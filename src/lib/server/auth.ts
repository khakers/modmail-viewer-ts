import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { Discord } from 'arctic';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/logger';

// TODO verify these environment variables are set at start
export const discord = new Discord(env.DISCORD_CLIENT_ID, env.DISCORD_CLIENT_SECRET, env.OAUTH_REDIRECT_URI);


class SessionHandler {}

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
		.update(table.session)
		.set({ accessToken: accessToken, accessTokenExpiresAt: expiresAt })
		.where(eq(table.session.discordUserId, discordID));

	if (result.changes === 0) {
		logger.error({ discordID }, 'Failed to update access token');
		return null;
	}

	logger.trace({ discordID }, 'Successfully updated access token');
	return;
}

export async function createSession(token: string, user: Omit<table.Session, "id" | "expiresAt">) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: table.Session = {
		id: sessionId,
		discordUserId: user.discordUserId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30),
		refreshToken: user.refreshToken,
		accessToken: user.accessToken,
		accessTokenExpiresAt: user.accessTokenExpiresAt
	};
	await db.insert(table.session).values(session);
	return session;
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

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id));
	}

	return { session };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	// revoke refresh token before deleting the session
	const result = await db.select({refreshToken: table.session.refreshToken})
		.from(table.session)
		.where(eq(table.session.id, sessionId));
	try {
		await discord.revokeToken(result[0]?.refreshToken)
	} catch (e) {
		logger.error('Token revocation failed', e)
	}
	
	await db.delete(table.session).where(eq(table.session.id, sessionId));
	logger.trace("succesfully invalidated session", {sessionId});
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
