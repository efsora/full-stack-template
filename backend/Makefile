# Backend Service Makefile
# Provides convenient shortcuts for development, testing, deployment, and CI/CD

.DEFAULT_GOAL := dev

# Declare all targets as phony (don't produce files)
.PHONY: help dev dev-docker build install clean-install ci-install \
	test test-run test-coverage \
	lint lint-fix format format-check type-check check fix \
	db-generate db-migrate db-push db-studio migrate reset-db \
	docker-up docker-down docker-logs docker-clean up down logs clean \
	generate-openapi env setup ci

#===========================================
# Help
#===========================================

help: ## Show this help message
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  Backend Service - Available Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "📦 Setup & Installation:"
	@echo "  setup              Setup complete dev environment (install + env + db)"
	@echo "  install            Install dependencies (npm install)"
	@echo "  clean-install      Remove node_modules and fresh install"
	@echo "  ci-install         Reproducible install for CI (npm ci)"
	@echo "  env                Copy .env.example to .env (if not exists)"
	@echo ""
	@echo "🚀 Development:"
	@echo "  dev                Start development server (default)"
	@echo "  dev-docker         Start development server for Docker"
	@echo "  build              Build for production (lint + type-check + build)"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  test               Run tests in watch mode"
	@echo "  test-run           Run tests once (for CI)"
	@echo "  test-coverage      Run tests with coverage report"
	@echo ""
	@echo "✨ Code Quality:"
	@echo "  lint               Check for linting errors"
	@echo "  lint-fix           Fix linting errors automatically"
	@echo "  format             Format code with Prettier"
	@echo "  format-check       Check code formatting"
	@echo "  type-check         Run TypeScript type checking"
	@echo "  check              Run all checks (lint + type-check + format-check)"
	@echo "  fix                Fix all issues (lint-fix + format)"
	@echo ""
	@echo "🗄️  Database (Drizzle ORM):"
	@echo "  db-generate        Generate migrations from schema"
	@echo "  db-migrate         Apply migrations to database"
	@echo "  db-push            Push schema directly to DB (dev only)"
	@echo "  db-studio          Open Drizzle Studio GUI"
	@echo "  migrate            Generate and apply migrations"
	@echo "  reset-db           Reset database (⚠️  destructive)"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  docker-up (up)     Start all Docker services"
	@echo "  docker-down (down) Stop all Docker services"
	@echo "  docker-logs (logs) Follow backend logs"
	@echo "  docker-clean       Stop services and remove volumes"
	@echo ""
	@echo "🔧 Utilities:"
	@echo "  generate-openapi   Generate OpenAPI spec from Zod schemas"
	@echo "  ci                 Run full CI pipeline"
	@echo ""
	@echo "💡 Tip: Run 'make' without arguments to start dev server"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

#===========================================
# Setup & Installation
#===========================================

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Dependencies installed"

clean-install: ## Remove node_modules and fresh install
	@echo "🧹 Removing node_modules..."
	rm -rf node_modules package-lock.json
	@echo "📦 Fresh install..."
	npm install
	@echo "✅ Clean install complete"

ci-install: ## Reproducible install for CI
	@echo "📦 Installing dependencies (CI mode)..."
	npm ci
	@echo "✅ CI dependencies installed"

env: ## Copy .env.example to .env if not exists
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Created .env from .env.example"; \
		echo "⚠️  Please review and update .env with your values"; \
	else \
		echo "✅ .env already exists"; \
	fi

setup: install env db-push ## Setup complete dev environment
	@echo "✅ Setup complete! Run 'make dev' to start development"

#===========================================
# Development
#===========================================

dev: generate-openapi ## Start development server
	@echo "🚀 Starting development server..."
	npm run dev

dev-docker: ## Start development server for Docker
	@echo "🐳 Starting development server (Docker mode)..."
	npm run dev:docker

build: lint type-check generate-openapi ## Build for production
	@echo "🔨 Building backend..."
	npm run build
	@echo "✅ Build complete"

