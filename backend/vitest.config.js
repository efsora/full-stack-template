import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only include TypeScript test files from source
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    // Exclude compiled dist folder and node_modules
    exclude: ["node_modules", "dist", "dist/**/*"],
    // Use Node.js as test environment
    environment: "node",
  },
});
