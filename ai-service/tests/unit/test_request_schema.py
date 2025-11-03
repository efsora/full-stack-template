from app.api.schemas.request import CreateUserRequest


def test_password_strength_weak() -> None:
    request = CreateUserRequest(user_name="Ana", user_surname="Smith", password="abc123")
    assert request.password_strength == "weak"


def test_password_strength_medium() -> None:
    request = CreateUserRequest(user_name="Ana", user_surname="Smith", password="abcdefgh")
    assert request.password_strength == "medium"


def test_password_strength_strong() -> None:
    request = CreateUserRequest(user_name="Ana", user_surname="Smith", password="supersecretpass")
    assert request.password_strength == "strong"
