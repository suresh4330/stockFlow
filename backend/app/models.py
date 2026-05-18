from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from .database import Base


class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"
    staff = "staff"


class StockTransactionType(str, Enum):
    stock_in = "stock_in"
    stock_out = "stock_out"


class AlertType(str, Enum):
    low_stock = "low_stock"
    out_of_stock = "out_of_stock"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.staff, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    stock_transactions = relationship("StockTransaction", back_populates="created_by_user")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, index=True, nullable=False)
    description = Column(Text, default="", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    products = relationship("Product", back_populates="category")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), default="", nullable=False)
    phone = Column(String(40), default="", nullable=False)
    company_name = Column(String(160), index=True, nullable=False)
    address = Column(Text, default="", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    products = relationship("Product", back_populates="supplier")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), index=True, nullable=False)
    sku = Column(String(80), unique=True, index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    purchase_price = Column(Float, default=0, nullable=False)
    selling_price = Column(Float, default=0, nullable=False)
    current_stock = Column(Integer, default=0, nullable=False)
    minimum_stock = Column(Integer, default=0, nullable=False)
    description = Column(Text, default="", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    stock_transactions = relationship("StockTransaction", back_populates="product", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="product", cascade="all, delete-orphan")


class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    type = Column(SAEnum(StockTransactionType), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    product = relationship("Product", back_populates="stock_transactions")
    created_by_user = relationship("User", back_populates="stock_transactions")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    alert_type = Column(SAEnum(AlertType), nullable=False)
    message = Column(String(255), nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    product = relationship("Product", back_populates="alerts")

