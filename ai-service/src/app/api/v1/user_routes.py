from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.api.dependencies import get_context
from app.api.schemas.base_response import AppResponse
from app.api.schemas.request import CreateUserRequest
from app.api.schemas.response import CreateUserResponse
from app.core.context import Context
from app.services.user_service import UserService

router = APIRouter(prefix="/api/v1/users", tags=["users"])

ContextDep = Annotated[Context, Depends(get_context)]
UserServiceDep = Annotated[UserService, Depends()]


@router.post("", response_model=AppResponse[CreateUserResponse], status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    payload: CreateUserRequest,
    ctx: ContextDep,
    user_service: UserServiceDep,
) -> AppResponse[CreateUserResponse]:
    """Create a new user."""
    trace_id = getattr(request.state, "trace_id", None)
    ctx.logger.info(
        f"Creating user: {payload.user_name} {payload.user_surname}",
        trace_id=trace_id,
        user_name=payload.user_name,
        user_surname=payload.user_surname,
    )

    try:
        user_entity = await user_service.create_user(payload.user_name, payload.user_surname)

        user = CreateUserResponse(
            user_name=user_entity.user_name,
            user_surname=payload.user_surname,
            email=user_entity.email.value,
        )

        ctx.logger.info(
            f"User created successfully: {user_entity.email.value}",
            trace_id=trace_id,
            user_id=user_entity.id,
            email=user_entity.email.value,
        )
        return AppResponse.ok(user, message="User created", trace_id=trace_id)
    except Exception as exc:
        ctx.logger.exception(
            f"Failed to create user: {type(exc).__name__}",
            trace_id=trace_id,
            exception_type=type(exc).__name__,
            user_name=payload.user_name,
            user_surname=payload.user_surname,
        )
        raise
