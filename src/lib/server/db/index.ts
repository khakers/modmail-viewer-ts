import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const databaseUrl = !env.DATABASE_URL ? 'sqlite:./db.sqlite' : process.env.DATABASE_URL;

const client = new Database(env.DATABASE_URL);

export const db = drizzle(client, { schema });
