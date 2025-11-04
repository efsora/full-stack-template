import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Import all path registrations
import "./paths/health.js";
import "./paths/hello.js";
import "./paths/users.js";
import { registry } from "./registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate OpenAPI specification from registered paths and components
 */
function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  const openApiSpec = generator.generateDocument({
    info: {
      description:
        "API documentation for the Full Stack Template backend service",
      title: "Full Stack Template API",
      version: "1.0.0",
    },
    openapi: "3.1.0",
    servers: [
      {
        description: "Development server",
        url: "http://localhost:3000",
      },
    ],
    tags: [
      {
        description: "System health and status endpoints",
        name: "System",
      },
      {
        description: "Health check and test endpoints",
        name: "Hello",
      },
      {
        description: "User management endpoints",
        name: "Users",
      },
    ],
  });

  // Write to _docs/openapi.json (relative to project root)
  const outputPath = path.join(__dirname, "../../_docs/openapi.json");
  const outputDir = path.dirname(outputPath);

  // Ensure the directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2));

  console.log(`✅ OpenAPI specification generated at: ${outputPath}`);
}

// Run generation
generateOpenApiSpec();
