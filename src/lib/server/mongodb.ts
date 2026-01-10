import type { MongoClient } from "mongodb";
import { getMongodbClient as getMultiTenantMongodbClient, getMongodbClientFromId as getMultiTenantMongodbClientFromId } from "./tenancy/multitenantMongodb";
import { getMongodbClient as getMonoTenantMongodbClient } from "./tenancy/monoTenantMongodb";
import { env } from "$env/dynamic/private";

export const multitenancyEnabled = env.TENANT_JSON !== undefined;

// 
export function getMongodbClient(tenant: string | undefined): MongoClient | undefined {
    if (multitenancyEnabled) {
        return getMultiTenantMongodbClient(tenant);
    } else {
        return getMonoTenantMongodbClient(tenant);
    }
}

export function getMongodbClientFromId(id: string): MongoClient | undefined {
    if (multitenancyEnabled) {
        return getMultiTenantMongodbClientFromId(id);
    } else {
        return getMonoTenantMongodbClient(undefined);
    }
}