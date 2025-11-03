from src.app.core.version import APP_NAME, APP_VERSION


def test_version_constants() -> None:
    assert APP_NAME == "fastapi-backend"
    assert APP_VERSION == "0.1.0"
