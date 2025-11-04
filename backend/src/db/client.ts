import { env } from "#infrastructure/config/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "#db/schema";

/**
 * PostgreSQL connection client
 */
const client = postgres(env.DATABASE_URL, {
  max: 10, // Maximum number of connections in the pool
});

/**
 * Drizzle database instance
 * Use this for all database operations
 */
export const db = drizzle(client, { schema });

/**
 * Close database connection
 * Call this when shutting down the application
 */
export const closeDatabase = async (): Promise<void> => {
  await client.end();
};
