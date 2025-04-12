CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`refresh_token` text NOT NULL,
	`access_token` text NOT NULL,
	`access_token_expires_at` integer NOT NULL
);
