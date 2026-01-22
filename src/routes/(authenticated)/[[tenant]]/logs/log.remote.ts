import { getRequestEvent, query } from '$app/server';
import z from 'zod';
import { error } from '$lib/server/skUtils';
import { logger } from '$lib/logger';
import type { ModmailThread } from '$lib/modmail';
import { convertBSONtoJS } from '$lib/bsonUtils';
import { hydrateS3AttachmentURLs } from '$lib/server/s3';
import type { Filter } from 'mongodb';
import { redirect } from '@sveltejs/kit';
import { urlWithSearchParams } from '$lib/searchParamUtils';
import { paramsSchema } from './schema';

// Helper to guard and get common request values
function guard() {
	const req = getRequestEvent();
	if (!req.locals.Tenant) {
		logger.error('Tenant parameter is missing');
		error(404, 'No tenant found', req);
	}
	const client = req.locals.Tenant.mongoThreadCollection;

	if (!client) {
		logger.error('MongoDB client not found');
		error(500, `modmail server of id ${req.locals.Tenant.slug} not found`, req);
	}

	return { req, client };
}

export const getThread = query(z.string(), async (threadId) => {
	const { req, client } = guard();

	try {
		const modmailThread = await client.findOne<ModmailThread>({ _id: threadId });

		if (!modmailThread) {
			logger.debug(req.params.id, 'Document not found');
			error(404, 'Not Found', req);
		}

		const thread = convertBSONtoJS(modmailThread) as ModmailThread;

		logger.debug('Document found');

		for (const message of thread.messages) {
			message.attachments = await hydrateS3AttachmentURLs(message.attachments);
		}

		return thread;
	} catch (err) {
		logger.error(err);
		error(500, 'Internal Server Error', req);
	}
});

/**
 * Retrieves pagination metadata for modmail threads based on the provided query parameters.
 *
 * @param params - Query parameters (the `page` field is omitted). Expected properties:
 *   - status?: string | undefined — status filter value (e.g., 'open', 'all').
 *   - pageSize: number — number of items per page used to compute pageCount.
 *
 * @returns An object with:
 *   - pageCount: number — total number of pages for the given pageSize.
 *   - statusFilter: string | undefined — the provided status filter.
 *   - threadCount: number — total number of matching threads.
 *
 * @throws If authentication fails or the database count operation errors.
 */
export const getThreadPagination = query(paramsSchema.omit({ page: true }), async (params) => {
	const { client } = guard();

	const filter: Filter<ModmailThread> = {};

	if (params.status && params.status !== 'all') {
		if (params.status === 'open') {
			filter['open'] = true;
		} else {
			filter['open'] = false;
		}
	}

	const threadCount = await client.countDocuments(filter);

	return {
		pageCount: Math.ceil(threadCount / params.pageSize),
		statusFilter: params.status,
		threadCount
	};
});

export const getThreads = query(paramsSchema, async (params) => {
	const { req, client } = guard();

	const filter: Filter<ModmailThread> = {};

	if (params.status && params.status !== 'all') {
		if (params.status === 'open') {
			filter['open'] = true;
		} else {
			filter['open'] = false;
		}
	}

	try {
		// sort logs by closed time, last message, and creation date
		const [threadCount, modmailThreads] = await Promise.all([
			client.countDocuments(filter),
			client
				.find(filter)
				.sort({ created_at: -1, 'messages.timestamp': -1, closed_at: -1 })
				.skip((params.page - 1) * params.pageSize)
				.limit(params.pageSize)
				.toArray()
		]);

		const pageCount = Math.ceil(threadCount / params.pageSize);

		if (params.page > pageCount && params.page !== 1) {
			redirect(307, urlWithSearchParams(req.url, [['page', '1']]));
		}

		if (!modmailThreads) {
			error(500, 'Failed to retrieve threads', req);
		}

		const convertedThreads = convertBSONtoJS(modmailThreads) as ModmailThread[];

		const threads = convertedThreads.map((thread) => {
			// Trim all messages but first and last to reduce unnecesary transferred data
			const messageCount = thread.messages.length;
			thread.messages =
				thread.messages.length > 1
					? [thread.messages[0], thread.messages[thread.messages.length - 1]]
					: thread.messages;
			return { message_count: messageCount, ...thread };
		});

		// TODO consider removing pageCount and statusFilter from here since they are also in getThreadPagination
		return {
			page: params.page,
			pageCount: Math.ceil(threadCount / params.pageSize),
			statusFilter: params.status,
			threadCount,
			threads: threads
		};
	} catch (err) {
		logger.error(err);
		error(500, 'Internal Server Error', req);
	}
});
