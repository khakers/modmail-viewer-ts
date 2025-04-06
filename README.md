# modmail-viewer-ts

A rewrite of modmail-viewer in Typescript and SvelteKit

Requires a local sqlite database for storage of sessions.
Discord tokens are encrypted at rest using a provided secret key

Tenants are currently specified via a json file.

The slug is the field used in the url to access resources belonging to that tenant

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
