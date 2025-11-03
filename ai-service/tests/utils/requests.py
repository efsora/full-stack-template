from __future__ import annotations

from httpx import AsyncClient, Response


async def create_user_request(
    client: AsyncClient, *, user_name: str, user_surname: str, password: str
) -> Response:
    payload = {
        "user_name": user_name,
        "user_surname": user_surname,
        "password": password,
    }
    return await client.post("/api/v1/users", json=payload)
