import { discord, updateAccessToken } from "./auth";
import { logger } from "$lib/logger";
import { Cacheable, type CacheableOptions } from "cacheable";
import KeyvMemcache from "@keyv/memcache";
import { env } from "$env/dynamic/private";
import { DISCORD_API_URL } from "$env/static/private";

export type DiscordUser = {
    id: string,
    username: string,
    discriminator: string,
    global_name: string | undefined,
    avatar: string | undefined,
    bot?: boolean,
    system?: boolean,
    // mfa_enabled?: boolean,
    locale?: string,
    verified?: boolean,
    // email?: string | undefined,
    flags?: number,
    premium_type?: number,
    public_flags?: number
};

export type GuildMember = {
    user?: DiscordUser,
    nick?: string,
    avatar?: string | null,
    banner?: string | null,
    roles: string[],
    joined_at: string,
    premium_since?: string,
    deaf: boolean,
    mute: boolean,
    pending?: boolean,
    permissions?: string,
};

export type PartialGuild = {
    id: string;
    name: string;
    icon: string | undefined;
    banner: string | undefined;
    owner?: boolean;
    permissions?: string; // total permissions for the user in the guild (excludes overwrites and implicit permissions)
    features?: string[];
    // requires with_count query param set to true
    approximate_member_count?: number; // Approximate member count for the guild
    approximate_presence_count?: number; // Approximate presence count for the guild (online members)
}

type DiscordToken = {
    discordUserId: string;
    refreshToken: string;
    accessToken: string;
    accessTokenExpiresAt: Date;
}

const cacheSettings: CacheableOptions = {
    ttl: 60 * 5 * 1000
};
if (env.MEMCACHED_URI !== undefined) {

    logger.info("Using memcached as tier 2 Discord API cache");
    const secondary = new KeyvMemcache(env.MEMCACHED_URI)
    cacheSettings.secondary = secondary; // Use memcached if MEMCACHED_URI is set
}
const cacheable = new Cacheable(cacheSettings); // Cache for 5 minutes



const ratelimitMap = new Map<string, { reset: Date, remaining: number, limit: number, bucket: string }>();

function trackLimit(response: Response, endpoint: string) {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const limit = response.headers.get('X-RateLimit-Limit');
    const reset = response.headers.get('X-RateLimit-Reset');
    const bucket = response.headers.get('X-RateLimit-Bucket');

    if (remaining && limit && reset) {
        const resetDate = new Date(Date.now() + parseInt(reset) * 1000);
        ratelimitMap.set(endpoint, { reset: resetDate, remaining: parseInt(remaining), limit: parseInt(limit), bucket });
    }
}

function getRateLimitInfo(endpoint: string): { reset: Date, remaining: number, limit: number } | undefined {
    // Retrieve rate limit information for a specific endpoint
    const rateLimitInfo = ratelimitMap.get(endpoint);
    if (rateLimitInfo) {
        // Check if the rate limit has expired
        if (new Date() > rateLimitInfo.reset) {
            ratelimitMap.delete(endpoint); // Remove expired rate limit info
            return undefined; // Rate limit info is no longer valid
        }
        return rateLimitInfo;
    }
    // If no rate limit info is found for the endpoint, return undefined
    return undefined;
}

function isThisEndpointRateLimited(endpoint: string): boolean {
    // Check if the endpoint is currently rate limited
    const rateLimitInfo = getRateLimitInfo(endpoint);
    if (rateLimitInfo) {
        // If remaining requests are 0, it is rate limited
        if (rateLimitInfo.remaining <= 0) {
            logger.warn({ endpoint, rateLimitInfo }, `Endpoint is currently rate limited. Remaining: ${rateLimitInfo.remaining}, Limit: ${rateLimitInfo.limit}`);
            return true;
        }
    }
    return false; // Not rate limited
}

const API_ENDPOINT = DISCORD_API_URL === undefined ? "https://discord.com/api/v10" : env.DISCORD_API_URL; // Use the environment variable if provided, otherwise default to Discord's API v10


export class DiscordApi {
    protected discordToken: DiscordToken;

    constructor(token: DiscordToken) {
        this.discordToken = token;
    }

    static fromSession(session: {
        discordUserId: string;
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresAt: Date;
    }) {
        // Create an instance of DiscordApi from a session object
        return new DiscordApi({
            discordUserId: session.discordUserId,
            refreshToken: session.refreshToken,
            accessToken: session.accessToken,
            accessTokenExpiresAt: session.accessTokenExpiresAt
        });
    }

    // todo sync this the session so stored data is kept in sync
    private async checkTokenRefresh(): Promise<void> {
        // if the access token is still valid (minus a small buffer for clock skew), return early
        const now = new Date();
        const expiresAt = this.discordToken.accessTokenExpiresAt;
        // Allow a 2 minute buffer to account for clock skew
        if (expiresAt > new Date(now.getTime() + 2 * 60 * 1000)) {
            return; // Access token is still valid
        }
        logger.debug({ user: this.discordToken.discordUserId }, `Access token expired for user ${this.discordToken.discordUserId}. Refreshing...`);
        const foo = await discord.refreshAccessToken(this.discordToken.refreshToken)
        this.discordToken.accessToken = foo.accessToken();
        this.discordToken.accessTokenExpiresAt = foo.accessTokenExpiresAt();
        await updateAccessToken(this.discordToken.discordUserId, this.discordToken.accessToken, this.discordToken.accessTokenExpiresAt);
    }

