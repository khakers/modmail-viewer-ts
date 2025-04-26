import { discord, getDiscordRefreshToken, updateAccessToken } from './auth';
import { logger } from '$lib/logger';
import { Cacheable } from 'cacheable';
import { env } from '$env/dynamic/private';
import { DISCORD_API_URL } from '$env/static/private';
import { addMinutes, isAfter, isPast } from 'date-fns';
import { hashString } from '$lib/server/cache-utils';
import { coalesceAsync } from '$lib/server/coaleseAsync';

export type DiscordUser = {
	id: string;
	username: string;
	discriminator: string;
	global_name: string | undefined;
	avatar: string | undefined;
	bot?: boolean;
	system?: boolean;
	// mfa_enabled?: boolean,
	locale?: string;
	verified?: boolean;
	// email?: string | undefined,
	flags?: number;
	premium_type?: number;
	public_flags?: number;
};

export type GuildMember = {
	user?: DiscordUser;
	nick?: string;
	avatar?: string | null;
	banner?: string | null;
	roles: string[];
	joined_at: string;
	premium_since?: string;
	deaf: boolean;
	mute: boolean;
	pending?: boolean;
	permissions?: string;
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
};

export type DiscordOIDC = {
	sub: string; // The unique identifier for the Discord user
	preferred_username: string; // The username of the Discord user
	nickname: string;
	picture: string;
	locale: string;
};

interface DiscordToken {
	uid: string | undefined;
	refreshToken: string;
	accessToken: string;
	accessTokenExpiresAt: Date;
}

const options = {
	ttl: '5m',
	stats: true,
	namespace: 'discord-api'
};

const cache = new Cacheable({
	namespace: 'discordAPI'
});

const ratelimitMap = new Map<
	string,
	{ reset: Date; remaining: number; limit: number; bucket: string | null }
>();

function trackLimit(response: Response, endpoint: string) {
	const remaining = response.headers.get('X-RateLimit-Remaining');
	const limit = response.headers.get('X-RateLimit-Limit');
	const reset = response.headers.get('X-RateLimit-Reset');
	const bucket = response.headers.get('X-RateLimit-Bucket');

	if (remaining && limit && reset) {
		const resetDate = new Date(Date.now() + parseInt(reset) * 1000);
		ratelimitMap.set(endpoint, {
			reset: resetDate,
			remaining: parseInt(remaining),
			limit: parseInt(limit),
			bucket
		});
	}
}

function getRateLimitInfo(
	endpoint: string
): { reset: Date; remaining: number; limit: number } | undefined {
	// Retrieve rate limit information for a specific endpoint
	const rateLimitInfo = ratelimitMap.get(endpoint);
	if (rateLimitInfo) {
		// Check if the rate limit has expired
		if (isAfter(new Date(), rateLimitInfo.reset)) {
			ratelimitMap.delete(endpoint); // Remove expired rate limit info
			return undefined; // Rate limit info is no longer valid
		}
		return rateLimitInfo;
	}
	// If no rate limit info is found for the endpoint, return undefined
	return undefined;
}

// TODO some rate limits are global so the string identifiers should be seperate
function isThisEndpointRateLimited(endpoint: string): boolean {
	// Check if the endpoint is currently rate limited
	const rateLimitInfo = getRateLimitInfo(endpoint);
	if (rateLimitInfo) {
		// If remaining requests are 0, it is rate limited
		if (rateLimitInfo.remaining <= 0) {
			logger.warn(
				{
					endpoint,
					rateLimitInfo
				},
				`Endpoint is currently rate limited. Remaining: ${rateLimitInfo.remaining}, Limit: ${rateLimitInfo.limit}`
			);
			return true;
		}
	}
	return false; // Not rate limited
}

// Discord API endpoint
// if env.DISCORD_API_URL is set, use that as the API endpoint
// otherwise use DISCORD_API_URL
// otherwise use https://discord.com/api/v10
const API_ENDPOINT =
	env.DISCORD_API_URL === undefined || env.DISCORD_API_URL === ''
		? DISCORD_API_URL === undefined || env.DISCORD_API_URL === ''
			? 'https://discord.com/api/v10'
			: DISCORD_API_URL
		: env.DISCORD_API_URL; // Use the environment variable if provided, otherwise default to Discord's API v10

logger.trace({ API_ENDPOINT }, 'Using Discord API endpoint');

export class DiscordApi {
	protected discordToken: Omit<DiscordToken, 'refreshToken'>;

	constructor(token: Omit<DiscordToken, 'refreshToken'>) {
		this.discordToken = token;
	}

	static fromSession(session: { uid: string; accessToken: string; accessTokenExpiresAt: Date }) {
		// Create an instance of DiscordApi from a session object
		return new DiscordApi({
			uid: session.uid,
			accessToken: session.accessToken,
			accessTokenExpiresAt: session.accessTokenExpiresAt
		});
	}

