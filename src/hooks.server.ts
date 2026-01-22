import * as auth from '$lib/server/auth.js';
import { type Handle, type HandleServerError, redirect, type ServerInit } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { context, baseLogger, logger } from '$lib/logger';
import { sequence } from '@sveltejs/kit/hooks';
import { getTenants, Tenant } from '$lib/server/tenancy/tenant';
import { CacheableDiscordApi } from '$lib/server/discord';
import { error } from '$lib/server/skUtils';
import { getPermisionOrdinal } from '$lib/server/modmail/permissions';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { env } from '$env/dynamic/private';
import { building, dev, version } from '$app/environment';

export const init: ServerInit = async () => {
	console.log('init');

	if (!dev && !building) {
		logger.info('Running migrations');
		// TODO db is also initialized in src/lib/server/db/index.ts
		const db = drizzle(env.DATABASE_URL);
		migrate(db, {
			migrationsFolder: './drizzle'
		});
	}
	logger.info({ version }, 'Server initialized');
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

// Inject request uuid into request and set header
const handleRequestId: Handle = async ({ event, resolve }) => {
	event.locals.requestId = crypto.randomUUID();

	const response = await resolve(event);

	response.headers.set('x-request-id', event.locals.requestId);
	return response;
};

// Creates a logger for each request, adds it to request locals, and initiates an async context for the logger that the rest of the request is done within
const handleLogging: Handle = async ({ event, resolve }) => {
	const reqLogger = baseLogger.child({ requestId: event.locals.requestId });

	// establish logger context for request
	return await context.run({ logger: reqLogger }, async () => {
		event.locals.logger = reqLogger;

		const startTime = performance.now();
		const uri = new URL(event.request.url);

		const url = new URL(event.request.url);
		const requestLogObject = {
			req: {
				method: event.request.method,
				url: event.request.url,
				routeId: event.route.id,
				path: url.pathname,
				pathParams: event.params,
				query: Object.fromEntries(url.searchParams),
				headers: Object.fromEntries(event.request.headers),
				agent: event.request.headers.get('user-agent'),
				remoteAddress: event.getClientAddress()
			}
		};

		reqLogger.info(requestLogObject, 'Incoming request');

		const response = await resolve(event);
		const endTime = performance.now();

		reqLogger.info(
			{
				res: {
					path: uri.pathname,
					method: event.request.method,
					status: response.status,
					durationMillis: endTime - startTime,
					headers: response.headers,
					body: response.body
				}
			},
			'request completed'
		);

		return response;
	});
};

const handleAuthentication: Handle = async ({ event, resolve }) => {
	const logger = event.locals.logger;
	if (!building) {
		if (event.url.pathname === '/favicon.ico') {
			return resolve(event);
		}
		const sessionToken = event.cookies.get(auth.sessionCookieName);

		if (!sessionToken) {
			event.locals.session = null;
			if (
				event.route.id !== null &&
				!event.route.id.startsWith('/auth') &&
				!event.route.id.startsWith('/share')
			) {
				return redirect(307, '/auth/login');
			}
			return resolve(event);
		}

		const { session, user: discordTokens } = await auth.validateSessionToken(sessionToken);

		if (session && discordTokens) {
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} else {
			logger.trace('invalid session token in request');
			auth.deleteSessionTokenCookie(event);
			event.locals.session = null;
			if (event.route.id !== null && event.route.id !== '/auth/login') {
				return redirect(307, '/auth/login');
			}
			// redirect(307, '/auth/login');
		}

		event.locals.session = session;
		event.locals.discordAccessTokens = discordTokens;

		// add discord user information
		if (session) {
			const discordApi = CacheableDiscordApi.fromSession(discordTokens);
			try {
				const [userdata, guilds] = await Promise.all([
					discordApi.getDiscordUser(),
					discordApi.getUserGuilds()
				]);
				logger.trace({ userdata }, 'Retrieved user data from Discord API');
				event.locals.user = {
					discordUserId: userdata.id,
					username: userdata.username,
					discriminator: userdata.discriminator,
					avatar: userdata.avatar
						? `https://cdn.discordapp.com/avatars/${userdata.id}/${userdata.avatar}.png`
						: null,
					guilds: guilds
				};
			} catch (e) {
				logger.error(
					{ err: e },
					'encountered an error trying to add discord user data to request local'
				);
				error(500, 'Discord API error', event);
			}
		}
	}
	return resolve(event);
};

// Adds a MongoDB client to the request if the route starts with /[[tenants]]
const handleInjectTenant: Handle = async ({ event, resolve }) => {
	// This hook cannot run anything during build time and will only cause issue if it does
	if (!building) {
		const logger = event.locals.logger;

		if (event.route.id?.startsWith('/(authenticated)/[[tenant]]')) {
			event.locals.logger.trace(
				{ routeId: event.route.id, tenant: event.params.tenant },
				'Injecting Tenant information'
			);
			if (!event.params.tenant) {
				// TODO choose the first tenant if the user has access to any tenants
				// the discord guild information endpoint has a rate of 5 requests every few minutes so checking permisssions will likely get rate limited

				const tenants = await getTenants(event.locals.user.guilds.map((guild) => guild.id));
				if (tenants.length === 0) {
					logger.debug('The user does not have any discord guilds with tenants');
					return error(404, 'Tenant not found');
				}
				event.locals.Tenant = tenants[0];
				logger.debug(
					{ tenantId: event.locals.Tenant.id },
					"No tenant specified in the request, using first tenant that matched the user's guilds"
				);
			} else {
				try {
					event.locals.Tenant = await Tenant.create(event.params.tenant);
				} catch (e) {
					if (e instanceof Error && e.name === 'TenantNotFoundError') {
						logger.error(
							{ err: e, tenantSlug: event.params.tenant },
							'Tenant not found'
						);
						return error(404, 'Tenant not found', event);
					}
					logger.error(
						{ err: e, tenantSlug: event.params.tenant },
						'Error loading tenant'
					);
					return error(500, 'encountered an error loading tenant', event);
				}
			}
			event.locals.logger = event.locals.logger.child({
				tenantId: event.locals.Tenant.id,
				tenantSlug: event.locals.Tenant.slug
			});
		}
	}
	return resolve(event);
};

const handleTenancyAuthorization: Handle = async ({ event, resolve }) => {
	if (!building) {
		// Runs after the session and tenancy middleware to ensure that the user has access to the tenant they are trying to access
		const logger = event.locals.logger.child({ module: 'handleTenancyAuthorization' });
		if (!event.locals.session) {
			// No session, no user to authorize
			return resolve(event);
		}
		// TODO sveltekit does not support a custom error page for errors thrown via hooks
		if (event.route.id?.startsWith('/(authenticated)/[[tenant]]')) {
			// Ensure the user has access to the tenant
			if (!event.locals.Tenant) {
				// No tenant found, return without resolving
				logger.trace('No tenant found for request');
				return resolve(event);
			}
			if (!event.locals.discordAccessTokens) {
				logger.error('No discord access tokens in request locals');
				error(500, 'internal error', event);
			}
			const discordAPi = CacheableDiscordApi.fromSession(event.locals.discordAccessTokens);
			logger.trace(
				{
					tenantId: event.locals.Tenant.id,
					discordUserId: event.locals.session.discordUserId
				},
				'Checking permissions for tenant'
			);

			const tenantServerId = event.locals.Tenant.guildId;
			if (!tenantServerId) {
				logger.error(
					{ tenantId: event.locals.Tenant.id },
					'Tenant configuration missing guild id'
				);
				error(500, 'Tenant configuration missing guild id', event);
			}

			const userGuildInfo = await discordAPi.getGuildUserInfo(tenantServerId);
			logger.trace({ userGuildInfo }, 'Retrieved user guild info for tenant authorization');

			if (!userGuildInfo) {
				// User is not part of the guild
				logger.trace(
					{
						tenantId: event.locals.Tenant.id,
						discordUserId: event.locals.session.discordUserId
					},
					'User not found in tenant guild'
				);
				// Redirect to unauthorized or some other page
				return error(403, 'You do not have access to this tenant', event);
			}
			const permissionLevel = await event.locals.Tenant.getPermissionsLevel(
				userGuildInfo.roles,
				event.locals.session.discordUserId
			);

			logger.trace(
				{
					permissionLevel
				},
				'Determined user permission level for tenant'
			);

			if (
				permissionLevel === undefined ||
				getPermisionOrdinal(permissionLevel) < getPermisionOrdinal('SUPPORTER')
			) {
				logger.trace(
					{ discordUserId: event.locals.session.id, tenantId: event.locals.Tenant.id },
					'User is not authorized to access this tenant'
				);
				return error(403, 'You do not have access to this tenant', event);
			}
		}
	}
	return resolve(event);
};

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	// Custom error handling
	const reqLogger = logger.child({ module: 'handleError' });

	// Log the error
	reqLogger.error({ err: error }, 'Unhandled server error');

	return {
		status,
		message,
		requestId: event.locals.requestId || undefined
	};
};

export const handle: Handle = sequence(
	handleRequestId,
	handleParaglide,
	handleLogging,
	handleAuthentication,
	handleInjectTenant,
	handleTenancyAuthorization
);
