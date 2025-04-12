import { defineConfig } from 'drizzle-kit';

// if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const databaseUrl = !process.env.DATABASE_URL ? 'sqlite:./db.sqlite' : process.env.DATABASE_URL;

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dbCredentials: { url: databaseUrl },
	verbose: true,
	strict: true,
	dialect: 'sqlite'
});
