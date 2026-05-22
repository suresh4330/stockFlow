from fastapi.testclient import TestClient

from .conftest import auth_headers


def create_category_supplier_product(client: TestClient, headers: dict[str, str]) -> tuple[int, int, int]:
    category_response = client.post(
        "/api/categories",
        json={"name": "Electronics", "description": "Devices"},
        headers=headers,
    )
    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

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
    supplier_id = supplier_response.json()["id"]

    product_response = client.post(
        "/api/products",
        json={
            "name": "Wireless Mouse",
            "sku": "WM-001",
            "category_id": category_id,
            "supplier_id": supplier_id,
            "purchase_price": 14.5,
            "selling_price": 24.99,
            "current_stock": 20,
            "minimum_stock": 10,
            "description": "Ergonomic wireless mouse",
        },
        headers=headers,
    )
    assert product_response.status_code == 201
    product_id = product_response.json()["id"]
    return category_id, supplier_id, product_id


def test_sales_order_lifecycle(client: TestClient) -> None:
    headers = auth_headers(client, "admin")
    _, _, product_id = create_category_supplier_product(client, headers)

    # 1. Create a pending Sales Order
    sales_payload = {
        "customer_name": "Acme Corp",
        "status": "pending",
        "items": [
            {"product_id": product_id, "quantity": 5, "unit_price": 24.99}
        ]
    }
    create_res = client.post("/api/sales", json=sales_payload, headers=headers)
    assert create_res.status_code == 201
    order = create_res.json()
    assert order["customer_name"] == "Acme Corp"
    assert order["status"] == "pending"
    assert order["total_amount"] == 124.95
    assert len(order["items"]) == 1

    # Product stock should still be 20 (since order is pending)
    prod_res = client.get(f"/api/products/{product_id}", headers=headers)
    assert prod_res.json()["current_stock"] == 20

    # 2. Complete the Sales Order
    update_res = client.put(f"/api/sales/{order['id']}/status", json={"status": "completed"}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "completed"

    # Product stock should drop to 15 (20 - 5)
    prod_res = client.get(f"/api/products/{product_id}", headers=headers)
    assert prod_res.json()["current_stock"] == 15

    # Check that a Stock transaction was created
    txs_res = client.get("/api/stock/transactions", headers=headers)
    assert txs_res.status_code == 200
    txs = txs_res.json()
    assert len(txs) == 1
    assert txs[0]["type"] == "stock_out"
    assert txs[0]["quantity"] == 5
    assert f"Sales Order #{order['id']}" in txs[0]["reason"]

    # 3. Cancel the completed Sales Order (should reverse stock deduction)
    cancel_res = client.put(f"/api/sales/{order['id']}/status", json={"status": "cancelled"}, headers=headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Product stock should go back up to 20
    prod_res = client.get(f"/api/products/{product_id}", headers=headers)
    assert prod_res.json()["current_stock"] == 20

    # Transaction log should have another entry of type "stock_in"
    txs_res = client.get("/api/stock/transactions", headers=headers)
    txs = txs_res.json()
    assert len(txs) == 2
    assert txs[0]["type"] == "stock_in"
    assert txs[0]["quantity"] == 5
    assert "Cancelled" in txs[0]["reason"]


def test_sales_order_stock_insufficient(client: TestClient) -> None:
    headers = auth_headers(client, "admin")
    _, _, product_id = create_category_supplier_product(client, headers)

    # 1. Attempt to create an immediately completed sales order that exceeds stock
    sales_payload = {
        "customer_name": "Acme Corp",
        "status": "completed",
        "items": [
            {"product_id": product_id, "quantity": 25, "unit_price": 24.99}  # stock is 20
        ]
    }
    create_res = client.post("/api/sales", json=sales_payload, headers=headers)
    assert create_res.status_code == 400
    assert "Insufficient stock" in create_res.json()["detail"]

    # 2. Create pending sales order for 25 items (allowed since it is pending)
    sales_payload["status"] = "pending"
    create_res = client.post("/api/sales", json=sales_payload, headers=headers)
    assert create_res.status_code == 201
    order = create_res.json()

    # Transitioning to completed should fail
    update_res = client.put(f"/api/sales/{order['id']}/status", json={"status": "completed"}, headers=headers)
    assert update_res.status_code == 400
    assert "Insufficient stock" in update_res.json()["detail"]


def test_purchase_order_lifecycle(client: TestClient) -> None:
    headers = auth_headers(client, "admin")
    _, supplier_id, product_id = create_category_supplier_product(client, headers)

    # 1. Create pending Purchase Order
    po_payload = {
        "supplier_id": supplier_id,
        "status": "pending",
        "items": [
            {"product_id": product_id, "quantity": 10, "unit_price": 14.50}
        ]
    }
    create_res = client.post("/api/purchases", json=po_payload, headers=headers)
    assert create_res.status_code == 201
    order = create_res.json()
    assert order["status"] == "pending"
    assert order["total_amount"] == 145.00

    # Stock should still be 20
    prod_res = client.get(f"/api/products/{product_id}", headers=headers)
    assert prod_res.json()["current_stock"] == 20

    # 2. Complete the Purchase Order
    update_res = client.put(f"/api/purchases/{order['id']}/status", json={"status": "completed"}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "completed"

    # Stock should increase to 30 (20 + 10)
    prod_res = client.get(f"/api/products/{product_id}", headers=headers)
    assert prod_res.json()["current_stock"] == 30

    # 3. Cancel the completed Purchase Order (should deduct received stock, if available)
    cancel_res = client.put(f"/api/purchases/{order['id']}/status", json={"status": "cancelled"}, headers=headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Stock should return to 20
    prod_res = client.get(f"/api/products/{product_id}", headers=headers)
    assert prod_res.json()["current_stock"] == 20


def test_purchase_order_cancel_fails_if_stock_sold(client: TestClient) -> None:
    headers = auth_headers(client, "admin")
    _, supplier_id, product_id = create_category_supplier_product(client, headers)

    # 1. Create and complete a Purchase Order for 10 units
    po_payload = {
        "supplier_id": supplier_id,
        "status": "completed",
        "items": [
            {"product_id": product_id, "quantity": 10, "unit_price": 14.50}
        ]
    }
    create_res = client.post("/api/purchases", json=po_payload, headers=headers)
    assert create_res.status_code == 201
    order = create_res.json()

    # Stock is now 30 (20 original + 10 received)
    prod_res = client.get(f"/api/products/{product_id}", headers=headers)
    assert prod_res.json()["current_stock"] == 30

    # Sell 25 units manually (so stock drops to 5)
    sell_res = client.post("/api/stock/out", json={"product_id": product_id, "quantity": 25, "reason": "Big sale"}, headers=headers)
    assert sell_res.status_code == 201

    # Stock is 5
    prod_res = client.get(f"/api/products/{product_id}", headers=headers)
    assert prod_res.json()["current_stock"] == 5

    # 2. Attempt to cancel the Purchase Order (should try to deduct 10 units, but stock is 5)
    cancel_res = client.put(f"/api/purchases/{order['id']}/status", json={"status": "cancelled"}, headers=headers)
    assert cancel_res.status_code == 400
    assert "insufficient stock" in cancel_res.json()["detail"]
