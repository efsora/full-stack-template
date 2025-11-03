# Backend Service

Express + TypeScript backend service implementing a Functional Core, Imperative Shell (FCIS) architecture with automatic observability.

## Quick Start with Docker

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- PostgreSQL client (optional, for database access)

### 1. Start the Services

From the **root of the monorepo**, run:

```bash
# Start all services (backend, postgres, weaviate)
docker-compose up -d
```

**That's it!** The setup is fully automated:

- ✅ PostgreSQL database (`backend_db`) is created automatically
- ✅ Database user (`backend_user`) is created with permissions
- ✅ Database migrations run automatically on startup
- ✅ Backend starts and waits for database to be ready

The backend will be available at: **http://localhost:3000**

**What happens on startup:**

1. PostgreSQL starts and runs `/scripts/init-db.sql` (first time only)
   - Creates `backend_db` database
   - Creates `backend_user` with password
   - Grants all necessary permissions
2. Backend container starts and waits for PostgreSQL to be healthy
3. Startup script (`docker-entrypoint.sh`) runs:
   - Waits for database connection
   - Runs `drizzle-kit push` to apply schema
   - Starts the backend server

You can watch the process:

```bash
docker-compose logs -f backend
```

### 2. Verify Setup

Check if the backend is running:

```bash
# Health check
curl http://localhost:3000/health

# API test endpoint
curl http://localhost:3000/api/v1/hello

# View API documentation
open http://localhost:3000/swagger
```

## Local Development (Without Docker)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/backend_db

# JWT
JWT_SECRET=your-32-character-secret-key-change-in-production-please

# Observability
ENABLE_TRACING=true
OTEL_SERVICE_NAME=backend
# OTEL_EXPORTER_OTLP_ENDPOINT is optional - if not set, traces log to console
# Uncomment to send traces to an external collector (Jaeger, Tempo, etc.)
# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
METRICS_ENABLED=true
LOG_LEVEL=debug
LOGGER_PRETTY=true
```

### 3. Start PostgreSQL

```bash
# Using Docker Compose (from root)
docker-compose up -d postgres

# Or use your local PostgreSQL installation
```

### 4. Run Migrations

```bash
# Generate migration files (if schema changed)
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Or push schema directly (development only)
npx drizzle-kit push
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000` with hot-reload enabled.

## Available Scripts

```bash
# Development
npm run dev              # Start with hot-reload (uses .env file)
npm run dev:docker       # Start for Docker (no .env file needed)

# Building
npm run build            # Compile TypeScript and generate OpenAPI spec
npm run type-check       # Type check without building

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier
npm run format:check     # Check formatting

# Testing
npm run test             # Run tests in watch mode (useful during development)
npm run test:run         # Run tests once (CI/CD or quick verification)
npm run test:coverage    # Run tests with coverage report (shows tested code)

# Database
npx drizzle-kit generate # Generate migration files
npx drizzle-kit migrate  # Run migrations
npx drizzle-kit push     # Push schema (dev only)
npx drizzle-kit studio   # Open database GUI

# Documentation
npm run generate:openapi # Generate OpenAPI spec (auto-runs with dev/build)
```

## Code Quality

This project enforces code quality through automated linting, formatting, and testing. These tools ensure consistency, catch errors early, and maintain high code standards across the codebase.

### Testing (Vitest)

**Framework**: Vitest v4.0.4 - Fast, modern test runner with native ESM support

**Test Location**: All tests are located in `backend/tests/` directory, organized by category:

- `tests/value-objects/` - Unit tests for domain value objects (Email, Password)
- `tests/integration/` - Integration tests for workflows with real database
- `tests/helpers/` - Shared test utilities and database setup

**Running Tests**:

```bash
# Watch mode (recommended during development)
npm run test
# Automatically reruns tests when files change
# Great for TDD workflow

# Single run (for CI/CD or quick checks)
npm run test:run
# Runs all tests once and exits
# Use this before committing changes

# Coverage report
npm run test:coverage
# Generates detailed coverage report in coverage/ directory
# Shows which lines of code in src/core/ are tested
# Configured thresholds: 35% (lines, functions, branches, statements)
```

**Coverage Configuration**:

Coverage is configured to:

- Only measure code in `src/core/` (business logic)
- Use v8 provider for fast, accurate coverage
- Generate lcov reports for IDE integration
- Warn when thresholds aren't met (doesn't fail build)
- Exclude test files from coverage metrics

**Test Patterns**:

#### Unit Tests (Value Objects)

Test pure functions that return `Result<T>`:

```typescript
import { describe, it, expect } from "vitest";
import { Email } from "#core/users/value-objects/Email";
import { run } from "#lib/result/index";

