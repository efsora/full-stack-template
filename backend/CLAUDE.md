# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Start dev server with file watching and .env file
npm run dev:docker       # Start dev server for Docker (no .env file)

# Building
npm run build            # Compile TypeScript and generate OpenAPI spec
npm run type-check       # Type check without emitting files

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changes

# Testing
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage report

# TypeScript Quality Checks
npm run check:any              # Detect any type usage (fails if found)
npm run check:types            # Strict type checking (stricter than type-check)
npm run check:casting          # Report type casting instances
npm run check:typescript-quality # All TypeScript quality checks combined

# Database (Drizzle ORM)
npx drizzle-kit generate # Generate migrations from schema changes
npx drizzle-kit migrate  # Apply migrations to database
npx drizzle-kit push     # Push schema directly to database (dev only)
npx drizzle-kit studio   # Open Drizzle Studio database GUI

# OpenAPI Documentation
npm run generate:openapi # Generate OpenAPI spec from Zod schemas (auto-runs with dev/build)
```

## Architecture: Functional Core, Imperative Shell (FCIS)

This backend implements a strict separation between pure business logic and side effects.

### Directory Structure

```
src/
├── core/                    # Functional Core (Pure Business Logic)
│   └── users/               # Domain-specific modules
│       ├── *.workflow.ts    # Orchestration layer (compose operations)
│       ├── *.operations.ts  # Pure business operations
│       ├── value-objects/   # Domain primitives (Email, Password)
│       ├── types/
│       │   ├── inputs.ts    # External request data
│       │   ├── outputs.ts   # External response data
│       │   ├── errors.ts    # Domain-specific errors
│       │   └── internal.ts  # Implementation-only types
│       └── index.ts         # Barrel export (public API)
├── infrastructure/          # Imperative Shell (Technical Concerns)
│   ├── auth/                # JWT token generation
│   ├── config/              # Environment config with Zod validation
│   ├── logger/              # Pino logger with AsyncLocalStorage
│   ├── metrics/             # Prometheus metrics
│   ├── tracing/             # OpenTelemetry distributed tracing
│   └── repositories/        # Data access layer (Drizzle ORM)
├── routes/                  # HTTP layer (Express routes)
│   └── [domain]/            # Each domain has: routes.ts, handlers.ts, schemas.ts
├── middlewares/             # Express middleware
├── lib/                     # Library modules
│   ├── result/              # Custom Result system (functional programming)
│   └── types/               # Shared type definitions
└── db/                      # Database schemas and client
```

### Key Architectural Patterns

1. **Custom Result System**: Railway-oriented programming with automatic observability
2. **Repository Pattern**: Factory functions for dependency injection and testing
3. **Value Objects**: Opaque branded types for type-safe domain primitives
4. **Barrel Exports**: Enforced via ESLint to maintain clean boundaries
5. **Type vs Interface Convention**: `type` for DTOs, `interface` for contracts

## Custom Result System

The codebase uses a **custom Result system** (inspired by Effect-TS) for managing side effects with full observability.

### Result Type

```typescript
type Result<T> = Success<T> | Failure | Command<T>;
```

- **Success**: Contains a successful result value
- **Failure**: Contains a typed error (AppError)
- **Command**: Represents a side effect (async operation) with continuation

### Workflow Pattern (Railway-Oriented Programming)

Workflows compose operations using `pipe()`:

```typescript
// src/core/users/create-user.workflow.ts
export function createUser(input: CreateUserInput): Result<CreateUserResult> {
  return pipe(
    validateUserCreation(input), // Effect<ValidatedInput>
    checkEmailAvailability, // Effect<ValidatedInput>
    hashPasswordForCreation, // Effect<HashedInput>
    saveNewUser, // Effect<CreateUserResult>
    addAuthToken, // Effect<CreateUserResult>
  );
}
```

Each step receives the previous step's output. If any step returns `Failure`, execution stops and the failure propagates.

### Operation Pattern (Side Effects)

Operations use `command()` for async operations:

```typescript
// src/core/users/create-user.operations.ts
export function saveNewUser(input: HashedInput): Result<CreateUserResult> {
  return command(
    async () => {
      const users = await userRepository.create({
        email: input.email,
        password: input.hashedPassword,
        name: input.name,
      });
      return first(users);
    },
    (user) =>
      user
        ? success({ id: user.id, email: user.email, name: user.name })
        : fail({ code: "INTERNAL_ERROR", message: "Failed to create user" }),
    {
      operation: "saveNewUser",
      tags: { domain: "users", action: "create" },
    },
  );
}
```

**Command automatically provides**:

- OpenTelemetry span creation
- Prometheus metrics recording
- Pino logging with correlation IDs
- Error tracking

### Combinators

```typescript
// Sequential composition (output becomes input to next function)
pipe(effect1, effect2, effect3);

