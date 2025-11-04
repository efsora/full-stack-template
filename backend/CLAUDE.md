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

# Database (Drizzle ORM)
npx drizzle-kit generate # Generate migrations from schema changes
npx drizzle-kit migrate  # Apply migrations to database
npx drizzle-kit push     # Push schema directly to database (dev only)
npx drizzle-kit studio   # Open Drizzle Studio database GUI

# OpenAPI Documentation
npm run generate:openapi # Generate OpenAPI spec from Zod schemas (auto-runs with dev/build)
```

## Standalone Backend Setup

**Important**: The backend is a **standalone service** with its own isolated `node_modules/` directory. It is NOT part of the NPM workspaces (unlike frontend, shared, and packages).

### Why Standalone?

- **Deployment Isolation**: Clean separation of backend and frontend dependencies for containerization
- **No Dependency Mixing**: Backend and frontend don't share `node_modules/`
- **Independent Builds**: Backend can be built and deployed without workspace complexity

### Installation

```bash
# From the backend directory
cd backend
npm install
```

This creates `backend/node_modules/` with all backend dependencies (both production and dev dependencies).

### Using Workspace Packages (Future)

If you need to use shared workspace packages (`@full-stack-template/common` or `@full-stack-template/shared`) in the backend:

1. Add to `backend/package.json` dependencies:

   ```json
   {
     "dependencies": {
       "@full-stack-template/common": "file:../packages/common",
       "@full-stack-template/shared": "file:../shared"
     }
   }
   ```

2. Rebuild the shared package (if needed):

   ```bash
   cd ../packages/common
   npm run build
   ```

3. Install in backend:
   ```bash
   cd ../../backend
   npm install
   ```

The `file:` protocol will copy/symlink the package into `backend/node_modules/@full-stack-template/`.

## Docker Deployment

The backend has **fully automated setup** when using Docker Compose:

1. **Database Initialization** (`/scripts/init-db.sql`):
   - Creates `backend_db` database
   - Creates `backend_user` with password
   - Grants all necessary permissions
   - Runs automatically on first PostgreSQL startup

2. **Migration on Startup** (`scripts/docker-entrypoint.sh`):
   - Waits for PostgreSQL to be healthy
   - Runs `drizzle-kit push` to apply schema
   - Starts the backend server
   - Runs on every backend container startup

3. **Zero Manual Setup**:
   ```bash
   docker-compose up -d  # Everything is automatic!
   ```

The entrypoint script logs each step with emojis for easy debugging:

- 🔍 Waiting for database
- ✅ Database ready
- 🔄 Running migrations
- ✅ Migrations completed
- 🚀 Starting backend

## Architecture Overview

This backend implements a **Functional Core, Imperative Shell** architecture with a custom Effect system for composable, observable operations.

### Directory Structure

```
src/
├── core/                    # Functional Core (Pure Business Logic)
│   └── users/               # Domain-specific modules
│       ├── *.workflow.ts    # Orchestration layer (compose operations)
│       ├── *.operations.ts  # Pure business operations
│       ├── value-objects/   # Domain primitives (Email, Password)
│       └── types/           # Domain types (inputs, outputs, errors, internal)
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
│   ├── effect/              # Custom Effect system (functional programming)
│   └── types/               # Shared type definitions
└── db/                      # Database schemas and client
```

### Key Design Patterns

1. **Custom Result System**: Lightweight functional programming system for composable operations with automatic observability
2. **Repository Pattern**: Factory functions for testable data access
3. **Value Objects**: Opaque branded types for type-safe domain primitives
4. **Railway-Oriented Programming**: Explicit success/failure paths via Effect type
5. **Dependency Injection**: Via function parameters and factory functions
6. **Layered HTTP Handler**: validate → handleResult → workflow → operations → repository

## Custom Result System

The codebase uses a **custom Effect system** (inspired by Effect-TS/fp-ts) for managing side results with full observability.

### Result Type

```typescript
type Result<T> = Success<T> | Failure | Command<T>;
```

- **Success**: Contains a successful result value
- **Failure**: Contains a typed error (AppError)
- **Command**: Represents a side effect (async operation) with continuation

### Result Patterns

#### 1. Workflow Orchestration (Railway-Oriented Programming)

Workflows in `*.workflow.ts` compose operations using `pipe()`:

```typescript
export function login(body: LoginBody): Effect<LoginResult> {
  return pipe(
    validateLogin(body), // Effect<LoginInput>
    findUserByEmail, // Effect<{ input, user }>
    verifyPassword, // Effect<LoginResult>
    addAuthToken, // Effect<LoginResult>
  );
}
```

Each step receives the previous step's output. If any step returns `Failure`, execution stops and the failure propagates.

#### 2. Command for Side Effects

Operations in `*.operations.ts` use `command()` for async operations:

```typescript
export function findUserByEmail(input: LoginInput): Effect<{ input; user }> {
  return command(
    async () => {
      const users = await userRepository.findByEmail(input.email);
      return first(users);
    },
    (user) =>
      user
        ? success({ input, user })
        : fail({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          }),
    {
      operation: "findUserByEmail",
      tags: { domain: "users", action: "read" },
    },
  );
}
```

**Command automatically provides**:

- OpenTelemetry span creation
- Prometheus metrics recording
- Pino logging with correlation IDs
- Error tracking

#### 3. Combinators

```typescript
// Sequential composition (output becomes input to next function)
pipe(effect1, effect2, effect3);

