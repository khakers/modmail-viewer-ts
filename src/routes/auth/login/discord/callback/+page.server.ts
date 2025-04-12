import { createSession, discord, generateSessionToken, setSessionTokenCookie } from '$lib/server/auth';
import { ArcticFetchError, OAuth2RequestError, OAuth2Tokens } from 'arctic';
import type { PageServerLoad } from './$types';
import { CacheableDiscordApi } from '$lib/server/discord';
import { isHttpError, isRedirect, redirect } from '@sveltejs/kit';
import { error } from '$lib/server/skUtils';

export const load = (async (event) => {

    const logger = event.locals.logger;

    const code = event.url.searchParams.get("code");
    const state = event.url.searchParams.get("state");
    const storedState = event.cookies.get("discord_oauth_state") ?? null;
    if (code === null || state === null || storedState === null) {
        error(400, 'OAuth2 callback missing required parameters: code or state', event);
    }
    if (state !== storedState) {
        error(400, 'Invalid state parameter', event);
    }

    let tokens: OAuth2Tokens;
    try {
        tokens = await discord.validateAuthorizationCode(code, null);
    } catch (e) {
        if (e instanceof OAuth2RequestError) {
            // Invalid authorization code, credentials, or redirect URI
            const code = e.code;
            logger.error({ error: e }, 'Failed to validate Discord authorization code');
            // ...
        }
        if (e instanceof ArcticFetchError) {
            // Failed to call `fetch()`
            const cause = e.cause;
            logger.error({ error: e }, 'Failed to fetch Discord tokens');
            // ...
        }

        // Invalid code or client credentials
        error(400, 'Failed to validate Discord authorization code', event);
    }

    const discordApi = new CacheableDiscordApi({
        discordUserId: undefined,
        accessToken: tokens.accessToken(),
        accessTokenExpiresAt: tokens.accessTokenExpiresAt(),
        refreshToken: tokens.refreshToken()
    });
    try {
        const discordUser = await discordApi.getDiscordUser()

        const user = {
            discordUserId: discordUser.id,
            discordUsername: discordUser.username,
            accessToken: tokens.accessToken(),
            accessTokenExpiresAt: tokens.accessTokenExpiresAt(),
            refreshToken: tokens.refreshToken()
        }

        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, user);
        logger.trace("session created");
        setSessionTokenCookie(event, sessionToken, session.expiresAt);

        redirect(303, '/');

    } catch (e) {
        if (isRedirect(e) || isHttpError(e)) {
            throw e;
        }
        logger.error({ error: e }, 'Failed to fetch Discord user data');
        error(500, 'Failed to fetch Discord user data', event);
    }
    // const discordUser = await getDiscordUser(tokens.accessToken());

}) satisfies PageServerLoad;