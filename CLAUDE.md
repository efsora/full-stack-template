# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **multi-service repository** for a full-stack application with integrated AI capabilities. Each service is **independent** with its own `node_modules` and dependencies. The project uses a **spec-first approach** where all APIs are defined using OpenAPI 3.1 specifications before implementation.

### Service Architecture
- **Frontend**: React + TypeScript + Vite (currently implemented as scaffold)
- **Backend**: Express + TypeScript (not yet implemented)
- **AI Service**: FastAPI + Python (not yet implemented)
- **Databases**:
  - PostgreSQL with two schemas: `backend_schema` (managed by backend) and `ai_schema` (managed by AI service)
  - AI service has read-only access to `backend_schema`
  - Weaviate vector database for AI service

### Communication Flow
- Frontend ↔ Backend: HTTP + SSE (Server-Sent Events)
- Backend ↔ AI Service: HTTP + SSE

## Development Commands

### Initial Setup
```bash
# Install root-level dependencies (husky, lint-staged)
npm install

# Install dependencies for each service independently
cd frontend && npm install
cd ../shared && npm install
cd ../packages/common && npm install
# When backend is created: cd ../backend && npm install

# Start all services with Docker Compose
docker-compose up -d

# Or start specific services:
docker-compose up -d postgres weaviate  # Only databases
docker-compose up -d frontend           # Only frontend

# Generate TypeScript types from OpenAPI contracts
npm run generate:types
```

### Working with OpenAPI Contracts
```bash
# Lint OpenAPI specs (in shared/contracts/)
npm run lint:contracts

# Format OpenAPI specs
npm run format:contracts

# Generate types from contracts
npm run generate:types
```

### Frontend Development

#### Local Development (without Docker)
```bash
# Run frontend dev server locally
cd frontend && npm run dev

# Or using Makefile
cd frontend && make dev

# Build frontend for production
cd frontend && npm run build

# Lint frontend code
cd frontend && npm run lint

# Format frontend code
cd frontend && npm run format

# Type-check frontend
cd frontend && npm run type-check

# Preview production build
cd frontend && npm run preview
```

#### Docker Development
```bash
# Start frontend container (from frontend directory)
cd frontend && make docker-dev

# Build and start frontend container
cd frontend && make docker-dev-build

# Stop frontend container
cd frontend && make docker-dev-down

# View container logs
cd frontend && make docker-dev-logs
```

### Common Package Development
```bash
# Build common utilities package
cd packages/common && npm run build

# Watch mode for development
cd packages/common && npm run dev
```

### Backend Development (when implemented)
Backend will use Express + TypeScript. Each service manages its own database migrations within its designated schema.

### AI Service Development (when implemented)
AI service will use FastAPI and Python. Use `uv` as the Python package manager.

Python linting/formatting (configured in lint-staged):
```bash
cd ai-service && uv run ruff check .
cd ai-service && uv run black --check .
cd ai-service && uv run mypy .
```

## Spec-First Development Workflow

**CRITICAL**: All API changes must start with updating OpenAPI contracts.

1. Define or update API contract in `shared/contracts/`:
   - `frontend-backend-api.yaml`: Frontend ↔ Backend API
   - `backend-ai-api.yaml`: Backend ↔ AI Service API
2. Run `npm run lint:contracts` to validate
3. Run `npm run generate:types` to generate TypeScript (and Python) types
4. Implement services using the generated types

Generated types locations:
- TypeScript: `shared/types/frontend-backend-api.ts` and `shared/types/backend-ai-api.ts`
- Python: `ai-service/src/generated_types.py` (requires `datamodel-code-generator`)

## Project Structure

Each service is independent with its own dependencies:
- `backend/`: Backend service (not yet created)
- `frontend/`: Frontend service with independent `node_modules`
- `shared/`: OpenAPI contracts and generated types (independent `node_modules`)
- `packages/common/`: Shared utilities, constants, validators (independent `node_modules`)
- Root: Only contains git hooks configuration (husky, lint-staged)

## Database Setup

PostgreSQL is initialized with two schemas via `scripts/init-db.sql`:
- `backend_schema`: Full access for backend, read-only for AI service
- `ai_schema`: Full access for AI service only

The AI service can query backend data but cannot modify it, ensuring proper data ownership boundaries.

## Git Hooks

Pre-commit hooks (via Husky + lint-staged) automatically:
- Validate and format OpenAPI contracts when modified
- Lint and type-check backend/frontend code changes
- Run Python linting (ruff, black, mypy) on AI service changes
- Build common package when modified

## Technology Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose
- Python 3.11+ with `uv` (for AI service)
- Optional: `datamodel-code-generator` for Python type generation

## Docker Deployment

### Frontend Service
The frontend is containerized with:
- **Multi-stage build**: Node.js for building, Nginx for serving
- **Production optimized**: Gzipped assets, proper caching headers, SPA routing support
- **Port**: 5173 (configurable via `FRONTEND_PORT` env var)

```bash
# Build and run frontend with Docker Compose (from root)
docker-compose up -d frontend

# Or build and run standalone (from frontend/)
cd frontend && docker-compose up -d

# Rebuild after code changes
docker-compose up -d --build frontend

# View logs
docker-compose logs -f frontend

# Stop frontend
docker-compose down frontend
```

### Docker Files Structure
- `frontend/Dockerfile`: Multi-stage build (Node builder + Nginx runtime)
- `frontend/nginx.conf`: Nginx configuration for SPA routing
- `frontend/docker-compose.yml`: Standalone frontend compose file
- `docker-compose.yml` (root): Main orchestration file that includes frontend

### Environment Variables
Create a `.env` file in the root directory:
```bash
FRONTEND_PORT=5173
NODE_ENV=production
POSTGRES_PORT=5432
POSTGRES_DB=app_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
WEAVIATE_PORT=8080
```

## Key Files

- `docker-compose.yml`: Infrastructure orchestration (databases + frontend)
- `frontend/Dockerfile`: Multi-stage build for production deployment
- `frontend/nginx.conf`: Nginx configuration for React SPA
- `frontend/docker-compose.yml`: Standalone frontend Docker Compose
- `scripts/generate-types.sh`: Type generation from OpenAPI specs
- `scripts/init-db.sql`: Database schema initialization
- `tsconfig.base.json`: Base TypeScript configuration (strict mode enabled)
- `.husky/`: Git hooks configuration