// Parallel composition
allNamed({ email: Email.create(email), password: Password.create(password) });
allConcurrent([query1, query2, query3]);

// Transformation
map((user) => ({ id: user.id, email: user.email }));

// Conditional logic
filter(
  (user) => user.isActive,
  (user) =>
    fail({
      code: "FORBIDDEN",
      message: `User ${user.id} is inactive`,
    }),
);

// Side results without transformation
tap((post) => logger.info({ postId: post.id }, "Post created"));

// Pattern matching
match(result, {
  onSuccess: (value) => value,
  onFailure: (error) => {
    throw error;
  },
});
```

#### 4. Invariant Assertions

The Result system provides `invariant()` for asserting programming contracts. Use this to distinguish between:

- **Business errors** (user not found, validation failures) → Use `fail()` with Failure
- **Programming errors** (API misuse, "should never happen" cases) → Use `invariant()`

```typescript
import { invariant } from "#lib/result";

// ✅ Correct: Programming error (API contract violation)
invariant(
  result.status !== "Command",
  "matchResponse() must be called after run()",
);

// ❌ Incorrect: Business error (use Failure instead)
invariant(user !== null, "User not found"); // NO! Use fail()

// ✅ Correct: Business error
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

All invariant violations throw with `[Invariant Violation]` prefix for easy debugging.

#### 5. Result Execution

Handlers execute results using `run()`:

```typescript
export async function handleLogin(req: Request) {
  const body = req.body as LoginBody;
  return await run(login(body));
}
```

The `handleResult` middleware:

- Processes handlers returning `AppResponse<T>` (universal response format)
- Maps success responses to 200/201 HTTP status codes
- Maps failure responses to appropriate HTTP error status codes
- Sends responses directly (already formatted by `matchResponse`)

### Value Objects

Domain primitives are implemented as opaque branded types in `value-objects/`:

```typescript
// Email.ts
export type Email = string & { readonly __brand: unique symbol };

export const Email = {
  create: (value: string): Effect<Email> => {
    /* validation */
  },
  domain: (email: Email): string => {
    /* extract domain */
  },
  toString: (email: Email): string => email as string,
};

// Usage
const emailEffect = Email.create("user@example.com"); // Effect<Email>
```

Benefits:

- Type safety: Can't pass raw strings where Email is expected
- Validation happens at creation time
- Self-documenting API

## Type vs Interface Convention

This codebase follows a clear convention for when to use `type` vs `interface`:

### Use `type` for Data Transfer Objects (DTOs)

All Input/Output/Internal types in domain modules use `type` declarations:

```typescript
// ✅ Correct - Use type for DTOs
export type CreateUserInput = {
  email: string;
  name?: string;
  password: string;
};

export type CreateUserResult = {
  id: number;
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

**Benefits:**

- More flexible (supports unions, intersections, primitives)
- Clearer intent: "this is just a data shape"
- Preferred by modern TypeScript community for DTOs
- Consistent with functional programming patterns

### Use `interface` for Extensible Contracts

Reserve `interface` for OOP patterns and declaration merging:

```typescript
// ✅ Correct - Use interface for extensible contracts
export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  create(data: NewUser): Promise<User>;
}

