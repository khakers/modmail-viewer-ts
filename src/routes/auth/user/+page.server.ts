import { error } from '$lib/server/skUtils';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
    if (event.locals.session == null) {
        error(401, 'Unauthorized: No session found', event);
    }

    const { discordUserId, expiresAt } = event.locals.session!;
    return {
        discordUserId,
        expiresAt
    };
}) satisfies PageServerLoad;