// Parallel composition (all effects run concurrently)
allNamed({
  email: Email.create(email),
  password: Password.create(password),
});

// Transformation
map((user) => ({ id: user.id, email: user.email }));

// Conditional logic
filter(
  (user) => user.isActive,
  (user) => fail({ code: "FORBIDDEN", message: `User ${user.id} is inactive` }),
);

// Side effects without transformation
tap((user) => logger.info({ userId: user.id }, "User created"));

// Pattern matching
match(result, {
  onSuccess: (value) => value,
  onFailure: (error) => {
    throw error;
  },
});
```

### Invariant Assertions

Use `invariant()` for programming errors, NOT business errors:

```typescript
import { invariant } from "#lib/result";

// ✅ CORRECT - Programming error (API misuse)
invariant(
  result.status !== "Command",
  "matchResponse() must be called after run()",
);

// ❌ INCORRECT - Business error (use Failure instead)
invariant(user !== null, "User not found"); // NO! Use fail()

// ✅ CORRECT - Business error
return user
  ? success(user)
  : fail({
      code: "NOT_FOUND",
      message: "User not found",
      resourceType: "user",
      resourceId: userId,
    });
```

**When to use `invariant()`:**

- API misuse: Calling functions with invalid preconditions
- Type system gaps: Exhaustiveness checking in switch statements
- Internal consistency: "This should never happen" scenarios

**When NOT to use `invariant()`:**

- Expected runtime failures → Return `Failure` result
- User input validation → Use `fail()` with VALIDATION_ERROR
- Business rule violations → Use `fail()` with appropriate error code

### Executing Results

Handlers execute results using `run()`:

```typescript
// src/routes/users/handlers.ts
export async function handleCreateUser(
  req: ValidatedRequest<{ body: CreateUserBody }>,
): Promise<AppResponse<CreateUserResult>> {
  const body = req.validated.body;
  const result = await run(createUser(body));

  return matchResponse(result, {
    onSuccess: (user) => createSuccessResponse(user),
    onFailure: (error) => createFailureResponse(error),
  });
}
```

## Barrel Export Enforcement

**Critical Architectural Rule**: Handlers MUST import workflows only from domain barrel files (`#core/domain/index.ts`).

This is enforced by a custom ESLint rule: `local/no-direct-core-imports`

### Correct vs Incorrect Imports

**✅ Correct** - Import from barrel:

```typescript
// src/routes/users/handlers.ts
import { createUser, getUserById } from "#core/users/index.js";
import type { CreateUserResult } from "#core/users/index.js";
```

**❌ Incorrect** - Direct imports (ESLint error):

```typescript
// Direct workflow import
import { createUser } from "#core/users/create-user.workflow.js";

// Operation import (operations should never be in handlers)
import { validateUserCreation } from "#core/users/create-user.operations.js";

// Internal type import
import type { HashedInput } from "#core/users/types/internal.js";
```

### Barrel File Structure

Each domain MUST have an `index.ts` barrel file:

```typescript
// src/core/users/index.ts
/**
 * Users Module - Public API
 */

// Workflows (main entry points)
export { createUser } from "./create-user.workflow.js";
export { getUserById } from "./get-user.workflow.js";

// Public types
export type { CreateUserInput } from "./types/inputs.js";
export type { CreateUserResult, UserData } from "./types/outputs.js";

// Value objects (if used in workflow signatures)
export { Email } from "./value-objects/Email.js";
export { Password } from "./value-objects/Password.js";

// NOT exported (intentionally hidden):
// - *.operations.ts - Database operations
// - types/internal.ts - Internal types
// - *.compositions.ts - Internal orchestration
```

### What to Export from Barrel

**✅ Export**:

- Workflows (`*.workflow.ts`) - Main entry points for handlers
- Public input types (`types/inputs.ts`) - Request data structures
- Public output types (`types/outputs.ts`) - Response data structures
- Error types (`types/errors.ts`) - Domain-specific errors
- Value objects - If used in workflow signatures

**❌ DO NOT Export**:

- Operations (`*.operations.ts`) - Implementation details
- Internal types (`types/internal.ts`) - Implementation-only types
- Compositions (`*.compositions.ts`) - Internal orchestration
- Rules (`*.rules.ts`) - Validation logic
- Helpers (`*.helpers.ts`) - Utility functions

## Repository Pattern

Repositories use **factory functions** for dependency injection and testing.

### Repository Structure

