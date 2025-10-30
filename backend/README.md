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
# Start all services (backend, postgres, weaviate, otel-collector)
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
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
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
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Generate coverage report

# Database
npx drizzle-kit generate # Generate migration files
npx drizzle-kit migrate  # Run migrations
npx drizzle-kit push     # Push schema (dev only)
npx drizzle-kit studio   # Open database GUI

# Documentation
npm run generate:openapi # Generate OpenAPI spec (auto-runs with dev/build)
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

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | No |
| GET | `/api/v1/hello` | Test endpoint | No |
| POST | `/api/v1/users` | Create user | No |
| GET | `/api/v1/users/:id` | Get user by ID | Yes |
| POST | `/api/auth/register` | Register user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/metrics` | Prometheus metrics | No |

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment | `development` | Yes |
| `PORT` | Server port | `3000` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | - | Yes |
| `ENABLE_TRACING` | Enable OpenTelemetry tracing | `false` | No |
| `OTEL_SERVICE_NAME` | Service name for tracing | `backend` | No |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP endpoint URL | - | No |
| `METRICS_ENABLED` | Enable Prometheus metrics | `false` | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `LOGGER_PRETTY` | Pretty print logs | `false` | No |

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
- Export to OTLP collectors

## License

[Your License Here]
