import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { sql } from 'drizzle-orm';
import { customType, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

function encrypt(text: Buffer, key: Buffer): Buffer {
	const iv = randomBytes(12);

	const cipher = createCipheriv('aes-256-gcm', key, iv);
	let message = cipher.update(text);
	message = Buffer.concat([message, cipher.final()]);
	return Buffer.concat([iv, message, cipher.getAuthTag()]);
}

function decrypt(cipherText: Buffer, key: Buffer): Buffer {
	const tag = cipherText.subarray(-16);
	const iv = cipherText.subarray(0, 12);
	const encryptedText = cipherText.subarray(12, -16);
	const decipher = createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAuthTag(tag);
	let text = decipher.update(encryptedText);
	text = Buffer.concat([text, decipher.final()]);
	return text;
}

const key = process.env.ENCRYPTION_SECRET_KEY
	? Buffer.from(process.env.ENCRYPTION_SECRET_KEY!, 'hex')
	: Buffer.alloc(32);

const encryptedText = customType<{ data: string }>({
	dataType() {
		return 'text';
	},
	fromDriver(value: unknown) {
		return decrypt(Buffer.from(value as string, 'hex'), key).toString('utf8');
	},
	toDriver(value: string) {
		return encrypt(Buffer.from(value, 'utf8'), key).toString('hex');
	}
});

export const user = sqliteTable('user', {
	uid: text('discord_uid').primaryKey(),
	refreshToken: encryptedText('refresh_token').notNull(),
	accessToken: encryptedText('access_token').notNull(),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }).notNull()
});

export type User = typeof user.$inferSelect;

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	discordUserId: text('discord_user_id')
		.notNull()
		.references(() => user.uid),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
});

export type Session = typeof session.$inferSelect;

export const sharedThreads = sqliteTable('shared_threads', {
	id: text('uuid').primaryKey().$defaultFn(() => crypto.randomUUID()),
	threadId: text('thread_id'),
	tenantId: text('tenant_id').notNull(),
	creatorDiscordUserId: text('creator_discord_user_id')
		.notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
	requireAuthentication: integer({ mode: 'boolean' }).notNull(),
	showInternalMessages: integer({ mode: 'boolean' }).notNull(),
	showAnonymousSenderName: integer({ mode: 'boolean' }).notNull(),
	showSystemMessages: integer({ mode: 'boolean' }).notNull(),
	enabled: integer({ mode: 'boolean' }).notNull().default(true),
}, (table) => [
	index("thread_id_idx").on(table.threadId)
])

export type SharedThreads = typeof sharedThreads.$inferSelect;