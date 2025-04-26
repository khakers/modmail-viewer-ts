import { error } from '$lib/server/skUtils';
import {
	deleteSessionTokenCookie,
	getSessionsForUser,
	invalidateAllSessions,
	invalidateSession
} from '$lib/server/auth';
import { logger } from '$lib/logger';
import { z } from 'zod';
import type { PageServerLoad } from './$types';
import { fail, isActionFailure, redirect } from '@sveltejs/kit';

export const load = (async (event) => {
	if (event.locals.session == null) {
		error(401, 'Unauthorized: No session found', event);
	}

	return {
		session: event.locals.session,
		sessions: await getSessionsForUser(event.locals.session.discordUserId)
	};
}) satisfies PageServerLoad;

const INVALIDATE_FORM_SCHEMA = z.string().base64url().min(60).max(66);

export const actions = {
	revokeAllSessions: async (event) => {
		if (event.locals.session === null) {
			error(401, 'invalid session');
		}
		await invalidateAllSessions(event.locals.session.discordUserId);

		await deleteSessionTokenCookie(event);
		logger.info({ discordUid: event.locals.session.discordUserId }, 'revoked all sessions');
		redirect(303, '/auth/login');
	},
	revokeSession: async ({ request }) => {
		const form = await request.formData();
		try {
			const sessionId = INVALIDATE_FORM_SCHEMA.parse(form.get('sessionId'));
			logger.info({ sessionId }, 'Revoking session');
			try {
				await invalidateSession(sessionId);
			} catch (e) {
				logger.error({ err: e }, 'Failed to revoke session');
				fail(500, { sessionId, invalidated: false });
			}
		} catch (e) {
			if (isActionFailure(e)) {
				throw e;
			}
			logger.error({ err: e }, 'received invalid session ID in session revocation request');
			fail(400, { sessionId: form.get('sessionId') });
		}
	}
};