// ✅ Correct - Use interface for declaration merging
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
```

**When to use `interface`:**

- Repository contracts and service interfaces
- Class hierarchies and inheritance
- Declaration merging (extending third-party types)
- Plugin systems requiring extension

### Union Type Order Convention

Always put the main type first in unions:

```typescript
// ✅ Correct
name: string | null;
cursor?: string | null;

// ❌ Incorrect
name: null | string;
cursor?: null | string;
```

### ESLint Configuration

The codebase enforces this convention via ESLint:

```javascript
"@typescript-eslint/consistent-type-definitions": ["error", "type"]
```

This rule ensures all new code follows the `type`-first approach for DTOs.

## Repository Pattern

Repositories use **factory functions** for dependency injection and testing.

### Repository Structure

```typescript
// src/infrastructure/repositories/drizzle/UserRepository.ts
export function createUserRepository(dbInstance: typeof db) {
  return {
    findById: (id: number) => {
      /* ... */
    },
    findByEmail: (email: string) => {
      /* ... */
    },
    create: (data: NewUser) => {
      /* ... */
    },
    update: (id: number, data: Partial<NewUser>) => {
      /* ... */
    },
    delete: (id: number) => {
      /* ... */
    },
    withTransaction: (tx: unknown) => createUserRepository(tx as typeof db),
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;
export const userRepository = createUserRepository(db); // Singleton
```

### Usage in Operations

```typescript
import { userRepository } from "#infrastructure/repositories/drizzle";

// Use the singleton for production
await userRepository.findByEmail(email);

// Use factory for testing with mock db
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

## Database (Drizzle ORM)

### Schema Definition

Schemas are defined in `src/db/schema.ts`:

```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
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

For development, you can use `npx drizzle-kit push` to apply schema changes directly without generating migration files.

## Universal API Response Format

All API endpoints return responses in a standardized `AppResponse<T>` format using discriminated unions for type-safe success/failure handling.

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

### Handler Implementation Pattern

Handlers use `matchResponse` to construct the complete response:

```typescript
import {
  createSuccessResponse,
  createFailureResponse,
  type AppResponse,
} from "#lib/types/response";

export async function handleGetUser(
  req: Request,
): Promise<AppResponse<UserData>> {
  const result = await run(getUserById(userId));

  return matchResponse(result, {
    onSuccess: (user) =>
      createSuccessResponse({
        id: user.id,
        email: user.email,
        name: user.name,
      }),
    onFailure: (error) => createFailureResponse(error),
  });
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

// Get trace ID (auto-included by helpers)
getTraceId(): string
```

### Type Safety

The `AppResponse<T>` system enforces:

- Exhaustive field mapping via TypeScript
- Required `traceId` in all responses
- Discriminated union (success: true/false)
- Proper error structure with AppError type

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

**Handler Type Safety**:

- Import `ValidatedRequest` from `#middlewares/validate`
- Import inferred types (not schema objects) from schemas
- Use `req.validated.body/params/query` for type-safe access
- No unsafe type casting needed

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
Route Handler
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

Handlers receive validated, type-safe inputs through `req.validated`:

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

// No validation (no ValidatedRequest needed)
export async function handleList(
  req: Request,
): Promise<AppResponse<ListResult>> {
  // No validated data needed
  // ...
}
```

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

**Critical Security Feature**: The request logger automatically sanitizes sensitive data to prevent credential leakage in logs.

**What Gets Redacted**:

- **Authentication**: passwords, tokens, API keys, Bearer tokens, sessions
- **Payment**: credit card numbers, CVV, account numbers
- **PII**: SSN, passport, driver's license, national ID
- **Security**: private keys, secrets, encryption keys

**How It Works**:
The `sanitize` utility (`src/middlewares/utils/sanitize.ts`) recursively redacts sensitive fields:

```typescript
import {
  sanitize,
  sanitizeBody,
  sanitizeHeaders,
} from "#middlewares/utils/sanitize";

// Sanitize request data before logging
const safeBody = sanitizeBody(req.body);
const safeHeaders = sanitizeHeaders(req.headers);

logger.info({ body: safeBody, headers: safeHeaders }, "Request received");
```

**Automatic Sanitization**: The `requestLogger` middleware automatically sanitizes all request bodies, headers, and query parameters before logging. No manual sanitization needed in route handlers.

**Example**:

```typescript
// Input
{ email: "user@example.com", password: "secret123" }

// Logged output
{ email: "user@example.com", password: "[REDACTED]" }
```

**Adding Custom Sensitive Fields**: Edit the `SENSITIVE_FIELDS` Set in `src/middlewares/utils/sanitize.ts` to add domain-specific sensitive field names.

### Metrics (Prometheus)

Metrics are automatically collected for:

- HTTP requests (count, duration, response size)
- Result executions (count, duration, errors)
- Database queries (count, duration)
- Business events (users_registered_total, etc.)

Access metrics: `GET /metrics`

### Tracing (OpenTelemetry)

Distributed tracing is automatically enabled for:

- HTTP requests (via auto-instrumentation)
- Database queries (via Drizzle instrumentation)
- Result operations (via Command metadata)

Configure via environment variables:

```
ENABLE_TRACING=true
OTEL_SERVICE_NAME=backend
# OTEL_EXPORTER_OTLP_ENDPOINT is optional
# If not set, traces are logged to console via ConsoleSpanExporter
# Set this to send traces to an external collector (Jaeger, Tempo, etc.)
# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

**Tracing Behavior:**

- When `OTEL_EXPORTER_OTLP_ENDPOINT` is **not set**: Traces are logged to the backend console using `ConsoleSpanExporter`
- When `OTEL_EXPORTER_OTLP_ENDPOINT` is **set**: Traces are exported to the specified OTLP endpoint (e.g., otel-collector, Jaeger, Tempo)

To add an external trace collector:

1. Add otel-collector service to docker-compose.yml
2. Configure exporters (Jaeger, Tempo, Zipkin, or cloud providers)
3. Set `OTEL_EXPORTER_OTLP_ENDPOINT` to the collector's endpoint

## CORS Configuration

CORS is enabled for all origins in development mode to support Swagger UI and frontend development:

```typescript
// src/index.ts
app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: true,
  }),
);
```

For production, configure specific allowed origins in the environment or CORS middleware.

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

Use the `auth` middleware to protect routes:

```typescript
import { auth } from "#middlewares/auth";

router.get("/protected", auth, handleProtected);
```

The middleware:

- Verifies Bearer token from `Authorization` header
- Attaches decoded payload to `req.user = { userId, email }`
- Returns 401 for invalid/missing tokens

## Adding a New Domain/Entity

1. **Create database schema** in `src/db/schema.ts`
2. **Generate migration**: `npx drizzle-kit generate`
3. **Create repository**: `src/infrastructure/repositories/drizzle/EntityRepository.ts`
4. **Create core module**: `src/core/entity/`
   - Define types in `types/`
   - Create value objects in `value-objects/`
   - Implement operations in `*.operations.ts`
   - Compose workflows in `*.workflow.ts`
5. **Create HTTP layer**: `src/routes/entity/`
   - Define schemas in `schemas.ts` with OpenAPI metadata
   - Implement handlers in `handlers.ts`
   - Define routes in `routes.ts`
6. **Register routes** in `src/routes/index.ts`
7. **Create barrel export** in `src/core/entity/index.ts` (see Barrel Export Enforcement section)
8. **Register OpenAPI paths**:
   - Create `src/openapi/paths/entity.ts` with path registrations
   - Import in `src/openapi/generate.ts`
   - Run `npm run generate:openapi`

## Barrel Export Enforcement

This project enforces **barrel exports** using a custom ESLint rule to maintain clean architectural boundaries between the imperative shell (handlers) and functional core (domain logic).

### The Rule

**Rule**: `local/no-direct-core-imports`

Handlers in `src/routes/**/*.ts` **must** import workflows only from domain barrel files (`#core/domain/index.ts`). Direct imports from workflow files, operations, or internal types are **forbidden**.

### Correct vs Incorrect Imports

**✅ Correct** - Import from barrel:

```typescript
// src/routes/auth/handlers.ts
import { login, register } from "#core/users/index.js";
import type { LoginResult } from "#core/users/index.js";
```

**❌ Incorrect** - Direct imports (will fail ESLint):

```typescript
// Direct workflow import
import { login } from "#core/users/login.workflow.js";

// Operation import (operations should never be in handlers)
import { validateLogin } from "#core/users/login.operations.js";

// Internal type import
import type { ValidatedUser } from "#core/users/types/internal.js";
```

### Barrel File Structure

Each domain must have an `index.ts` barrel file that **only exports public APIs**:

```typescript
// src/core/users/index.ts
/**
 * Users Module
 * Public API for user operations
 */

// Workflows (main entry points)
export { login } from "./login.workflow.js";
export { register } from "./register.workflow.js";
export { getUserById } from "./get-user.workflow.js";

// Public types
export type { LoginBody, RegisterBody } from "./types/inputs.js";
export type { LoginResult, RegisterResult, UserData } from "./types/outputs.js";
export type {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
} from "./types/errors.js";

// Value objects (if used in workflow signatures)
export { Email } from "./value-objects/Email.js";
export { Password } from "./value-objects/Password.js";

// NOT exported (intentionally hidden):
// - *.operations.ts - Database operations
// - types/internal.ts - Internal types
```

### What to Export

**✅ Export from barrel**:

- Workflows (`*.workflow.ts`) - Main entry points for handlers
- Public input types (`types/inputs.ts`) - Request data structures
- Public output types (`types/outputs.ts`) - Response data structures
- Error types (`types/errors.ts`) - Domain-specific errors
- Value objects - If used in workflow signatures

**❌ DO NOT export from barrel**:

- Operations (`*.operations.ts`) - Implementation details
- Compositions (`*.compositions.ts`) - Internal orchestration
- Rules (`*.rules.ts`) - Validation logic
- Helpers (`*.helpers.ts`) - Utility functions
- Internal types (`types/internal.ts`) - Implementation-only types

### Error Messages

If you violate the rule, ESLint will show:

```
Import workflows from domain barrel instead: #core/users (not #core/users/login.workflow.js)
Handlers cannot import operations. Import workflows from domain barrel: #core/users
Handlers cannot import internal types. Import public types from domain barrel: #core/users
```

### Why This Matters (FCIS Architecture)

This enforcement maintains the **Functional Core, Imperative Shell** pattern:

1. **Encapsulation**: Internal operations are hidden from handlers
2. **Single Responsibility**: Workflows orchestrate, handlers delegate
3. **Testability**: Test workflows as black boxes without mocking handlers
4. **Maintainability**: Change internal operations without affecting handlers
5. **Clear Contracts**: Workflow signatures define the domain API
6. **Separation of Concerns**: Functional core remains pure, shell remains imperative

### Checking for Violations

Run ESLint to detect violations:

```bash
npm run lint
```

The rule runs automatically:

- In your editor (if ESLint extension is installed)
- During `npm run lint`
- In pre-commit hooks (via lint-staged)
- In CI/CD pipelines

## Testing Strategy

Tests are written using Vitest v4.0.4 and organized by test category. The project uses Docker testcontainers for integration tests with real PostgreSQL databases.

### Test Categories and When to Use Them

**Unit Tests** (`tests/value-objects/`):

- **What to test**: Pure value objects, utility functions, isolated operations
- **Characteristics**: No database, no external dependencies, fast execution
- **Example**: Email validation, Password strength calculation
- **When to write**: For pure functions that don't require external resources

**Integration Tests** (`tests/integration/`):

- **What to test**: Complete workflows with real database operations
- **Characteristics**: Uses testcontainers, tests end-to-end business logic
- **Example**: Full createUser workflow including validation, hashing, and database persistence
- **When to write**: For workflows that orchestrate multiple operations and database access

**Handler Tests** (Future):

- **What to test**: HTTP layer with request/response handling
- **Characteristics**: Uses supertest, tests routing and validation middleware
- **Example**: POST /api/v1/users with authentication
- **When to write**: For testing the HTTP API layer separately from business logic

### Testing with Result System

All tests work with the `Result<T>` type and use the `run()` interpreter:

```typescript
import { run } from "#lib/result/index";
import { createUser } from "#core/users/create-user.workflow";

// Always await run() to execute Result effects
const result = await run(createUser(input));

// Use type narrowing to safely access result values
if (result.status === "Success") {
  expect(result.value.email).toBe("test@example.com");
  // TypeScript knows result.value exists here
} else if (result.status === "Failure") {
  expect(result.error.code).toBe("USER_EMAIL_ALREADY_EXISTS");
  // TypeScript knows result.error exists here
}
```

**Testing Patterns**:

1. **Always use `run()`**: Convert Result to Promise for testing
2. **Check status first**: Use `result.status` before accessing value/error
3. **Type narrowing**: Let TypeScript narrow types after status check
4. **Test both paths**: Write tests for Success and Failure scenarios
5. **Descriptive names**: Use "should..." pattern for test descriptions

### Integration Testing with Testcontainers

Integration tests use PostgreSQL testcontainers for isolated, reproducible testing:

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
    // Your test here
  });
});
```

**Testcontainer Lifecycle**:

1. **beforeAll**: Starts PostgreSQL 18 container, runs migrations (shared across tests)
2. **beforeEach**: Truncates all tables with CASCADE (ensures test isolation)
3. **Test Execution**: All tests share the same container (parallel execution)
4. **afterAll**: Stops container and cleans up resources

**Benefits**:

- **Real Database**: Tests against actual PostgreSQL, not mocks or SQLite
- **Isolation**: Each test starts with clean database state
- **Parallel Execution**: Shared container makes tests fast
- **No Manual Setup**: Docker handles everything automatically
- **Consistent Environment**: Same PostgreSQL version as production (18-alpine)

### Database Cleanup Strategy

The project uses `TRUNCATE CASCADE` for database cleanup between tests:

```typescript
// tests/helpers/database.ts
export async function cleanupDatabase(db) {
  const tables = ["users"]; // Add tables as schema grows
  for (const table of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
  }
}
```

**Why TRUNCATE CASCADE**:

- **Fast**: Faster than DELETE for removing all rows
- **Handles Foreign Keys**: CASCADE automatically handles dependent data
- **Resets Sequences**: Optional - can reset AUTO_INCREMENT if needed
- **Simple**: One command per table, no ordering required

**When to Update**:

- Add new tables to the `tables` array as you expand the schema
- Keep the list in dependency order if not using CASCADE

### Coverage Configuration

Coverage is configured in `vitest.config.js`:

```javascript
coverage: {
  provider: "v8",                    // Fast native Node.js coverage
  reporter: ["text", "lcov"],        // Console output + lcov for IDEs
  include: ["src/core/**/*.ts"],     // Only measure business logic
  exclude: ["src/core/**/*.test.ts"], // Exclude test files
  thresholds: {
    lines: 35,                        // Warn if < 35% lines covered
    functions: 35,
    branches: 35,
    statements: 35,
    autoUpdate: false,
  },
  all: false,                         // Warn only, don't fail build
}
```

**Coverage Scope**:

- **Included**: `src/core/**/*.ts` (business logic only)
- **Excluded**: Infrastructure, routes, config, tests
- **Rationale**: Focus on testing the functional core, not framework code

**Coverage Expectations**:

- **35% Threshold**: Template starts with minimal examples, thresholds are low
- **Warn Only**: Coverage warnings don't fail builds (encourages testing without blocking)
- **Increase Over Time**: As you add tests, gradually increase thresholds
- **Business Logic Focus**: Only core domain logic counts toward coverage

**Running Coverage**:

```bash
npm run test:coverage           # Generate coverage report
# Output: coverage/lcov.info    # For IDE integration
# Output: Terminal summary      # Quick coverage overview
```

### Test Helper Utilities

The project provides reusable test helpers in `tests/helpers/database.ts`:

**Available Functions**:

```typescript
// Setup PostgreSQL testcontainer and run migrations
setupTestDatabase(): Promise<string>

