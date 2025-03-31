import type { PartialGuild } from "$lib/server/discord";
import type { PermissionLevel } from "$lib/server/modmail/permissions";

export type User = {
    uid: string | number;
    name: string;
    avatar: string;
};

export type TenantInfo = {
    tenant: {
        id: string;
        slug: string;
        name: string;
        guildId: string;
        permissionLevel: PermissionLevel | undefined;
    };
    guild: PartialGuild | undefined
}