#===========================================
# Testing
#===========================================

test: ## Run tests in watch mode
	@echo "🧪 Running tests in watch mode..."
	npm run test

test-run: ## Run tests once (for CI)
	@echo "🧪 Running tests..."
	npm run test:run

test-coverage: ## Run tests with coverage report
	@echo "🧪 Running tests with coverage..."
	npm run test:coverage

#===========================================
# Code Quality
#===========================================

lint: ## Check for linting errors
	@echo "🔍 Checking for linting errors..."
	npm run lint

lint-fix: ## Fix linting errors automatically
	@echo "🔧 Fixing linting errors..."
	npm run lint:fix

format: ## Format code with Prettier
	@echo "✨ Formatting code..."
	npm run format

format-check: ## Check code formatting
	@echo "🔍 Checking code formatting..."
	npm run format:check

type-check: ## Run TypeScript type checking
	@echo "🔍 Type checking..."
	npm run type-check

check: lint type-check format-check ## Run all checks
	@echo "✅ All checks passed"

fix: lint-fix format ## Fix all issues
	@echo "✅ All fixes applied"

#===========================================
# Database (Drizzle ORM)
#===========================================

db-generate: ## Generate migrations from schema
	@echo "🔄 Generating migrations..."
	npx drizzle-kit generate
	@echo "✅ Migrations generated"

db-migrate: ## Apply migrations to database
	@echo "🔄 Applying migrations..."
	npx drizzle-kit migrate
	@echo "✅ Migrations applied"

db-push: ## Push schema directly to DB (dev only)
	@echo "🔄 Pushing schema to database..."
	npx drizzle-kit push
	@echo "✅ Schema pushed"

db-studio: ## Open Drizzle Studio GUI
	@echo "🎨 Opening Drizzle Studio..."
	npx drizzle-kit studio

migrate: db-generate db-migrate ## Generate and apply migrations
	@echo "✅ Migration complete"

reset-db: ## Reset database (⚠️  destructive)
	@echo "⚠️  WARNING: This will delete all database data!"
	@echo -n "Continue? [y/N] " && read ans && [ $${ans:-N} = y ]
	@echo "🔄 Resetting database..."
	@if [ -f "../docker-compose.yml" ]; then \
		cd .. && docker-compose down postgres && docker-compose up -d postgres; \
		echo "⏳ Waiting for database to be ready..."; \
		sleep 5; \
		cd backend && $(MAKE) db-push; \
		echo "✅ Database reset complete (via Docker)"; \
	else \
		echo "❌ docker-compose.yml not found in parent directory"; \
		echo "💡 For local database reset, use manual SQL or Docker"; \
		exit 1; \
	fi

#===========================================
# Docker
#===========================================

docker-up: ## Start all Docker services
	@echo "🐳 Starting Docker services..."
	cd .. && docker-compose up -d
	@echo "✅ Docker services started"

docker-down: ## Stop all Docker services
	@echo "🐳 Stopping Docker services..."
	cd .. && docker-compose down
	@echo "✅ Docker services stopped"

docker-logs: ## Follow backend logs
	@echo "📋 Following backend logs (Ctrl+C to exit)..."
	cd .. && docker-compose logs -f backend

docker-clean: ## Stop services and remove volumes
	@echo "🧹 Stopping services and removing volumes..."
	cd .. && docker-compose down -v
	@echo "✅ Docker cleanup complete"

# Shortcut aliases for Docker commands
up: docker-up
down: docker-down
logs: docker-logs
clean: docker-clean

#===========================================
# Utilities
#===========================================

generate-openapi: ## Generate OpenAPI spec from Zod schemas
	@echo "📄 Generating OpenAPI spec..."
	npm run generate:openapi
	@echo "✅ OpenAPI spec generated"

ci: lint type-check test-run build ## Run full CI pipeline
	@echo "✅ CI pipeline completed successfully"
