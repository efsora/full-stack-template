# Full-Stack Template

A production-ready full-stack application template with type-safe inter-service communication, implementing modern software engineering best practices.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Makefile Commands](#makefile-commands)
- [Type Safety Implementation](#type-safety-implementation)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Database](#database)
- [API Documentation](#api-documentation)
- [Docker Deployment](#docker-deployment)
- [Environment Configuration](#environment-configuration)

---

## Overview

This is a modern full-stack application template featuring:

- **End-to-end Type Safety**: Automatically generated types across all services
- **Microservices Architecture**: Separate backend, frontend, and AI services
- **Docker-First Development**: Complete containerized development environment
- **Production-Ready**: Observability, testing, and security best practices
- **Functional Core, Imperative Shell**: Clean architecture with custom Effect system

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docker Network                          │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │ Frontend │───▶│ Backend  │───▶│   AI     │    │ Weaviate │ │
│  │  React   │    │  Express │    │ FastAPI  │◀──▶│  Vector  │ │
│  │  :5173   │    │   :3000  │    │  :8000   │    │  :8080   │ │
│  └──────────┘    └────┬─────┘    └────┬─────┘    └──────────┘ │
│                       │               │                         │
│                       └───────┬───────┘                         │
│                               ▼                                 │
│                       ┌──────────────┐                          │
│                       │  PostgreSQL  │                          │
│                       │    :5432     │                          │
│                       └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### Type Safety Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    Phase 1: Frontend ↔ Backend                 │
└────────────────────────────────────────────────────────────────┘
Backend (Zod schemas)
    ↓
npm run generate:openapi
    ↓
backend/_docs/openapi.json
    ↓
openapi-typescript
    ↓
frontend/schema.d.ts (TypeScript types)
    ↓
Frontend uses type-safe API calls

┌────────────────────────────────────────────────────────────────┐
│                   Phase 2: Backend ↔ AI Service                │
└────────────────────────────────────────────────────────────────┘
AI Service (FastAPI/Pydantic)
    ↓
http://localhost:8000/openapi.json
    ↓
openapi-typescript
    ↓
backend/src/generated/ai-service.d.ts
    ↓
Backend uses type-safe AI service client
```

---

## Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript 5.9
- **Build Tool**: Vite 7
- **Routing**: React Router v7
- **State Management**: Zustand 5 + TanStack Query 5
- **Forms**: React Hook Form + Zod validation
- **Styling**: TailwindCSS 4
- **HTTP Client**: Axios (type-safe with generated types)

### Backend
- **Runtime**: Node.js 22 + TypeScript 5.9
- **Framework**: Express 5
- **Database**: PostgreSQL 18 + Drizzle ORM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod 4 with OpenAPI generation
- **Observability**:
  - Logging: Pino with structured logging
  - Metrics: Prometheus client
  - Tracing: OpenTelemetry
- **Testing**: Vitest 4 + Testcontainers

### AI Service
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 18 + SQLAlchemy (async)
- **Vector Database**: Weaviate 1.33.2
- **Package Manager**: uv
- **Testing**: pytest + pytest-asyncio

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 18 Alpine
- **Web Server**: Nginx (for frontend)
- **Networking**: Docker bridge network

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 22+ (for local development)
- Python 3.11+ (for AI service local development)
- Make (for running Makefile commands)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd full-stack-template
   ```

2. **Start all services**
   ```bash
   make full-stack-up
   ```

   This will start:
   - PostgreSQL (port 5432)
   - Weaviate (port 8080)
   - Backend API (port 3000)
   - Frontend (port 5173)
   - AI Service (port 8000)

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Backend Swagger: http://localhost:3000/swagger
   - AI Service: http://localhost:8000
   - AI Service Docs: http://localhost:8000/docs
   - Weaviate: http://localhost:8080

4. **Stop services**
   ```bash
   make full-stack-down
   ```

### Local Development Setup

For development without Docker:

1. **Install dependencies**
   ```bash
   make install-all
   ```

2. **Start PostgreSQL and Weaviate**
   ```bash
   docker compose up -d postgres weaviate
   ```

3. **Run services individually**
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd frontend
   npm run dev

   # AI Service
   cd ai-service
   uv run uvicorn app.main:app --reload
   ```

---

## Makefile Commands

The root Makefile provides comprehensive commands for managing the full-stack application.

### 🚀 Main Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands with descriptions |
| `make full-stack-up` | Start all services (postgres, weaviate, backend, frontend, ai-service) |
| `make full-stack-down` | Stop all services |
| `make full-stack-restart` | Restart all services |
| `make full-stack-rebuild` | Rebuild and restart all services |
| `make status` | Show status of all Docker services |
| `make health` | Check health of all services (HTTP endpoints) |

### 📊 Logging Commands

| Command | Description |
|---------|-------------|
| `make full-stack-logs` | View logs from all services (follows) |
| `make full-stack-logs-backend` | View backend logs only |
| `make full-stack-logs-frontend` | View frontend logs only |
| `make full-stack-logs-ai` | View AI service logs only |

### 🧪 Testing Commands

| Command | Description |
|---------|-------------|
| `make backend-test` | Run backend tests with PostgreSQL |
| `make backend-test-coverage` | Run backend tests with coverage report |
| `make ai-test` | Run AI service tests with PostgreSQL |
| `make ai-test-coverage` | Run AI service tests with coverage |
| `make test-all` | Run all tests (backend + AI service) |

### 🔧 Type Generation Commands

| Command | Description |
|---------|-------------|
| `make generate-backend-types` | Generate frontend types from backend OpenAPI |
| `make generate-ai-types` | Generate backend types from AI service OpenAPI |
| `make generate-all-types` | Generate all types (frontend from backend, backend from AI) |

**Type Generation Flow:**

1. **Frontend Types** (`make generate-backend-types`):
   - Backend generates OpenAPI spec from Zod schemas → `backend/_docs/openapi.json`
   - Frontend generates TypeScript types → `frontend/schema.d.ts`
   - Frontend uses types for type-safe API calls

2. **Backend Types** (`make generate-ai-types`):
   - Starts AI service to expose OpenAPI endpoint
   - Generates TypeScript types → `backend/src/generated/ai-service.d.ts`
   - Backend uses types for type-safe AI service communication

### 🗃️ Database Commands

| Command | Description |
|---------|-------------|
| `make db-migrate-backend` | Run backend database migrations (Drizzle) |
| `make db-migrate-ai` | Run AI service database migrations (Alembic) |
| `make db-migrate-all` | Run all database migrations |
| `make db-shell-backend` | Open PostgreSQL shell for backend database |
| `make db-shell-main` | Open PostgreSQL shell for main database |

**Database Details:**

- **Backend Database**: `backend_db` (user: `backend_user`, password: `backend_password`)
- **Main Database**: `app_db` (user: `postgres`, password: `postgres`)
- **Connection**: `localhost:5432` (SSL mode: disable/prefer)

### 🐚 Shell Access Commands

| Command | Description |
|---------|-------------|
| `make backend-shell` | Open shell in backend container |
| `make ai-shell` | Open shell in AI service container |
| `make frontend-shell` | Open shell in frontend container |
| `make postgres-shell` | Open PostgreSQL shell (main database) |

### 📦 Installation Commands

| Command | Description |
|---------|-------------|
| `make install-backend` | Install backend dependencies (npm) |
| `make install-frontend` | Install frontend dependencies (npm) |
| `make install-ai` | Install AI service dependencies (uv) |
| `make install-all` | Install all dependencies |

### 🧹 Cleanup Commands

| Command | Description |
|---------|-------------|
| `make full-stack-clean` | Stop services and remove volumes ⚠️ Deletes all data |
| `make clean-node-modules` | Remove all node_modules directories |
| `make clean-build` | Remove all build artifacts |
| `make clean-all` | Deep clean (removes everything) |

**⚠️ Warning**: `make full-stack-clean` will permanently delete all data in Docker volumes (databases, vector data). This action cannot be undone.

---

## Type Safety Implementation

This project implements **end-to-end type safety** without using a shared types folder, following **Strategy A: Code-First Approach**.

### Phase 1: Frontend ↔ Backend

**Implementation:**

1. Backend defines API schemas using Zod with OpenAPI metadata
2. Backend auto-generates OpenAPI spec (`backend/_docs/openapi.json`)
3. Frontend generates TypeScript types from OpenAPI spec
4. Frontend uses generated types for API calls

**Example:**

```typescript
// Backend: routes/users/schemas.ts
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6)
}).openapi('CreateUser');

// Generated: frontend/schema.d.ts
export interface components {
  schemas: {
    CreateUser: {
      email: string;
      name: string;
      password: string;
    }
  }
}

// Frontend: Type-safe API call
import type { components } from './schema';

type CreateUserBody = components['schemas']['CreateUser'];

const createUser = async (body: CreateUserBody) => {
  return axios.post<AppResponse<User>>('/api/v1/users', body);
};
```

**Regenerate Types:**
```bash
make generate-backend-types
```

### Phase 2: Backend ↔ AI Service

**Implementation:**

1. AI Service exposes FastAPI OpenAPI endpoint (`http://localhost:8000/openapi.json`)
2. Backend generates TypeScript types from AI Service OpenAPI
3. Backend uses type-safe axios client for AI service communication

**Example:**

```typescript
// Generated: backend/src/generated/ai-service.d.ts
export interface paths {
  '/api/v1/hello': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': {
              message: string;
            }
          }
        }
      }
    }
  }
}

// Backend: Type-safe AI client
import type { paths, components } from '#generated/ai-service';

class AIServiceClient {
  async hello(): Promise<AIServiceResponse<HelloResponse>> {
    const response = await this.client.get<paths['/api/v1/hello']['get']['responses'][200]['content']['application/json']>('/api/v1/hello');
    return response.data;
  }

  async embedText(data: components['schemas']['EmbedRequest']): Promise<EmbedResponse> {
    return this.client.post('/api/v1/weaviate/embed', data);
  }
}
```

**Regenerate Types:**
```bash
make generate-ai-types
```

### Universal Response Format

All API responses use the `AppResponse<T>` format:

```typescript
// Success Response
{
  success: true,
  data: T,
  traceId: string,
  message?: string | null,
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

**AppError Types:**
- `VALIDATION_ERROR`: Input validation failed (400)
- `UNAUTHORIZED`: Authentication required (401)
- `FORBIDDEN`: Permission denied (403)
- `NOT_FOUND`: Resource not found (404)
- `CONFLICT`: Resource already exists (409)
- `INTERNAL_ERROR`: Server error (500)

---

## Project Structure

```
full-stack-template/
├── backend/                      # Express + TypeScript Backend
│   ├── src/
│   │   ├── core/                 # Functional Core (Business Logic)
│   │   │   └── users/            # Domain modules
│   │   │       ├── *.workflow.ts # Orchestration layer
│   │   │       ├── *.operations.ts # Pure business operations
│   │   │       ├── value-objects/ # Domain primitives
│   │   │       └── types/        # Domain types
│   │   ├── infrastructure/       # Imperative Shell (Technical)
│   │   │   ├── auth/             # JWT authentication
│   │   │   ├── config/           # Environment config
│   │   │   ├── logger/           # Pino logger
│   │   │   ├── metrics/          # Prometheus metrics
│   │   │   ├── tracing/          # OpenTelemetry
│   │   │   ├── ai-service/       # AI service client (Phase 2)
│   │   │   └── repositories/     # Data access layer
│   │   ├── routes/               # HTTP layer (Express routes)
│   │   │   ├── users/            # User routes
│   │   │   │   ├── routes.ts     # Route definitions
│   │   │   │   ├── handlers.ts   # Request handlers
│   │   │   │   └── schemas.ts    # Zod validation schemas
│   │   │   └── ai-demo/          # AI demo routes (Phase 2)
│   │   ├── middlewares/          # Express middleware
│   │   ├── lib/                  # Library modules
│   │   │   ├── effect/           # Custom Effect system
│   │   │   └── types/            # Shared type definitions
│   │   ├── db/                   # Database schemas
│   │   ├── openapi/              # OpenAPI generation
│   │   │   ├── registry.ts       # OpenAPI registry
│   │   │   ├── schemas.ts        # Common schemas
│   │   │   └── paths/            # Path registrations
│   │   └── generated/            # Generated types (Phase 2)
│   │       └── ai-service.d.ts   # AI service types
│   ├── tests/                    # Test files
│   ├── _docs/                    # Generated OpenAPI spec
│   │   └── openapi.json          # Auto-generated
│   └── docker/                   # Docker configuration
│
├── frontend/                     # React + TypeScript Frontend
│   ├── src/
│   │   ├── api/                  # API client layer
│   │   │   ├── client/           # Axios instance
│   │   │   ├── types/            # API types
│   │   │   ├── hooks/            # TanStack Query hooks
│   │   │   └── schemas/          # Zod schemas
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── routes/               # React Router config
│   │   └── stores/               # Zustand stores
│   ├── schema.d.ts               # Generated backend types (Phase 1)
│   ├── nginx.conf                # Nginx configuration
│   └── Dockerfile                # Production build
│
├── ai-service/                   # FastAPI + Python AI Service
│   ├── src/
│   │   └── app/
│   │       ├── api/              # API routes
│   │       │   └── v1/           # API v1
│   │       │       ├── hello.py  # Health endpoint
│   │       │       └── weaviate.py # Vector operations
│   │       ├── core/             # Business logic
│   │       ├── infrastructure/   # Database, Weaviate
│   │       └── main.py           # FastAPI app
│   ├── tests/                    # Test files
│   └── Makefile                  # AI service commands
│
├── scripts/                      # Utility scripts
│   ├── init-db.sql               # Database initialization
│   └── check-users.sh            # Database utilities
│
├── docker-compose.yml            # Docker Compose configuration
├── Makefile                      # Root Makefile (main commands)
└── README.md                     # This file
```

---

## Development Workflow

### Adding a New Feature

1. **Backend: Define Schema**
   ```typescript
   // backend/src/routes/domain/schemas.ts
   export const createSchema = z.object({
     field: z.string()
   }).openapi('CreateBody');
   ```

2. **Backend: Create Workflow**
   ```typescript
   // backend/src/core/domain/create.workflow.ts
   export function create(input: CreateInput): Effect<CreateResult> {
     return pipe(
       validateInput(input),
       performOperation,
       saveToDatabase
     );
   }
   ```

3. **Backend: Create Handler**
   ```typescript
   // backend/src/routes/domain/handlers.ts
   export async function handleCreate(req: ValidatedRequest<{body: CreateBody}>): Promise<AppResponse<CreateResult>> {
     const result = await run(create(req.validated.body));
     return matchResponse(result, {
       onSuccess: (data) => createSuccessResponse(data),
       onFailure: (error) => createFailureResponse(error)
     });
   }
   ```

4. **Backend: Register Route**
   ```typescript
   // backend/src/routes/domain/routes.ts
   router.post('/create', validate(createSchema), handleResult(handleCreate));
   ```

5. **Backend: Register OpenAPI Path**
   ```typescript
   // backend/src/openapi/paths/domain.ts
   registry.registerPath({ method: 'post', path: '/api/v1/domain', ... });
   ```

6. **Generate Types**
   ```bash
   make generate-backend-types
   ```

7. **Frontend: Use Type-Safe API**
   ```typescript
   // frontend/src/api/hooks/useDomain.ts
   import type { components } from '../../schema';

   type CreateBody = components['schemas']['CreateBody'];

   export const useCreate = () => {
     return useMutation({
       mutationFn: (body: CreateBody) => apiClient.post('/api/v1/domain', body)
     });
   };
   ```

### Integrating with AI Service

1. **AI Service: Define Endpoint**
   ```python
   # ai-service/src/app/api/v1/feature.py
   @router.post("/feature")
   async def process_feature(request: FeatureRequest) -> FeatureResponse:
       # Implementation
   ```

2. **Generate Backend Types**
   ```bash
   make generate-ai-types
   ```

3. **Backend: Create AI Client Method**
   ```typescript
   // backend/src/infrastructure/ai-service/client.ts
   async processFeature(data: components['schemas']['FeatureRequest']): Promise<FeatureResponse> {
     return this.client.post('/api/v1/feature', data);
   }
   ```

4. **Backend: Use in Workflow**
   ```typescript
   // backend/src/core/domain/workflow.ts
   import { aiServiceClient } from '#infrastructure/ai-service';

   const response = await aiServiceClient.processFeature(data);
   ```

---

## Testing

### Backend Testing

**Test Structure:**

```
backend/tests/
├── value-objects/          # Unit tests for value objects
│   └── Email.test.ts
├── integration/            # Integration tests with database
│   └── create-user.test.ts
└── helpers/                # Test utilities
    └── database.ts
```

**Run Tests:**

```bash
# All tests
make backend-test

# With coverage
make backend-test-coverage

# Local (without Docker)
cd backend
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # With coverage
```

**Example Integration Test:**

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, createTestDb, cleanupDatabase, teardownTestDatabase, getTestDb } from '../helpers/database';
import { run } from '#lib/result';
import { createUser } from '#core/users/create-user.workflow';

describe('Create User Workflow', () => {
  beforeAll(async () => {
    const connectionString = await setupTestDatabase();
    createTestDb(connectionString);
  }, 60000);

  beforeEach(async () => {
    await cleanupDatabase(getTestDb());
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should create user successfully', async () => {
    const input = { email: 'test@example.com', password: 'pass123', name: 'Test' };
    const result = await run(createUser(input));

    expect(result.status).toBe('Success');
    if (result.status === 'Success') {
      expect(result.value.email).toBe('test@example.com');
    }
  });
});
```

### AI Service Testing

**Run Tests:**

```bash
# All tests
make ai-test

# With coverage
make ai-test-coverage

# Local
cd ai-service
make test
make test-cov
```

### Test Coverage

- **Target**: 35% minimum (template baseline)
- **Scope**: `src/core/**/*.ts` (business logic only)
- **Reports**: `coverage/lcov.info` and terminal summary

---

## Database

### Connection Details

**Backend Database:**
- Host: `localhost`
- Port: `5432`
- Database: `backend_db`
- User: `backend_user`
- Password: `backend_password`
- SSL Mode: `disable` or `prefer`

**Main Database:**
- Host: `localhost`
- Port: `5432`
- Database: `app_db`
- User: `postgres`
- Password: `postgres`
- SSL Mode: `disable` or `prefer`

### Database Management

```bash
# Open database shells
make db-shell-backend          # Backend database
make db-shell-main             # Main database

# Run migrations
make db-migrate-backend        # Backend migrations (Drizzle)
make db-migrate-ai             # AI migrations (Alembic)
make db-migrate-all            # All migrations

# Local development (Drizzle)
cd backend
npx drizzle-kit generate       # Generate migration
npx drizzle-kit migrate        # Apply migration
npx drizzle-kit push           # Push schema directly (dev only)
npx drizzle-kit studio         # Open Drizzle Studio (GUI)
```

### Schema Definition (Backend)

```typescript
// backend/src/db/schema.ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date())
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

---

## API Documentation

### Swagger UI

Interactive API documentation is available at:

- **Backend**: http://localhost:3000/swagger
- **AI Service**: http://localhost:8000/docs

### OpenAPI Specification

- **Backend**: http://localhost:3000/docs/openapi.json
- **AI Service**: http://localhost:8000/openapi.json

### API Endpoints

**Backend:**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | No |
| GET | `/api/v1/hello` | Hello endpoint | No |
| POST | `/api/v1/users` | Create user | No |
| GET | `/api/v1/users/:id` | Get user by ID | Yes |
| POST | `/api/v1/users/login` | User login | No |
| GET | `/api/v1/ai-demo/hello` | Test AI service | No |
| POST | `/api/v1/ai-demo/embed` | Embed text in Weaviate | No |
| POST | `/api/v1/ai-demo/search` | Search Weaviate | No |

**AI Service:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/hello` | Hello endpoint |
| POST | `/api/v1/weaviate/embed` | Embed text |
| POST | `/api/v1/weaviate/search` | Semantic search |

---

## Docker Deployment

### Services

The `docker-compose.yml` defines 5 services:

1. **postgres**: PostgreSQL 18 Alpine
   - Port: `5432`
   - Volumes: `postgres_data`
   - Health check: `pg_isready`

2. **weaviate**: Weaviate 1.33.2
   - Ports: `8080` (HTTP), `50051` (gRPC)
   - Volumes: `weaviate_data`
   - Health check: `/.well-known/ready`

3. **backend**: Express + TypeScript
   - Port: `3000`
   - Depends on: postgres, ai-service
   - Health check: `/health`

4. **frontend**: React + Nginx
   - Port: `5173`
   - Depends on: backend
   - Nginx proxy: `/api/*` → `backend:3000`

5. **ai-service**: FastAPI + Python
   - Port: `8000`
   - Depends on: postgres, weaviate
   - Health check: `/health`

### Docker Commands

```bash
# Start all services
make full-stack-up
# or
docker compose up -d --build

# Stop all services
make full-stack-down
# or
docker compose down

# View logs
make full-stack-logs
# or
docker compose logs -f

# Rebuild specific service
docker compose up -d --build backend

# Remove everything (including volumes)
make full-stack-clean
# or
docker compose down -v
```

### Docker Networking

All services communicate via the `app-network` bridge network:

- Frontend → Backend: `http://backend:3000`
- Backend → AI Service: `http://ai-service:8000`
- Backend → PostgreSQL: `postgres:5432`
- AI Service → PostgreSQL: `postgres:5432`
- AI Service → Weaviate: `http://weaviate:8080`

---

## Environment Configuration

### Backend Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://backend_user:backend_password@postgres:5432/backend_db

# Authentication
JWT_SECRET=your-secret-key-minimum-32-characters

# AI Service
AI_SERVICE_URL=http://ai-service:8000

# Observability
ENABLE_TRACING=true
TRACING_SAMPLE_RATE=1.0
OTEL_SERVICE_NAME=backend-api
METRICS_ENABLED=true
LOG_LEVEL=debug
LOGGER_PRETTY=true

# Optional: Send traces to external collector
# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

### Frontend Environment Variables

```bash
# API URL (empty for Docker - uses nginx proxy)
VITE_API_URL=http://localhost:3000

# Environment
VITE_NODE_ENV=development
```

### AI Service Environment Variables

```bash
# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=app_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Schemas
AI_SCHEMA=ai_schema
BACKEND_SCHEMA=backend_schema

# Weaviate
WEAVIATE_HOST=weaviate
WEAVIATE_PORT=8080
```

---

## Observability

### Logging

**Backend**: Pino structured logging with automatic request correlation
- Log Level: Configured via `LOG_LEVEL` env var
- Pretty Print: Enabled in development via `LOGGER_PRETTY=true`
- Correlation IDs: Automatic via AsyncLocalStorage
- Security: Automatic sanitization of sensitive fields (passwords, tokens, etc.)

**Log Levels**: `debug`, `info`, `warn`, `error`

### Metrics

**Backend**: Prometheus metrics exposed at `/metrics`

Automatic metrics:
- HTTP requests: count, duration, response size
- Database queries: count, duration
- Custom business metrics: users_registered_total, etc.

### Tracing

**Backend**: OpenTelemetry distributed tracing

**Configuration:**
- `ENABLE_TRACING=true`: Enable tracing
- `OTEL_SERVICE_NAME=backend-api`: Service name in traces
- `OTEL_EXPORTER_OTLP_ENDPOINT` (optional): External collector endpoint

**Behavior:**
- **Without OTLP endpoint**: Traces logged to console via `ConsoleSpanExporter`
- **With OTLP endpoint**: Traces exported to Jaeger/Tempo/etc.

**Auto-instrumented:**
- HTTP requests
- Database queries (Drizzle)
- Custom operations (via Command metadata)

---

## Contributing

### Code Quality

```bash
# Linting
cd backend && npm run lint
cd frontend && npm run lint

# Formatting
cd backend && npm run format
cd frontend && npm run format

# Type Checking
cd backend && npm run type-check
cd frontend && npm run type-check
```

### Architecture Principles

1. **Functional Core, Imperative Shell**: Business logic in `core/`, infrastructure in `infrastructure/`
2. **Type Safety**: End-to-end types via code generation
3. **Effect System**: Composable operations with automatic observability
4. **Railway-Oriented Programming**: Explicit success/failure paths
5. **Repository Pattern**: Factory functions for testability
6. **Value Objects**: Opaque branded types for domain primitives
7. **Barrel Exports**: Public APIs via `index.ts` (enforced by ESLint)

---
