import { convertBSONtoJS } from '$lib/bsonUtils';
import type { ModmailThread } from '$lib/modmail';
import { getMongodbClient } from '$lib/server/mongodb';
import { MultitenancyDisabledError } from '$lib/server/tenancy/monoTenantMongodb';
import type { PageServerLoad } from './$types';
import { error, isHttpError } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {

   const logger = event.locals.logger.child({ module: 'logs/[id]/+page.server.ts' });

   logger.debug('Hello from logs/[id]/+page.server.ts');
   try {
      const client = getMongodbClient(event.params.tenant);

      if (!client) {
         logger.error('MongoDB client not found');
         error(404, `modmail server of id ${event.params.tenant} not found`);
      }

      try {
         const modmailThread = await client.db().collection('logs').findOne<ModmailThread>({ _id: event.params.id });
         // console.log(foo);
         if (!modmailThread) {
            logger.debug(event.params.id, 'Document not found');
            error(404, 'Not Found');
         }
         console.log("documentfoubnd");
         logger.debug('Document found');
         ;
         return {
            document: convertBSONtoJS(modmailThread) as ModmailThread
         };
      } catch (err) {
         if (isHttpError(err)) {
            throw err;
         }
         logger.error(err);
         error(500, 'Internal Server Error');
      }
   } catch (err) {
      if (isHttpError(err)) {
         throw err;
      }
      if (err instanceof MultitenancyDisabledError) {

      logger.error(err);
      error(404, 'Invalid tenant slug');
      } else {
         logger.error(err);
         error(500);
      }
   }


};