describe("Email Value Object", () => {
  it("creates valid email successfully", async () => {
    const result = await run(Email.create("user@example.com"));

    expect(result.status).toBe("Success");
    if (result.status === "Success") {
      expect(Email.toString(result.value)).toBe("user@example.com");
    }
  });

  it("rejects invalid email format", async () => {
    const result = await run(Email.create("not-an-email"));

    expect(result.status).toBe("Failure");
    if (result.status === "Failure") {
      expect(result.error.code).toBe("USER_INVALID_EMAIL");
    }
  });
});
```

#### Integration Tests (Workflows)

Test complete workflows with real PostgreSQL database using Docker testcontainers:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { run } from "#lib/result/index";
import { createUser } from "#core/users/create-user.workflow";
import {
  setupTestDatabase,
  createTestDb,
  cleanupDatabase,
  teardownTestDatabase,
  getTestDb,
} from "../helpers/database";

describe("createUser Integration Tests", () => {
  // Setup test database before all tests
  beforeAll(async () => {
    const connectionString = await setupTestDatabase();
    createTestDb(connectionString);
  }, 60000); // 60s timeout for container startup

  // Cleanup database before each test to ensure isolation
  beforeEach(async () => {
    const db = getTestDb();
    await cleanupDatabase(db);
  });

  // Teardown test database after all tests
  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("should create user successfully with valid input", async () => {
    // Arrange
    const input = {
      email: "test@example.com",
      password: "securePassword123",
      name: "Test User",
    };

    // Act
    const result = await run(createUser(input));

    // Assert
    expect(result.status).toBe("Success");
    if (result.status === "Success") {
      expect(result.value.email).toBe("test@example.com");
      expect(result.value.token).toBeDefined();

      // Verify user exists in database
      const db = getTestDb();
      const users = await db.query.users.findMany({
        where: (users, { eq }) => eq(users.email, "test@example.com"),
      });
      expect(users).toHaveLength(1);
    }
  });
});
```

**Integration Testing with Testcontainers**:

The project uses Docker testcontainers for isolated, reproducible integration tests:

- **Automatic PostgreSQL Setup**: Tests automatically start a PostgreSQL 18 container
- **Migration Execution**: Drizzle migrations run automatically before tests
- **Parallel Execution**: Shared container across all test files for speed
- **Database Cleanup**: `TRUNCATE CASCADE` between tests ensures isolation
- **No Manual Setup**: Docker handles everything automatically

**Test Helper Utilities** (`tests/helpers/database.ts`):

```typescript
// Setup testcontainer and run migrations (call in beforeAll)
const connectionString = await setupTestDatabase();
createTestDb(connectionString);

// Get shared database instance (use in tests)
const db = getTestDb();

// Cleanup database (call in beforeEach)
await cleanupDatabase(db);

// Teardown container (call in afterAll)
await teardownTestDatabase();
```

**Key Testing Principles**:

1. **Unit Tests**: Use `run()` to execute `Result<T>` effects
2. **Type Safety**: Check `result.status` and use TypeScript narrowing
3. **Isolation**: Clean database between tests with `beforeEach`
4. **Descriptive Names**: Test names should explain behavior
5. **Test Both Paths**: Always test success and failure scenarios
6. **Real Database**: Integration tests use real PostgreSQL, not mocks
7. **Arrange-Act-Assert**: Structure tests clearly with AAA pattern

**Example Files**:

- `tests/value-objects/Email.test.ts` - Unit test example
- `tests/value-objects/Password.test.ts` - Unit test example
- `tests/integration/create-user.test.ts` - Integration test example
- `tests/helpers/database.ts` - Test infrastructure utilities

### Linting (ESLint)

**Tool**: ESLint v9 with TypeScript ESLint (Flat Config Format)

**Configuration**: `backend/eslint.config.js`

- `@eslint/js` recommended rules - JavaScript best practices
- TypeScript ESLint strict type checking (`strictTypeChecked`) - Catches type errors
- TypeScript ESLint stylistic rules (`stylisticTypeChecked`) - Code style consistency
- Custom rule: `no-direct-core-imports` - Enforces architecture boundaries

**Running ESLint**:

```bash
# Check for violations
npm run lint
# Shows all linting errors and warnings
# Exit code 1 if violations found

# Auto-fix violations
npm run lint:fix
# Automatically fixes fixable issues
# Some issues require manual intervention
```

