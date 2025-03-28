// See https://svelte.dev/docs/kit/types#app.d.ts

import type pino from "pino";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			logger: pino.Logger;
			requestId: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
