import { Long, ObjectId, type Db } from "mongodb";

export type PermissionLevel = "OWNER" | "ADMINISTRATOR" | "MODERATOR" | "SUPPORTER" | "REGULAR" | "ANYONE";

export type config = {
    _id: ObjectId
    bot_id: Long;
    log_channel_id: Long;
    main_category_id: Long;
    plugins?: string[];
    level_permissions: {
        OWNER?: string[];
        ADMINISTRATOR?: string[];
        MODERATOR?: string[];
        SUPPORTER?: string[];
        REGULAR?: string[];
        ANYONE?: string[];
    }
};

const permissionOrder: Record<PermissionLevel, number> = {
    OWNER: 5,
    ADMINISTRATOR: 4,
    MODERATOR: 3,
    SUPPORTER: 2,
    REGULAR: 1,
    ANYONE: 0
};

export function getPermisionOrdinal(level: PermissionLevel): number {
    return permissionOrder[level];
}


    

export async function getModmailPermissions(client: Db, botId: string): Promise<config["level_permissions"]> {
    const collection = client.collection("config");
    const config = await collection.findOne<config>({ bot_id: Long.fromString(botId) });

    if (!config) {
        return {};
    }

    return config.level_permissions || []; // Return the permissions array or an empty array if undefined
}

export function getUserPermissionLevel(permissions: Partial<config["level_permissions"]>, userId: string, roles: string[] | undefined): PermissionLevel {
    // Check if any of the user or role ids match any of the permission level ids in descending order of hierarchy
    // return the highest level of permission that matches the user
    
    if ((Array.isArray(permissions.OWNER) && permissions.OWNER.includes(userId))) {
        return "OWNER";
    }

    for (const level of ["ADMINISTRATOR", "MODERATOR", "SUPPORTER", "REGULAR", "ANYONE"] as PermissionLevel[]) {
        const levelPermissions = permissions[level];
        if (Array.isArray(levelPermissions) && levelPermissions.includes(userId)) {
            return level; // User ID matches this permission level
        } else if (Array.isArray(levelPermissions) && roles && roles.some(role => levelPermissions.includes(role))) {
            return level; // One of the user's roles matches this permission level
        }
    }

    return "ANYONE"

}