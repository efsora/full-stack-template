# FastAPI Best Practices

A production-grade FastAPI template that demonstrates how we approach API design, testing, and observability. The goal is to give the team a ready-to-run stack with sensible defaults so every new service starts on solid footing.

## Highlights

- **Layered architecture** – HTTP handlers in `app/api`, domain logic in `app/domain`, persistence in `app/db_ops`, and infrastructure concerns in `app/infrastructure`.
- **Dependency injection** – [`dependency-injector`](https://python-dependency-injector.ets-labs.org/) provides containerised wiring (`Container`, `get_context`) so the app remains testable and composable.
- **Typed contracts** – Pydantic request/response models, computed fields, and shared `AppResponse` envelope keep responses predictable for consumers.
- **Async-first stack** – Async SQLAlchemy + asyncpg, Starlette middleware, and strict `pytest-asyncio` defaults ensure we catch event-loop issues early.
- **Observability hooks** – Trace IDs are assigned per request and propagated through responses, ready for log correlation.
- **Quality gates** – Pre-commit runs Black, Ruff, MyPy, Pyright, Bandit, and pytest; coverage thresholds live in `pyproject.toml`.

## Project Structure

```
src/
├── app/
│   ├── api/                 # FastAPI routers, schemas, response envelope
│   ├── core/                # Settings, context, version
│   ├── db_ops/              # Database-facing operations
│   ├── dependency_injection # IoC container setup
│   ├── domain/              # Pure domain models and operations
│   └── infrastructure/      # DB engine, SQLAlchemy models, utilities
└── migrations/              # Alembic environment and revision scripts
```

Tests live under `tests/` and mirror the same structure with unit, integration, and utility helpers.

## Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (preferred) or `pip`
- Docker + Docker Compose (for Postgres and containerised workflows)

## Quick Start

```bash
# 1. Install Python deps into a virtual environment
uv sync  # or: python -m venv .venv && source .venv/bin/activate && pip install -r requirements-dev.txt

# 2. Bring up Postgres
docker compose up -d postgres

# 3. Run the application (auto reload, debugger port exposed)
make run     # wraps the docker dev container
# or locally: PYTHONPATH=src uvicorn app.main:app --app-dir src --reload
```

Open http://localhost:8000/docs for the interactive API documentation.

## VS Code Setup

The repository ships with workspace settings under `.vscode/` so VS Code mirrors the tooling we use in CI (formatting, linting, type checking, debugger attach configs, and Docker-based pytest tasks). To get the full experience, install the following extensions:

- `ms-python.python`
- `ms-python.black-formatter`
- `charliermarsh.ruff`
- `ms-python.mypy-type-checker`
- `ryanluker.vscode-coverage-gutters`

Helpful extras:

- `ms-python.vscode-pylance` (richer language features on top of the Python extension)
- `ms-azuretools.vscode-docker` (manage the Docker tasks and dev container from the sidebar)

After the extensions are installed, reload VS Code so it picks up the workspace interpreter at `.venv`, the `PYTHONPATH=src` wiring, Ruff+Black on save, and the preconfigured pytest/Docker tasks (`Run All Tests`, `pytest:docker`).

## Database & Migrations

- Connection string is managed through `DATABASE_URL`; see `src/app/core/settings.py` for defaults.
- Alembic config lives in `alembic.ini` and `src/migrations`. To generate a revision:

```bash
uv run alembic revision -m "add users table"
uv run alembic upgrade head
```

The test harness coerces the database name to `app_test` (`tests/conftest.py`) and creates it automatically via `ensure_database_exists`.

## Testing Strategy

We enforce two categories of tests:

- **Unit tests** – Pure Python and fast feedback (see `tests/unit`). They cover response envelopes, schema behaviours, domain primitives, and route composition.
- **Integration tests** – Spin up the FastAPI app with dependency overrides and hit real endpoints (`tests/integration`). Database access, validation errors, and persistence logic are exercised here.

Run them either in Docker or locally with the same environment variables:

```bash
# Inside docker (recommended)
make test

# Locally
export PYTHONPATH=src
export ENV=test
export DATABASE_URL=postgresql+asyncpg://app:app@localhost:5432/app
.venv/bin/pytest
```

### Coverage

```bash
make test-cov
# htmlcov/index.html holds the HTML report
```

The coverage config in `pyproject.toml` enforces branch coverage and excludes infrastructure glue that is hard to meaningfully test.

## Quality Gates (pre-commit)

Install hooks once per clone:

```bash
uv run pre-commit install
```

Then run them manually before pushing (or rely on the pre-commit integration in your IDE):

```bash
make pre-commit
```

Hooks included:

- Black (formatting)
- Ruff (linting, import order, pyupgrade)
- MyPy (static typing with Pydantic plugin)
- Pyright (Pylance-equivalent type checks)
- Bandit (basic security linting)

## Best Practices We’re Demonstrating

- **Explicit context objects** (`Context`) instead of passing sessions globally; makes tests deterministic and easy to override.
- **Factory-based responses** (`AppResponse.ok` / `.fail`) centralise API shape and error semantics.
- **Async engine lifecycle** managed via FastAPI lifespan and dependency overrides in tests to avoid connection leaks.
- **Strict asyncio mode** in pytest to surface cross-loop mistakes early.
- **Declarative dependency wiring** so routes remain thin orchestration layers and all business logic lives in `domain`.
- **Environment-aware settings** with `pydantic-settings`, supporting `.env.*` overrides per deployment.
- **Security & quality tooling** baked into CI so there is one command to validate a pull request.

## Contributing

1. Fork + create a feature branch.
2. Run `make pre-commit` and ensure tests & coverage pass locally (`make test-cov`).
3. Submit a PR with context on the behaviour change and tests.

## Troubleshooting

- **`PermissionError` when running pytest locally** – ensure Postgres is running on `localhost:5432`; the tests create `app_test` automatically.
- **Coverage complains about `providers.pyx`** – run coverage with `DEPENDENCY_INJECTOR_DISABLE_C_EXTENSIONS=1` or keep the `*/dependency_injector/*` omit rule.
- **Pylance squiggles for test doubles** – they’re safe to ignore; add `# pyright: ignore[reportArgumentType]` if the noise is distracting or rely on the pre-commit Pyright hook for CI parity.

## Reference Commands

```bash
make run           # dev server inside Docker
make test          # pytest inside Docker
make test-cov      # coverage run + HTML report
make lint          # Ruff lint
make type          # MyPy
make pre-commit    # full quality suite
```

Happy building! Let’s use this template as the source for future FastAPI services, and keep iterating on the best practices as the ecosystem evolves.