// Create Drizzle database instance for testing
createTestDb(connectionString: string): Database

// Get the shared test database instance
getTestDb(): Database

// Cleanup database (truncate all tables)
cleanupDatabase(db: Database): Promise<void>

// Teardown testcontainer and close connections
teardownTestDatabase(): Promise<void>

// Get test database connection string
getTestConnectionString(): string
```

**Usage Pattern**:

1. Call `setupTestDatabase()` in `beforeAll` (starts container, runs migrations)
2. Call `createTestDb()` in `beforeAll` (creates shared db instance)
3. Call `cleanupDatabase()` in `beforeEach` (cleans data between tests)
4. Use `getTestDb()` in tests (access shared db instance)
5. Call `teardownTestDatabase()` in `afterAll` (cleanup resources)

### Testing Conventions

**File Organization**:

- Unit tests: `tests/value-objects/*.test.ts`
- Integration tests: `tests/integration/*.test.ts`
- Helpers: `tests/helpers/*.ts`
- Name pattern: `*.test.ts` (Vitest auto-discovers)

**Import Patterns**:

```typescript
// Use # aliases for clean imports
import { Email } from "#core/users/value-objects/Email";
import { createUser } from "#core/users/create-user.workflow";
import { run } from "#lib/result/index";
import { getTestDb } from "../helpers/database";
```

**Test Structure (AAA Pattern)**:

```typescript
it("should create user successfully", async () => {
  // Arrange: Setup test data
  const input = { email: "test@example.com", password: "pass123" };

  // Act: Execute the operation
  const result = await run(createUser(input));

  // Assert: Verify the outcome
  expect(result.status).toBe("Success");
  if (result.status === "Success") {
    expect(result.value.email).toBe("test@example.com");
  }
});
```

**Error Testing Pattern**:

```typescript
it("should fail with invalid email", async () => {
  const input = { email: "not-an-email", password: "pass123" };

  const result = await run(createUser(input));

  expect(result.status).toBe("Failure");
  if (result.status === "Failure") {
    expect(result.error.code).toBe("USER_INVALID_EMAIL");
    expect(result.error.message).toBe("Invalid email format");
  }
});
```

**Database Verification Pattern**:

```typescript
it("should persist user in database", async () => {
  const input = { email: "test@example.com", password: "pass123" };

  const result = await run(createUser(input));

  // Verify in database
  const db = getTestDb();
  const users = await db.query.users.findMany({
    where: (users, { eq }) => eq(users.email, "test@example.com"),
  });

  expect(users).toHaveLength(1);
  expect(users[0].email).toBe("test@example.com");
});
```

### Common Testing Issues and Solutions

**Issue: "Test database not initialized"**

- **Cause**: `getTestDb()` called before `setupTestDatabase()`
- **Solution**: Ensure `setupTestDatabase()` runs in `beforeAll` before any tests

**Issue: "Container startup timeout"**

- **Cause**: Docker not running or slow network
- **Solution**: Increase timeout in `beforeAll` to 60000ms (60 seconds)

**Issue: "Tests fail with duplicate key errors"**

- **Cause**: Database not cleaned between tests
- **Solution**: Add `cleanupDatabase()` call in `beforeEach`

**Issue: "Cannot find table 'users'"**

- **Cause**: Migrations not run or wrong connection string
- **Solution**: Verify `runMigrations()` is called in `setupTestDatabase()`

**Issue: "Tests work locally but fail in CI"**

- **Cause**: Docker not available in CI environment
- **Solution**: Ensure CI has Docker installed and running

### Example Test Files

**Unit Test Example**: `tests/value-objects/Email.test.ts`

- Tests pure Email validation logic
- No database required
- Fast execution (< 1ms per test)

**Integration Test Example**: `tests/integration/create-user.test.ts`

- Tests complete createUser workflow
- Uses real PostgreSQL database
- Tests validation, hashing, persistence, error handling
- Verifies database state after operations

**Helper Utilities**: `tests/helpers/database.ts`

- Testcontainer setup and teardown
- Database cleanup utilities
- Shared database instance management
- Migration execution

## API Documentation

### Auto-Generated OpenAPI Specification

The OpenAPI spec is **automatically generated** from Zod schemas using `@asteasolutions/zod-to-openapi`. This ensures the documentation always stays in sync with the code.

**Modular Architecture**: The OpenAPI generation uses a modular structure with separate files for:

- **Registry** (`src/openapi/registry.ts`) - Central OpenAPI registry and security schemes
- **Common Schemas** (`src/openapi/schemas.ts`) - Reusable response wrappers and error schemas
- **Path Registrations** (`src/openapi/paths/`) - Separate file for each domain/route
- **Generation Script** (`src/openapi/generate.ts`) - Orchestrates the spec generation

**File Structure**:

```
src/
├── openapi/
│   ├── generate.ts          # Generation script
│   ├── registry.ts          # Central OpenAPI registry
│   ├── schemas.ts           # Common response/error schemas
│   └── paths/               # Path registrations by domain
│       ├── health.ts        # Health endpoint
│       ├── hello.ts         # Hello endpoint
│       └── users.ts         # User endpoints
└── routes/
    └── [domain]/
        └── schemas.ts       # Zod schemas with OpenAPI metadata
```

**Generation Process**:

1. Define Zod schemas in `routes/[domain]/schemas.ts` with `.openapi()` metadata
2. Create path registration in `src/openapi/paths/[domain].ts`
3. Run `npm run generate:openapi` to generate `_docs/openapi.json`
4. Spec auto-generates before `npm run dev` and `npm run build`

**Accessing Documentation**:

- OpenAPI JSON: `http://localhost:3000/docs/openapi.json`
- Swagger UI: `http://localhost:3000/swagger` (interactive documentation)
- Health Check: `http://localhost:3000/health`

### Adding Endpoints to OpenAPI

When adding new routes, follow these steps:

#### 1. Define Zod Schemas with OpenAPI Metadata

In `routes/domain/schemas.ts`:

```typescript
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const createBodySchema = z
  .object({
    email: z.string().email().openapi({ example: "user@example.com" }),
    name: z.string().min(1).openapi({ example: "John Doe" }),
  })
  .openapi("CreateBody");

export const createResponseSchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 1 }),
    email: z.string().email().openapi({ example: "user@example.com" }),
    name: z.string().openapi({ example: "John Doe" }),
  })
  .openapi("CreateResponse");
```

#### 2. Create Path Registration File

Create `src/openapi/paths/domain.ts`:

```typescript
import { createBodySchema, createResponseSchema } from "#routes/domain/schemas";
import { registry } from "../registry.js";
import { commonErrorResponses, successResponseSchema } from "../schemas.js";

/**
 * POST /api/v1/domain
 * Create a new entity
 */
