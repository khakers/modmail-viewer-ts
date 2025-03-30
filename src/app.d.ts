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
			session: import('$lib/server/auth').SessionValidationResult['session'];
			Tenant?: Tenant; // The tenant information for the current request, if applicable
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
