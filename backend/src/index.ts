/**
 * Backend API Server
 *
 * OpenTelemetry instrumentation is loaded via --import flag (see package.json scripts).
 * This ensures HTTP/Express modules are patched BEFORE they are imported here.
 */

import { env } from "#infrastructure/config/env";
import { metricsRegistry } from "#infrastructure/metrics/index";
import { errorHandler } from "#middlewares/errorHandler";
import { metricsMiddleware } from "#middlewares/metrics";
import { requestLogger } from "#middlewares/requestLogger";
import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import swaggerUi from "swagger-ui-express";

import routes from "#routes/index";

// ES Module __dirname equivalent
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// CORS middleware (must be early in the chain)
app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: true,
  }),
);

// Observability middleware (early in the chain)
app.use(requestLogger);
app.use(metricsMiddleware);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics endpoint (for Prometheus scraping)
app.get("/metrics", async (_req, res) => {
  res.setHeader("Content-Type", metricsRegistry.contentType);
  const metrics = await metricsRegistry.metrics();
  res.send(metrics);
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    message: "Server is healthy",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Serve OpenAPI spec
app.get("/docs/openapi.json", (_req, res) => {
  const specPath = path.join(__dirname, "../_docs/openapi.json");
  res.sendFile(specPath);
});

// Load OpenAPI spec for Swagger UI
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const openapiSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../_docs/openapi.json"), "utf-8"),
);

// Serve Swagger UI (interactive)
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Mount all API routes
app.use("/api", routes);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${String(env.PORT)}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Observability:`);
  console.log(`  - Logging: ${env.LOG_LEVEL} (Pino)`);
  console.log(
    `  - Metrics: ${env.METRICS_ENABLED ? "enabled" : "disabled"} (Prometheus)`,
  );
  console.log(
    `  - Tracing: ${env.ENABLE_TRACING ? "enabled" : "disabled"} (OpenTelemetry)`,
  );
  console.log(`Endpoints:`);
  console.log(`  - Health: http://localhost:${String(env.PORT)}/health`);
  console.log(`  - Metrics: http://localhost:${String(env.PORT)}/metrics`);
  console.log(`  - Swagger UI: http://localhost:${String(env.PORT)}/swagger`);
  console.log(`  - Redoc: http://localhost:${String(env.PORT)}/api-docs`);
  console.log(
    `  - OpenAPI Spec: http://localhost:${String(env.PORT)}/_docs/openapi.json`,
  );
});