	// todo sync this the session so stored data is kept in sync
	private async checkTokenRefresh(): Promise<void> {
		if (this.discordToken.uid === undefined) return;
		// if the access token is still valid (minus a small buffer for clock skew), return early
		const now = Date.now();
		const expiresAt = this.discordToken.accessTokenExpiresAt;
		// Allow a 2 minute buffer to account for clock skew
		logger.trace(
			{ expiresAt, now },
			`Checking if access token is expired for user ${this.discordToken.uid}`
		);
		// if now+2 min is after token expiration, refresh the token
		// if token is already expired or will expire within 2 minutes
		if (isPast(expiresAt) || isAfter(addMinutes(now, 2), expiresAt)) {
			logger.debug(
				{ user: this.discordToken.uid },
				`Access token expired for user ${this.discordToken.uid}. Refreshing...`
			);
			const token = await getDiscordRefreshToken(this.discordToken.uid);
			const refreshReponse = await discord.refreshAccessToken(token);

			this.discordToken.accessToken = refreshReponse.accessToken();
			this.discordToken.accessTokenExpiresAt = refreshReponse.accessTokenExpiresAt();

			await updateAccessToken(
				this.discordToken.uid,
				this.discordToken.accessToken,
				this.discordToken.accessTokenExpiresAt
			);
		}
	}

	async getDiscordUser(): Promise<DiscordUser> {
		await this.checkTokenRefresh();

		if (
			isThisEndpointRateLimited(
				'/users/@me+' + (this.discordToken.uid ?? crypto.randomUUID())
			)
		) {
			// If the endpoint is rate limited, log a warning and return early
			logger.warn(
				{ userId: this.discordToken.uid },
				`Cannot fetch Discord user info: endpoint is rate limited`
			);
			throw new Error('Rate limit exceeded for /users/@me');
		}

		const response = await fetch(new URL(API_ENDPOINT + '/users/@me'), {
			headers: {
				Authorization: `Bearer ${this.discordToken.accessToken}`
			}
		});

		trackLimit(response, `/users/@me+${this.discordToken.uid ?? crypto.randomUUID}`); // scope endpoint to this user id

		if (!response.ok) {
			if (response.status === 429) {
				// Unauthorized, token might be invalid or expired
				logger.warn({ endpoint: '/users/@me', res: response }, `hit rate limit`);
			}
			logger.error(
				{
					endpoint: '/users/@me',
					res: response
				},
				`Failed to fetch user info: ${response.statusText}`
			);
			throw new Error(`Failed to get user info: ${response.statusText}`);
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
		logger.trace(
			{ guildId },
			`Fetching guild user info for guild ${guildId} with cacheable Discord API`
		);
		await this.checkTokenRefresh();

		if (!guildId) {
			throw new Error('Guild ID is required');
		}

		if (isThisEndpointRateLimited(`/users/@me/guilds/${guildId}/member`)) {
			// If the endpoint is rate limited, log a warning and return early
			logger.warn({ guildId }, `Cannot fetch guild member info: endpoint is rate limited`);
			throw new Error('Rate limit exceeded for /users/@me/guilds/${guildId}/member');
		}

		const response = await fetch(
			new URL(API_ENDPOINT + `/users/@me/guilds/${guildId}/member`),
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.discordToken.accessToken}`
				}
			}
		);

		trackLimit(response, `/users/@me/guilds/${guildId}/member`);

		if (!response.ok) {
			if (response.status === 429) {
				// Unauthorized, token might be invalid or expired
				logger.warn(
					{
						guildId,
						endpoint: `/users/@me/guilds/${guildId}/member`,
						res: response
					},
					`hit rate limit on `
				);
			}
			logger.error(
				{
					guildId,
					endpoint: `/users/@me/guilds/${guildId}/member`,
					res: response
				},
				`Failed to fetch guild member info for guild ${guildId}: ${response.statusText}`
			);
			throw new Error(`Failed to fetch guild member info: ${response.statusText}`);
		}

		return await response.json();
	}

	async getUserGuilds(): Promise<Array<PartialGuild>> {
		await this.checkTokenRefresh();

		if (
			isThisEndpointRateLimited(
				'/users/@me/guilds+' + (this.discordToken.uid ?? crypto.randomUUID())
			)
		) {
			// If the endpoint is rate limited, log a warning and return early
			logger.warn(
				{ userId: this.discordToken.uid },
				`Cannot fetch Discord user guilds: endpoint is rate limited`
			);
			throw new Error('Rate limit exceeded for /users/@me/guilds');
		}

		const response = await fetch(new URL(API_ENDPOINT + `/users/@me/guilds`), {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.discordToken.accessToken}`
			}
		});

		trackLimit(response, `/users/@me/guilds`);

		if (!response.ok) {
			if (response.status === 429) {
				// Unauthorized, token might be invalid or expired
				logger.warn(
					{ endpoint: `/users/@me/guilds`, res: response },
					`hit endpoint rate limit`
				);
			}
			logger.error(
				{
					endpoint: `/users/@me/guilds`,
					res: response
				},
				`Failed to fetch user guilds: ${response.statusText}`
			);
			throw new Error(`Failed to fetch guild member info: ${response.statusText}`);
		}

		return await response.json();
	}
}

