import type { RequestEvent } from '@sveltejs/kit';
import { count, eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { Discord } from 'arctic';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/logger';
import { addDays, isPast, subDays } from 'date-fns';

// TODO verify these environment variables are set at start
export const discord = new Discord(
	env.DISCORD_CLIENT_ID,
	env.DISCORD_CLIENT_SECRET,
	env.OAUTH_REDIRECT_URI
);

class SessionHandler {}

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
		.where(eq(table.user.uid, uid));

	return result.token;
}

export async function createSession(token: string, discordTokens: table.User) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session = {
		id: sessionId,
		discordUserId: discordTokens.uid,
		expiresAt: addDays(Date.now(), 30)
	};

	// if there is already an existing user, update its values, otherwise insert
	const [existingToken] = await db
		.select()
		.from(table.user)
		.where(eq(table.user.uid, discordTokens.uid));
	logger.trace({ exists: existingToken }, 'identifying user');
	if (existingToken) {
		try {
			await discord.revokeToken(existingToken.refreshToken);
			logger.trace(
				{ uid: discordTokens.uid },
				'revoked existing refresh token when creating new client session'
			);
		} catch (e) {
			logger.error(
				{ uid: discordTokens.uid, err: e },
				'failed to revoke token while setting'
			);
		}
		await db
			.update(table.user)
			.set(discordTokens)
			.where(eq(table.user.uid, discordTokens.uid));
	} else {
		await db.insert(table.user).values(discordTokens);
	}

	await db.insert(table.session).values(session);

	return session;
}

export async function getDiscordUser(uid: string) {
	const [result] = await db.select().from(table.user).where(eq(table.user.uid, uid));
	return result;
}

export async function getSessionsForUser(discordUid: string) {
	return db
		.select({
			id: table.session.id,
			expiresAt: table.session.expiresAt,
			createdAt: table.session.createdAt
		})
		.from(table.session)
		.where(eq(table.session.discordUserId, discordUid));
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const [result] = await db
		.select({
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
		.select({
			uid: table.user.uid,
			accessToken: table.user.accessToken,
			accessTokenExpiresAt: table.user.accessTokenExpiresAt
		})
		.from(table.user)
		.where(eq(table.user.uid, session.discordUserId));

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	// revoke refresh token before deleting the session
	logger.info({ sessionId }, 'Invalidating session');

	// Get the discord user id for the session
	const [discordUidQuery] = await db
		.select({ uid: table.session.discordUserId })
		.from(table.session)
		.where(eq(table.session.id, sessionId));

	if (!discordUidQuery) {
		logger.warn({ sessionId }, 'No session found to invalidate');
		return;
	}

	// Count the number of sessions for this user
	const [userSessionCount] = await db
		.select({ value: count(table.session.id) })
		.from(table.session)
		.where(eq(table.session.discordUserId, discordUidQuery.uid));

	logger.trace({ userSessionCount, sessionId }, 'found discord UID for session');

	// revoke the refresh token only if this is the last session for the user
	if (userSessionCount.value <= 1) {
		const [result] = await db
			.select({ refreshToken: table.user.refreshToken })
			.from(table.user)
			.where(eq(table.user.uid, discordUidQuery.uid));
		logger.trace({}, "revoking refresh token");
		try {
			await discord.revokeToken(result?.refreshToken);
		} catch (e) {
			logger.error({ err: e }, 'Refresh token revocation failed');
		}
	}

	await db.delete(table.session).where(eq(table.session.id, sessionId));
	logger.trace({ sessionId },'succesfully invalidated session');
}

// Invalidate all sessions and revoke the discord refresh token
export async function invalidateAllSessions(uid: string) {
	// Delete all sessions for the user
	const deleted = await db.delete(table.session).where(eq(table.session.discordUserId, uid));

	// Get the refresh token for the user
	const [result] = await db
		.select({ refreshToken: table.user.refreshToken })
		.from(table.user)
		.where(eq(table.user.uid, uid));

	logger.trace({ deleted }, "invalidated sessions");
	try {
		await discord.revokeToken(result?.refreshToken);
	} catch (e) {
		logger.error({ err: e }, 'Refresh token revocation failed');
	}
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
