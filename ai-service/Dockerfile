# Dev image with hot reload + debugpy
FROM python:3.11-slim AS dev

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1) Copy requirements first
COPY requirements-dev.txt requirements.txt /app/

# 2) Copy project metadata & code BEFORE installing
COPY pyproject.toml README.md /app/
COPY src/ /app/src/
COPY tests/ /app/tests/

# 3) Install dev deps
RUN pip install --upgrade pip && pip install -r /app/requirements-dev.txt

# Debugger (explicit)
RUN pip install debugpy

ENV PYTHONPATH=/app/src
EXPOSE 8000 5678

CMD ["python", "-m", "uvicorn", "app.main:app", "--app-dir", "src", "--host", "0.0.0.0", "--port", "8000", "--reload"]
