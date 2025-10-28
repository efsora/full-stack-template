import { defineConfig, Config } from "drizzle-kit";
import { env } from "#infrastructure/config/env";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema.ts",
    out: "./src/db/migrations",
    dbCredentials: {
        url: env.DATABASE_URL,
    },
}) satisfies Config;