```typescript
// src/infrastructure/repositories/drizzle/UserRepository.ts
export function createUserRepository(dbInstance: typeof db) {
  return {
    findById: (id: string) => {
      /* ... */
    },
    findByEmail: (email: string) => {
      /* ... */
    },
    create: (data: NewUser) => {
      /* ... */
    },
    update: (id: string, data: Partial<NewUser>) => {
      /* ... */
    },
    delete: (id: string) => {
      /* ... */
    },
    withTransaction: (tx: unknown) => createUserRepository(tx as typeof db),
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;
export const userRepository = createUserRepository(db); // Singleton
```

### Usage

```typescript
// Operations use the singleton
import { userRepository } from "#infrastructure/repositories/drizzle";
await userRepository.findByEmail(email);

// Tests use the factory with mock db
const testRepo = createUserRepository(mockDb);
```

### Transaction Support

```typescript
await db.transaction(async (tx) => {
  const userRepo = userRepository.withTransaction(tx);
  const postRepo = postRepository.withTransaction(tx);

  await userRepo.update(userId, { name: "New Name" });
  await postRepo.create({ userId, content: "Hello" });
});
```

## Type vs Interface Convention

### Use `type` for Data Transfer Objects (DTOs)

```typescript
// ✅ CORRECT - Use type for DTOs
export type CreateUserInput = {
  email: string;
  name?: string;
  password: string;
};

export type CreateUserResult = {
  id: string;
  email: string;
  name: string | null;
  token?: string;
};
```

**When to use `type`:**

- Input types (`types/inputs.ts`) - Request data from external sources
- Output types (`types/outputs.ts`) - Response data to external consumers
- Internal types (`types/internal.ts`) - Domain-internal data shapes
- Shared response types (`lib/types/`) - API response wrappers
- Union types and intersections

### Use `interface` for Extensible Contracts

```typescript
// ✅ CORRECT - Use interface for contracts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
}
```

**When to use `interface`:**

- Repository contracts and service interfaces
- Class hierarchies and inheritance
- Declaration merging (extending third-party types)

### Union Type Order Convention

Always put the main type first:

```typescript
// ✅ Correct
name: string | null;
cursor?: string | null;

// ❌ Incorrect
name: null | string;
cursor?: null | string;
```

### ESLint Enforcement

```javascript
"@typescript-eslint/consistent-type-definitions": ["error", "type"]
```

## HTTP Layer

### Adding New Routes

1. **Create domain folder**: `src/routes/[domain]/`

2. **Define Zod schemas** (`schemas.ts`):

```typescript
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const createBodySchema = z
  .object({
    field: z.string().openapi({ example: "value" }),
  })
  .openapi("CreateBody");

// Export inferred type for handlers
export type CreateBody = z.infer<typeof createBodySchema>;
```

3. **Create handlers** (`handlers.ts`):

```typescript
import { matchResponse } from "#lib/result/combinators";
import { run } from "#lib/result/index";
import { createWorkflow } from "#core/domain/index";
import {
  createSuccessResponse,
  createFailureResponse,
  type AppResponse,
} from "#lib/types/response";
import type { ValidatedRequest } from "#middlewares/validate";
import type { CreateBody } from "./schemas";

export async function handleCreate(
  req: ValidatedRequest<{ body: CreateBody }>,
): Promise<AppResponse<CreateResult>> {
  const body = req.validated.body; // Type-safe validated data
  const result = await run(createWorkflow(body));

  return matchResponse(result, {
    onSuccess: (data) => createSuccessResponse(data),
    onFailure: (error) => createFailureResponse(error),
  });
}
```

4. **Define routes** (`routes.ts`):

```typescript
import { validate } from "#middlewares/validate";
import { handleResult } from "#middlewares/resultHandler";

router.post("/create", validate(createBodySchema), handleResult(handleCreate));
```

5. **Register in main router** (`src/routes/index.ts`):

```typescript
import domainRoutes from "./domain/routes";
router.use("/domain", domainRoutes);
```

### Request Flow

```
HTTP Request
  ↓
Middleware (logging, metrics, body parsing)
  ↓
validate() middleware (Zod schema)
  ├─ Validates body/params/query
  ├─ Returns 400 if validation fails
  └─ Populates req.validated with type-safe data
  ↓
handleResult() middleware
  ↓
Handler Function (accesses req.validated.*)
  ├─ Type-safe validated inputs
  └─ Calls workflow
  ↓
Workflow (orchestrates operations)
  ↓
Operations (business logic)
  ↓
Repository (database access)
  ↓
Response (formatted by handleResult)
```

### Validated Request Pattern

