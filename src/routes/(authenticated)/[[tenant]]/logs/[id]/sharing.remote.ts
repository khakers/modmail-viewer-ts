import { form, getRequestEvent, query } from '$app/server';
import { db } from '$lib/server/db';
import { z } from 'zod/v4';
import { sharedThreads } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { options } from 'marked';
import { formSchema } from './schema';
import { logger } from '$lib/logger';
import { invalid, json } from '@sveltejs/kit';
import { encodeBase64UUID } from '$lib/uuid-utils';
import { shareThread as shareThreadFunc } from '$lib/server/thread-sharing';
import { error } from '$lib/server/skUtils';
import { isBefore } from 'date-fns';

export const getThreadShares = query(z.string(), async (threadId) => {
	return await db.select().from(sharedThreads).where(eq(sharedThreads.threadId, threadId));
});

export const shareThread = form(
	z.object({
		id: z.string(),
		requireAuthentication: z.coerce.boolean<boolean>(),
		showInternalMessages: z.coerce.boolean<boolean>(),
		showAnonymousSenderName: z.coerce.boolean<boolean>(),
		showSystemMessages: z.coerce.boolean<boolean>(),
		expiresAt: z.iso.date().min(Date.now(), 'Expiration must be in the future').optional()
	}),
	async (data, issue) => {
		const req = getRequestEvent();

		if (!req.locals.Tenant) {
			logger.error(
				{},
				'failed to create threadShare because request local tenant was undefined'
			);
			error(401, 'Unauthorized');
		}
		logger.debug({ data }, 'shareThread called'); // thread id

		// sveltekit handles remote functions in a way that keeps auth expectations valid
		// So we get data like below in a request for this thread
		//    "url": "http://localhost:5173/_app/remote/z2d76e/shareThread",
		//   "routeId": "/(authenticated)/[[tenant]]/logs/[id]",
		//   "path": "/_app/remote/z2d76e/shareThread",
		//   "pathParams": {
		//     "tenant": "qsr",
		//     "id": "80a9516fa1f1"
		//   },

		if (data.expiresAt) {
			const expiration = new Date(data.expiresAt);

			if (isNaN(expiration.getTime())) {
				invalid(issue.expiresAt('Expiration date is invalid'));
			}
			if (isBefore(expiration, new Date())) {
				invalid(issue.expiresAt('Expiration date must be in the future'));
			}
		}

		// TODO verify that the thread id being shared belongs to the tenant in req.locals.Tenant

		const thread = await req.locals.Tenant.mongoThreadCollection.findOne({ _id: data.id });
		if (!thread) {
			logger.error(
				{ threadId: data.id, tenantId: req.locals.Tenant.id },
				'Thread to be shared not found in database'
			);
			// Technically this is not found, but this should only occur in
			invalid('Invalid thread');
		}

		// const id = await shareThreadFunc(
		// 	data.id,
		// 	req.locals.Tenant.id,
		// 	req.locals.user.discordUserId,
		// 	{
		// 		expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
		// 		requireAuthentication: data.requireAuthentication,
		// 		showInternalMessages: data.showInternalMessages,
		// 		showAnonymousSenderName: data.showAnonymousSenderName,
		// 		showSystemMessages: data.showSystemMessages
		// 	}
		// );
		logger.debug({ form: data }, 'share submission');
		const id = crypto.randomUUID();

		getThreadShares(data.id).refresh(); // prefetch updated shares

		json({ success: true, shareId: encodeBase64UUID(id), form: data });
	}
);
