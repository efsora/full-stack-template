# Full-Stack + AI Template

A monorepo template for building full-stack applications with integrated AI capabilities.

## Architecture

This project follows a microservices architecture with the following components:

- **Backend**: Express + TypeScript
- **Frontend**: React + TypeScript
- **AI Service**: FastAPI (Python)
- **Databases**:
  - PostgreSQL (shared by backend and AI service)
  - Weaviate (vector database for AI service)

### Communication

- Frontend ↔ Backend: HTTP + SSE
- Backend ↔ AI Service: HTTP + SSE

### Project Structure

```
full-stack-template/
├── backend/              # Express + TypeScript service
├── frontend/             # React + TypeScript service
├── ai-service/           # FastAPI service
├── shared/               # OpenAPI contracts and generated types
├── packages/             # Shared utilities and packages
│   └── common/          # Common utilities, constants, validators
├── infrastructure/       # AWS CDK deployment code (coming soon)
├── scripts/              # Utility scripts
└── docker-compose.yml    # Local development orchestration
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose
- Python 3.11+ (for AI service development)
- uv (Python package manager)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd full-stack-template
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start the infrastructure

```bash
docker-compose up -d postgres weaviate
```

This will start:
- PostgreSQL on port 5432 (with `backend_schema` and `ai_schema`)
- Weaviate on port 8080

### 5. Generate types from OpenAPI contracts

```bash
npm run generate:types
```

This will:
- Generate TypeScript types from OpenAPI specs
- Generate Python types for the AI service (if `datamodel-code-generator` is installed)

## OpenAPI Contracts

API contracts are defined in `shared/contracts/` using OpenAPI 3.1 specification:

- `frontend-backend-api.yaml`: Frontend ↔ Backend API
- `backend-ai-api.yaml`: Backend ↔ AI Service API

### Working with contracts

```bash
# Lint OpenAPI specs
npm run lint:contracts

# Format OpenAPI specs
npm run format:contracts

# Generate types
npm run generate:types
```

## Development Workflow

1. Define API contracts in `shared/contracts/` (spec-first approach)
2. Generate types using `npm run generate:types`
3. Implement services using the generated types
4. Each service manages its own migrations
5. Test locally using Docker Compose

## Database Schemas

- **backend_schema**: Managed by backend service
  - Backend has full read/write access
  - AI service has read-only access

- **ai_schema**: Managed by AI service
  - AI service has full read/write access
  - Isolated from backend schema

## Git Hooks

Pre-commit hooks are configured using Husky:

- Validates OpenAPI contracts when modified
- Ensures contracts follow the specification

## Deployment

Deployment to AWS (ECS + EC2 + RDS) using CDK will be configured in the `infrastructure/` folder.

## Contributing

1. Follow the spec-first approach for API changes
2. Update OpenAPI contracts before implementing changes
3. Run `npm run generate:types` after updating contracts
4. Ensure all contracts pass validation before committing

## License

[Your License Here]
