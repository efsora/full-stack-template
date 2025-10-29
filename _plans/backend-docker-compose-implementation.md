# Backend Docker Compose Implementation Plan

## Task Definition

Implement the backend service in docker-compose.yml with full observability stack (Redis, OTEL Collector) and proper environment configuration based on backend/docker/.env.docker.example.

## Requirements

1. Add `dev:docker` npm script to backend/package.json
2. Uncomment and update the existing backend service section in docker-compose.yml (lines 49-71)
3. Add all environment variables from `.env.docker.example` inline to docker-compose.yml
4. Add Redis service with `redis:latest` image
5. Add OTEL Collector service with `otel/opentelemetry-collector:latest` image
6. Create minimal `otel-collector-config.yaml` configuration file at `backend/docker/`
7. Add health check to backend service (interval: 10s, timeout: 5s, retries: 5)
8. Ensure proper service dependencies and network configuration

## Action Points

### 1. Backend Package Configuration
- [x] Add `dev:docker` script to `backend/package.json`: `"dev:docker": "tsx --watch src/index.ts"`

### 2. OTEL Collector Configuration
- [x] Create `backend/docker/otel-collector-config.yaml` with minimal configuration
  - Receivers: otlp (grpc: 4317, http: 4318)
  - Processors: batch
  - Exporters: debug (console output) - Note: Changed from "logging" to "debug" due to deprecation
  - Service pipeline: traces -> batch -> debug

### 3. Docker Compose - Redis Service
- [x] Add Redis service to docker-compose.yml
  - Image: `redis:latest`
  - Container name: `full-stack-redis`
  - Port: 6379
  - Restart policy: `unless-stopped`
  - Network: `app-network`
  - Health check using `redis-cli ping`

### 4. Docker Compose - OTEL Collector Service
- [x] Add otel-collector service to docker-compose.yml
  - Image: `otel/opentelemetry-collector:latest`
  - Container name: `full-stack-otel-collector`
  - Ports: 4317 (gRPC), 4318 (HTTP)
  - Volume mount: `./backend/docker/otel-collector-config.yaml:/etc/otel-collector-config.yaml`
  - Command: `--config=/etc/otel-collector-config.yaml`
  - Restart policy: `unless-stopped`
  - Network: `app-network`

### 5. Docker Compose - Backend Service
- [x] Uncomment backend service section (lines 49-71)
- [x] Update build context: `.` (root) with `dockerfile: backend/docker/Dockerfile` (for npm workspace support)
- [x] Set container name: `full-stack-backend`
- [x] Set port mapping: `${BACKEND_PORT:-3000}:3000`
- [x] Add inline environment variables from `.env.docker.example`:
  - NODE_ENV=development
  - PORT=3000
  - DATABASE_URL=postgresql://backend_user:backend_password@postgres:5432/backend_db
  - REDIS_URL=redis://redis:6379
  - JWT_SECRET=docker-dev-secret-key-32chars-minimum-length-required
  - ENABLE_TRACING=true
  - TRACING_SAMPLE_RATE=1.0
  - OTEL_SERVICE_NAME=backend-api
  - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318/v1/traces
  - METRICS_ENABLED=true
  - LOG_LEVEL=debug
  - LOGGER_PRETTY=true
- [x] Add depends_on with conditions:
  - postgres: `service_healthy`
  - redis: `service_healthy`
  - otel-collector: `service_started`
- [x] Add health check:
  - test: `["CMD", "curl", "-f", "http://localhost:3000/health"]`
  - interval: 10s
  - timeout: 5s
  - retries: 5
- [x] Add to network: `app-network`
- [x] Set restart policy: `unless-stopped`

### 6. Dockerfile Adjustments (for npm workspace)
- [x] Update Dockerfile to work with npm workspace monorepo structure
- [x] Copy root package.json and package-lock.json
- [x] Copy backend package.json before install
- [x] Use `npm ci --workspace=backend --ignore-scripts` to skip husky hooks
- [x] Copy backend source code
- [x] Set working directory to `/app/backend`