export class CacheableDiscordApi {
	private DiscordAPI: DiscordApi;
	private discordToken: Omit<DiscordToken, 'refreshToken'>;

	constructor(token: Omit<DiscordToken, 'refreshToken'>) {
		this.DiscordAPI = DiscordApi.fromSession(token);
		this.discordToken = token;
	}

	static fromSession(session: { uid: string; accessToken: string; accessTokenExpiresAt: Date }) {
		return new CacheableDiscordApi({
			uid: session.uid,
			accessToken: session.accessToken,
			accessTokenExpiresAt: session.accessTokenExpiresAt
		});
	}

	async getDiscordUser(): Promise<DiscordUser> {
		const log = logger.child({
			method: 'CacheableDiscordApi#getDiscordUser'
		});
		if (this.discordToken.uid === undefined) {
			log.trace('unable to check cache due to missing uid');

			// Can't check cache without uid
			// we can, however, cache the response since we will know the uid at that point
			const response = await this.DiscordAPI.getDiscordUser();
			// take the opportunity to set the uid if this class is used again
			this.discordToken.uid = response.id;

			if (response === undefined) {
				throw new Error('received undefined response from discord api');
			}
			await cache.set('getDiscordUser::' + hashString(response.id), response, '10m');

			return response;
		}

		const key = 'getDiscordUser::' + hashString(this.discordToken.uid);

		let response = await cache.get<DiscordUser>(key);

		if (response === undefined) {
			log.trace({ key }, 'cache miss');

			// we coalesce with the token since within the space any duplicates will happen we know the token but not necessarily the uid
			response = await coalesceAsync(
				'discordApi::getDiscordUser' + hashString(this.discordToken.accessToken),
				async () => {
					response = await this.DiscordAPI.getDiscordUser();

					await cache.set(key, response, '10m');

					return response;
				}
			);
		} else {
			log.trace({ key }, 'cache hit');
		}

		return response;
	}

	async getGuildUserInfo(guildId: string): Promise<GuildMember> {
		const log = logger.child({
			method: 'CacheableDiscordApi#getGuildUserInfo',
			guildId: guildId
		});

		if (this.discordToken.uid === undefined) {
			log.trace('unable to check cache due to missing uid');

			// Can't check cache without uid
			// we can, however, cache the response since we will know the uid at that point
			const response = await this.DiscordAPI.getGuildUserInfo(guildId);

			return response;
		}

		const key = 'getGuildUserInfo::' + hashString(this.discordToken.uid + guildId);

		let response = await cache.get<GuildMember>(key);

		if (response === undefined) {
			log.trace({ key }, 'cache miss');

			// we coalesce with the token since within the space any duplicates will happen we know the token but not necessarily the uid
			response = await coalesceAsync(
				'discordApi::getGuildUserInfo' + hashString(this.discordToken.accessToken),
				async () => {
					response = await this.DiscordAPI.getGuildUserInfo(guildId);

					await cache.set(key, response, '10m');

					return response;
				}
			);
		} else {
			log.trace({ key }, 'cache hit');
		}

		return response;
	}

	async getUserGuilds(): Promise<Array<PartialGuild>> {
		const log = logger.child({ method: 'CacheableDiscordApi#getUserGuilds' });
		if (this.discordToken.uid === undefined) {
			log.trace('unable to check cache due to missing uid');

			// Can't check cache without uid
			// we can, however, cache the response since we will know the uid at that point
			return await this.DiscordAPI.getUserGuilds();
		}

		const key = 'getUserGuilds::' + hashString(this.discordToken.uid);

		let response = await cache.get<Array<PartialGuild>>(key);

		if (response === undefined) {
			log.trace({ key }, 'cache miss');

			// we coalesce with the token since within the space any duplicates will happen we know the token but not necessarily the uid
			response = await coalesceAsync(
				'discordApi::getUserGuilds' + hashString(this.discordToken.accessToken),
				async () => {
					response = await this.DiscordAPI.getUserGuilds();

					await cache.set(key, response, '10m');

					return response;
				}
			);
		} else {
			log.trace({ key }, 'cache hit');
		}

		return response;
	}
}
