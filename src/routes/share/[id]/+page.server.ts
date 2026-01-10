import { convertBSONtoJS } from '$lib/bsonUtils';
import { logger } from '$lib/logger';
import type { ModmailThread } from '$lib/modmail';
import { getMongodbClientFromId } from '$lib/server/mongodb';
import { error } from '$lib/server/skUtils';
import { getSharedThread } from '$lib/server/thread-sharing';
import { decodeBase64UUID } from '$lib/uuid-utils';
import { isAfter } from 'date-fns';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals }) => {
    const id: string = decodeBase64UUID(params.id);

    const shareSettings = await getSharedThread(id);
    if (!shareSettings) {
        error(404, "not found");
    }
    if (shareSettings.requireAuthentication !== false) {
        if (!locals.session) {
            error(401, 'authentication required');
        }
    }
    if (shareSettings.expiresAt && isAfter(new Date(), shareSettings.expiresAt)) {
        // logger.debug("")
        error(404, "not found");
    }

    const client = getMongodbClientFromId(shareSettings.tenantId)

    if (!client) {
        logger.error({ shareId: id, shareSettings }, "no mongodb client was found for the tenant ID this shared thread had stored. Have tenant IDs changed?")
        error(500, "failed to retrieve thread")
    }

    const modmailThread = await client.db()
        .collection('logs')
        .findOne<ModmailThread>({ _id: shareSettings.threadId });

    if (!modmailThread) {
        logger.debug(params.id, 'Document not found');
        error(404, 'Not Found');
    }

    let thread = convertBSONtoJS(modmailThread) as ModmailThread;

    if (shareSettings.showAnonymousSenderName !== true) {
        thread.messages.forEach((message) => {
            if (message.type === 'anonymous') {
                message.author = {
                    avatar_url: "",
                    discriminator: "0",
                    id: "0",
                    mod: true,
                    name: "anonymous"
                }
            }
        })
    }

    if (shareSettings.showInternalMessages !== true) {
        thread.messages = thread.messages.filter((m) => m.type !== 'internal')
    }

    if (shareSettings.showSystemMessages !== true) {
        thread.messages = thread.messages.filter((m) => m.type !== 'system')
    }

    return {
        thread: thread
    };
}) satisfies PageServerLoad;