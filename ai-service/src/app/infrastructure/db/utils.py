from __future__ import annotations

import asyncio

import asyncpg
from sqlalchemy.engine import make_url


def coerce_database(url: str, database: str) -> str:
    """Return the given URL with its database replaced."""
    url_obj = make_url(url)
    coerced = url_obj.set(database=database)
    return coerced.render_as_string(hide_password=False)


async def ensure_database_exists(database_url: str) -> None:
    """Create the database if it does not already exist."""
    url = make_url(database_url)
    if not url.database:
        raise RuntimeError("Database name could not be determined from DATABASE_URL")

    base_driver = url.drivername.split("+", 1)[0]
    admin_url = url.set(database="postgres", drivername=base_driver)
    simple_url = url.set(drivername=base_driver)

    conn = await asyncpg.connect(admin_url.render_as_string(hide_password=False))
    try:
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            url.database,
        )
        if not exists:
            db_name = url.database.replace('"', '""')
            owner = (url.username or "postgres").replace('"', '""')
            await conn.execute(f'CREATE DATABASE "{db_name}" OWNER "{owner}"')
    finally:
        await conn.close()

    test_conn = await asyncpg.connect(simple_url.render_as_string(hide_password=False))
    await test_conn.close()


def ensure_database_exists_sync(database_url: str) -> None:
    """Synchronous helper that delegates to the async variant."""
    asyncio.run(ensure_database_exists(database_url))


async def ensure_schema_exists(database_url: str, schema_name: str) -> None:
    """Create the schema if it does not already exist."""
    # Convert SQLAlchemy URL to asyncpg format if needed
    url = make_url(database_url)
    base_driver = url.drivername.split("+", 1)[0]
    asyncpg_url = url.set(drivername=base_driver)

    conn = await asyncpg.connect(asyncpg_url.render_as_string(hide_password=False))
    try:
        exists = await conn.fetchval(
            "SELECT 1 FROM information_schema.schemata WHERE schema_name = $1",
            schema_name,
        )
        if not exists:
            schema_escaped = schema_name.replace('"', '""')
            await conn.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema_escaped}"')
    finally:
        await conn.close()


async def drop_schema(database_url: str, schema_name: str) -> None:
    """Drop the schema including all its contents."""
    # Convert SQLAlchemy URL to asyncpg format if needed
    url = make_url(database_url)
    base_driver = url.drivername.split("+", 1)[0]
    asyncpg_url = url.set(drivername=base_driver)

    conn = await asyncpg.connect(asyncpg_url.render_as_string(hide_password=False))
    try:
        schema_escaped = schema_name.replace('"', '""')
        await conn.execute(f'DROP SCHEMA IF EXISTS "{schema_escaped}" CASCADE')
    finally:
        await conn.close()
