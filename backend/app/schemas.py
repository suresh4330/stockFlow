from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from .models import AlertType, StockTransactionType, UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.staff


class LoginRequest(BaseModel):
    email: str
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: UserRole
    created_at: datetime


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = ""


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = None


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    created_at: datetime


class SupplierCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = ""
    phone: str = ""
    company_name: str = Field(min_length=2, max_length=160)
    address: str = ""


class SupplierUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: str | None = None
    phone: str | None = None
    company_name: str | None = Field(default=None, min_length=2, max_length=160)
    address: str | None = None


class SupplierRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str
    company_name: str
    address: str
    created_at: datetime


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    sku: str = Field(min_length=2, max_length=80)
    category_id: int
    supplier_id: int
    purchase_price: float = Field(ge=0)
    selling_price: float = Field(ge=0)
    current_stock: int = Field(ge=0)
    minimum_stock: int = Field(ge=0)
    description: str = ""


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    sku: str | None = Field(default=None, min_length=2, max_length=80)
    category_id: int | None = None
    supplier_id: int | None = None
    purchase_price: float | None = Field(default=None, ge=0)
    selling_price: float | None = Field(default=None, ge=0)
    current_stock: int | None = Field(default=None, ge=0)
    minimum_stock: int | None = Field(default=None, ge=0)
    description: str | None = None


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str
    category_id: int
    supplier_id: int
    purchase_price: float
    selling_price: float
    current_stock: int
    minimum_stock: int
    description: str
    created_at: datetime
    updated_at: datetime


class StockMovementRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    reason: str = Field(min_length=2, max_length=255)


class StockTransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    type: StockTransactionType
    quantity: int
    reason: str
    created_by: int
    created_at: datetime


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    alert_type: AlertType
    message: str
    is_resolved: bool
    created_at: datetime


class DashboardSummary(BaseModel):
    total_products: int
    total_categories: int
    total_suppliers: int
    low_stock_items: int
    out_of_stock_items: int
    total_inventory_value: float
    recent_transactions: int


class HealthResponse(BaseModel):
    status: str
    database: str
    service: str
    version: str
    environment: str


class DevOpsStatusResponse(BaseModel):
    backend_status: str
    database_status: str
    api_health: str
    docker_environment: str
    application_version: str
    services: list[dict[str, Any]]