```typescript
// Multiple validation sources (body + params)
export async function handleUpdate(
  req: ValidatedRequest<{ body: UpdateBody; params: IdParams }>,
): Promise<AppResponse<UpdateResult>> {
  const body = req.validated.body; // Type: UpdateBody
  const { id } = req.validated.params; // Type: IdParams
  // ...
}

// Single validation source (params only)
export async function handleGet(
  req: ValidatedRequest<{ params: IdParams }>,
): Promise<AppResponse<GetResult>> {
  const { id } = req.validated.params; // Type: IdParams
  // ...
}
```

## Universal API Response Format

All API endpoints return `AppResponse<T>` format using discriminated unions.

### Response Structure

```typescript
// Success Response
{
  success: true,
  data: T,
  traceId: string,
  message?: null,
  meta?: Meta | null,
  error?: null
}

// Failure Response
{
  success: false,
  error: AppError,
  message: string,
  traceId: string,
  data?: null,
  meta?: null
}
```

### Helper Functions

```typescript
// Simple success response
createSuccessResponse<T>(data: T): SuccessResponse<T>

// Success with pagination
createPaginatedSuccessResponse<T>(
  data: T,
  pagination: PaginationMeta
): SuccessResponse<T>

// Failure response
createFailureResponse(error: AppError): FailureResponse
```

## Testing Strategy

Tests use Vitest v4.0.4 and Docker testcontainers for integration tests.

### Test Categories

**Unit Tests** (`tests/value-objects/`):

- Pure value objects, utility functions
- No database, no external dependencies
- Fast execution
- Example: Email validation, Password strength

**Integration Tests** (`tests/integration/`):

- Complete workflows with real database operations
- Uses PostgreSQL testcontainers
- Tests end-to-end business logic
- Example: Full createUser workflow

### Testing with Result System

```typescript
import { run } from "#lib/result/index";
import { createUser } from "#core/users/create-user.workflow";

// Always await run() to execute Result effects
const result = await run(createUser(input));

// Use type narrowing to safely access result values
if (result.status === "Success") {
  expect(result.value.email).toBe("test@example.com");
} else if (result.status === "Failure") {
  expect(result.error.code).toBe("USER_EMAIL_ALREADY_EXISTS");
}
```

### Integration Testing with Testcontainers

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupTestDatabase,
  createTestDb,
  cleanupDatabase,
  teardownTestDatabase,
  getTestDb,
} from "../helpers/database";

describe("Workflow Integration Tests", () => {
  // Setup: Start container and run migrations (once for all tests)
  beforeAll(async () => {
    const connectionString = await setupTestDatabase();
    createTestDb(connectionString);
  }, 60000); // 60s timeout for container startup

  // Cleanup: Truncate tables before each test for isolation
  beforeEach(async () => {
    const db = getTestDb();
    await cleanupDatabase(db);
  });

  // Teardown: Stop container after all tests
  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("should test workflow with real database", async () => {
    // Arrange
    const input = { email: "test@example.com", password: "pass123" };

    // Act
    const result = await run(createUser(input));

    // Assert
    expect(result.status).toBe("Success");
    if (result.status === "Success") {
      expect(result.value.email).toBe("test@example.com");

      // Verify in database
      const db = getTestDb();
      const users = await db.query.users.findMany({
        where: (users, { eq }) => eq(users.email, "test@example.com"),
      });
      expect(users).toHaveLength(1);
    }
  });
});
```

**Testcontainer Lifecycle**:

1. **beforeAll**: Starts PostgreSQL 18 container, runs migrations (shared across tests)
2. **beforeEach**: Truncates all tables with CASCADE (ensures test isolation)
3. **Test Execution**: All tests share the same container (parallel execution)
4. **afterAll**: Stops container and cleans up resources

### Coverage Configuration

```bash
npm run test:coverage  # Generate coverage report
```

**Coverage Scope**:

- **Included**: `src/core/**/*.ts` (business logic only)
- **Excluded**: Infrastructure, routes, config, tests
- **Thresholds**: 35% (lines, functions, branches, statements)
- **Rationale**: Focus on testing the functional core, not framework code

## Database (Drizzle ORM)

### Schema Definition

```typescript
// src/db/schema.ts
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Migration Workflow

1. Modify schema in `src/db/schema.ts`
2. Generate migration: `npx drizzle-kit generate`
3. Review migration in `src/db/migrations/`
4. Apply migration: `npx drizzle-kit migrate`

For development: `npx drizzle-kit push` (applies schema changes directly)

## Observability

### Logging (Pino)

The logger automatically includes:

- Request correlation IDs (via AsyncLocalStorage)
- Service name and environment
- Timestamp and log level

```typescript
import { logger } from "#infrastructure/logger";

logger.info({ userId, action: "login" }, "User logged in");
logger.error({ error, requestId }, "Operation failed");
```

