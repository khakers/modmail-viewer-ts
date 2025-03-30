import type { LayoutServerLoad } from './$types';

export const load = (async ({locals}) => {

    const sessionData = locals.session; // Access the session data from locals

    return {
        session: {
            discordUserId: sessionData?.discordUserId || null,
            // discordUsername: sessionData?. || null,
        },
    };
}) satisfies LayoutServerLoad;