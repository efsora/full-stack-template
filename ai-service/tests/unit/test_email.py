import pytest

from app.api.schemas.errors import ErrorCode
from app.core.exceptions import DomainValidationError
from app.domain.operations import create_email
from app.domain.primitives import EmailStr


@pytest.mark.parametrize(
    ("user_name", "user_surname", "expected"),
    (
        ("Alice", "Smith", "alice.smith@example.com"),
        ("JOHN", "DOE", "john.doe@example.com"),
        ("Mary-Jane", "OConnor", "mary-jane.oconnor@example.com"),
    ),
)
def test_create_email_returns_expected_address(
    user_name: str, user_surname: str, expected: str
) -> None:
    assert create_email(user_name, user_surname) == expected


def test_email_str_accepts_valid_email() -> None:
    email = EmailStr("user@example.com")
    assert email.value == "user@example.com"


def test_email_str_rejects_invalid_email() -> None:
    with pytest.raises(DomainValidationError) as exc_info:
        EmailStr("invalid-email")

    err = exc_info.value
    assert err.code is ErrorCode.VALIDATION_ERROR
    assert err.status_code == 422
    assert err.errors == [("email", "Invalid email address")]
    assert err.detail == {"value": "invalid-email"}
