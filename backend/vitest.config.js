import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only include TypeScript test files from source
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    // Exclude compiled dist folder and node_modules
    exclude: ["node_modules", "dist", "dist/**/*"],
    // Use Node.js as test environment
    environment: "node",
    // Global setup (runs once before all tests)
    globalSetup: ["./tests/global-setup.ts"],
    // Setup files to run before each test file
    setupFiles: ["./tests/setup.ts"],
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/core/**/*.ts"],
      exclude: ["src/core/**/*.test.ts"],
      thresholds: {
        lines: 35,
        functions: 35,
        branches: 35,
        statements: 35,
        autoUpdate: false,
      },
      all: false,
    },
  },
});
