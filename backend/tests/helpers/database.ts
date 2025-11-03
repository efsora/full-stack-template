/**
 * Database Test Helpers
 *
 * Provides utilities for integration testing with PostgreSQL testcontainers.
 * Supports parallel test execution with shared container and proper cleanup.
 */

import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "#db/schema";

// Shared testcontainer instance for all tests (started once)
let testContainer: StartedPostgreSqlContainer | null = null;
let sharedDb: ReturnType<typeof drizzle> | null = null;
let sharedClient: ReturnType<typeof postgres> | null = null;

/**
 * Setup PostgreSQL testcontainer
 * Starts a PostgreSQL 18 Alpine container matching production environment
 *
 * @returns Connection string for the test database
 */
export async function setupTestDatabase(): Promise<string> {
  // Return existing connection if already setup
  if (testContainer) {
    return testContainer.getConnectionUri();
  }

  // Start PostgreSQL testcontainer
  testContainer = await new PostgreSqlContainer("postgres:18-alpine")
    .withDatabase("test_db")
    .withUsername("test_user")
    .withPassword("test_password")
    .withReuse() // Reuse container across test runs for speed
    .start();

  const connectionUri = testContainer.getConnectionUri();

  // Apply schema directly to test database (simpler than migrations)
  await applySchema(connectionUri);

  return connectionUri;
}

/**
 * Apply schema directly to test database
 * Uses the Drizzle schema to create tables without migrations
 * Note: Uses gen_random_uuid() instead of uuidv7() for simplicity in tests
 *
 * @param connectionString - PostgreSQL connection string
 */
export async function applySchema(connectionString: string): Promise<void> {
  const schemaClient = postgres(connectionString, { max: 1 });
  const schemaDb = drizzle(schemaClient, { schema });

  // Enable pgcrypto extension for gen_random_uuid()
  await schemaDb.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  // Create users table directly from schema
  // Note: Using gen_random_uuid() instead of uuidv7() for test simplicity
  await schemaDb.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      name text,
      password text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `);

  await schemaClient.end();
}

/**
 * Create a Drizzle database instance for testing
 *
 * @param connectionString - PostgreSQL connection string
 * @returns Drizzle database instance
 */
export function createTestDb(connectionString: string) {
  // Return shared instance if already created
  if (sharedDb && sharedClient) {
    return sharedDb;
  }

  sharedClient = postgres(connectionString, {
    max: 10,
  });

  sharedDb = drizzle(sharedClient, { schema });

  return sharedDb;
}

/**
 * Get the shared test database instance
 * Creates a new instance if not already created (uses DATABASE_URL from env)
 *
 * @returns Shared Drizzle database instance
 */
export function getTestDb() {
  if (!sharedDb) {
    // Create db instance using DATABASE_URL set by global setup
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL not set. Ensure global setup has run.");
    }

    sharedClient = postgres(connectionString, { max: 10 });
    sharedDb = drizzle(sharedClient, { schema });
  }
  return sharedDb;
}

/**
 * Cleanup database by truncating all tables
 * Uses CASCADE to handle foreign key constraints
 *
 * @param db - Drizzle database instance
 */
export async function cleanupDatabase(
  db: ReturnType<typeof drizzle>,
): Promise<void> {
  // Truncate all tables in the schema
  // CASCADE automatically handles foreign key constraints
  const tables = ["users"]; // Add more tables as schema grows

  for (const table of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
  }
}

/**
 * Teardown test database container
 * Closes connections and stops the container
 */
export async function teardownTestDatabase(): Promise<void> {
  // Close shared database connection
  if (sharedClient) {
    await sharedClient.end();
    sharedClient = null;
    sharedDb = null;
  }

  // Stop testcontainer
  if (testContainer) {
    await testContainer.stop();
    testContainer = null;
  }
}

/**
 * Get test database connection string
 * Must call setupTestDatabase() first
 *
 * @returns Connection string for test database
 * @throws Error if test database is not setup
 */
export function getTestConnectionString(): string {
  if (!testContainer) {
    throw new Error(
      "Test database not initialized. Call setupTestDatabase() first.",
    );
  }
  return testContainer.getConnectionUri();
}
