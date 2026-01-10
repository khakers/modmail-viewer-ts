CREATE TABLE `shared_threads` (
	`uuid` text PRIMARY KEY NOT NULL,
	`thread_id` text,
	`tenant_id` text NOT NULL,
	`creator_discord_user_id` text NOT NULL,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`requireAuthentication` integer NOT NULL,
	`showInternalMessages` integer NOT NULL,
	`showAnonymousSenderName` integer NOT NULL,
	`showSystemMessages` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE INDEX `thread_id_idx` ON `shared_threads` (`thread_id`);