**Ignored Patterns**:

- `**/*.js` - JavaScript files (project is TypeScript-only)
- `dist/**` - Compiled output

### Custom ESLint Rule: no-direct-core-imports

This custom rule enforces the **Barrel Export Pattern** to maintain clean architectural boundaries between the imperative shell (handlers) and functional core (domain logic).

**Purpose**: Prevents handlers from importing internal implementation details, ensuring workflows remain the single entry point for domain operations.

**Scope**: Only applies to files in `src/routes/**/*.ts` (handlers)

**Correct Usage** (Import from barrel):

```typescript
// ✅ CORRECT - Import from domain barrel
import { login, register } from "#core/users/index.js";
import type { LoginResult } from "#core/users/index.js";
```

**Incorrect Usage** (Direct imports):

```typescript
// ❌ WRONG - Direct workflow import
import { login } from "#core/users/login.workflow.js";

// ❌ WRONG - Operation import (operations should never be in handlers)
import { validateLogin } from "#core/users/login.operations.js";

// ❌ WRONG - Internal type import
import type { ValidatedUser } from "#core/users/types/internal.js";
```

**Forbidden Import Types**:

- `*.workflow.ts` - Import workflows from barrel instead
- `*.operations.ts` - Operations are internal implementation details
- `*.compositions.ts` - Internal orchestration logic
- `*.rules.ts` - Validation logic
- `*.helpers.ts` - Utility functions
- `types/internal.ts` - Implementation-only types

**Error Messages**:

When you violate the rule, ESLint will show clear guidance:

```bash
Import workflows from domain barrel instead: #core/users (not #core/users/login.workflow.js)
Handlers cannot import operations. Import workflows from domain barrel: #core/users
Handlers cannot import internal types. Import public types from domain barrel: #core/users
```

**Why This Matters** (FCIS Architecture):

1. **Encapsulation** - Internal operations are hidden from handlers
2. **Single Responsibility** - Workflows orchestrate, handlers delegate
3. **Testability** - Test workflows as black boxes without mocking handlers
4. **Maintainability** - Change internal operations without affecting handlers
5. **Clear Contracts** - Workflow signatures define the domain API

**Barrel File Structure**:

Each domain must export its public API from `index.ts`:

```typescript
// src/core/users/index.ts
// ✅ Export workflows (main entry points)
export { login } from "./login.workflow.js";
export { register } from "./register.workflow.js";

// ✅ Export public types
export type { LoginBody, RegisterBody } from "./types/inputs.js";
export type { LoginResult } from "./types/outputs.js";

// ✅ Export value objects (if used in workflow signatures)
export { Email } from "./value-objects/Email.js";

// ❌ DO NOT export operations, internal types, or helpers
```

### Common ESLint Errors & Fixes

#### Error 1: Direct Workflow Import Violation

**Error Message**:

```
Import workflows from domain barrel instead: #core/users (not #core/users/login.workflow.js)
```

**Fix**:

```typescript
// Before (wrong)
import { login } from "#core/users/login.workflow.js";

// After (correct)
import { login } from "#core/users/index.js";
```

#### Error 2: Unused Variables

**Error Message**:

```
'userId' is defined but never used. (@typescript-eslint/no-unused-vars)
```

**Fix**:

```typescript
// Before (wrong)
function handleRequest(req: Request) {
  const userId = req.params.id;
  return { success: true };
}

// After (correct) - Remove unused variable
function handleRequest(req: Request) {
  return { success: true };
}

// Or use it
function handleRequest(req: Request) {
  const userId = req.params.id;
  logger.info({ userId }, "Processing request");
  return { success: true };
}
```

#### Error 3: Unsafe Assignment

**Error Message**:

```
Unsafe assignment of an 'any' value. (@typescript-eslint/no-unsafe-assignment)
```

**Fix**:

```typescript
// Before (wrong)
const body = req.body; // body is 'any'

// After (correct) - Type assertion
const body = req.body as LoginBody;

// Or better - Runtime validation with Zod
const body = loginBodySchema.parse(req.body);
```

#### Error 4: Missing Await

**Error Message**:

```
Promises must be awaited. (@typescript-eslint/no-floating-promises)
```

**Fix**:

```typescript
// Before (wrong)
run(login(body)); // Promise not awaited

// After (correct)
await run(login(body));

// Or handle explicitly
void run(login(body)); // If intentionally not awaited
```

### Formatting (Prettier)

**Tool**: Prettier v3.6.2

**Configuration**: `backend/.prettierrc`

