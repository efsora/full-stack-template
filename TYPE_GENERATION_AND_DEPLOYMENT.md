# Type Generation & Production Deployment Guide

This document explains how type generation works in the full-stack template and provides strategies for production deployments.

---

## Table of Contents

- [Type Generation Overview](#type-generation-overview)
- [Phase 1: Backend → Frontend Type Generation](#phase-1-backend--frontend-type-generation)
- [Phase 2: AI Service → Backend Type Generation](#phase-2-ai-service--backend-type-generation)
- [Production Deployment Strategy](#production-deployment-strategy)
- [CI/CD Pipeline](#cicd-pipeline)
- [Docker Build Process](#docker-build-process)
- [Environment-Specific Configuration](#environment-specific-configuration)
- [Best Practices](#best-practices)

---

## Type Generation Overview

The project uses a **code-first approach** where each service generates TypeScript types from OpenAPI specifications exposed by other services. This eliminates the need for a shared types folder and ensures types are always in sync with the actual API implementation.

### Key Tools

- **`@asteasolutions/zod-to-openapi`**: Generates OpenAPI 3.1 specs from Zod schemas (backend)
- **`openapi-typescript`**: Generates TypeScript types from OpenAPI specs
- **FastAPI**: Auto-generates OpenAPI specs from Pydantic models (AI service)

### Type Generation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Phase 1: Frontend ↔ Backend                 │
└─────────────────────────────────────────────────────────────────┘

Step 1: Backend Schema Definition (Zod)
├─ backend/src/routes/users/schemas.ts
│  export const createUserSchema = z.object({
│    email: z.string().email(),
│    name: z.string().min(1),
│    password: z.string().min(6)
│  }).openapi('CreateUser');
│
Step 2: OpenAPI Path Registration
├─ backend/src/openapi/paths/users.ts
│  registry.registerPath({
│    method: 'post',
│    path: '/api/v1/users',
│    request: { body: { schema: createUserSchema } }
│  });
│
Step 3: OpenAPI Generation
├─ Command: npm run generate:openapi
├─ Runs: tsx src/openapi/generate.ts
├─ Output: backend/_docs/openapi.json
│
Step 4: TypeScript Type Generation
├─ Command: npm run generate:types (in frontend/)
├─ Runs: openapi-typescript ../backend/_docs/openapi.json --output schema.d.ts
├─ Output: frontend/schema.d.ts
│
Step 5: Frontend Uses Generated Types
└─ import type { components } from './schema';
   type CreateUserBody = components['schemas']['CreateUser'];

┌─────────────────────────────────────────────────────────────────┐
│                  Phase 2: Backend ↔ AI Service                  │
└─────────────────────────────────────────────────────────────────┘

Step 1: AI Service Endpoint Definition (FastAPI/Pydantic)
├─ ai-service/src/app/api/v1/weaviate.py
│  @router.post("/embed")
│  async def embed_text(request: EmbedRequest) -> EmbedResponse:
│      # Implementation
│
Step 2: FastAPI Auto-Generates OpenAPI
├─ Available at: http://localhost:8000/openapi.json
│  (Auto-generated from Pydantic models)
│
Step 3: Backend TypeScript Type Generation
├─ Command: make generate-ai-types
├─ Runs: npx openapi-typescript http://localhost:8000/openapi.json \
│         --output backend/src/generated/ai-service.d.ts
├─ Output: backend/src/generated/ai-service.d.ts
│
Step 4: Backend Uses Generated Types
└─ import type { components } from '#generated/ai-service';
   type EmbedRequest = components['schemas']['EmbedRequest'];
```

---

## Phase 1: Backend → Frontend Type Generation

### Step-by-Step Process

#### 1. Backend Schema Definition

The backend defines API schemas using **Zod** with OpenAPI metadata:

```typescript
// backend/src/routes/users/schemas.ts
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const createUserSchema = z.object({
  email: z.string().email().openapi({ example: "user@example.com" }),
  name: z.string().min(1).openapi({ example: "John Doe" }),
  password: z.string().min(6).openapi({ example: "password123" })
}).openapi('CreateUser');
```

**Why Zod?**
- Runtime validation + compile-time types
- Single source of truth for validation and OpenAPI
- Type inference from schema definitions

#### 2. OpenAPI Path Registration

Each route registers its OpenAPI definition:

```typescript
// backend/src/openapi/paths/users.ts
import { registry } from "../registry.js";
import { createUserSchema } from "#routes/users/schemas";

registry.registerPath({
  method: 'post',
  path: '/api/v1/users',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "User created successfully",
      content: {
        'application/json': {
          schema: successResponseSchema(userDataSchema)
        }
      }
    }
  }
});
```

#### 3. OpenAPI Generation Script

The generation script collects all registered paths and generates the OpenAPI spec:

```typescript
// backend/src/openapi/generate.ts
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import fs from "node:fs";

// Import all path registrations (triggers registration)
import "./paths/health.js";
import "./paths/hello.js";
import "./paths/users.js";
import { registry } from "./registry.js";

function generateOpenApiSpec() {
  // Create generator from registry
  const generator = new OpenApiGeneratorV31(registry.definitions);

  // Generate OpenAPI document
  const openApiSpec = generator.generateDocument({
    info: {
      title: "Full Stack Template API",
      version: "1.0.0",
    },
    openapi: "3.1.0",
    servers: [{ url: "http://localhost:3000" }]
  });

  // Write to _docs/openapi.json
  fs.writeFileSync(
    'backend/_docs/openapi.json',
    JSON.stringify(openApiSpec, null, 2)
  );
}

generateOpenApiSpec();
```

**When does it run?**
- `npm run dev`: Runs before starting dev server
- `npm run build`: Runs before TypeScript compilation
- `make generate-backend-types`: Manual trigger

#### 4. Frontend Type Generation

The frontend uses `openapi-typescript` to generate TypeScript types:

```bash
# Frontend command
npm run generate:types

# Actual command executed
openapi-typescript ../backend/_docs/openapi.json --output schema.d.ts
```

**Output** (`frontend/schema.d.ts`):

```typescript
export interface components {
  schemas: {
    CreateUser: {
      email: string;
      name: string;
      password: string;
    };
    UserData: {
      id: number;
      email: string;
      name: string | null;
    };
    // ... other schemas
  }
}

export interface paths {
  '/api/v1/users': {
    post: {
      requestBody: {
        content: {
          'application/json': components['schemas']['CreateUser'];
        }
      };
      responses: {
        201: {
          content: {
            'application/json': {
              success: true;
              data: components['schemas']['UserData'];
              // ...
            }
          }
        }
      }
    }
  }
  // ... other paths
}
```

#### 5. Frontend Usage

The frontend imports and uses these generated types:

```typescript
// frontend/src/api/hooks/useUsers.ts
import type { components } from '../../schema';
import { apiClient } from '../client';

type CreateUserBody = components['schemas']['CreateUser'];
type UserData = components['schemas']['UserData'];

export const useCreateUser = () => {
  return useMutation({
    mutationFn: async (body: CreateUserBody) => {
      const response = await apiClient.post<AppResponse<UserData>>(
        '/api/v1/users',
        body
      );
      return response.data;
    }
  });
};
```

**Type Safety Benefits:**
- ✅ Compile-time errors if API changes
- ✅ Autocomplete for all API fields
- ✅ Refactoring safety across services
- ✅ No manual type synchronization needed

---

## Phase 2: AI Service → Backend Type Generation

### Step-by-Step Process

#### 1. AI Service Endpoint Definition

The AI service defines endpoints using **FastAPI** and **Pydantic**:

```python
# ai-service/src/app/api/v1/weaviate.py
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class EmbedRequest(BaseModel):
    text: str
    collection: str

class EmbedResponse(BaseModel):
    id: str
    success: bool
    message: str

@router.post("/embed", response_model=EmbedResponse)
async def embed_text(request: EmbedRequest) -> EmbedResponse:
    # Implementation
    return EmbedResponse(
        id="uuid-here",
        success=True,
        message="Text embedded successfully"
    )
```

**FastAPI Auto-Generation:**
- FastAPI automatically generates OpenAPI 3.1 spec from Pydantic models
- Available at: `http://localhost:8000/openapi.json`
- Includes all request/response schemas, endpoints, and validation rules

#### 2. Backend Type Generation

The backend generates TypeScript types from the AI service's OpenAPI endpoint:

```bash
# Makefile command
make generate-ai-types

# Actual commands executed:
# 1. Start AI service (if not running)
docker compose up -d ai-service

# 2. Wait for service to be ready
sleep 5

# 3. Generate types
mkdir -p backend/src/generated
cd backend && npx openapi-typescript http://localhost:8000/openapi.json \
  --output src/generated/ai-service.d.ts
```

**Output** (`backend/src/generated/ai-service.d.ts`):

```typescript
export interface components {
  schemas: {
    EmbedRequest: {
      text: string;
      collection: string;
    };
    EmbedResponse: {
      id: string;
      success: boolean;
      message: string;
    };
    // ... other schemas
  }
}

export interface paths {
  '/api/v1/weaviate/embed': {
    post: {
      requestBody: {
        content: {
          'application/json': components['schemas']['EmbedRequest'];
        }
      };
      responses: {
        201: {
          content: {
            'application/json': components['schemas']['EmbedResponse'];
          }
        }
      }
    }
  }
  // ... other paths
}
```

#### 3. Backend AI Service Client

The backend creates a type-safe client using generated types:

```typescript
// backend/src/infrastructure/ai-service/client.ts
import axios, { AxiosInstance } from 'axios';
import type { paths, components } from '#generated/ai-service';

type AIServiceResponse<T> = {
  data: T;
  trace_id: string;
};

export class AIServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
      timeout: 30000
    });
  }

  async embedText(
    data: components['schemas']['EmbedRequest']
  ): Promise<AIServiceResponse<components['schemas']['EmbedResponse']>> {
    const response = await this.client.post<
      paths['/api/v1/weaviate/embed']['post']['responses'][201]['content']['application/json']
    >('/api/v1/weaviate/embed', data);

    return response.data;
  }
}

export const aiServiceClient = new AIServiceClient();
```

#### 4. Backend Workflow Usage

Workflows use the type-safe client:

```typescript
// backend/src/core/documents/embed.workflow.ts
import { aiServiceClient } from '#infrastructure/ai-service';
import { command, success, fail } from '#lib/effect';

export function embedDocument(text: string, collection: string) {
  return command(
    async () => {
      // Type-safe call to AI service
      const response = await aiServiceClient.embedText({
        text,      // ✅ Type checked
        collection // ✅ Type checked
      });

      return response.data;
    },
    (result) => result ? success(result) : fail({ code: 'AI_SERVICE_ERROR' }),
    { operation: 'embedDocument' }
  );
}
```

**Type Safety Benefits:**
- ✅ Backend knows exact AI service API contract
- ✅ Compile errors if AI service changes
- ✅ Autocomplete for all AI service operations
- ✅ No runtime surprises from API mismatches

---

## Production Deployment Strategy

### Overview

Production deployments require a coordinated approach to ensure type safety is maintained across all services. Here's a comprehensive strategy:

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CI/CD Pipeline                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  AI Service │───▶│   Backend   │───▶│  Frontend   │
│   (Python)  │    │ (TypeScript)│    │(TypeScript) │
└─────────────┘    └─────────────┘    └─────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Build      │    │  Build      │    │  Build      │
│  + Expose   │    │  + Generate │    │  + Generate │
│  OpenAPI    │    │  AI Types   │    │  Backend    │
│             │    │  + Expose   │    │  Types      │
│             │    │  OpenAPI    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Docker      │    │ Docker      │    │ Docker      │
│ Image       │    │ Image       │    │ Image       │
│ ai:latest   │    │ backend:    │    │ frontend:   │
│             │    │ latest      │    │ latest      │
└─────────────┘    └─────────────┘    └─────────────┘
      │                   │                   │
      └───────────────────┴───────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Container Registry   │
              │  (ECR, Docker Hub,    │
              │   GitHub Packages)    │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Production Cluster  │
              │   (ECS, K8s, Docker)  │
              └───────────────────────┘
```

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main, development]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  # Job 1: Build and push AI Service
  build-ai-service:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        working-directory: ./ai-service
        run: |
          pip install uv
          uv sync

      - name: Run tests
        working-directory: ./ai-service
        run: make test

      - name: Log in to container registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push AI service image
        uses: docker/build-push-action@v5
        with:
          context: ./ai-service
          file: ./ai-service/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/ai-service:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/ai-service:latest

  # Job 2: Build and push Backend
  build-backend:
    runs-on: ubuntu-latest
    needs: [build-ai-service]  # Wait for AI service
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install backend dependencies
        working-directory: ./backend
        run: npm ci

      # CRITICAL: Generate backend OpenAPI for frontend
      - name: Generate backend OpenAPI
        working-directory: ./backend
        run: npm run generate:openapi

      # OPTIONAL: Generate AI service types for backend
      # This requires AI service to be running
      - name: Start AI service locally
        run: |
          docker compose up -d ai-service
          sleep 10  # Wait for service to be ready

      - name: Generate AI service types
        working-directory: ./backend
        run: |
          mkdir -p src/generated
          npx openapi-typescript http://localhost:8000/openapi.json \
            --output src/generated/ai-service.d.ts

      - name: Run backend tests
        working-directory: ./backend
        run: npm run test:run

      - name: Build backend
        working-directory: ./backend
        run: npm run build

      - name: Log in to container registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push backend image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./backend/docker/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/backend:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/backend:latest

      # Upload backend OpenAPI artifact for frontend
      - name: Upload backend OpenAPI
        uses: actions/upload-artifact@v4
        with:
          name: backend-openapi
          path: backend/_docs/openapi.json
          retention-days: 1

  # Job 3: Build and push Frontend
  build-frontend:
    runs-on: ubuntu-latest
    needs: [build-backend]  # Wait for backend
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # Download backend OpenAPI from previous job
      - name: Download backend OpenAPI
        uses: actions/download-artifact@v4
        with:
          name: backend-openapi
          path: backend/_docs/

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci

      # CRITICAL: Generate frontend types from backend OpenAPI
      - name: Generate frontend types
        working-directory: ./frontend
        run: npm run generate:types

      - name: Type check frontend
        working-directory: ./frontend
        run: npm run type-check

      - name: Build frontend
        working-directory: ./frontend
        run: npm run build
        env:
          VITE_API_URL: ""  # Use relative URLs (nginx proxy)
          VITE_NODE_ENV: production

      - name: Log in to container registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/frontend:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/frontend:latest

  # Job 4: Deploy to production
  deploy-production:
    runs-on: ubuntu-latest
    needs: [build-ai-service, build-backend, build-frontend]
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to ECS/K8s
        run: |
          # Update ECS task definitions or K8s deployments
          # with new image tags
          echo "Deploying to production..."
          # kubectl set image deployment/backend backend=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/backend:${{ github.sha }}
          # kubectl set image deployment/frontend frontend=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/frontend:${{ github.sha }}
          # kubectl set image deployment/ai-service ai-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/ai-service:${{ github.sha }}
```

### Key Pipeline Decisions

#### 1. **Type Generation in CI/CD**

**Option A: Generate types in CI/CD** (Recommended)
```yaml
# Generate types during build
- name: Generate types
  run: |
    npm run generate:openapi
    npm run generate:types
```

**Pros:**
- ✅ Always fresh types
- ✅ No stale generated files in repo
- ✅ Ensures types match current code

**Cons:**
- ❌ Slightly longer build times
- ❌ Requires AI service to be running for backend type gen

**Option B: Commit generated files**
```yaml
# Types already in repo, just validate
- name: Validate types are up to date
  run: |
    npm run generate:types
    git diff --exit-code schema.d.ts
```

**Pros:**
- ✅ Faster builds
- ✅ Developers see type changes in PRs
- ✅ No dependency on other services

**Cons:**
- ❌ Risk of stale types
- ❌ Extra commits for type updates
- ❌ Merge conflicts on schema.d.ts

**Recommendation:** Use Option A (generate in CI/CD) for production deployments.

#### 2. **Build Order Dependency**

Critical ordering:
1. **AI Service** first (no dependencies)
2. **Backend** second (needs AI service for type generation)
3. **Frontend** last (needs backend OpenAPI)

Use GitHub Actions `needs:` to enforce order:
```yaml
build-backend:
  needs: [build-ai-service]

build-frontend:
  needs: [build-backend]
```

#### 3. **Artifact Sharing**

Share OpenAPI specs between jobs using artifacts:
```yaml
# Backend job
- name: Upload backend OpenAPI
  uses: actions/upload-artifact@v4
  with:
    name: backend-openapi
    path: backend/_docs/openapi.json

# Frontend job
- name: Download backend OpenAPI
  uses: actions/download-artifact@v4
  with:
    name: backend-openapi
    path: backend/_docs/
```

---

## Docker Build Process

### Multi-Stage Builds for Each Service

#### Backend Dockerfile

```dockerfile
# backend/docker/Dockerfile
FROM node:22-alpine AS base

# Dependencies stage
FROM base AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && \
    cp -R node_modules /prod_node_modules && \
    npm ci

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# CRITICAL: Generate OpenAPI before building
RUN npm run generate:openapi

# Build TypeScript
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /prod_node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/_docs ./_docs
COPY package*.json ./

EXPOSE 3000

CMD ["node", "--import", "./dist/instrumentation.js", "dist/index.js"]
```

#### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:22-alpine AS base

# Dependencies stage
FROM base AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build stage (with type generation)
FROM base AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# CRITICAL: Expect backend OpenAPI to exist
# In CI/CD, this is provided by artifact download
# In local Docker build, ensure `make generate-backend-types` was run

# Generate types from backend OpenAPI
RUN npm run generate:types

# Build frontend
ARG VITE_API_URL=""
ARG VITE_NODE_ENV=production
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_NODE_ENV=$VITE_NODE_ENV

RUN npm run build

# Production stage (Nginx)
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### AI Service Dockerfile

```dockerfile
# ai-service/Dockerfile
FROM python:3.11-slim AS base

# Install uv
RUN pip install uv

WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

# Production stage
FROM base AS production
COPY --from=dependencies /app/.venv /app/.venv
COPY . .

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/src:$PYTHONPATH"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose for Local Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    # ... rest of config

  backend:
    build:
      context: .
      dockerfile: backend/docker/Dockerfile
    depends_on:
      ai-service:
        condition: service_started
    environment:
      AI_SERVICE_URL: http://ai-service:8000
    # ... rest of config

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ""  # Use nginx proxy
    depends_on:
      - backend
    # ... rest of config
```

---

## Environment-Specific Configuration

### Development Environment

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_TRACING=true

# Use localhost URLs for local dev
VITE_API_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
DATABASE_URL=postgresql://backend_user:backend_password@localhost:5432/backend_db
```

### Production Environment

```bash
# .env.production (managed by secrets manager)
NODE_ENV=production
LOG_LEVEL=info
ENABLE_TRACING=true

# Use internal service names or load balancer URLs
VITE_API_URL=""  # Empty = use relative URLs (nginx proxy)
AI_SERVICE_URL=http://ai-service.internal:8000
DATABASE_URL=postgresql://user:pass@rds-instance.region.rds.amazonaws.com:5432/db

# External services
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.company.com
JWT_SECRET=${JWT_SECRET_FROM_SECRETS_MANAGER}
```

### Environment Variable Management

**Options:**

1. **AWS Systems Manager Parameter Store**
   - Store secrets per environment
   - Reference in ECS task definitions
   - Automatic rotation

2. **HashiCorp Vault**
   - Centralized secrets management
   - Dynamic secrets
   - Audit logging

3. **Kubernetes Secrets**
   - Native K8s secret management
   - Encrypted at rest
   - RBAC controls

---

## Best Practices

### 1. Type Generation

✅ **DO:**
- Generate types in CI/CD pipeline
- Fail builds on type generation errors
- Include type checking in PR checks
- Version OpenAPI specs with git tags

❌ **DON'T:**
- Commit generated `schema.d.ts` files (except for local dev convenience)
- Skip type generation in production builds
- Manually sync types between services

### 2. Deployment

✅ **DO:**
- Deploy services in order: AI Service → Backend → Frontend
- Use health checks before marking deployments successful
- Implement blue-green or canary deployments
- Tag images with git SHA for traceability

❌ **DON'T:**
- Deploy all services simultaneously
- Skip integration tests
- Use `latest` tag in production

### 3. Versioning

✅ **DO:**
- Use semantic versioning for APIs
- Maintain backward compatibility
- Document breaking changes
- Version OpenAPI specs

❌ **DON'T:**
- Break APIs without version bumps
- Deploy incompatible changes together
- Skip migration guides

### 4. Monitoring

✅ **DO:**
- Monitor type generation failures
- Track API contract violations
- Alert on deployment failures
- Log OpenAPI spec changes

❌ **DON'T:**
- Ignore type errors in logs
- Skip smoke tests after deployment

---

## Example Deployment Commands

### Local Development
```bash
# Generate all types
make generate-all-types

# Start all services
make full-stack-up

# View logs
make full-stack-logs
```

### CI/CD (GitHub Actions)
```bash
# Automatic on push to main
git push origin main

# Manual workflow trigger
gh workflow run deploy.yml
```

### Production Deployment (ECS Example)
```bash
# Update task definition with new image
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json

# Update service to use new task definition
aws ecs update-service \
  --cluster production-cluster \
  --service backend-service \
  --task-definition backend:42

# Wait for deployment to complete
aws ecs wait services-stable \
  --cluster production-cluster \
  --services backend-service
```

### Production Deployment (Kubernetes Example)
```bash
# Update deployments with new images
kubectl set image deployment/backend \
  backend=ghcr.io/org/backend:abc123

kubectl set image deployment/frontend \
  frontend=ghcr.io/org/frontend:abc123

kubectl set image deployment/ai-service \
  ai-service=ghcr.io/org/ai-service:abc123

# Watch rollout status
kubectl rollout status deployment/backend
kubectl rollout status deployment/frontend
kubectl rollout status deployment/ai-service

# Verify deployments
kubectl get pods
kubectl logs -f deployment/backend
```

---

## Troubleshooting

### Issue: Frontend build fails with "Cannot find module './schema'"

**Cause:** Backend OpenAPI not generated before frontend type generation

**Solution:**
```bash
# Local
cd backend && npm run generate:openapi
cd ../frontend && npm run generate:types

# CI/CD: Ensure artifact upload/download
- uses: actions/upload-artifact@v4
- uses: actions/download-artifact@v4
```

### Issue: Backend can't find AI service types

**Cause:** AI service not running during type generation

**Solution:**
```bash
# Local
docker compose up -d ai-service
make generate-ai-types

# CI/CD: Start AI service in docker-compose
docker compose up -d ai-service
sleep 10  # Wait for health check
make generate-ai-types
```

### Issue: Type mismatches in production

**Cause:** Skipped type generation in CI/CD

**Solution:**
- Add type generation to CI/CD pipeline
- Fail builds on type check errors
- Never skip `npm run generate:types`

---

## Summary

### Type Generation Flow

1. **AI Service** → FastAPI auto-generates OpenAPI
2. **Backend** → Generates OpenAPI from Zod, fetches AI service types
3. **Frontend** → Generates types from backend OpenAPI

### Production Deployment

1. **Build Order**: AI Service → Backend → Frontend
2. **Type Generation**: Always run in CI/CD
3. **Docker Images**: Multi-stage builds with type generation
4. **Deployment**: Blue-green or canary for zero downtime
5. **Monitoring**: Track type generation and deployment health

### Key Takeaway

Type generation ensures **compile-time safety** across your entire stack. By integrating it into your CI/CD pipeline, you prevent runtime errors and maintain API contracts automatically.
