import { building } from '$app/environment';
import { convertBSONtoJS } from '$lib/bsonUtils';
import type { ModmailThread } from '$lib/modmail';
import { hydrateS3AttachmentURLs } from '$lib/server/s3';
import { error } from '$lib/server/skUtils';
import { MultitenancyDisabledError } from '$lib/server/tenancy/monoTenantMongodb';
import type { PageServerLoad } from './$types';
import { isHttpError } from '@sveltejs/kit';


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
               return {
                  thread: thread
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