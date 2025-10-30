from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
import structlog

from app.api.schemas.base_response import AppResponse
from app.api.schemas.request import CreateUserRequest
from app.api.schemas.response import CreateUserResponse
from app.services.user_service import UserService

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1/users", tags=["users"])

UserServiceDep = Annotated[UserService, Depends()]


@router.post("", response_model=AppResponse[CreateUserResponse], status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    payload: CreateUserRequest,
    user_service: UserServiceDep,
) -> AppResponse[CreateUserResponse]:
    """Create a new user."""
    trace_id = getattr(request.state, "trace_id", None)
    logger.info(
        "create_user_endpoint_called",
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

        logger.info(
            "create_user_endpoint_success",
            trace_id=trace_id,
            user_id=user_entity.id,
        )
        return AppResponse.ok(user, message="User created", trace_id=trace_id)
    except Exception as exc:
        logger.exception(
            "create_user_endpoint_failed",
            trace_id=trace_id,
            exception_type=type(exc).__name__,
        )
        raise
