CREATE TABLE `user` (
	`discord_uid` text PRIMARY KEY NOT NULL,
	`refresh_token` text NOT NULL,
	`access_token` text NOT NULL,
	`access_token_expires_at` integer NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_session` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`discord_user_id`) REFERENCES `user`(`discord_uid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_session`("id", "discord_user_id", "expires_at") SELECT "id", "discord_user_id", "expires_at" FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
PRAGMA foreign_keys=ON;