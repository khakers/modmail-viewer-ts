import { env } from "$env/dynamic/private";
import { logger } from "$lib/logger";
import { readFileSync } from "fs";
import { MongoClient } from "mongodb";
import { z } from "zod";
import { TenantSchema, type TenantConfig } from "../tenantSchema";
import { building } from "$app/environment";


// TODO each slug and id in the schema must be unique and should not be duplicated in the JSON file.
const tenantArraySchema = z.array(TenantSchema).readonly();


const TenantMongodbInstances: Map<string, { tenant: TenantConfig, MongodbClient: MongoClient }> = new Map();



const jsonPath = env.TENANT_JSON;
if (!building) {

    logger.info("multitenancy is enabled");
    if (!jsonPath) {
        logger.fatal("TENANT_JSON is not set but multitenancy is enabled");
        throw new Error("TENANT_JSON undefined");
    }
    logger.info(`loading tenants from ${jsonPath}`);
    // load tenants from file
    const file = readFileSync(jsonPath, "utf-8")

    const tenants = JSON.parse(file);

    if (!tenants) {
        logger.fatal("Failed to parse TENANT_JSON file");
        throw new Error("Failed to parse TENANT_JSON file");
    }

    logger.trace({ tenants }, "Parsed tenant JSON"); // Log the parsed tenants for debugging

    const parsedTenancyConfig = tenantArraySchema.parse(tenants);

    for (const tenant of parsedTenancyConfig) {
        const uri = tenant.connection_uri;
        const client = new MongoClient(uri);
        TenantMongodbInstances.set(tenant.slug, { MongodbClient: client, tenant });
    }

}

export function getMongodbClient(tenantSlug: string | undefined): MongoClient | undefined {
    if (!tenantSlug) {
        logger.error("No tenant slug provided");
        return undefined;
    }

    const tenant = TenantMongodbInstances.get(tenantSlug);
    if (tenant) {
        return tenant.MongodbClient;
    }

    return undefined
}

export function getTenantData(tenantSlug: string): TenantConfig & { mongoClient: MongoClient } | undefined {
    // logger.debug({ tenant }, "getTenantData");
    if (tenantSlug) {
        const instance = TenantMongodbInstances.get(tenantSlug);
        if (instance) {
            return instance.tenant;
        } else {
            logger.error(`Tenant with slug ${tenantSlug} not found`);
            return undefined;
        }
    }
    logger.error("No tenant slug provided");
    return undefined;

}

export function GetAllTenants() {
    return Array.from(TenantMongodbInstances.values())
}

export function functionGetTenantsInGuildIds(guildIds: string[]) {
    // This function returns all tenants that match the provided guild IDs

    if (guildIds.length === 0) {
        logger.error("No guild IDs provided");
        return [];
    }
    logger.trace({ guildIds }, "Getting tenants for guild IDs");

    return Array.from(TenantMongodbInstances.values())
        .filter(instance => guildIds.includes(instance.tenant.guild_id))
}

export function getTenants(): TenantConfig[] {
    return Array.from(TenantMongodbInstances.values()).map(instance => instance.tenant);

}


export async function getTenant(slug: string): Promise<TenantConfig & { mongoClient: MongoClient } | undefined> {
    const tenantInstance = TenantMongodbInstances.get(slug);
    if (tenantInstance) {
        return { ...tenantInstance.tenant, mongoClient: tenantInstance.MongodbClient };
    } else {
        logger.error(`Tenant with slug ${slug} not found`);
        return undefined;
    }
}