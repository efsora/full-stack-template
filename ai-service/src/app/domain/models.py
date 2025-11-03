from dataclasses import dataclass
from datetime import datetime

from app.domain.primitives import EmailStr


@dataclass
class User:
    id: int
    user_name: str
    user_surname: str
    email: EmailStr
    created_at: datetime
    updated_at: datetime
