from dataclasses import dataclass

from app.core.exceptions import DomainValidationError


@dataclass
class EmailStr:
    value: str

    def __post_init__(self) -> None:
        if "@" not in self.value:
            raise DomainValidationError(
                "Invalid email address",
                field="email",
                detail={"value": self.value},
            )
