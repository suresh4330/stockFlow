import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:///./test_stockflow.db"
os.environ["JWT_SECRET"] = "test_secret"
os.environ["AUTO_CREATE_TABLES"] = "true"
os.environ["ENVIRONMENT"] = "test"

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def reset_database() -> Generator[None, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    SessionLocal.remove() if hasattr(SessionLocal, "remove") else None


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def auth_headers(client: TestClient, role: str = "admin") -> dict[str, str]:
    payload = {
        "name": f"{role.title()} User",
        "email": f"{role}@example.com",
        "password": "password123",
        "role": role,
    }
    client.post("/api/auth/register", json=payload)
    response = client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

