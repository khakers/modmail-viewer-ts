import { error } from '$lib/server/skUtils';
import type { Actions, PageServerLoad } from './$types';
import { invalidateSession, deleteSessionTokenCookie } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';

export const load = (async (event) => {
    // grab a list of all tenats, filter out tenants that the user is not in, and finally check permissions
    // return the list of tenants that the user can access

    const logger = event.locals.logger;

    const session = event.locals.session;
    if (!session) {
        logger.error('Session not found');
        error(401, 'Unauthorized: Session not found', event);
    }


    const parentData = await event.parent();


    return {

        tenants: parentData.tenants
    };
}) satisfies PageServerLoad;


export const actions = {
    logout: async (event) => {
        if (event.locals.session === null) {
            return fail(401);
        }
        await invalidateSession(event.locals.session.id);
        deleteSessionTokenCookie(event);
        return redirect(302, "/auth/login");
    }
} satisfies Actions;