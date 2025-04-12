import { env } from "$env/dynamic/private";
import { MongoClient } from "mongodb";
import { building } from "$app/environment";
import type { Tenant } from "./tenant";


export class MultitenancyDisabledError extends Error {
    constructor(message: string) {
        super(message);
    }
}

// if mongodb uri is set, don't use multitenancy
// if mongodb uri is not set, use multitenancy

if (!env.MONGODB_URI && !building) {
    throw new Error("MONGODB_URI is not set");
}


const uri = env.MONGODB_URI;
if (!uri && !building) {
    throw new Error("MONGODB_URI is not set");
}

const tenant: Tenant = {
    id: "default",
    connection_uri: uri,
    slug: "",
    guild_id: env.GUILD_ID,
}

export const MongodbClient: MongoClient = building === false ?  new MongoClient(uri) : undefined;

export function getMongodbClient(tenant: string | undefined): MongoClient {
    if (tenant) {
        throw new MultitenancyDisabledError("requested a tenant but multitenancy is not enabled");
    }
    return MongodbClient;
}

export function getTenants(): Tenant[] {
    return [tenant]
}