## Context Information

### Current Docker Compose Structure
- **Services running**: postgres (5432), weaviate (8080, 50051)
- **Networks**: app-network (bridge driver)
- **Volumes**: postgres_data, weaviate_data

### Backend Application Details
- **Framework**: Express + TypeScript
- **Node Version**: 22
- **ORM**: Drizzle with PostgreSQL
- **Auth**: JWT with bcrypt
- **Observability**:
  - OpenTelemetry for distributed tracing
  - Prometheus metrics (prom-client)
  - Pino logger with pretty printing
- **API Docs**: Swagger UI + OpenAPI 3.1

### Backend Endpoints
- `/health` - Health check
- `/metrics` - Prometheus metrics
- `/swagger` - Swagger UI
- `/docs/openapi.json` - OpenAPI spec
- `/api/*` - API routes

### Backend Environment Variables (Required)
From `backend/src/infrastructure/config/env.ts`:
- NODE_ENV (development/production)
- PORT (default: 3000)
- DATABASE_URL (PostgreSQL connection string)
- OTEL_EXPORTER_OTLP_ENDPOINT (tracing endpoint)
- OTEL_SERVICE_NAME
- ENABLE_TRACING (boolean)
- METRICS_ENABLED (boolean)
- LOG_LEVEL (debug/info/warn/error)
- LOGGER_PRETTY (boolean)
- JWT_SECRET (minimum 32 characters)

### Docker Configuration Files
- **Dockerfile**: `backend/docker/Dockerfile`
  - Base: node:22
  - Workdir: /app
  - Runs: `npm ci` then `npm run dev:docker`
  - Exposes: 3000
- **Env Example**: `backend/docker/.env.docker.example`
  - Contains all required environment variables
  - Uses Docker service hostnames (postgres, redis, otel-collector)

### Database Connection
- **URL Pattern**: `postgresql://backend_user:backend_password@postgres:5432/backend_db`
- **Host**: Uses service name `postgres` for Docker network resolution
- **Connection Pool**: Max 10 connections (configured in backend/src/db/client.ts)

### Git Status
- Branch: `development/EFSDEV-70-backend-deployment`
- Main branch: `master`
- Status: clean

## Implementation Order

1. Backend package.json update (simple, no dependencies)
2. OTEL Collector config file (needed before docker-compose)
3. Redis service in docker-compose.yml (no dependencies on other new services)
4. OTEL Collector service in docker-compose.yml (depends on config file)
5. Backend service in docker-compose.yml (depends on all above)

## Success Criteria

- [x] Backend service builds successfully with Docker Compose
- [x] Backend service starts and passes health check
- [x] Backend can connect to PostgreSQL database
- [x] Backend can connect to Redis
- [x] Backend sends traces to OTEL Collector
- [x] All services are on the same network and can communicate
- [x] Environment variables are properly injected from docker-compose.yml

## Implementation Complete - Summary

All tasks completed successfully! The backend service is now running in Docker with full observability stack.

### Services Running:
- **postgres** (port 5432): Healthy ✅
- **redis** (port 6379): Healthy ✅
- **weaviate** (ports 8080, 50051): Running ✅
- **otel-collector** (ports 4317, 4318): Running ✅
- **backend** (port 3000): Healthy ✅

### Verified Endpoints:
- http://localhost:3000/health - Returns 200 OK ✅
- http://localhost:3000/metrics - Prometheus metrics working ✅
- http://localhost:3000/swagger - Swagger UI accessible ✅

### Key Implementation Notes:
1. **npm workspace support**: Dockerfile updated to work with monorepo structure
2. **OTEL config**: Used "debug" exporter instead of deprecated "logging"
3. **Build optimization**: Added `--ignore-scripts` to skip husky hooks during Docker build
4. **Removed obsolete version**: Removed `version: '3.8'` from docker-compose.yml (deprecated)
