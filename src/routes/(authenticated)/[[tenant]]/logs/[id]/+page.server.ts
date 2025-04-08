import { env } from '$env/dynamic/private';
import { PUBLIC_S3_ENDPOINT, PUBLIC_S3_PORT } from '$env/static/public';
import { convertBSONtoJS } from '$lib/bsonUtils';
import type { ModmailThread } from '$lib/modmail';
import { getMongodbClient } from '$lib/server/mongodb';
import { error } from '$lib/server/skUtils';
import { MultitenancyDisabledError } from '$lib/server/tenancy/monoTenantMongodb';
import type { PageServerLoad } from './$types';
import { isHttpError } from '@sveltejs/kit';
import * as Minio from 'minio'


export const load: PageServerLoad = async (event) => {

   const logger = event.locals.logger.child({ module: 'logs/[id]/+page.server.ts' });

   logger.debug('Hello from logs/[id]/+page.server.ts');
   try {
      const client = getMongodbClient(event.params.tenant);

      if (!client) {
         logger.error('MongoDB client not found');
         error(404, `modmail server of id ${event.params.tenant} not found`, event);
      }

      try {
         const modmailThread = await client.db().collection('logs').findOne<ModmailThread>({ _id: event.params.id });
         // console.log(foo);
         if (!modmailThread) {
            logger.debug(event.params.id, 'Document not found');
            error(404, 'Not Found', event);
         }

         const thread = convertBSONtoJS(modmailThread) as ModmailThread;

         logger.debug('Document found');


         const minioClient = new Minio.Client({
            endPoint: PUBLIC_S3_ENDPOINT,
            port: Number.parseInt(PUBLIC_S3_PORT),
            useSSL: false,
            accessKey: env.S3_ACCESS_KEY,
            secretKey: env.S3_SECRET_KEY,
         });

         // TODO iterate all attachment URIs in parallel 

         for (const message of thread.messages) {
            for (const attachment of message.attachments) {
               console.log(attachment);
               if ('type' in attachment && attachment.type === 'openmodmail_s3') {
                  const url = await minioClient.presignedGetObject(attachment.s3.bucket, attachment.s3.object, 24 * 60 * 60);
                  attachment.url = url;
               }
            }
         }
         return {
            document: thread
         };
      } catch (err) {
         if (isHttpError(err)) {
            throw err;
         }
         logger.error(err);
         error(500, 'Internal Server Error', event);
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


};