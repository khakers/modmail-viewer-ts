import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	discordUserId: text('discord_user_id')
		.notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	refreshToken: text('refresh_token').notNull(),
	accessToken: text('access_token').notNull(),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }).notNull()
});

export type Session = typeof session.$inferSelect;