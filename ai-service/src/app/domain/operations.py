from app.core.context import Context
from app.db_ops.user_db_ops import create_user_in_db
from app.domain.models import User
from app.domain.primitives import EmailStr


def create_email(user_name: str, user_surname: str) -> str:
    return f"{user_name.lower()}.{user_surname.lower()}@example.com"


async def create_user_operation(ctx: Context, user_name: str, user_surname: str) -> User:
    email_address = create_email(user_name, user_surname)
    user_entity = await create_user_in_db(ctx, user_name, user_surname, email_address)

    return User(
        id=user_entity.id,
        user_name=user_entity.name,
        user_surname=user_entity.surname,
        email=EmailStr(user_entity.email),
        created_at=user_entity.created_at,
        updated_at=user_entity.updated_at,
    )
