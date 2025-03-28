import { env } from "$env/dynamic/private";
import { logger as parentLogger } from "$lib/logger";
import { readFileSync } from "fs";
import { MongoClient } from "mongodb";
import { z } from "zod";

const logger = parentLogger.child({ module: "multitenantMongodb" });

const tenantSchema = z.array(z.object({
    id: z.string(),
    // Value used in the URL
    slug: z.string(),
    name: z.string().optional(),
    title: z.string().optional(),
    description: z.string(),
    connection_uri: z.string().url()
})).readonly();

const TenantMongodbInstances: Map<string, { MongodbClient: MongoClient }> = new Map();


const jsonPath = env.TENANT_JSON;
logger.info("multitenancy is enabled");
if (!jsonPath) {
    logger.fatal("TENANT_JSON is not set but multitenancy is enabled");
    throw new Error("TENANT_JSON undefined");
}
logger.info(`loading tenants from ${jsonPath}`);
// load tenants from file
const file = readFileSync(jsonPath, "utf-8")

const tenants = JSON.parse(file);
const parsedTenancyConfig = tenantSchema.parse(tenants);

for (const tenant of parsedTenancyConfig) {
    const uri = tenant.connection_uri;
    const client = new MongoClient(uri);
    TenantMongodbInstances.set(tenant.slug, { MongodbClient: client });
}

logger.debug(TenantMongodbInstances,"TenantMongodbInstances" );
console.debug("TenantMongodbInstances", TenantMongodbInstances);

export function getMongodbClient(tenant: string | undefined): MongoClient | undefined {
    logger.debug({ tenant }, "getMongodbClient");
    if (tenant) {
        const client = TenantMongodbInstances.get(tenant);
        return client?.MongodbClient;

    }
    return undefined;
}
