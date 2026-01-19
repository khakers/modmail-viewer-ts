import { building } from "$app/environment";
import { env as env } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";
import type { Attachment, Message, OpenModmailAttachment } from "$lib/modmail";
import { Client } from "minio";

// This is incredibly annoying, but sveltekit runs everything and crashes on build if this isn't guarded, 
// and the error will not be in this file

const presigned = !building && pub.PUBLIC_S3_PRESIGNED === 'true';

const s3Endpoint = new URL(pub.PUBLIC_S3_URL ?? "http://localhost");

const minioClient = presigned ? new Client({
    endPoint: s3Endpoint.hostname,
    port: parseInt(s3Endpoint.port),
    useSSL: s3Endpoint.protocol === 'https:',
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
}) : undefined;

async function generatePresignedS3Url(attachment: OpenModmailAttachment) {
    if (!minioClient) throw new Error("Minio client not configured for presigned URLs");
    return await minioClient.presignedGetObject(attachment.s3.bucket, attachment.s3.object, 24 * 60 * 60);
}

export async function hydrateS3AttachmentURLs(attachments: Attachment[] | OpenModmailAttachment[] | null) {
    if (!attachments || attachments.length === 0) {
        return attachments;
    }
    const promises = attachments.map(async (attachment) => {
        if ('type' in attachment && attachment.type === 'openmodmail_s3') {
            if (presigned) {
                attachment.url = await generatePresignedS3Url(attachment);
            } else {
                // construct a url based on endpoint 
                const url = new URL(`/${attachment.s3.bucket}/${attachment.s3.object}`, pub.PUBLIC_S3_URL);
                attachment.url = url.toString();
            }
        }
        return attachment;
    });

    return await Promise.all(promises);
}

export async function hydrateAttachmentsInMessage(message: Message) {
    message.attachments = await hydrateS3AttachmentURLs(message.attachments);
    return message;
}