### Log Sanitization (Security)

The request logger automatically sanitizes sensitive data:

**What Gets Redacted**:

- **Authentication**: passwords, tokens, API keys, Bearer tokens, sessions
- **Payment**: credit card numbers, CVV, account numbers
- **PII**: SSN, passport, driver's license, national ID
- **Security**: private keys, secrets, encryption keys

**Automatic**: The `requestLogger` middleware handles this. No manual sanitization needed.

**Adding Custom Fields**: Edit `SENSITIVE_FIELDS` Set in `src/middlewares/utils/sanitize.ts`

### Metrics (Prometheus)

Metrics automatically collected:

- HTTP requests (count, duration, response size)
- Result executions (count, duration, errors)
- Database queries (count, duration)
- Business events (users_registered_total, etc.)

Access metrics: `GET /metrics`

### Tracing (OpenTelemetry)

Distributed tracing automatically enabled for:

- HTTP requests (via auto-instrumentation)
- Database queries (via Drizzle instrumentation)
- Result operations (via Command metadata)

**Tracing Behavior**:

- When `OTEL_EXPORTER_OTLP_ENDPOINT` is **not set**: Traces log to console
- When `OTEL_EXPORTER_OTLP_ENDPOINT` is **set**: Traces export to OTLP endpoint

## OpenAPI Documentation

### Auto-Generated from Zod Schemas

The OpenAPI spec is **automatically generated** from Zod schemas using `@asteasolutions/zod-to-openapi`.

**File Structure**:

```
src/openapi/
├── generate.ts          # Generation script
├── registry.ts          # Central OpenAPI registry
├── schemas.ts           # Common response/error schemas
└── paths/               # Path registrations by domain
    ├── users.ts
    └── [domain].ts
```

### Adding Endpoints

1. **Define Zod schemas with OpenAPI metadata** (`routes/domain/schemas.ts`):

```typescript
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const createBodySchema = z
  .object({
    email: z.string().email().openapi({ example: "user@example.com" }),
  })
  .openapi("CreateBody");
```

2. **Create path registration** (`src/openapi/paths/domain.ts`):

```typescript
import { createBodySchema } from "#routes/domain/schemas";
import { registry } from "../registry.js";
import { commonErrorResponses, successResponseSchema } from "../schemas.js";

registry.registerPath({
  method: "post",
  path: "/api/v1/domain",
  summary: "Create entity",
  tags: ["Domain"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Entity created successfully",
      content: {
        "application/json": {
          schema: successResponseSchema(createResponseSchema),
        },
      },
    },
    400: commonErrorResponses[400],
    500: commonErrorResponses[500],
  },
});
```

3. **Import path registration** (`src/openapi/generate.ts`):

```typescript
import "./paths/users.js";
import "./paths/domain.js"; // Add your new path file
```

4. **Regenerate spec**: `npm run generate:openapi`

### Common Schema Utilities

```typescript
// Wrap data in AppResponse<T> success format
schema: successResponseSchema(userDataSchema);

// Paginated list endpoints
schema: paginatedSuccessResponseSchema(userSchema);

// Standard error responses
responses: {
  400: commonErrorResponses[400],  // Validation Error
  401: commonErrorResponses[401],  // Unauthorized
  404: commonErrorResponses[404],  // Not Found
  500: commonErrorResponses[500],  // Internal Error
}
```

## Adding a New Domain/Entity

1. **Create database schema** in `src/db/schema.ts`
2. **Generate migration**: `npx drizzle-kit generate`
3. **Create repository**: `src/infrastructure/repositories/drizzle/EntityRepository.ts`
   - Factory function pattern with `withTransaction` support
4. **Create core module**: `src/core/entity/`
   - Define types in `types/` (inputs, outputs, errors, internal)
   - Create value objects in `value-objects/`
   - Implement operations in `*.operations.ts`
   - Compose workflows in `*.workflow.ts`
5. **Create barrel export**: `src/core/entity/index.ts`
   - Export workflows, public types, and value objects
   - DO NOT export operations, internal types, or helpers
6. **Create HTTP layer**: `src/routes/entity/`
   - Define schemas in `schemas.ts` with OpenAPI metadata
   - Implement handlers in `handlers.ts` (import from barrel only)
   - Define routes in `routes.ts`
7. **Register routes** in `src/routes/index.ts`
8. **Register OpenAPI paths**:
   - Create `src/openapi/paths/entity.ts` with path registrations
   - Import in `src/openapi/generate.ts`
   - Run `npm run generate:openapi`

## Environment Configuration

