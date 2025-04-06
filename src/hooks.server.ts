import * as auth from '$lib/server/auth.js';
import { redirect, type Handle, type HandleServerError, type ServerInit } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { logger } from '$lib/logger';
import { sequence } from '@sveltejs/kit/hooks';
import { Tenant } from '$lib/server/tenancy/tenant';
import { CacheableDiscordApi } from '$lib/server/discord';
import { error } from '$lib/server/skUtils';
import { getPermisionOrdinal } from '$lib/server/modmail/permissions';

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



const handleAuthentication: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === "/favicon.ico") {
		return resolve(event);
	}
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
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

	event.locals.session = session;

	// add discord user information
	if (session) {
		const discordApi = CacheableDiscordApi.fromSession(session);
		const userdata = await discordApi.getDiscordUser();
		event.locals.user = {
			discordUserId: userdata.id, 
			username: userdata.username,
			discriminator: userdata.discriminator, 
			avatar: userdata.avatar ? `https://cdn.discordapp.com/avatars/${userdata.id}/${userdata.avatar}.png` : null
		};
	}


	return resolve(event);
};

// Redirects users to the login page if they attempt to access and authenticated route without a session
const handleGeneralAuthorization: Handle = async ({ event, resolve }) => {
	// Runs after the session middleware so the session is available
	if (event.route.id?.startsWith('/(authenticated)')) {
		if (!event.locals.session) {
			// Redirect to login page
			return redirect(303, '/auth/login');
		}
	}
	return resolve(event);
}



// TODO refactor to supply tenant information instead
// Adds a MongoDB client to the request if the route starts with /[[tenants]]
const handleInjectTenant: Handle = async ({ event, resolve }) => {
	event.locals.logger.trace({ routeId: event.route.id }, 'Handling MongoDB client for request');
	if (event.route.id?.startsWith('/[[tenant]]')) {
		event.locals.logger.trace('Adding MongoDB client to request')
		if (!event.params.tenant) {
			// If no tenant is specified, return without adding a client
			event.locals.logger.trace('No tenant specified in the request');
			return resolve(event);
		}
		event.locals.Tenant = await Tenant.create(event.params.tenant);
		event.locals.logger = event.locals.logger.child({
			tenantId: event.locals.Tenant.id,
			tenantSlug: event.locals.Tenant.slug
		});
	}
	return resolve(event);
}

const handleTenancyAuthorization: Handle = async ({ event, resolve }) => {
	// Runs after the session and tenancy middleware to ensure that the user has access to the tenant they are trying to access
	const logger = event.locals.logger.child({ module: 'handleTenancyAuthorization' });
	if (!event.locals.session) {
		// No session, no user to authorize
		return resolve(event);
	}
	// TODO sveltekit does not support a custom error page for errors thrown via hooks
	if (event.route.id?.startsWith('/[[tenant]]')) {
		// Ensure the user has access to the tenant
		if (!event.locals.Tenant) {
			// No tenant found, return without resolving
			logger.trace('No tenant found for request');
			return resolve(event);
		}
		const discordAPi = CacheableDiscordApi.fromSession(event.locals.session);
		logger.trace({ tenantId: event.locals.Tenant.id, discordUserId: event.locals.session.discordUserId }, 'Checking permissions for tenant');

		const tenantServerId = event.locals.Tenant.guildId;
		if (!tenantServerId) {
			logger.error({ tenantId: event.locals.Tenant.id }, 'Tenant configuration missing guild id');
			error(500, 'Tenant configuration missing guild id', event);
		}

		const userGuildInfo = await discordAPi.getGuildUserInfo(tenantServerId);
		logger.trace({ userGuildInfo }, 'Retrieved user guild info for tenant authorization');

		if (!userGuildInfo) {
			// User is not part of the guild
			logger.trace({ tenantId: event.locals.Tenant.id, discordUserId: event.locals.session.discordUserId }, 'User not found in tenant guild');
			// Redirect to unauthorized or some other page
			return error(403, 'You do not have access to this tenant', event);
		}
		const permissionLevel = await event.locals.Tenant.getPermissionsLevel(userGuildInfo.roles, event.locals.session.discordUserId);

		if (permissionLevel === undefined || getPermisionOrdinal(permissionLevel) < getPermisionOrdinal("SUPPORTER")) {
			logger.trace({ discordUserId: event.locals.session.id, tenantId: event.locals.Tenant.id }, 'User is not authorized to access this tenant');
			return error(403, 'You do not have access to this tenant', event);
		}
	}

	return resolve(event);
}

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	// Custom error handling
	const reqLogger = (event.locals.logger || logger).child({ module: "handleError" });

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
	handleAuthentication,
	handleInjectTenant,
	handleTenancyAuthorization
);

// export const handle = sequence(originalHandle, handleAuth);
