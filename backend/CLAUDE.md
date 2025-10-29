# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Start dev server with file watching and .env file
npm run dev:docker       # Start dev server for Docker (no .env file)

# Building
npm run build            # Compile TypeScript to dist/
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
```

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
├── shared/                  # Shared utilities
│   ├── effect/              # Custom Effect system (functional programming)
│   └── types/               # Shared type definitions
└── db/                      # Database schemas and client
```

### Key Design Patterns

1. **Custom Effect System**: Lightweight functional programming system for composable operations with automatic observability
2. **Repository Pattern**: Factory functions for testable data access
3. **Value Objects**: Opaque branded types for type-safe domain primitives
4. **Railway-Oriented Programming**: Explicit success/failure paths via Effect type
5. **Dependency Injection**: Via function parameters and factory functions
6. **Layered HTTP Handler**: validate → handleEffect → workflow → operations → repository

## Custom Effect System

The codebase uses a **custom Effect system** (inspired by Effect-TS/fp-ts) for managing side effects with full observability.

### Effect Type

```typescript
type Effect<T> = Success<T> | Failure | CommandEffect<T>
```

- **Success**: Contains a successful result value
- **Failure**: Contains a typed error (AppError)
- **CommandEffect**: Represents a side effect (async operation) with continuation

### Effect Patterns

#### 1. Workflow Orchestration (Railway-Oriented Programming)

Workflows in `*.workflow.ts` compose operations using `pipe()`:

```typescript
export function login(body: LoginBody): Effect<LoginResult> {
  return pipe(
    validateLogin(body),    // Effect<LoginInput>
    findUserByEmail,        // Effect<{ input, user }>
    verifyPassword,         // Effect<LoginResult>
    addAuthToken           // Effect<LoginResult>
  );
}
```

Each step receives the previous step's output. If any step returns `Failure`, execution stops and the failure propagates.

#### 2. CommandEffect for Side Effects

Operations in `*.operations.ts` use `commandEffect()` for async operations:

```typescript
export function findUserByEmail(input: LoginInput): Effect<{ input, user }> {
  return commandEffect(
    async () => {
      const users = await userRepository.findByEmail(input.email);
      return first(users);
    },
    (user) => user ? success({ input, user }) : failure({
      code: "UNAUTHORIZED",
      message: "Invalid email or password"
    }),
    {
      operation: "findUserByEmail",
      tags: { domain: "users", action: "read" }
    }
  );
}
```

**CommandEffect automatically provides**:
- OpenTelemetry span creation
- Prometheus metrics recording
- Pino logging with correlation IDs
- Error tracking

#### 3. Combinators

```typescript
// Sequential composition (output becomes input to next function)
pipe(effect1, effect2, effect3)

// Parallel composition
allNamed({ email: Email.create(email), password: Password.create(password) })
allConcurrent([query1, query2, query3])

// Transformation
map((user) => ({ id: user.id, email: user.email }))

// Conditional logic
filter((user) => user.isActive, (user) => failure({
  code: "FORBIDDEN",
  message: `User ${user.id} is inactive`
}))

// Side effects without transformation
tap((post) => logger.info({ postId: post.id }, "Post created"))

// Pattern matching
match(result, {
  onSuccess: (value) => value,
  onFailure: (error) => { throw error; }
})
```

#### 4. Effect Execution

Handlers execute effects using `runEffect()`:

```typescript
export async function handleLogin(req: Request) {
  const body = req.body as LoginBody;
  return await runEffect(login(body));
}
```

The `handleEffect` middleware:
- Executes the effect returned by the handler
- Maps `Success` to 200/201 HTTP responses
- Maps `Failure` to appropriate HTTP error status codes
- Automatically formats responses using `successResponse()` and `errorResponse()`

### Value Objects

Domain primitives are implemented as opaque branded types in `value-objects/`:

```typescript
// Email.ts
export type Email = string & { readonly __brand: unique symbol };

export const Email = {
  create: (value: string): Effect<Email> => { /* validation */ },
  domain: (email: Email): string => { /* extract domain */ },
  toString: (email: Email): string => email as string
};

// Usage
const emailEffect = Email.create("user@example.com"); // Effect<Email>
```

Benefits:
- Type safety: Can't pass raw strings where Email is expected
- Validation happens at creation time
- Self-documenting API

## Repository Pattern

Repositories use **factory functions** for dependency injection and testing.

### Repository Structure

```typescript
// src/infrastructure/repositories/drizzle/UserRepository.ts
export function createUserRepository(dbInstance: typeof db) {
  return {
    findById: (id: number) => { /* ... */ },
    findByEmail: (email: string) => { /* ... */ },
    create: (data: NewUser) => { /* ... */ },
    update: (id: number, data: Partial<NewUser>) => { /* ... */ },
    delete: (id: number) => { /* ... */ },
    withTransaction: (tx: unknown) => createUserRepository(tx as typeof db)
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
  updatedAt: timestamp("updated_at").defaultNow().notNull()
    .$onUpdate(() => new Date())
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

## HTTP Layer

### Adding New Routes

1. **Create domain folder**: `src/routes/[domain]/`

2. **Define Zod schemas** (`schemas.ts`):
```typescript
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const createBodySchema = z.object({
  field: z.string().openapi({ example: "value" })
}).openapi("CreateBody");
```

3. **Create handlers** (`handlers.ts`):
```typescript
export async function handleCreate(req: Request) {
  const body = req.body as CreateBody;
  return await runEffect(createWorkflow(body));
}
```

4. **Define routes** (`routes.ts`):
```typescript
import { validate } from "#middlewares/validate";
import { handleEffect } from "#middlewares/handleEffect";

router.post("/create",
  validate(createBodySchema),
  handleEffect(handleCreate)
);
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
  ↓
handleEffect() middleware
  ↓
Handler Function (calls workflow)
  ↓
Workflow (orchestrates operations)
  ↓
Operations (business logic)
  ↓
Repository (database access)
  ↓
Response (formatted by handleEffect)
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

### Metrics (Prometheus)

Metrics are automatically collected for:
- HTTP requests (count, duration, response size)
- Effect executions (count, duration, errors)
- Database queries (count, duration)
- Business events (users_registered_total, etc.)

Access metrics: `GET /metrics`

### Tracing (OpenTelemetry)

Distributed tracing is automatically enabled for:
- HTTP requests (via auto-instrumentation)
- Database queries (via Drizzle instrumentation)
- Effect operations (via CommandEffect metadata)

Configure via environment variables:
```
ENABLE_TRACING=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_SERVICE_NAME=backend
```

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
   - Define schemas in `schemas.ts`
   - Implement handlers in `handlers.ts`
   - Define routes in `routes.ts`
6. **Register routes** in `src/routes/index.ts`
7. **Update OpenAPI spec** in `_docs/openapi.json`

## Testing Strategy

Tests are written using Vitest and should follow these patterns:

### Unit Tests (Operations)
- Test pure functions in `*.operations.ts`
- Mock repositories using factory functions
- Test both success and failure paths

### Integration Tests (Workflows)
- Test complete workflows with real database (test container)
- Verify Effect composition works correctly
- Test error handling and edge cases

### Handler Tests
- Test HTTP layer with supertest
- Verify request validation
- Test authentication/authorization

## API Documentation

- OpenAPI spec: `_docs/openapi.json`
- Swagger UI: `http://localhost:3000/swagger`
- OpenAPI endpoint: `http://localhost:3000/docs/openapi.json`

Schemas are defined using `@asteasolutions/zod-to-openapi` to auto-generate OpenAPI specs from Zod schemas.