```json
{
  "printWidth": 80
}
```

**Philosophy**: Prettier enforces consistent code style automatically. It's an opinionated formatter that removes debates about formatting preferences.

**Running Prettier**:

```bash
# Format all files
npm run format
# Automatically formats all code
# Safe to run anytime

# Check formatting without changes
npm run format:check
# Returns exit code 1 if formatting needed
# Useful in CI/CD pipelines
```

**What Prettier Formats**:

- Line length (wraps at 80 characters)
- Indentation (2 spaces)
- Quote style (default: double quotes)
- Semicolons (default: always)
- Trailing commas (default: es5)
- Arrow function parentheses (default: always)

**Prettier vs ESLint**:

- **Prettier** - Code formatting (spacing, line breaks, quotes)
- **ESLint** - Code quality (bugs, best practices, type safety)
- Both tools work together without conflicts

### Editor Integration

**VSCode Settings** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "typescript"]
}
```

**Recommended VSCode Extensions**:

- `esbenp.prettier-vscode` - Prettier formatter
- `dbaeumer.vscode-eslint` - ESLint integration
- `vitest.explorer` - Vitest test runner UI

**Benefits**:

- Automatic formatting on save
- Real-time ESLint errors in editor
- Auto-fix ESLint issues on save
- Test explorer for running/debugging tests

### Troubleshooting Code Quality Issues

#### ESLint Cache Issues

**Problem**: ESLint shows errors for code that was already fixed

**Solution**:

```bash
# Clear ESLint cache
rm -rf node_modules/.cache/eslint

# Or specify cache location
npm run lint -- --cache-location node_modules/.cache/eslint
```

#### Conflicting Prettier/ESLint Rules

**Problem**: Prettier and ESLint fight over formatting

**Solution**: This project uses compatible configurations, but if conflicts arise:

```bash
# Check for conflicts
npx eslint-config-prettier src/index.ts

# The project already uses proper configs, so this should be rare
```

#### Type Checking Errors

**Problem**: ESLint shows type errors but TypeScript compiler doesn't

**Solution**:

```bash
# Run TypeScript compiler directly
npm run type-check

# Check tsconfig.json is correct
cat tsconfig.json

# Ensure ESLint uses correct tsconfig
# In eslint.config.js: projectService: true
```

#### Import Alias Resolution

**Problem**: ESLint/TypeScript can't resolve `#` import aliases

**Solution**:

```bash
# Check package.json has imports field
cat package.json | grep -A 3 '"imports"'
# Should show: "#*": "./src/*"

# Restart TypeScript server in VSCode
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

#### Tests Not Found

**Problem**: Vitest doesn't find test files

**Solution**:

```bash
# Check test files match pattern
ls tests/**/*.test.ts

# Verify vitest.config.js (should use defaults)
cat vitest.config.js

# Run with explicit pattern
npx vitest --run tests/
```

## Database Management

### Schema Changes

1. **Modify** the schema in `src/db/schema.ts`
2. **Generate** migration: `npx drizzle-kit generate`
3. **Review** the migration file in `src/db/migrations/`
4. **Apply** migration: `npx drizzle-kit migrate`

For development, you can skip migration files:

```bash
npx drizzle-kit push  # Applies schema changes directly
```

### Drizzle Studio

Open a visual database editor:

```bash
npx drizzle-kit studio
```

Access at: `https://local.drizzle.studio`

### Manual Database Access

```bash
# Connect to database (Docker)
docker exec -it full-stack-postgres psql -U postgres -d backend_db

# Connect to database (local)
psql postgresql://postgres:postgres@localhost:5432/backend_db
```

## API Documentation

### Swagger UI (Interactive)

Visit: **http://localhost:3000/swagger**

Try endpoints directly in your browser with:

- Request/response examples
- Authentication testing
- Schema validation

### OpenAPI Specification

- **JSON**: http://localhost:3000/docs/openapi.json
- **File**: `_docs/openapi.json`

The OpenAPI spec is **auto-generated** from Zod schemas. To regenerate:

```bash
npm run generate:openapi
```

### Available Endpoints

| Method | Endpoint             | Description        | Auth |
| ------ | -------------------- | ------------------ | ---- |
| GET    | `/health`            | Health check       | No   |
| GET    | `/api/v1/hello`      | Test endpoint      | No   |
| POST   | `/api/v1/users`      | Create user        | No   |
| GET    | `/api/v1/users/:id`  | Get user by ID     | Yes  |
| POST   | `/api/auth/register` | Register user      | No   |
| POST   | `/api/auth/login`    | Login              | No   |
| GET    | `/metrics`           | Prometheus metrics | No   |