    async getDiscordUser(): Promise<DiscordUser> {
        await this.checkTokenRefresh();

        if (isThisEndpointRateLimited("/users/@me+" + this.discordToken.discordUserId)) {
            // If the endpoint is rate limited, log a warning and return early
            logger.warn({ userId: this.discordToken.discordUserId }, `Cannot fetch Discord user info: endpoint is rate limited`);
            throw new Error("Rate limit exceeded for /users/@me");
        }

        const response = await fetch(API_ENDPOINT + "/users/@me", {
            headers: {
                Authorization: `Bearer ${this.discordToken.accessToken}`
            }
        });

        trackLimit(response, `/users/@me+${this.discordToken.discordUserId}`); // scope endpoint to this user id

        if (!response.ok) {
            if (response.status === 429) {
                // Unauthorized, token might be invalid or expired
                logger.warn({ endpoint: "/users/@me", response }, `hit rate limit`);
            }
            logger.error({ endpoint: "/users/@me", response }, `Failed to fetch user info}: ${response.statusText}`);
            throw new Error(`Failed to user info: ${response.statusText}`);
        }


        return await response.json();
    }

    /**
     * Retrieves the guild member information of the current user for a given guild.
     *
     * This function ensures that the Discord access token is valid by invoking a token refresh if needed,
     * and then sends a GET request to the Discord API to retrieve the user's guild member details.
     *
     * @param guildId - The ID of the Discord guild for which to retrieve member information.
     * @returns A promise that resolves to the GuildMember object representing the user's information in the specified guild.
     *
     * @throws Error if the provided guildId is empty or invalid.
     */
    async getGuildUserInfo(guildId: string): Promise<GuildMember> {
        await this.checkTokenRefresh();

        if (!guildId) {
            throw new Error("Guild ID is required");
        }

        if (isThisEndpointRateLimited(`/users/@me/guilds/${guildId}/member`)) {
            // If the endpoint is rate limited, log a warning and return early
            logger.warn({ guildId }, `Cannot fetch guild member info: endpoint is rate limited`);
            throw new Error("Rate limit exceeded for /users/@me/guilds/${guildId}/member");
        }

        const response = await fetch(API_ENDPOINT + `/users/@me/guilds/${guildId}/member`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.discordToken.accessToken}`
            }
        });

        trackLimit(response, `/users/@me/guilds/${guildId}/member`);

        if (!response.ok) {
            if (response.status === 429) {
                // Unauthorized, token might be invalid or expired
                logger.warn({ guildId, endpoint: `/users/@me/guilds/${guildId}/member`, response }, `hit rate limit on `);
            }
            logger.error({ guildId, endpoint: `/users/@me/guilds/${guildId}/member`, response }, `Failed to fetch guild member info for guild ${guildId}: ${response.statusText}`);
            throw new Error(`Failed to fetch guild member info: ${response.statusText}`);
        }

        return await response.json();
    }

    async getUserGuilds(): Promise<Array<PartialGuild>> {
        await this.checkTokenRefresh();

        if (isThisEndpointRateLimited("/users/@me/guilds+" + this.discordToken.discordUserId)) {
            // If the endpoint is rate limited, log a warning and return early
            logger.warn({ userId: this.discordToken.discordUserId }, `Cannot fetch Discord user guilds: endpoint is rate limited`);
            throw new Error("Rate limit exceeded for /users/@me/guilds");
        }

        const response = await fetch(API_ENDPOINT + `/users/@me/guilds`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.discordToken.accessToken}`
            }
        });

        trackLimit(response, `/users/@me/guilds`);

        if (!response.ok) {
            if (response.status === 429) {
                // Unauthorized, token might be invalid or expired
                logger.warn({ endpoint: `/users/@me/guilds`, response }, `hit endpoint rate limit`);
            }
            logger.error({ endpoint: `/users/@me/guilds`, response }, `Failed to fetch user guilds: ${response.statusText}`);
            throw new Error(`Failed to fetch guild member info: ${response.statusText}`);
        }

        return await response.json();

    }
}

export class CacheableDiscordApi extends DiscordApi {

    constructor(token: DiscordToken) {
        super(token);
    }

    static fromSession(session: {
        discordUserId: string;
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresAt: Date;
    }) {
        return new CacheableDiscordApi({
            discordUserId: session.discordUserId,
            refreshToken: session.refreshToken,
            accessToken: session.accessToken,
            accessTokenExpiresAt: session.accessTokenExpiresAt
        });
    }

    private wrappedGetDiscordUser = cacheable.wrap(super.getDiscordUser, {
        keyPrefix: "getDiscordUser" + this.discordToken.discordUserId,
        ttl: 60 * 10 * 1000
    });
    async getDiscordUser(): Promise<DiscordUser> {
        return this.wrappedGetDiscordUser();
    }

    private wrappedGetGuildUserInfo = cacheable.wrap(super.getGuildUserInfo, {
        keyPrefix: "getGuildUserInfo" + this.discordToken.discordUserId,
    });

    async getGuildUserInfo(guildId: string): Promise<GuildMember> {
        return this.wrappedGetGuildUserInfo(guildId);
    }

    private wrappedGetUserGuilds = cacheable.wrap(super.getUserGuilds, {
        keyPrefix: "getUserGuilds" + this.discordToken.discordUserId,
    });

    async getUserGuilds(): Promise<Array<PartialGuild>> {
        return this.wrappedGetUserGuilds();
    }
}