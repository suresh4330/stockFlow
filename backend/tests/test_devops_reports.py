from fastapi.testclient import TestClient

from .conftest import auth_headers
from .test_inventory import create_category_supplier_product


def test_health_endpoint(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["database"] == "connected"


def test_dashboard_summary(client: TestClient) -> None:
    headers = auth_headers(client, "admin")
    create_category_supplier_product(client, headers)

    response = client.get("/api/dashboard/summary")

    assert response.status_code == 200
    assert response.json()["total_products"] == 1
    assert response.json()["low_stock_items"] == 1


def test_inventory_report_and_csv_export(client: TestClient) -> None:
    headers = auth_headers(client, "manager")
    admin_headers = auth_headers(client, "admin")
    create_category_supplier_product(client, admin_headers)

    report_response = client.get("/api/reports/inventory", headers=headers)
    assert report_response.status_code == 200
    assert report_response.json()[0]["sku"] == "WM-001"

    csv_response = client.get("/api/reports/export/csv", headers=headers)
    assert csv_response.status_code == 200
    assert "text/csv" in csv_response.headers["content-type"]
    assert "Wireless Mouse" in csv_response.text


def test_devops_status_endpoint(client: TestClient) -> None:
    response = client.get("/api/devops/status")

    assert response.status_code == 200
    assert response.json()["backend_status"] == "ok"
    assert any(service["name"] == "Prometheus" for service in response.json()["services"])
