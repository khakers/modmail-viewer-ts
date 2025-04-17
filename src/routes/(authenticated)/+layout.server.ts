import { CacheableDiscordApi } from '$lib/server/discord';
import { getPermisionOrdinal } from '$lib/server/modmail/permissions';
import { error } from '$lib/server/skUtils';
import { getTenants } from '$lib/server/tenancy/tenant';
import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {

    const logger = event.locals.logger;

    const session = event.locals.session;
    if (!session) {
        logger.error('Session not found');
        error(401, 'Unauthorized: Session not found', event);
    }

    const loadStart = performance.now();

    const discordApi = CacheableDiscordApi.fromSession(event.locals.discordAccessTokens);

    const guilds = await discordApi.getUserGuilds();

    const guildIds = guilds.map(guild => guild.id);

    logger.debug({ loadStart }, `Guilds loaded in ${performance.now() - loadStart} ms`);

    const tenants = await getTenants(guildIds);

    const roleFetchStart = performance.now();

    const guildRoles = (await Promise.all(
        tenants.map(tenant =>
            discordApi.getGuildUserInfo(tenant.guildId)
                .then(guildUserInfo => ({
                    guildId: tenant.guildId,
                    roles: guildUserInfo.roles || [],
                    tenant: tenant
                }))
        )));

    const roleFetchEnd = performance.now();

    const permissionLevels = (await Promise.all(
        guildRoles.map(a =>
            a.tenant.getPermissionsLevel(a.roles, session.discordUserId)
                .then(permissionLevel => ({ tenant: a.tenant, permissionLevel }))
                .catch((err) => {
                    // Catch any errors in mongodb instances
                    logger.error({err, tenant:a.tenant.slug},'encountered an error getting permissions for tenant')
                    return ({ tenant: a.tenant, permissionLevel: undefined});
                })
        )
    ));

    const permissionFetchEnd = performance.now();


    const filteredTenants = permissionLevels
        .filter(item => getPermisionOrdinal(item.permissionLevel ?? "ANYONE") >= getPermisionOrdinal("SUPPORTER"))
        .map(item => ({
            id: item.tenant.id,
            slug: item.tenant.slug,
            name: item.tenant.name,
            guildId: item.tenant.guildId,
            permissionLevel: item.permissionLevel,
            description: item.tenant.description
        }));

    const tenantInfo = filteredTenants
        .map((tenant) => {
            return { tenant: tenant, guild: guilds.find(server => server.id === tenant.guildId) };
        })
        .filter(a => a.guild !== undefined);

    const loadEnd = performance.now();

    logger.debug({ userGulds: roleFetchStart - loadStart, roleFetch: roleFetchEnd - roleFetchStart, PermissionFetch: roleFetchEnd - permissionFetchEnd, permissionLevels: permissionFetchEnd - loadEnd }, `Tenants loaded in ${loadEnd - loadStart} ms (Guilds: ${roleFetchEnd - roleFetchStart} ms), `);

    //  = guilds
    //     .map(server => {
    //         const e = filteredTenants.find(a => a.guildId === server.id)
    //         return { tenant: e, guild: server };
    //     })
    //     .filter(a => a.tenant !== undefined);

    return {
        user: event.locals.user || null,
        tenants: filteredTenants,
        tenantInfo,
    };
}) satisfies LayoutServerLoad;