Configuration is validated at startup using Zod in `src/infrastructure/config/env.ts`.

Required variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Minimum 32 characters for token signing
- `NODE_ENV` - "development" or "production"
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - "debug", "info", "warn", or "error"
- `ENABLE_TRACING` - "true" or "false"
- `METRICS_ENABLED` - "true" or "false"

Optional variables:

- `OTEL_EXPORTER_OTLP_ENDPOINT` - OTLP endpoint URL (if not set, traces log to console)
- `OTEL_SERVICE_NAME` - Service name for tracing (default: "backend")

## Import Aliases

The project uses ES Module import aliases configured in `package.json`:

```json
{
  "imports": {
    "#*": "./src/*"
  }
}
```

Usage:

```typescript
import { logger } from "#infrastructure/logger";
import { userRepository } from "#infrastructure/repositories/drizzle";
import { Email } from "#core/users/value-objects/Email";
import { success, fail } from "#lib/result/factories";
import { run } from "#lib/result/index";
```

## Authentication

JWT-based authentication using the `jsonwebtoken` library.

### Token Generation

```typescript
import { generateAuthToken } from "#infrastructure/auth/token";

const token = generateAuthToken(userId, email);
// Token expires in 7 days
```

### Protected Routes

```typescript
import { auth } from "#middlewares/auth";

router.get("/protected", auth, handleProtected);
```

The middleware:

- Verifies Bearer token from `Authorization` header
- Attaches decoded payload to `req.user = { userId, email }`
- Returns 401 for invalid/missing tokens

## FCIS Orchestrator (AI-Powered Code Generation)

The FCIS Orchestrator is an AI-powered code generation system that automates the creation of FCIS-compliant backend features using Claude Code's advanced features (Skills, Sub-agents, Slash Commands, and Hooks).

### Quick Start

Generate a complete FCIS feature with a single command:

```bash
/fcis:create "Add password reset functionality"
/fcis:create "Add email verification to user registration"
```

### What Gets Generated

For each feature, the orchestrator generates:

**Database Layer**:

- Drizzle ORM schema definitions
- Database migrations
- Indexes for performance

**Infrastructure Layer** (Imperative Shell):

- Repository factory functions with CRUD methods
- External service clients (email, payment, SMS, etc.)
- Barrel exports

**Core Layer** (Functional Core):

- Value objects (branded types with validation)
- Operations (business logic with `command()`)
- Workflows (composition with `pipe()`)
- Type definitions (inputs, outputs, errors, internal)
- Barrel exports (public API only)

**HTTP Layer** (Imperative Shell):

- Zod schemas with OpenAPI metadata
- Request handlers (barrel imports only)
- Route definitions with middleware
- OpenAPI path registrations

**Tests**:

- Unit tests for value objects
- Unit tests for pure functions

### How It Works

The orchestrator guides you through 7 phases with interactive checkpoints:

#### 1. Analysis Phase

- Analyzes ALL existing domains in `src/core/`
- Learns naming conventions, file structures, error patterns
- Identifies required components
- Determines primary domain (new or existing)

**Checkpoint**: Review analysis and approve

#### 2. Q&A Session (Interactive Clarification)

**Purpose**: Resolve gaps, ambiguities, and implementation options before Design phase.

**Process**:
- Conducts gap analysis comparing task against learned patterns
- Generates clarifying questions in batches (max 4 per batch)
- Asks about: authentication, validation, pagination, error handling, external services, performance
- Dynamically generates follow-up questions based on answers
- Detects contradictions and requests clarification
- **Skips if no ambiguities detected**: Shows "No ambiguities detected, proceeding to Design"

**Question Categories**:
- Database Design (relationships, constraints, indexes)
- Business Logic (validation rules, error handling)
- API Design (auth, pagination, rate limiting)
- External Services (providers, timeouts, fallbacks)
- Testing (coverage scope, edge cases)
- Performance (caching, optimization priorities)

**Benefits**:
- Ensures complete requirements before implementation
- Captures architectural decisions with reasoning
- Provides educational context for each option
- Full traceability in design document

#### 3. Design Phase

- Designs database schema (tables, columns, indexes) - informed by Q&A decisions
- Designs type system (inputs, outputs, errors, value objects)
- Designs business logic (operations, workflows)
- Designs repository methods
- Designs external services
- Designs HTTP layer (routes, handlers, schemas)
- Designs tests

**Checkpoint**: Review design and approve

#### 3.5. Design Validation

**Purpose**: Ensure Design specifications are complete before implementation, enabling deterministic execution.

