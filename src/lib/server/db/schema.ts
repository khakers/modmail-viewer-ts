import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { sqliteTable, text, integer, customType } from 'drizzle-orm/sqlite-core';


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

// if (!building && !process.env.ENCRYPTION_SECRET_KEY) {
// 	throw new Error("ENCRYPTION_SECRET_KEY is not set");
// }
// 'building' will probably break drizzle because it can't import that

const key = process.env.ENCRYPTION_SECRET_KEY ? Buffer.from(process.env.ENCRYPTION_SECRET_KEY!, "hex") : Buffer.alloc(32);

const encryptedText = customType<{ data: string }>({
	dataType() {
		return "text";
	},
	fromDriver(value: unknown) {
		return decrypt(
			Buffer.from(value as string, "hex"),
			key
		).toString("utf8");
	},
	toDriver(value: string) {
		return encrypt(
			Buffer.from(value, "utf8"),
			key
		).toString("hex");
	},
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
		.references(()=> user.uid),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export type Session = typeof session.$inferSelect;
