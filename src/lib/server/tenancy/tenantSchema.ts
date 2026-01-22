import type { MongoClient } from "mongodb";
import { z } from "zod";

export const TenantSchema = z.object({
    id: z.string(),
    // Value used in the URL
    slug: z.string(),
    name: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    connection_uri: z.string().url(),
    guild_id: z.string().nonempty("Guild ID cannot be empty").regex(/^\d+$/, "Guild ID must be a valid Discord ID"),
    bot_id: z.string().nonempty().regex(/^\d+$/, "Bot ID must be a valid Discord ID"),
    database_name: z.string().optional(),
    thread_collection_name: z.string().default("logs"),
});

export type TenantConfig = z.infer<typeof TenantSchema>;

export type TenantInfo = Omit<TenantConfig, 'connection_uri'> & {
    mongoClient?: MongoClient; // Optional MongoDB client instance, if applicable
}