# Default Node package manager command
NPM = npm

# ----------------------------------------
# Development
# ----------------------------------------
dev:
	$(NPM) run dev

preview:
	$(NPM) run preview

# ----------------------------------------
# Build & Generate
# ----------------------------------------
build:
	$(NPM) run build

generate-types:
	$(NPM) run generate:types

# ----------------------------------------
# Code quality
# ----------------------------------------
lint:
	$(NPM) run lint

format:
	$(NPM) run format

# ----------------------------------------
# Pre-commit / commit check
# ----------------------------------------
commit-check:
	@echo "Running pre-commit checks..."
	$(NPM) run format
	$(NPM) run lint
	$(NPM) run pre-commit
	@echo "All checks passed"

# ----------------------------------------
# Shortcut for all
# ----------------------------------------
all: format lint build
	@echo "Format, lint and build completed."
