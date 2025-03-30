import { CacheableDiscordApi } from '$lib/server/discord';
import { error } from '$lib/server/skUtils';
import type { PageServerLoad } from './$types';

function omit<T>(key: keyof T, obj: T) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [key]: omitted, ...rest } = obj;
    return rest;
}

export const load = (async (event) => {
    //return data for for the user within the context of the tenant


    const logger = event.locals.logger;

    // get tentant information
    const tenant = event.locals.Tenant;
    // logger.trace({ tenant },'Loading page for tenant'); // Log the tenant slug for debugging

    if (tenant === undefined) {
        // Handle the case where the tenant is not found
        error(500, 'Tenant not found', event);
    }
    if (event.locals.session === null ) {
        // Handle the case where the session is not found
        error(500, 'Session not found', event);
    }

    const client = event.locals.Tenant?.mongoClient;
    if (!client) {
        logger.error({ tenant }, 'MongoDB client not found for tenant');
        // Handle the case where the MongoDB client is not available
        error(500, `MongoDB client not found for tenant '${tenant}'`, event);
    }

    const discordApi = new CacheableDiscordApi({ discordUserId: event.locals.session.discordUserId, accessToken: event.locals.session.accessToken, refreshToken: event.locals.session.refreshToken, accessTokenExpiresAt: event.locals.session.accessTokenExpiresAt });

    const discordRoles = await discordApi.getGuildUserInfo(tenant.guildId);

    return {
        tenant: {
            tenantId: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
            title: tenant.title,
            description: tenant.description,
            guildId: tenant.guildId,
            botId: tenant.botId,
        }, 
        discordServer: await discordApi.getGuildUserInfo(tenant.guildId),
        role: await tenant.getPermissionsLevel(discordRoles.roles || []),
    };
}) satisfies PageServerLoad;