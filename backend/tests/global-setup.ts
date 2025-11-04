/**
 * Vitest Global Setup
 *
 * Runs once before all test files.
 * Starts the testcontainer and sets DATABASE_URL before any modules are loaded.
 */

import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema.js";

let globalContainer: StartedPostgreSqlContainer | null = null;

export async function setup() {
  console.log("🔧 Starting test database container...");

  // Start PostgreSQL testcontainer
  globalContainer = await new PostgreSqlContainer("postgres:18-alpine")
    .withDatabase("test_db")
    .withUsername("test_user")
    .withPassword("test_password")
    .withReuse() // Reuse container across test runs
    .start();

  const connectionUri = globalContainer.getConnectionUri();

  console.log("✅ Test database container started");
  console.log(`📦 Connection: ${connectionUri}`);

  // Set DATABASE_URL before any modules import db client
  process.env.DATABASE_URL = connectionUri;

  // Apply schema
  console.log("🔄 Applying database schema...");
  const schemaClient = postgres(connectionUri, { max: 1 });
  const schemaDb = drizzle(schemaClient, { schema });

  // Enable pgcrypto for gen_random_uuid()
  await schemaDb.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  // Create users table
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

  console.log("✅ Database schema applied");

  // Store container reference globally for teardown
  (
    global as { __TEST_CONTAINER__?: StartedPostgreSqlContainer }
  ).__TEST_CONTAINER__ = globalContainer;
}

export async function teardown() {
  console.log("🧹 Stopping test database container...");

  const container = (
    global as { __TEST_CONTAINER__?: StartedPostgreSqlContainer }
  ).__TEST_CONTAINER__;
  if (container) {
    await container.stop();
    console.log("✅ Test database container stopped");
  }
}
