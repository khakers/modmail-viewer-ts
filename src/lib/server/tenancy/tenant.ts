import { getMongodbClient } from "../mongodb";
import type { TenantInfo } from "./tenantSchema";
import { getTenant } from "./multitenantMongodb";
import { logger } from "$lib/logger";
import { env } from "$env/dynamic/private";
import { getModmailPermissions, getUserPermissionLevel, type config, type PermissionLevel } from "../modmail/permissions";
import type { MongoClient } from "mongodb";
import { GetAllTenants } from "./sources/jsonSource";
import { Cacheable } from "cacheable";
import { coalesceAsync } from "../coaleseAsync";
import { hashString } from '$lib/server/cache-utils';
import type { ModmailThread } from "$lib/modmail";


export const MULTITENANCY_ENABLED = env.TENANT_JSON !== undefined;

export async function getTenantInfo(slug: string): Promise<TenantInfo> {
    // return tenant info from the provider if multitenancy is enabled or defaults/env if not

    if (!MULTITENANCY_ENABLED) {
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

// tennant not found error
export class TenantNotFoundError extends Error {
    constructor(slug: string) {
        super(`Tenant with slug "${slug}" not found`);
        this.name = "TenantNotFoundError";
    }
}

/**
 * Represents a tenant (guild/instance) of the application, encapsulating tenant metadata
 * and the MongoDB client associated with that tenant.
 *
 * This class provides:
 * - Factory creation via `Tenant.create(slug)` which loads tenant metadata from persistent storage.
 * - A cached permission resolution helper `getPermissionsLevel` that derives a user's
 *   PermissionLevel based on Discord roles and user id.
 * - Convenience getters for common tenant properties (id, slug, guildId, name, title,
 *   description, botId, and the underlying mongoClient).
 *
 * Remarks:
 * - The instance is immutable after construction; tenant data (including the mongo client)
 *   is stored as a private readonly payload.
 * - Permission lookups are cached per-tenant and per-bot to reduce database calls. The
 *   method `getPermissionsLevel` may use an in-memory or external cache and will attempt
 *   to populate it if missing.
 *
 * Example:
 * ```ts
 * // create a Tenant instance (throws if not found)
 * const tenant = await Tenant.create("example-slug");
 *
 * // resolve a user's permission level
 * const level = await tenant.getPermissionsLevel(["moderator", "helper"], "1234567890");
 * ```
 *
 * @public
 *
 * @throws {Error} When `Tenant.create(slug)` is called and no tenant metadata is found
 *                  for the provided slug.
 *
 * @remarks For `getPermissionsLevel`:
 * - Parameters:
 *   - `discordRoles`: array of Discord role IDs or names assigned to the user.
 *   - `discordUserId`: the Discord user's ID to check for direct/owner overrides.
 * - Returns a Promise resolving to the computed `PermissionLevel` or `undefined` if no
 *   applicable permission mapping exists.
 *
 * @see Tenant.create
 * @see getModmailPermissions
 * @see getUserPermissionLevel
 */
export class Tenant {
    private readonly tenantData: TenantInfo & { mongoClient: MongoClient };

    constructor(data: TenantInfo & { mongoClient: MongoClient }) {
        this.tenantData = data;
    }

    static async create(slug: string): Promise<Tenant> {
        const data = await getTenant(slug);
        if (!data) {
            throw new TenantNotFoundError(slug);
        }
        return new Tenant(data);
    }

    async getPermissionsLevel(discordRoles: string[], discordUserId: string): Promise<PermissionLevel | undefined> {

        // Cache value is unique per tenant and potentially per bot id within each tenant
        const key = "levelPermissions::" + hashString(this.tenantData.slug + this.tenantData.bot_id)

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

    get mongoThreadCollection() {
        return this.tenantData.mongoClient
			.db(this.tenantData.database_name)
			.collection<ModmailThread>(this.tenantData.thread_collection_name || 'logs');
    }

    toJSON() {
        return {
            id: this.id,
            slug: this.slug,
            guildId: this.guildId,
            name: this.name,
            title: this.title,
            description: this.description,
            botId: this.botId
        }
    }
}