registry.registerPath({
  method: "post",
  path: "/api/v1/domain",
  summary: "Create entity",
  description: "Create a new entity with the provided data",
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

**For protected endpoints**, add security:

```typescript
registry.registerPath({
  method: "get",
  path: "/api/v1/domain/{id}",
  security: [{ BearerAuth: [] }], // Requires JWT token
  // ... rest of config
});
```

#### 3. Import Path Registration in Generation Script

Add to `src/openapi/generate.ts`:

```typescript
// Import all path registrations
import "./paths/health.js";
import "./paths/hello.js";
import "./paths/users.js";
import "./paths/domain.js"; // Add your new path file
```

#### 4. Regenerate OpenAPI Spec

```bash
npm run generate:openapi
```

The spec is auto-generated and served via Swagger UI.

### Common Schema Utilities

The `src/openapi/schemas.ts` file provides reusable utilities:

#### Success Response Wrapper

Wraps data in standard `AppResponse<T>` success format:

```typescript
import { successResponseSchema } from "../schemas.js";

// Wrap your response schema
schema: successResponseSchema(userDataSchema);

// Generates:
// {
//   success: true,
//   data: { ...userData },
//   traceId: "...",
//   error: null,
//   message: null,
//   meta: null
// }
```

#### Paginated Response Wrapper

For paginated list endpoints:

```typescript
import { paginatedSuccessResponseSchema } from "../schemas.js";

// Wrap array schema
schema: paginatedSuccessResponseSchema(userSchema);

// Generates:
// {
//   success: true,
//   data: [...users],
//   meta: {
//     pagination: { page: 1, size: 10, total: 100 },
//     cursor: null
//   },
//   traceId: "...",
//   error: null,
//   message: null
// }
```

#### Common Error Responses

Reusable error responses for standard HTTP status codes:

```typescript
import { commonErrorResponses } from "../schemas.js";

responses: {
  200: { /* success response */ },
  400: commonErrorResponses[400],  // Validation Error
  401: commonErrorResponses[401],  // Unauthorized
  403: commonErrorResponses[403],  // Forbidden
  404: commonErrorResponses[404],  // Not Found
  409: commonErrorResponses[409],  // Conflict
  500: commonErrorResponses[500],  // Internal Error
}
```

All error responses match the `AppError` type from `lib/result/types/errors.ts`.

### OpenAPI Best Practices

1. **One path file per domain** - Keep registrations organized by business domain
2. **Use common schemas** - Leverage `successResponseSchema()` and `commonErrorResponses`
3. **Add examples** - Use `.openapi({ example: "value" })` for better docs
4. **Document all responses** - Include success and all possible error responses
5. **Import from routes** - Path files import schemas from `#routes/[domain]/schemas`
6. **Match AppResponse** - All response schemas must match the `AppResponse<T>` format
