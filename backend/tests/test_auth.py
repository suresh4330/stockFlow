from fastapi.testclient import TestClient


def test_register_login_and_me(client: TestClient) -> None:
    register_response = client.post(
        "/api/auth/register",
        json={
            "name": "Admin User",
            "email": "admin@example.com",
            "password": "password123",
            "role": "admin",
        },
    )

    assert register_response.status_code == 201
    assert register_response.json()["email"] == "admin@example.com"

    login_response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "password123"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["role"] == "admin"


def test_duplicate_register_returns_conflict(client: TestClient) -> None:
    payload = {
        "name": "Admin User",
        "email": "admin@example.com",
        "password": "password123",
        "role": "admin",
    }
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 409

