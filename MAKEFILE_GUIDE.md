# Makefile Quick Reference Guide

This guide explains how to use the Makefile commands for the full-stack application.

## 📋 Prerequisites

Before using the Makefile commands, ensure dependencies are installed:

```bash
make install-all
```

Or install individually:
```bash
make install-backend   # Install backend Node.js dependencies
make install-frontend  # Install frontend Node.js dependencies
make install-ai        # Install AI service Python dependencies
```

## 🚀 Main Commands (As Requested)

### 1. Start Full-Stack Application
```bash
make full-stack-up
```
Starts all services in Docker:
- **PostgreSQL** (port 5432)
- **Weaviate** (port 8080)
- **Backend** (port 3000)
- **Frontend** (port 5173)
- **AI Service** (port 8000)

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Backend Swagger: http://localhost:3000/swagger
- AI Service: http://localhost:8000
- AI Service Docs: http://localhost:8000/docs

### 2. Run Backend Tests
```bash
make backend-test
```
Runs backend tests in Docker with PostgreSQL testcontainers.

**With coverage:**
```bash
make backend-test-coverage
```

### 3. Run AI Service Tests
```bash
make ai-test
```
Runs AI service tests in Docker.

**With coverage:**
```bash
make ai-test-coverage
```

### 4. Generate Frontend Types from Backend
```bash
make generate-backend-types
```
Generates TypeScript types for frontend from backend OpenAPI spec.

**What it does:**
1. Generates backend OpenAPI spec from Zod schemas
2. Generates `frontend/schema.d.ts` from backend OpenAPI

**Output:** `frontend/schema.d.ts`

### 5. Generate Backend Types from AI Service
```bash
make generate-ai-types
```
Generates TypeScript types for backend from AI service OpenAPI spec.

**What it does:**
1. Starts AI service (if not running)
2. Fetches OpenAPI spec from http://localhost:8000/openapi.json
3. Generates `backend/src/generated/ai-service.d.ts`

**Output:** `backend/src/generated/ai-service.d.ts`

### Generate All Types
```bash
make generate-all-types
```
Runs both `generate-backend-types` and `generate-ai-types`.

## 🛑 Stopping Services

```bash
make full-stack-down
```
Stops all running services.

## 📊 Monitoring

### View All Logs
```bash
make full-stack-logs
```

### View Individual Service Logs
```bash
make full-stack-logs-backend    # Backend logs only
make full-stack-logs-frontend   # Frontend logs only
make full-stack-logs-ai         # AI service logs only
```

### Check Service Status
```bash
make status
```

### Health Check
```bash
make health
```

## 🔄 Management Commands

### Restart Services
```bash
make full-stack-restart
```

### Rebuild and Restart
```bash
make full-stack-rebuild
```

### Clean Up (Delete Data)
```bash
make full-stack-clean  # ⚠️ WARNING: Deletes all Docker volumes
```

## 🗃️ Database Migrations

### Backend Migrations
```bash
make db-migrate-backend
```

### AI Service Migrations
```bash
make db-migrate-ai
```

### All Migrations
```bash
make db-migrate-all
```

## 🐚 Shell Access

### Backend Shell
```bash
make backend-shell
```

### AI Service Shell
```bash
make ai-shell
```

### Frontend Shell
```bash
make frontend-shell
```

### PostgreSQL Shell
```bash
make postgres-shell
```

## 🧹 Cleanup Commands

### Remove node_modules
```bash
make clean-node-modules
```

### Remove Build Artifacts
```bash
make clean-build
```

### Deep Clean (Everything)
```bash
make clean-all  # ⚠️ Removes everything including Docker volumes
```

## 📖 Complete Command List

Run `make help` or just `make` to see all available commands:

```bash
make help
```

## 🔧 Typical Development Workflow

### First Time Setup
```bash
# 1. Install all dependencies
make install-all

# 2. Start all services
make full-stack-up

# 3. Generate types
make generate-all-types

# 4. Check status
make status
make health
```

### Daily Development
```bash
# Start services
make full-stack-up

# View logs
make full-stack-logs

# Make code changes...

# Generate types if API changed
make generate-backend-types

# Run tests
make backend-test
make ai-test

# Stop services when done
make full-stack-down
```

### Before Committing
```bash
# Run all tests
make test-all

# Generate types
make generate-all-types

# Type check frontend
cd frontend && npm run type-check
```

## 🐛 Troubleshooting

### "tsx: command not found" Error
Install backend dependencies:
```bash
make install-backend
```

### "openapi-typescript: command not found" Error
Install frontend dependencies:
```bash
make install-frontend
```

### Docker Services Not Starting
Check Docker is running:
```bash
docker ps
```

Rebuild services:
```bash
make full-stack-rebuild
```

### Port Already in Use
Check what's using the port:
```bash
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :8000  # AI Service
```

Stop services and try again:
```bash
make full-stack-down
make full-stack-up
```

### Database Connection Issues
Check PostgreSQL is healthy:
```bash
make status
```

Restart PostgreSQL:
```bash
docker compose restart postgres
```

## 💡 Tips

1. **Use `make help`** - Shows all available commands with descriptions
2. **Install dependencies first** - Run `make install-all` before other commands
3. **Check logs** - Use `make full-stack-logs` to debug issues
4. **Health checks** - Use `make health` to verify all services are responding
5. **Generate types after API changes** - Run `make generate-backend-types` after changing backend schemas

## 🎯 Quick Test Commands

```bash
# Full test workflow
make install-all           # Install dependencies
make full-stack-up         # Start services
make generate-all-types    # Generate types
make test-all              # Run all tests
make health                # Check health
make full-stack-down       # Stop services
```
