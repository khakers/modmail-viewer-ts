# modmail-viewer-ts

A full rewrite of modmail-viewer in Typescript and SvelteKit, built with full support for multi-tenancy.

> [!IMPORTANT]
> This project is in its very early stages and subject to breaking changes in minor releases as more work is done. It's name and location are also not final.

Requires a local SQLite database for storage of sessions.
Discord tokens are encrypted at rest using a provided secret key

Tenants are currently specified via a JSON file.

The slug is the field used in the URL to access resources belonging to that tenant.

For example, in `logs.example.com/tenant/logs` the tenant slug is `tenant`.

> [!NOTE]
> Tenant schema is not final. 

```json
[
  {
    "id": "1",
    "slug": "tenant1",
    "name": "Test Modmail Server",
    "title": "Tenant1",
    "description": "Tenant 1 description",
    "connection_uri": "mongodb://localhost:27017/modmail_bot",
    "guild_id": "896746579527886918",
    "bot_id": "465564886976778762"
  },
]
```

## Multi-Tenancy

Support for Multi-Tenancy means you can have log viewing for as many modmail bots as you want with only one server.
Authentication is shared by all users of the app, but a user can only view a modmail instance they have the correct permissions for.
Tenants are determined by the tenant slug right before the '/log' portion of the url, and configured in the tenant JSON file.

## Environment variables

`?` indicates that setting this is optional
> [!WARNING]
> `ENCRYPTION_SECRET_KEY` should be a long securely generated random string.
> You can generate one with `openssl rand -hex 32`

| Environment Variable  | Default            | Description                                                                                                                                                      |
|-----------------------|--------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| TENANT_JSON           |                    | File path to JSON file containing valid tenant information                                                                                                       |
| DATABASE_URL?         | /var/data/local.db | SQLite database URL                                                                                                                                              |
| DISCORD_CLIENT_ID     |                    | Discord OAuth client ID.                                                                                                                                         |
| DISCORD_CLIENT_SECRET |                    | Discord OAuth Client secret.                                                                                                                                     |
| OAUTH_REDIRECT_URI    |                    | You must set this to the intended reachable URL of your application, plus the callback path. For example: `https://logs.example.com/auth/login/discord/callback` |
| ENCRYPTION_SECRET_KEY |                    | Key used for encryption at rest of discord API tokens                                                                                                            |
| PUBLIC_S3_URL?        |                    | URL that S3 files can be accessed at.                                                                                                                            |
| PUBLIC_S3_PRESIGNED?  | `false`            | `true` use pre-signed s3 URLs for serving assets                                                                                                                 |
| S3_ACCESS_KEY?        |                    | required for generating pre-signed s3 URL                                                                                                                        |
| S3_SECRET_KEY?        |                    | required for generating pre-signed s3 URL                                                                                                                        |

> [!NOTE]
> Additional environment variable configuration options can be found in the [SvelteKit adapter-node documentation.](https://svelte.dev/docs/kit/adapter-node#Environment-variables-PORT-HOST-and-SOCKET_PATH)

## Developing

```bash
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

## Building

To create a production version of your app:

```bash
pnpm run build
```

You can preview the production build with `pnpm run preview`.

## Database

Generate migrations with

```bash
pnpm db:generate
```

You can push schema changes to a local database with `db:push`
