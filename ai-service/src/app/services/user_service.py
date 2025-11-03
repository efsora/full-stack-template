from typing import Annotated

from fastapi import Depends

from app.api.dependencies import get_context
from app.core.context import Context
from app.domain.models import User
from app.domain.operations import create_user_operation

ContextDep = Annotated[Context, Depends(get_context)]


class UserService:
    def __init__(self, ctx: ContextDep) -> None:
        self._ctx = ctx

    async def create_user(self, user_name: str, user_surname: str) -> User:
        return await create_user_operation(self._ctx, user_name, user_surname)
