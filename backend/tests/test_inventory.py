from fastapi.testclient import TestClient

from .conftest import auth_headers


def create_category_supplier_product(client: TestClient, headers: dict[str, str]) -> int:
    category_response = client.post(
        "/api/categories",
        json={"name": "Electronics", "description": "Devices"},
        headers=headers,
    )
    assert category_response.status_code == 201

    supplier_response = client.post(
        "/api/suppliers",
        json={
            "name": "Nora Patel",
            "email": "nora@example.com",
            "phone": "555-0101",
            "company_name": "Bright Supply Co.",
            "address": "120 Market Street",
        },
        headers=headers,
    )
    assert supplier_response.status_code == 201

    product_response = client.post(
        "/api/products",
        json={
            "name": "Wireless Mouse",
            "sku": "WM-001",
            "category_id": category_response.json()["id"],
            "supplier_id": supplier_response.json()["id"],
            "purchase_price": 14.5,
            "selling_price": 24.99,
            "current_stock": 8,
            "minimum_stock": 10,
            "description": "Ergonomic wireless mouse",
        },
        headers=headers,
    )
    assert product_response.status_code == 201
    return product_response.json()["id"]


def test_product_crud_and_low_stock_alert(client: TestClient) -> None:
    headers = auth_headers(client, "admin")
    product_id = create_category_supplier_product(client, headers)

    product_response = client.get(f"/api/products/{product_id}")
    assert product_response.status_code == 200
    assert product_response.json()["current_stock"] == 8

    alerts_response = client.get("/api/alerts/low-stock")
    assert alerts_response.status_code == 200
    assert len(alerts_response.json()) == 1

    update_response = client.put(
        f"/api/products/{product_id}",
        json={"current_stock": 25},
        headers=headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["current_stock"] == 25

    assert client.delete(f"/api/products/{product_id}", headers=headers).status_code == 204


def test_stock_in_and_stock_out_update_inventory(client: TestClient) -> None:
    headers = auth_headers(client, "staff")
    admin_headers = auth_headers(client, "admin")
    product_id = create_category_supplier_product(client, admin_headers)

    stock_in = client.post(
        "/api/stock/in",
        json={"product_id": product_id, "quantity": 50, "reason": "New purchase"},
        headers=headers,
    )
    assert stock_in.status_code == 201

    product_after_in = client.get(f"/api/products/{product_id}").json()
    assert product_after_in["current_stock"] == 58

    stock_out = client.post(
        "/api/stock/out",
        json={"product_id": product_id, "quantity": 5, "reason": "Sale"},
        headers=headers,
    )
    assert stock_out.status_code == 201

    product_after_out = client.get(f"/api/products/{product_id}").json()
    assert product_after_out["current_stock"] == 53


def test_stock_out_cannot_go_negative(client: TestClient) -> None:
    headers = auth_headers(client, "admin")
    product_id = create_category_supplier_product(client, headers)

    response = client.post(
        "/api/stock/out",
        json={"product_id": product_id, "quantity": 99, "reason": "Invalid sale"},
        headers=headers,
    )

    assert response.status_code == 400
    assert "exceeds current stock" in response.json()["detail"]