## Environment Variables

| Variable                      | Description                                           | Default       | Required |
| ----------------------------- | ----------------------------------------------------- | ------------- | -------- |
| `NODE_ENV`                    | Environment                                           | `development` | Yes      |
| `PORT`                        | Server port                                           | `3000`        | Yes      |
| `DATABASE_URL`                | PostgreSQL connection string                          | -             | Yes      |
| `JWT_SECRET`                  | Secret for JWT tokens (min 32 chars)                  | -             | Yes      |
| `ENABLE_TRACING`              | Enable OpenTelemetry tracing                          | `false`       | No       |
| `OTEL_SERVICE_NAME`           | Service name for tracing                              | `backend`     | No       |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP endpoint URL (if not set, traces log to console) | -             | No       |
| `METRICS_ENABLED`             | Enable Prometheus metrics                             | `false`       | No       |
| `LOG_LEVEL`                   | Logging level                                         | `info`        | No       |
| `LOGGER_PRETTY`               | Pretty print logs                                     | `false`       | No       |

## Docker Commands

```bash
# Build image
docker-compose build backend

# Start service
docker-compose up -d backend

# View logs
docker-compose logs -f backend

# Restart service
docker-compose restart backend

# Stop service
docker-compose stop backend

# Execute commands in container
docker exec full-stack-backend <command>

# Open shell in container
docker exec -it full-stack-backend sh
```

## Troubleshooting

### Database Connection Errors

**Problem**: `password authentication failed for user "backend_user"`

**Solution**: This should not occur with Docker Compose as the database is created automatically. If it does:

1. Check if this is a fresh start (delete postgres volume if needed):

```bash
docker-compose down -v
docker-compose up -d
```

2. Verify the init script ran:

```bash
docker exec full-stack-postgres psql -U postgres -c "\l" | grep backend_db
```

### Migration Errors

**Problem**: Migrations fail to run on startup

**Solution**: Check the backend logs:

```bash
docker-compose logs backend
```

If migrations fail, you can run them manually:

```bash
docker exec full-stack-backend npx drizzle-kit push
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:

- Stop other services using port 3000
- Or change `PORT` in `.env` or `docker-compose.yml`

### TypeScript Build Errors

**Problem**: Build fails with import errors

**Solution**:

1. Check import paths use `#` aliases (e.g., `#lib/effect`)
2. Run `npm install` to ensure dependencies are installed
3. Run `npm run type-check` to see detailed errors

### OpenAPI Generation Fails

**Problem**: `generate:openapi` script fails

**Solution**:

1. Ensure all schema imports in `src/scripts/generate-openapi.ts` are correct
2. Check Zod schemas have `.openapi()` metadata
3. Verify schemas are properly exported

## Architecture

This backend uses **FCIS (Functional Core, Imperative Shell)** architecture:

- **Functional Core** (`src/core/`): Pure business logic with Effect system
- **Imperative Shell** (`src/infrastructure/`, `src/routes/`): I/O, HTTP, database

### Key Directories

```
src/
├── core/              # Business logic (workflows, operations)
├── infrastructure/    # Technical concerns (database, auth, logging)
├── routes/            # HTTP endpoints (handlers, schemas)
├── middlewares/       # Express middleware
├── lib/               # Shared libraries (Effect system)
├── db/                # Database schema and migrations
└── scripts/           # Build and utility scripts
```

### Adding New Features

1. **Define schema** in `src/db/schema.ts`
2. **Create repository** in `src/infrastructure/repositories/drizzle/`
3. **Add workflows** in `src/core/[domain]/`
4. **Create routes** in `src/routes/[domain]/`
5. **Register routes** in `src/routes/index.ts`
6. **Update OpenAPI** in `src/scripts/generate-openapi.ts`

See `CLAUDE.md` for detailed development guidelines.

## Observability

### Logging

Structured JSON logging with Pino:

- Request correlation IDs
- Automatic request/response logging
- Configurable log levels

### Metrics

Prometheus metrics at `/metrics`:

- HTTP request count/duration
- Effect execution metrics
- Database query metrics
- Custom business metrics

### Tracing

OpenTelemetry distributed tracing:

- HTTP request spans
- Database query spans
- Effect operation spans
- Traces log to console by default (ConsoleSpanExporter)
- Optional export to OTLP collectors (set `OTEL_EXPORTER_OTLP_ENDPOINT`)

## License

[Your License Here]
