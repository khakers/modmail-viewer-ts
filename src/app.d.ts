import type { Tenant } from '$lib/server/tenancy/tenant';
import type pino from 'pino';

declare global {
	namespace App {
		interface Error {
			requestId: string | undefined;
		}

		interface Locals {
			logger: pino.Logger;
			requestId: string;
			// user: import('$lib/server/auth').SessionValidationResult['user'];
			user: {
				discordUserId: string; // The Discord user ID
				username: string; // The Discord username
				discriminator: string; // The Discord discriminator (e.g., "1234")
				avatar: string | null; // The Discord avatar URL or null if no avatar is set
				}
				// TODO drop refresh token from this. app can manually grab it from db if needed
			session: import('$lib/server/auth').SessionValidationResult['session'];
			Tenant?: Tenant; // The tenant information for the current request, if applicable
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
