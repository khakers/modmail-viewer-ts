import { getMongodbClient } from "../mongodb";
import type { TenantInfo } from "./tenantSchema";
import { getTenant } from "./multitenantMongodb";
import { logger } from "$lib/logger";
import { env } from "$env/dynamic/private";
import { getModmailPermissions, getUserPermissionLevel, type config, type PermissionLevel } from "../modmail/permissions";
import type { MongoClient } from "mongodb";
import { GetAllTenants } from "./sources/jsonSource";
import { Cacheable } from "cacheable";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { coalesceAsync } from "../coaleseAsync";


export const multitenancyEnabled = env.TENANT_JSON !== undefined;

export async function getTenantInfo(slug: string): Promise<TenantInfo> {
    // return tenant info from the provider if multitenancy is enabled or defaults/env if not

    if (!multitenancyEnabled) {
        // Fallback to default tenant info if multitenancy is not enabled
        return {
            id: "default",
            slug: "",
            guild_id: process.env.GUILD_ID || "",
            mongoClient: getMongodbClient(undefined) // Use the default MongoDB client
        };
    } else {
        const tenantInfo = await getTenant(slug);

        if (!tenantInfo) {
            throw new Error(`Tenant with slug "${slug}" not found`);
        }

        logger.trace({ tenantInfo }, `Retrieved tenant info for slug "${slug}"`); // Log the retrieved tenant info for debugging

        return {
            // Return the tenant info along with the MongoDB client
            id: tenantInfo.id,
            slug: slug,
            guild_id: tenantInfo.guild_id,
            name: tenantInfo.name || slug, // Fallback to slug if name is not provided
            title: tenantInfo.title || tenantInfo.name || slug, // Fallback to name or slug for title
            description: tenantInfo.description || "", // Fallback to empty string if no description is provided
            mongoClient: tenantInfo.mongoClient // Use the MongoDB client associated with this tenant
        };

    }
}

const cache = new Cacheable({
    namespace: 'tenancy'
});


export async function getTenants(guildIds: string[]) {
    // TODO hardcoded source
    return GetAllTenants()
        .filter(tenant => guildIds.includes(tenant.tenant.guild_id))
        .map(tenant => new Tenant({ ...tenant.tenant, mongoClient: tenant.MongodbClient }))
}

export class Tenant {
    private readonly tenantData: TenantInfo & { mongoClient: MongoClient };

    constructor(data: TenantInfo & { mongoClient: MongoClient }) {
        this.tenantData = data;
    }

    static async create(slug: string): Promise<Tenant> {
        const data = await getTenant(slug);
        if (!data) {
            throw new Error(`Tenant with slug "${slug}" not found`);
        }
        return new Tenant(data);
    }

    async getPermissionsLevel(discordRoles: string[], discordUserId: string): Promise<PermissionLevel | undefined> {

        // Cache value is unique per tenant and potentially per bot id within each tenant
        const key = "levelPermissions::" + encodeHexLowerCase(sha256(new TextEncoder().encode(this.tenantData.slug + this.tenantData.bot_id)))

        let permissionMap = await cache.get<config['level_permissions']>(key)


        if (permissionMap === undefined) {
            permissionMap = await coalesceAsync("tenancy::" + key, async () => {

                permissionMap = await getModmailPermissions(this.tenantData.mongoClient.db(), this.tenantData.bot_id);

                await cache.set(key, permissionMap, '5m')

                return permissionMap;
            });

        } else {
            logger.trace({ method: "getPermissionsLevel", key, discordUserId, tenant: this.tenantData.slug }, "cache hit")
        }

        logger.trace({ permissionMap, discordUserId, discordRoles }, `Retrieved permission map for tenant "${this.slug}"`); // Log the permission map for debugging
        return getUserPermissionLevel(permissionMap, discordUserId, discordRoles);
    }

    get id() {
        return this.tenantData.id;
    }
    get slug() {
        return this.tenantData.slug;
    }
    get guildId() {
        return this.tenantData.guild_id;
    }
    get name() {
        return this.tenantData.name || this.slug;
    }
    get title() {
        return this.tenantData.title || this.name;
    }
    get description() {
        return this.tenantData.description || "";
    }
    get botId() {
        return this.tenantData.bot_id;
    }
    get mongoClient() {
        return this.tenantData.mongoClient;
    }
}