import { getMongodbClient } from '$lib/server/mongodb';
import { error, isHttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { MultitenancyDisabledError } from '$lib/server/monoTenantMongodb';
import type { ModmailThread } from '$lib/modmail';
import { convertBSONtoJS } from '$lib/bsonUtils';

export const load: PageServerLoad = async (event) => {

   const logger = event.locals.logger.child({ module: '' });

   try {
      const client = getMongodbClient(event.params.tenant);

      if (!client) {
         logger.error('MongoDB client not found');
         error(404, `modmail server of id ${event.params.tenant} not found`);
      }

      try {
         const modmailThreads = await client.db().collection('logs')
            .find()
            .sort({ closed_at: -1, created_at: -1 })
            .limit(10)
            .toArray();
         // console.log(foo);
         //  if (!modmailThreads) {
         //     error(404, 'Not Found');
         //  }

         return {
            threads: convertBSONtoJS(modmailThreads) as ModmailThread[]
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