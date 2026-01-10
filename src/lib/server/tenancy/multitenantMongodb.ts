import { logger } from '$lib/logger';
import { MongoClient } from 'mongodb';
import * as jsonSource from './sources/jsonSource';
import type { TenantConfig } from './tenantSchema';

// const tenantSource = env.TENANT_JSON !== undefined ? jsonSource : singleSource;

const tenantSource = jsonSource;

/**
 * Retrieves the MongoDB client instance associated with the specified tenant.
 *
 * @param tenant - A string representing the tenant identifier. If undefined, no client is returned.
 * @returns The MongoDB client corresponding to the tenant, or undefined if no tenant is provided.
 */
export function getMongodbClient(tenant: string | undefined): MongoClient | undefined {
	logger.debug({ tenant }, 'getMongodbClient');
	if (tenant) {
		return tenantSource.getMongodbClientFromId(tenant);
	}
	return undefined;
}

export function getMongodbClientFromId(id: string | undefined): MongoClient | undefined {
	logger.debug({ id }, 'getMongodbClient');
	if (id) {
		return tenantSource.getMongodbClientFromId(id);
	}
	return undefined;
}

export function getTenant(slug: string): Promise<
	| (TenantConfig & {
			mongoClient: MongoClient;
	  })
	| undefined
> {
	return tenantSource.getTenant(slug);
}

export function getTenants(): TenantConfig[] {
	logger.debug('getTenants');
	// Retrieve all tenants from the tenant source
	try {
		const clients = tenantSource.getTenants();
		return clients || []; // Return the tenants array or an empty array if undefined
	} catch (error) {
		logger.error({ err: error }, 'Failed to get tenants');
		return [];
	}
}
