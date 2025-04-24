import type { Tenant } from '$lib/server/tenancy/tenant';
import type pino from 'pino';
import type { PartialGuild } from '$lib/server/discord';

declare global {
	namespace App {
		interface Error {
			requestId: string | undefined;
		}

		interface Locals {
			logger: pino.Logger;
			requestId: string;
			discordAccessTokens: import('$lib/server/auth').SessionValidationResult['user'];
			user: {
				discordUserId: string;
				username: string;
				discriminator: string;
				avatar: string | null;
                guilds: PartialGuild[];
			}
			session: import('$lib/server/auth').SessionValidationResult['session'];
			Tenant?: Tenant; // The tenant information for the current request, if applicable
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
