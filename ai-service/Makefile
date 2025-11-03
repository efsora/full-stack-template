# ---- Variables ----
PY = uv run
APP = app.main:app
APP_DIR = src
PYTHONPATH ?= $(APP_DIR)

# ---- Phony ----
.PHONY: run test test-cov test-migrations lint type check pre-commit-install pre-commit format ruff ruff-fix mypy bandit qa

# ---- Development ----
run:
	uv sync --frozen
	uv run uvicorn $(APP) --reload --app-dir $(APP_DIR)

# ---- Tests ----
test:
	docker compose up -d postgres
	docker compose run --rm ai-service \
	  bash -lc 'ENV=test DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/app_db PYTHONPATH=/app/src pytest -q -s'


test-migrations:
	docker compose up -d postgres
	docker compose run --rm ai-service \
	  bash -lc 'ENV=test DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/app_db PYTHONPATH=/app/src alembic upgrade head'


test-cov:
	docker compose up -d postgres
	docker compose run --rm ai-service \
	  bash -lc 'ENV=test DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/app_db PYTHONPATH=/app/src \
	    coverage erase && coverage run -m pytest -q && coverage report && coverage html'

# ---- Quality ----
lint:
	$(PY) ruff check .

format:
	$(PY) black .

type:
	PYTHONPATH=$(PYTHONPATH) $(PY) mypy .

check: fmt lint type test-cov

# ---- Pre-commit ----
pre-commit-install:
	$(PY) pre-commit install

pre-commit:
	$(PY) pre-commit run --all-files

ruff:
	$(PY) ruff check --config pyproject.toml .

ruff-fix:
	$(PY) ruff check --config pyproject.toml --fix .

mypy:
	$(PY) mypy --config-file pyproject.toml .

bandit:
	$(PY) bandit -r src -c pyproject.toml