**Validates**:
- Database schema completeness (all tables, columns, constraints, indexes, cascades fully specified)
- Type system completeness (all inputs, outputs, errors with codes, value objects with validation rules)
- Business logic completeness (operations, workflows, error handling, validation rules defined)
- Repository completeness (all methods specified, transaction support identified)
- HTTP layer completeness (routes, handlers, schemas, auth requirements defined)
- External services completeness (providers, interfaces, timeouts specified if applicable)
- Test completeness (coverage scope, scenarios identified)

**Result**:
- ✅ **Complete**: Proceed to Planning phase
- ❌ **Incomplete**: Return to Design phase with specific missing items listed

**Why**: Prevents specialists from asking uncertain questions during implementation by ensuring all design decisions are documented upfront.

#### 4. Planning Phase

- Creates file inventory (new files, files to modify)
- Detects conflicts and merge strategies
- Validates feasibility, naming, FCIS compliance
- Creates execution plan for agents

**Checkpoint**: Review plan and approve

#### 5. Implementation Phase

11 specialist workflows execute in **5 logical groups** with automatic execution within groups and checkpoints between groups:

**Group 1: Foundation** (Data Layer)
- **schema-designer**: Database schemas + migrations
- **repository-builder**: Repository factory functions
- **Checkpoint**: Review database design

**Group 2: Domain Core** (Functional Core)
- **external-service-builder**: External API clients
- **value-object-creator**: Branded type value objects
- **operations-builder**: Business operations
- **workflow-composer**: Railway-oriented workflows
- **Checkpoint**: Review business logic

**Group 3: HTTP Shell** (Imperative Shell)
- **route-generator**: HTTP layer components
- **openapi-registrar**: API documentation
- **Checkpoint**: Review API design

**Group 4: Quality Assurance** (Validation - BLOCKING)
- **test-generator**: Unit tests
- **validator**: Architectural compliance + post-implementation checklist (format, lint, type-check, test, build)
- **Checkpoint**: Must pass all validation checks

**Group 5: Refinement** (Conditional)
- **refactoring-agent**: Align existing code (only if needed)
- **Checkpoint**: Approve refactoring

**Execution Strategy**:
- Specialists execute automatically within each group
- Progress reported after each group completes
- Checkpoints between groups for user review
- Stop-on-failure within groups (ask user: Retry/Skip/Stop)

Each specialist is defined in `.claude/skills/fcis-orchestrator/agent-specs/` as a workflow specification that the orchestrator follows.

#### 6. Iteration Phase

- Collect developer feedback
- Analyze which specialists need re-execution
- Re-run affected agents only
- Return to Phase 5 checkpoint

### Architectural Guarantees

The **validator** agent enforces (BLOCKING):

✅ **Barrel Export Compliance**

- Only workflows, public types, value objects exported
- No operations, internal types, or helpers in public API

✅ **Import Rules**

- Handlers import workflows ONLY from barrel exports
- No direct workflow/operation/internal type imports

✅ **Type Conventions**

- DTOs use `type`
- Contracts use `interface`

✅ **Result Usage**

- Workflows use `pipe()` for composition
- Operations use `command()` for side effects
- Proper error handling with `fail()`

✅ **Repository Pattern**

- Factory functions for dependency injection
- `withTransaction` support for all repositories

✅ **TypeScript Code Quality**

The validator enforces strict TypeScript quality rules:

**The 4 Rules**:
1. **Never use `any` type** - All values have proper types (User, string, CreateInput) or `unknown` with validation
2. **All values properly typed** - Explicit types on function parameters, return types, and non-obvious variables
3. **Minimal type casting** - Avoid `as Type` except after runtime validation (Zod), type guards, or external data validation
4. **Pattern consistency** - Use type patterns from existing domains (branded types, utility types, type structure)

**Enforcement**:
- Multi-layer: Pattern learning (Analysis) + Specialist guidelines + Validator checks
- 4-method detection: Grep + tsc + ESLint + npm scripts (check:any, check:types, check:casting)
- Automatic fixes: Replace `any`, add type annotations, remove unnecessary casts
- Blocking: Unfixable violations block implementation

**TypeScript Quality Scripts**: `npm run check:typescript-quality` runs all checks (check:any, check:types, check:casting)

✅ **Code Quality**

- ESLint passes
- TypeScript type checking passes

✅ **Runtime Readiness** (Post-Implementation Checklist)

The validator includes a comprehensive post-implementation checklist that ensures generated code is production-ready:

1. **Format (Conditional)**: Runs Prettier only if lint detects formatting issues
2. **Lint**: Checks code quality, auto-fixes violations (unused imports, formatting, barrel exports)
3. **Type Check**: Verifies TypeScript types, auto-fixes common errors (missing imports, type mismatches)
4. **Test**: Runs test suite, asks user for guidance on failures
5. **Build**: Verifies production build, auto-fixes build errors (import paths, OpenAPI issues)

