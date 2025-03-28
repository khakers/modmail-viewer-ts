import { env } from "$env/dynamic/private";
import { MongoClient } from "mongodb";


export class MultitenancyDisabledError extends Error {
    constructor(message: string) {
        super(message);
    }
}

// if mongodb uri is set, don't use multitenancy
// if mongodb uri is not set, use multitenancy

if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
}


const uri = env.MONGODB_URI;
if (!uri) {
    throw new Error("MONGODB_URI is not set");
}

export const MongodbClient = new MongoClient(uri);

export function getMongodbClient(tenant: string | undefined): MongoClient {
    if (tenant) {
        throw new MultitenancyDisabledError("requested a tenant but multitenancy is not enabled");
    }
    return MongodbClient;
}
