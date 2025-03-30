import { generateState } from 'arctic';
import type { PageServerLoad } from './$types';
import { discord } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

const scopes = ["identify", "guilds", "guilds.members.read", "openid"];

export const load = (async (event) => {
    const state = generateState();

    const url = discord.createAuthorizationURL(state, null, scopes);

    event.cookies.set('discord_oauth_state', state, {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: 'lax',
    });
    redirect(302, url);
}) satisfies PageServerLoad;