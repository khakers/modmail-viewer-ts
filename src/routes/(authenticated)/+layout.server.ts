import { discord } from '$lib/server/auth';
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


    const discordApi = CacheableDiscordApi.fromSession(session);

    const guilds = await discordApi.getUserGuilds();

    const guildIds = guilds.map(guild => guild.id);

    const tenants = await getTenants(guildIds);


    const discordServerRoles = (await Promise.all(
        tenants.map(tenant =>
            discordApi.getGuildUserInfo(tenant.guildId)
                .then(guildUserInfo => ({
                    guildId: tenant.guildId,
                    roles: guildUserInfo.roles || [],
                    tenant: tenant
                }))
        )));

    const permissionLevels = (await Promise.all(
        discordServerRoles.map(a => a.tenant.getPermissionsLevel(a.roles, session.discordUserId)
            .then(permissionLevel => ({ tenant: a.tenant, permissionLevel }))
        )
    ));



    const filteredTenants = permissionLevels
        .filter(item => getPermisionOrdinal(item.permissionLevel ?? "ANYONE") >= getPermisionOrdinal("SUPPORTER"))
        .map(item => ({
            id: item.tenant.id,
            slug: item.tenant.slug,
            name: item.tenant.name,
            guildId: item.tenant.guildId,
            permissionLevel: item.permissionLevel
        }));

    const tenantInfo = filteredTenants
        .map((tenant) => {
            return { tenant: tenant, guild: guilds.find(server => server.id === tenant.guildId) };
        })
        .filter(a => a.guild !== undefined);

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