import { getRequestEvent, query } from '$app/server';
import { logger } from '$lib/logger';
import { error } from '$lib/server/skUtils';
import { getTenants,Tenant } from '$lib/server/tenancy/tenant';
import { CacheableDiscordApi } from '$lib/server/discord';
import { getPermisionOrdinal } from '$lib/server/modmail/permissions';

async function getGuildUserInfo(tenant:Tenant) {
	const guildUserInfo = await discordApi.getGuildUserInfo(tenant.guildId);
	return await tenant.getPermissionsLevel(guildUserInfo.roles || [], session.discordUserId)
}

export const getUserTenants = query(async () => {
	const req = getRequestEvent();

	const session = req.locals.session;
	if (!session) {
		logger.error('Session not found');
		error(401, 'Unauthorized: Session not found', req);
	}

	// I don't think this can ever end up actually null without getting caught by earlier code
	if (!req.locals.discordAccessTokens) {
		logger.error('Discord access tokens not found in locals');
		error(401, 'Unauthorized: Discord access tokens not found', req);
	}

	const discordApi = CacheableDiscordApi.fromSession(req.locals.discordAccessTokens);

	const guilds = await discordApi.getUserGuilds();

	// logger.debug({ loadStart }, `Guilds loaded in ${performance.now() - loadStart} ms`);

	const tenants = await getTenants(guilds.map((guild) => guild.id));

	// const roleFetchStart = performance.now();

	// Get discord role IDs for each guild & corresponding tenant
	const guildRoles = await Promise.all(
		tenants.map((tenant) =>
			discordApi.getGuildUserInfo(tenant.guildId).then((guildUserInfo) => ({
				guildId: tenant.guildId,
				roles: guildUserInfo.roles || [],
				tenant: tenant
			}))
		)
	);

	// const roleFetchEnd = performance.now();

	const permissionLevels = await Promise.all(
		guildRoles.map((a) =>
			a.tenant
				.getPermissionsLevel(a.roles, session.discordUserId)
				.then((permissionLevel) => ({ tenant: a.tenant, permissionLevel }))
				.catch((err) => {
					// Catch any errors in mongodb instances
					logger.error(
						{ err, tenant: a.tenant.slug },
						'encountered an error getting permissions for tenant'
					);
					return { tenant: a.tenant, permissionLevel: undefined };
				})
		)
	);

	// const permissionFetchEnd = performance.now();

	return (
		permissionLevels
			// Filter to tenants where user has SUPPORTER level or higher
			.filter(
				(item) =>
					getPermisionOrdinal(item.permissionLevel ?? 'ANYONE') >=
					getPermisionOrdinal('SUPPORTER')
			)
			// Map to tenant info object
			.map((item) => ({
				id: item.tenant.id,
				slug: item.tenant.slug,
				name: item.tenant.name,
				guildId: item.tenant.guildId,
				permissionLevel: item.permissionLevel,
				description: item.tenant.description
			}))
			// Map to include guild info
			.map((tenant) => {
				return {
					tenant: tenant,
					guild: guilds.find((server) => server.id === tenant.guildId)
				};
			})
			// Filter out any where guild info wasn't found
			.filter((a) => a.guild !== undefined)
	);
});

export const getActiveTenant = query(async () => {
	const req = getRequestEvent();

	const session = req.locals.session;
	if (!session) {
		logger.error('Session not found');
		error(401, 'Unauthorized: Session not found', req);
	}

	// I don't think this can ever end up actually null without getting caught by earlier code
	if (!req.locals.discordAccessTokens) {
		logger.error('Discord access tokens not found in locals');
		error(401, 'Unauthorized: Discord access tokens not found', req);
	}

	const tenant = req.locals.Tenant;
	return tenant?.toJSON();
});

export const getActiveTenantGuild = query(async () => {
	const req = getRequestEvent();

	const session = req.locals.session;
	if (!session) {
		logger.error('Session not found');
		error(401, 'Unauthorized: Session not found', req);
	}

	// I don't think this can ever end up actually null without getting caught by earlier code
	if (!req.locals.discordAccessTokens) {
		logger.error('Discord access tokens not found in locals');
		error(401, 'Unauthorized: Discord access tokens not found', req);
	}

	const tenant = req.locals.Tenant;
	// get the discord guild info for the tenant
	if (!tenant) {
		return undefined;
	}

	const discordApi = CacheableDiscordApi.fromSession(req.locals.discordAccessTokens);

	return {
		tenant: tenant.toJSON(),
		permissionLevel: await discordApi.getGuildUserInfo(tenant.guildId).then((guildUserInfo) => {
			return tenant
				.getPermissionsLevel(guildUserInfo.roles || [], session.discordUserId)
				.catch((err) => {
					// Catch any errors in mongodb instances
					logger.error(
						{ err, tenant: tenant.slug },
						'encountered an error getting permissions for tenant'
					);
					return undefined;
				});
		}),
		guild: (await discordApi.getUserGuilds()).find((server) => server.id === tenant.guildId)
	};
});
