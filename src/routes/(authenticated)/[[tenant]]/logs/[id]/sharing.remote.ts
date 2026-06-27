import { command, form, getRequestEvent, query } from '$app/server';
import { db } from '$lib/server/db';
import { z } from 'zod/v4';
import { sharedThreads } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '$lib/logger';
import { invalid, json } from '@sveltejs/kit';
import { encodeBase64UUID } from '$lib/uuid-utils';
import { shareThread as shareThreadFunc } from '$lib/server/thread-sharing';
import { error } from '$lib/server/skUtils';
import { isAfter, isBefore } from 'date-fns';
import { getPermisionOrdinal, type PermissionLevel } from '$lib/server/modmail/permissions';
import { isoDateStringToDate } from '$lib/zod-helpers';

// Check the user's permissions for the tenant and throw a 403 if they don't meet the required level
async function permissionGuard(requiredLevel: PermissionLevel): Promise<void> {
	const req = getRequestEvent();

	if (!req.locals.Tenant) {
		logger.error('Tenant parameter is missing');
		error(404, 'No tenant found', req);
	}

	if (!req.locals.discordApiClient) {
		logger.error('Discord API client not found in request locals');
		error(500, 'Internal Server Error', req);
	}

	const discordRoles = await req.locals.discordApiClient.getGuildUserInfo(
		req.locals.Tenant.guildId
	);

	const permissionLevel = await req.locals.Tenant.getPermissionsLevel(
		discordRoles.roles || [],
		req.locals.user.discordUserId
	);

	if (getPermisionOrdinal(permissionLevel ?? 'ANYONE') <= getPermisionOrdinal(requiredLevel)) {
		logger.error(
			{
				userId: req.locals.user.discordUserId,
				tenantId: req.locals.Tenant.id,
				permissionLevel
			},
			'User did not have sufficient permissions to access this resource'
		);
		error(403, 'Forbidden');
	}
}

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
		expiresAt: isoDateStringToDate
			.refine(
				(date) => date === null || isAfter(date, new Date()),
				'Expiration must be in the future'
			)
			.optional()
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

		// TODO Allow per tenant configuration of minimum permission level required to share a thread
		try {
			permissionGuard('SUPPORTER');
		} catch (err) {
			logger.error(
				{ error: err instanceof Error ? err.message : String(err) },
				'Permission guard threw an error'
			);
			error(403, 'Forbidden');
		}

		logger.debug({ data }, 'shareThread called'); // thread id

		// sveltekit handles remote functions in a way that keeps auth expectations valid
		// So we get data like below in a request for this thread
		//    "url": "http://localhost:5173/_app/remote/z2d76e/shareThread",
		//   "routeId": "/(authenticated)/[[tenant]]/logs/[id]",
		//   "path": "/_app/remote/z2d76e/shareThread",
		//   "pathParams": {
		//     "tenant": "demo",
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

		const id = await shareThreadFunc(
			data.id,
			req.locals.Tenant.id,
			req.locals.user.discordUserId,
			{
				expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
				requireAuthentication: data.requireAuthentication,
				showInternalMessages: data.showInternalMessages,
				showAnonymousSenderName: data.showAnonymousSenderName,
				showSystemMessages: data.showSystemMessages
			}
		);
		logger.debug({ form: data }, 'share submission');
		// const id = crypto.randomUUID();

		getThreadShares(data.id).refresh(); // prefetch updated shares

		json({ success: true, shareId: encodeBase64UUID(id), form: data });
	}
);

export const disableThreadShare = command(z.object({ id: z.uuidv4(), enabled: z.boolean() }), async (data) => {
	logger.trace({ data }, 'disableThreadShare called');
	const thread = await db.select().from(sharedThreads).where(eq(sharedThreads.id, data.id)).limit(1);
	if (thread.length === 0) {
		logger.error({ id: data.id }, "disableThreadShare could not find share in database")
		error(404, 'Share not found');
	}
	// The creator of a thread can always disable it, otherwise we do a permission check
	if (thread[0].creatorDiscordUserId !== getRequestEvent().locals.user.discordUserId) {
		await permissionGuard('MODERATOR');
	}
	const res = await db
		.update(sharedThreads)
		.set({ enabled: data.enabled })
		.where(eq(sharedThreads.id, data.id));
	if (res.changes === 0) {
		logger.error({ res, id: data.id }, "disableThreadShare mongodb update returned 0 changes")
		error(404, 'Share not found');
	}

	getThreadShares(thread[0].threadId).refresh(); // prefetch updated shares
});
