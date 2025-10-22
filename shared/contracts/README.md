# OpenAPI Contracts

This directory contains OpenAPI 3.1 specifications that define the contracts between services.

## Contracts

### frontend-backend-api.yaml
Defines the API contract between the Frontend (React) and Backend (Express) services.

**Communication:** HTTP + SSE

### backend-ai-api.yaml
Defines the API contract between the Backend (Express) and AI Service (FastAPI).

**Communication:** HTTP + SSE

## Type Generation

TypeScript types are automatically generated from these contracts and placed in the `shared/types/` directory.

To regenerate types:
```bash
npm run generate:types
```

## Linting and Formatting

Lint contracts:
```bash
npm run lint:contracts
```

Format contracts:
```bash
npm run format:contracts
```

## Guidelines

- Follow OpenAPI 3.1 specification
- Use spec-first approach: define contracts before implementation
- Keep contracts in sync with actual implementations
- Use descriptive names and add examples where applicable
- Document all endpoints, parameters, and responses
