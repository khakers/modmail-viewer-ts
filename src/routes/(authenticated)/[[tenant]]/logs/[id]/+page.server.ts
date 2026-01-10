import { building } from '$app/environment';
import { convertBSONtoJS } from '$lib/bsonUtils';
import { logger } from '$lib/logger';
import type { ModmailThread } from '$lib/modmail';
import { hydrateS3AttachmentURLs } from '$lib/server/s3';
import { error } from '$lib/server/skUtils';
import { MultitenancyDisabledError } from '$lib/server/tenancy/monoTenantMongodb';
import { getThreadShares, shareThread } from '$lib/server/thread-sharing';
import { encodeBase64UUID } from '$lib/uuid-utils';
import { isHttpError } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from './$types';
import { formSchema } from "./schema";
import { isBefore } from 'date-fns';


export const load: PageServerLoad = async (event) => {


   const logger = event.locals.logger.child({ module: 'logs/[id]/+page.server.ts' });
   if (!building) {

      try {
         if (!building) {
            if (!event.locals.Tenant) {
               logger.error('Tenant parameter is missing');
               error(404, 'No tenant found', event);
            }
            const client = event.locals.Tenant.mongoClient;

            if (!client) {
               logger.error('MongoDB client not found');
               error(500, `modmail server of id ${event.locals.Tenant.slug} not found`, event);
            }

            try {
               const modmailThread = await client.db()
                  .collection('logs')
                  .findOne<ModmailThread>({ _id: event.params.id });

               if (!modmailThread) {
                  logger.debug(event.params.id, 'Document not found');
                  error(404, 'Not Found', event);
               }

               const thread = convertBSONtoJS(modmailThread) as ModmailThread;

               logger.debug('Document found');


               for (const message of thread.messages) {
                  message.attachments = await hydrateS3AttachmentURLs(message.attachments);
               }
               // RETURN
               return {
                  thread: thread,
                  shares: (await getThreadShares(event.params.id)).filter(v => (v.expiresAt === null || isBefore(new Date, v.expiresAt)) ),
                  shareForm: await superValidate(zod4(formSchema)),
               };
            } catch (err) {
               if (isHttpError(err)) {
                  throw err;
               }
               logger.error(err);
               error(500, 'Internal Server Error', event);
            }
         }
      } catch (err) {
         if (isHttpError(err)) {
            throw err;
         }
         if (err instanceof MultitenancyDisabledError) {

            logger.error(err);
            error(404, 'Invalid tenant slug', event);
         } else {
            logger.error(err);
            error(500, 'internal error', event);
         }
      }
   }


};

export const actions: Actions = {
   async share(event) {
      const form = await superValidate(event.request, zod4(formSchema));
      if (!event.locals.Tenant) {
         logger.error({}, "failed to create threadShare because request local tenant was undefined")
         return { success: false, form }
      }
      const id = await shareThread(event.params.id, event.locals.Tenant?.id, event.locals.user.discordUserId, form.data)
      event.locals.logger.debug({ form: form }, "share submission");

      return { success: true, shareId: encodeBase64UUID(id), form }
   },
   async deleteShare(event) {
      // TODO verify user permissions
   }
};