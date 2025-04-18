import type { RequestEvent } from '@sveltejs/kit';
import { count, eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { Discord } from 'arctic';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/logger';
import { addDays, isAfter, isPast, subDays } from 'date-fns';

// TODO verify these environment variables are set at start
export const discord = new Discord(env.DISCORD_CLIENT_ID, env.DISCORD_CLIENT_SECRET, env.OAUTH_REDIRECT_URI);


class SessionHandler { }

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function updateAccessToken(discordID: string, accessToken: string, expiresAt: Date) {
	logger.trace({ discordID, expiresAt }, 'Updating access token');
	// Update the access token for the user in the session table
	const result = await db
		.update(table.user)
		.set({ accessToken: accessToken, accessTokenExpiresAt: expiresAt })
		.where(eq(table.session.discordUserId, discordID));

	if (result.changes === 0) {
		logger.error({ discordID }, 'Failed to update access token');
		return null;
	} else {
		logger.trace({ discordID }, 'Successfully updated access token');
	}

	return;
}

export async function getDiscordRefreshToken(uid: string) {
	const [result] = await db
		.select({ token: table.user.refreshToken })
		.from(table.user)
		.where(eq(table.user.uid, uid))

	return result.token;
}

export async function createSession(token: string, discordTokens: table.User) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: table.Session = {
		id: sessionId,
		discordUserId: discordTokens.uid,
		expiresAt: addDays(Date.now(), 30),
	};

	await db.transaction(async (tx) => {
		// if there is already an exisitng user, update its values, otherwise insert
		const [existingToken] = await tx.select().from(table.user).where(eq(table.user.uid, discordTokens.uid));
		logger.trace({ exists: existingToken }, "identifying user")
		if (existingToken) {
			discord.revokeToken(existingToken.refreshToken)
				.then(() => logger.trace({ uid: discordTokens.uid }, "revoked existing refresh token when creating new client session"))
				.catch((...args) => logger.error({ uid: discordTokens.uid, args }, "failed to revoke token while setting"))
			await tx.update(table.user).set(discordTokens).where(eq(table.user.uid, discordTokens.uid));
		} else {
			await tx.insert(table.user).values(discordTokens);
		}

		await tx.insert(table.session).values(session);
	});

	return session;
}

export async function getDiscordUser(uid: string) {
	const [result] = await db
		.select()
		.from(table.user)
		.where(eq(table.user.uid, uid))
	return result;
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			session: table.session
		})
		.from(table.session)
		.where(eq(table.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}
	const { session } = result;

	const sessionExpired = isPast(session.expiresAt);
	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = isPast(subDays(session.expiresAt, 15));
	if (renewSession) {
		session.expiresAt = addDays(Date.now(), 30);
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id));
	}

	const [user] = await db
		.select({ uid: table.user.uid, accessToken: table.user.accessToken, accessTokenExpiresAt: table.user.accessTokenExpiresAt })
		.from(table.user)
		.where(eq(table.user.uid, session.discordUserId))

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	// revoke refresh token before deleting the session
	await db.transaction(async (tx) => {

		const discordUidQuery = tx
			.select({ uid: table.session.discordUserId })
			.from(table.session)
			.where(eq(table.session.id, sessionId));

		const [userSessionCount] = await tx
			.select({ value: count(table.session.id) })
			.from(table.session)
			.where(eq(table.session.discordUserId, discordUidQuery));

		if (!(userSessionCount.value > 1)) {
			const [result] = await tx.select({ refreshToken: table.user.refreshToken })
				.from(table.user)
				.where(eq(table.session.id, sessionId));
			logger.trace({})
			try {
				await discord.revokeToken(result?.refreshToken)
			} catch (e) {
				logger.error({ error: e }, 'Refrehs token revocation failed')
			}
		}

		await tx.delete(table.session).where(eq(table.session.id, sessionId));
		logger.trace("succesfully invalidated session", { sessionId });

	});
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
}
