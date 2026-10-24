import { building } from '$app/environment';
import { env as env } from '$env/dynamic/private';
import { env as pub } from '$env/dynamic/public';
import type {
	Attachment,
	Message,
	OpenModmailAttachment,
	OpenModmailS3Attachment
} from '$lib/modmail';
import { S3mini } from 's3mini';

// This is incredibly annoying, but sveltekit runs everything and crashes on build if this isn't guarded,
// and the error will not be in this file

const presigned =
	!building && (pub.PUBLIC_S3_PRESIGNED === 'true' || pub.PUBLIC_S3_PRESIGNED === 'TRUE');

const s3Endpoint = new URL(pub.PUBLIC_S3_URL ?? 'http://localhost');

const presigned_object_duration = 24 * 60 * 60;

async function generatePresignedS3Url(attachment: OpenModmailS3Attachment): Promise<string> {
	if (!presigned) throw new Error('S3 client not configured for presigned URLs');
	// TODO allow configuration of expiration time
	const s3Client = new S3mini({
		endpoint: new URL(`/${attachment.s3.bucket}`, s3Endpoint).toString(),
		accessKeyId: env.S3_ACCESS_KEY ?? '',
		secretAccessKey: env.S3_SECRET_KEY ?? ''
	});
	return await s3Client.getPresignedUrl('GET', attachment.s3.key, presigned_object_duration);
}

export async function hydrateS3AttachmentURLs(
	attachments: Attachment[] | OpenModmailAttachment[] | OpenModmailS3Attachment[] | null
) {
	if (!attachments || attachments.length === 0) {
		return attachments;
	}
	const promises = attachments.map(async (attachment) => {
		if ('type' in attachment && attachment.type === 'openmodmail_s3_v1') {
			if (presigned) {
				attachment.url = await generatePresignedS3Url(attachment);
			} else {
				// construct a url based on endpoint
				const url = new URL(
					`/${attachment.s3.bucket}/${attachment.s3.key}`,
					pub.PUBLIC_S3_URL
				);
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
