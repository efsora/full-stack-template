from httpx import AsyncClient
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from tests.utils.requests import create_user_request

from app.infrastructure.db.schema import User


@pytest.mark.asyncio
async def test_create_user_persists_record(
    client: AsyncClient,
    session_maker: async_sessionmaker[AsyncSession],
    sample_user_payload: dict[str, str],
) -> None:
    response = await create_user_request(client, **sample_user_payload)

    assert response.status_code == 201
    body = response.json()
    assert body["message"] == "User created"
    assert body["data"]["user_name"] == sample_user_payload["user_name"]
    assert body["data"]["user_surname"] == sample_user_payload["user_surname"]
    assert body["data"]["email"] == "alice.smith@example.com"

    async with session_maker() as read_session:
        result = await read_session.execute(
            select(User).where(User.email == "alice.smith@example.com")
        )
        user = result.scalar_one()
        assert user.name == sample_user_payload["user_name"]
        assert user.surname == sample_user_payload["user_surname"]


@pytest.mark.asyncio
async def test_create_user_validation_error(client: AsyncClient) -> None:
    payload = {
        "user_name": "Al",  # too short (min_length=3)
        "user_surname": "Smith",
        "password": "short",
    }

    response = await create_user_request(client, **payload)

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    field_map = {error["field"]: error["reason"] for error in body["error"]["errors"]}
    assert any(field.endswith("user_name") for field in field_map)
    assert any(field.endswith("password") for field in field_map)
