from sqlalchemy import insert

from app.core.context import Context
from app.infrastructure.db.schema import User as UserModel


async def create_user_in_db(
    ctx: Context, user_name: str, user_surname: str, email: str
) -> UserModel:
    async with ctx.autocommit_scope() as session:
        stmt = (
            insert(UserModel)
            .values(name=user_name, surname=user_surname, email=email)
            .returning(UserModel)
        )
        result = await session.execute(stmt)
        return result.scalar_one()
