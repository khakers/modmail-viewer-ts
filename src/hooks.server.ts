import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { logger } from '$lib/logger';
import { sequence } from '@sveltejs/kit/hooks';


const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const handleRequestId: Handle = async ({ event, resolve }) => {
	event.locals.requestId = crypto.randomUUID();
	const response = await resolve(event);
	response.headers.set("x-request-id", event.locals.requestId);
	return response;
};

const handleLogging: Handle = async ({ event, resolve }) => {
	const reqLogger = logger.child({ requestId: event.locals.requestId });
	event.locals.logger = reqLogger;

	const startTime = performance.now();

	const uri = new URL(event.request.url);

	reqLogger.info(event.request, "Incoming request");

	const response = await resolve(event);
	const endTime = performance.now();

	reqLogger.info(
		{
			path: uri.pathname,
			method: event.request.method,
			status: response.status,
			duration: endTime - startTime,
			headers: response.headers,
			body: response.body
		}
	);

	return response;

};


export const handle: Handle = sequence(handleRequestId, handleParaglide, handleLogging);
