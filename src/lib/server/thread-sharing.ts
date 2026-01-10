import { logger } from "$lib/logger";
import { eq } from 'drizzle-orm';
import { db } from "./db";
import { sharedThreads } from "./db/schema";


type sharingOptions = {
    expiresAt: Date | null
    requireAuthentication: boolean
    showInternalMessages: boolean
    showAnonymousSenderName: boolean
    showSystemMessages: boolean
}

/**
 * Shares a thread by creating a new shared thread entry in the database.
 *
 * @param threadId - The unique identifier of the thread to be shared.
 * @param author - The Discord user ID of the author sharing the thread.
 * @param options - Additional sharing options.
 * @returns A promise that resolves to the ID of the newly created shared thread entry.
 */
export async function shareThread(threadId: string, tenantId: string, author: string, options: sharingOptions) {
    const id = crypto.randomUUID();
    const res = await db.insert(sharedThreads)
        .values({ id, threadId, tenantId, creatorDiscordUserId: author, ...options });
    if (res.changes === 0) {
        logger.error({res, id}, "shareThread mongodb insertion returned 0 changes")
    }
    return id;

}

export async function getThreadShares(threadId: string) {
    const res = await db
        .select()
        .from(sharedThreads)
        .where(eq(sharedThreads.threadId, threadId))

    return res;
}

export async function getSharedThread(uuid:string) {
    const [res] = await db
        .select()
        .from(sharedThreads)
        .where(eq(sharedThreads.id, uuid))
        .limit(1)

    return res
}