**Stop-on-Failure Strategy**: If any check fails, the validator automatically fixes the issue and retries ALL checks from the beginning. This continues until all checks pass or maximum retry limit (10) is reached.

**Automatic Fixes**:
- Formatting corrections (Prettier)
- Unused import removal
- Missing import additions
- Type annotation adjustments
- Import path corrections
- Barrel export fixes
- OpenAPI schema corrections

All validation checks are **fully blocking** - implementation cannot complete until all checks pass.

### Hooks Integration

Hooks automatically enforce FCIS patterns:

**PostToolUse** (after file edits):

- Auto-format with Prettier
- ESLint auto-fix
- Barrel export validation

**PreToolUse** (before file edits):

- Block direct operation imports in handlers
- Warn about critical file modifications

**Stop** (after completion):

- Run TypeScript type check
- Show git status for review

### Pattern Learning

The orchestrator learns from your existing code:

- Naming conventions (camelCase, PascalCase, kebab-case)
- File organization patterns
- Common workflows (CRUD, auth patterns)
- Error handling conventions
- Value object usage

Generated code matches your codebase style automatically.

### Educational Mode

As agents work, you'll see inline explanations of FCIS principles:

- "Database schema is infrastructure (Imperative Shell)"
- "Repository uses factory pattern for dependency injection"
- "Workflows compose with pipe() for railway-oriented programming"
- "Value objects prevent primitive obsession"

### Design Documents

All work is tracked in `.claude/temp/fcis-design-[timestamp].md`:

- Full analysis findings
- Q&A session (questions, answers, and reasoning)
- Complete design specifications
- Detailed execution plan
- Agent execution log with results
- Iteration history

Design documents provide full audit trail and traceability.

### Utility Scripts

Helper scripts for manual validation:

```bash
# Analyze a domain's patterns
.claude/skills/fcis-orchestrator/scripts/analyze-domain.sh users

# Validate FCIS architecture compliance
.claude/skills/fcis-orchestrator/scripts/validate-architecture.sh

# Create a design document template
.claude/skills/fcis-orchestrator/scripts/create-design-doc.sh "My Task"
```

### Advanced Usage

**Iteration Example**:

```
After implementation...

Developer: "Add rate limiting to password reset endpoint"
Orchestrator: [Analyzes feedback, re-runs route-generator with rate limiting]
```

### File Structure

The orchestrator system lives in:

```
.claude/
├── skills/fcis-orchestrator/
│   ├── SKILL.md                  # Main skill description
│   ├── agent-specs/              # 12 specialist workflow specs
│   │   ├── orchestrator.md       # Main orchestrator workflow
│   │   ├── schema-designer.md
│   │   ├── repository-builder.md
│   │   ├── external-service-builder.md
│   │   ├── value-object-creator.md
│   │   ├── operations-builder.md
│   │   ├── workflow-composer.md
│   │   ├── route-generator.md
│   │   ├── openapi-registrar.md
│   │   ├── test-generator.md
│   │   ├── validator.md
│   │   └── refactoring-agent.md
│   ├── templates/                # 11 code generation templates
│   ├── patterns/                 # Pattern documentation
│   └── scripts/                  # Utility scripts
├── commands/fcis/
│   └── create.md                 # /fcis:create command
├── hooks/
│   └── validate-barrel-exports.sh # Validation hook
├── settings.json                 # Hooks configuration
└── temp/                         # Design documents (gitignored)
```

### Best Practices

1. **Be Specific**: Detailed task descriptions get better results
2. **Review Checkpoints**: Each phase builds on previous decisions
3. **Iterate Freely**: Request changes until implementation is right
4. **Learn Patterns**: Watch explanations to understand FCIS
5. **Trust Validation**: The validator catches architectural issues

### Troubleshooting

**Agent Keeps Failing?**
Check design document: `.claude/temp/fcis-design-*.md` for error details

**Generated Code Doesn't Match Style?**
Ensure existing domains follow desired patterns - orchestrator learns from them

**Validation Blocking Implementation?**
Review validation errors in design document for architectural guidance

### Resources

- **Skill Documentation**: `.claude/skills/fcis-orchestrator/SKILL.md`
- **Specialist Specs**: `.claude/skills/fcis-orchestrator/agent-specs/` (12 workflow specs)
- **Pattern Documentation**: `.claude/skills/fcis-orchestrator/patterns/`
- **Code Templates**: `.claude/skills/fcis-orchestrator/templates/`
- **Implementation Plan**: `_plans/fcis-orchestrator-architecture.md`
