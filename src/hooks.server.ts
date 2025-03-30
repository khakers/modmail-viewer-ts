import * as auth from '$lib/server/auth.js';
import { redirect, type Handle, type HandleServerError, type ServerInit } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { logger } from '$lib/logger';
import { sequence } from '@sveltejs/kit/hooks';
import { Tenant } from '$lib/server/tenancy/tenant';

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

	response.headers.set('x-request-id', event.locals.requestId);
	return response;
};

const handleLogging: Handle = async ({ event, resolve }) => {
	const reqLogger = logger.child({ requestId: event.locals.requestId });

	event.locals.logger = reqLogger;

	const startTime = performance.now();
	const uri = new URL(event.request.url);

	reqLogger.info(event.request, 'Incoming request');

	const response = await resolve(event);
	const endTime = performance.now();

	reqLogger.info({
		path: uri.pathname,
		method: event.request.method,
		status: response.status,
		duration: endTime - startTime,
		headers: response.headers,
		body: response.body
	});

	return response;
};



const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		// event.locals.user = null;
		event.locals.session = null;
		if (event.route.id !== null && !event.route.id.startsWith('/auth')) {
			return redirect(302, '/auth/login');
		}
		return resolve(event);
	}

	const { session } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	// event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};


// TODO refactor to supply tenant information instead
// Adds a MongoDB client to the request if the route starts with /[[tenants]]
const addMongoClientToRequest: Handle = async ({ event, resolve }) => {
	event.locals.logger.trace({routeId: event.route.id }, 'Handling MongoDB client for request');
	if (event.route.id?.startsWith('/[[tenant]]') ) {
		event.locals.logger.trace('Adding MongoDB client to request')
		if (!event.params.tenant) {
			// If no tenant is specified, return without adding a client
			event.locals.logger.trace('No tenant specified in the request');
			return resolve(event);
		}
		event.locals.Tenant = await Tenant.create(event.params.tenant);
	}
	return resolve(event);
}

export const handleError: HandleServerError = async ({ error, event, status, message}) => {
	// Custom error handling
	const reqLogger = (event.locals.logger || logger).child({ module: "handleError"});

	// Log the error
	reqLogger.error({ error }, 'Unhandled server error');

	return {
		status,
		message,
		requestId: event.locals.requestId || undefined,
	}
};

export const init: ServerInit = async () => {
	// if 
	
};

export const handle: Handle = sequence(
	handleRequestId,
	handleParaglide,
	handleLogging,
	handleAuth,
	addMongoClientToRequest
);

// export const handle = sequence(originalHandle, handleAuth);
