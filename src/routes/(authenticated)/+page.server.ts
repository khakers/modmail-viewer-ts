import { CacheableDiscordApi } from '$lib/server/discord';
import { error } from '$lib/server/skUtils';
import { getTenants } from '$lib/server/tenancy/tenant';
import type { PageServerLoad } from './$types';
import { getPermisionOrdinal } from '$lib/server/modmail/permissions';

export const load = (async (event) => {
    // grab a list of all tenats, filter out tenants that the user is not in, and finally check permissions
    // return the list of tenants that the user can access

    const logger = event.locals.logger;

    const session = event.locals.session;
    if (!session) {
        logger.error('Session not found');
        error(401, 'Unauthorized: Session not found', event);
    }

    const discordApi = CacheableDiscordApi.fromSession(session);

    const servers = await discordApi.getUserGuilds();

    const serverIds = servers.map(server => server.id);

    const tenants = await getTenants(serverIds);

    // get roles for all the servers in the filtered list
    // this will be used to check permissions for each tenant
    // we need to track the guild id and keep the tenant object for each response

    const roles = (await Promise.all(tenants.map(tenant =>
        discordApi.getGuildUserInfo(tenant.guildId).then(guildUserInfo => ({
            guildId: tenant.guildId,
            roles: guildUserInfo.roles || [],
            tenant: tenant
        }))
    )));

    logger.trace({ roles }, 'Retrieved roles for all tenants'); // Log the roles for debugging

    // Get the permission level of the user for each tenant and filter out tenants that the user does not have permissions for
    // (below SUPPORTER)

    const foo = (await Promise.all(
        roles.map(a => a.tenant.getPermissionsLevel(a.roles, session.discordUserId)
            .then(permissionLevel => ({ tenant: a.tenant, permissionLevel }))
        )
    ));
    // need to async filter all tenants to check if the user has permissions for each tenant
    // const foo = tenants.map((tenant) => tenant.getPermissionsLevel(session.discordUserId, session.))


    return {
        roles: roles.map(role => ({roles: role.roles, guildId: role.guildId})),
        possibleTenants: tenants.map(tenant => ({
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,

        })),
        permissionMap: foo.map(item => ({
            tenantId: item.tenant.id,
            slug: item.tenant.slug,
            permissionLevel: item.permissionLevel
        })),
        tenants: foo
            .filter(item => getPermisionOrdinal(item.permissionLevel ?? "ANYONE") >= getPermisionOrdinal("SUPPORTER"))
            .map(item => ({
                id: item.tenant.id,
                slug: item.tenant.slug,
                name: item.tenant.name,
                permissionLevel: item.permissionLevel
            }))
    };
}) satisfies PageServerLoad;