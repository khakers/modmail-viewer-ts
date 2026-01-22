import { isHttpError, isRedirect, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { MultitenancyDisabledError } from '$lib/server/tenancy/monoTenantMongodb';
import type { ModmailThread } from '$lib/modmail';
import { convertBSONtoJS } from '$lib/bsonUtils';
import { error } from '$lib/server/skUtils';
import { z } from 'zod';
import type { Filter } from 'mongodb';
import { parseSearchParams } from 'zod-search-params';
import { urlWithSearchParams } from '$lib/searchParamUtils';
import { paramsSchema } from './schema';





export const load: PageServerLoad = async (event) => {

   const logger = event.locals.logger;

   try {
      const client = event.locals.Tenant?.mongoClient;

      const params = parseSearchParams(paramsSchema, event.url.searchParams)

      if (!client) {
         logger.error('Request did not contain ');
         error(404, `modmail server of id '${event.locals.Tenant?.slug}' not found`, event);
      }
      const filter: Filter<ModmailThread> = {}

      if (params.status && params.status !== "all") {
         if (params.status === "open") {
            filter["open"] = true;
         } else {
            filter["open"] = false;
         }
      }


      try {
         // sort logs by closed time, last message, and creation date
         const [threadCount, modmailThreads] = await Promise.all([
            client.db().collection<ModmailThread>('logs').countDocuments(filter),
            client.db().collection<ModmailThread>('logs')
               .find(filter)
               .sort({ created_at: -1, "messages.timestamp": -1, closed_at: -1, })
               .skip((params.page - 1) * params.pageSize)
               .limit(params.pageSize)
               .toArray()
         ]);

         const pageCount = Math.ceil(threadCount / params.pageSize)

         if (params.page > pageCount && params.page !== 1) {
            redirect(307, urlWithSearchParams(event.url, [["page", '1']]))
         }

         if (!modmailThreads) {
            error(500, 'Failed to retrieve threads', event);
         }

         const convertedThreads = convertBSONtoJS(modmailThreads) as ModmailThread[];

         const threads = convertedThreads.map(thread => {
            // Trim all messages but first and last to reduce unnecesary transferred data
            const messageCount = thread.messages.length;
            thread.messages = thread.messages.length > 1
               ? [thread.messages[0], thread.messages[thread.messages.length - 1]]
               : thread.messages;
               return { message_count: messageCount, ...thread}
         })

         return {
            page: params.page,
            pageCount: Math.ceil(threadCount / params.pageSize),
            statusFilter: params.status,
            threadCount,
            threads: threads
         };
      } catch (err) {
         if (isHttpError(err) || isRedirect(err)) {
            throw err;
         }
         logger.error({ err }, "encountered an error trying to fetch mongodb data");
         error(500, 'Internal Server Error', event);
      }
   } catch (err) {
      if (isHttpError(err) || isRedirect(err)) {
         throw err;
      }
      if (err instanceof MultitenancyDisabledError) {

         logger.error(err);
         error(404, 'Invalid tenant slug', event);
      } else {
         logger.error(err);
         error(500, "Internal Server Error: Failed to load modmail threads", event);
      }
   }


};