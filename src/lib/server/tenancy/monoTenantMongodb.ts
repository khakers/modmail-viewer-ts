import { env } from '$env/dynamic/private';
import { MongoClient } from 'mongodb';
import { building } from '$app/environment';
import { MULTITENANCY_ENABLED } from './tenant';
import type { TenantConfig } from '$lib/server/tenancy/tenantSchema';

export class MultitenancyDisabledError extends Error {
	constructor(message: string) {
		super(message);
	}
}

if (!env.MONGODB_URI && !building && MULTITENANCY_ENABLED) {
	throw new Error('MONGODB_URI is not set');
}

const uri = env.MONGODB_URI;

const tenant: TenantConfig = {
	id: 'default',
	connection_uri: uri,
	slug: '',
	guild_id: env.GUILD_ID
};

export const MongodbClient = !building ? new MongoClient(uri) : undefined;

export function getMongodbClient(tenant: string | undefined): MongoClient {
	if (tenant) {
		throw new MultitenancyDisabledError('requested a tenant but multitenancy is not enabled');
	}
	// This will only be undefined if the application is building
	return MongodbClient as MongoClient;
}

export function getTenants(): TenantConfig[] {
	return [tenant];
}
