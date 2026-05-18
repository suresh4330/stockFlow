from sqlalchemy.orm import Session

from .database import SessionLocal, init_db
from .models import Category, Product, StockTransaction, StockTransactionType, Supplier, User, UserRole
from .security import hash_password
from .services.inventory import sync_alerts_for_product


def seed(db: Session) -> None:
    if db.query(User).first():
        return

    admin = User(
        name="Admin User",
        email="admin@stockflow.local",
        password_hash=hash_password("admin12345"),
        role=UserRole.admin,
    )
    manager = User(
        name="Maya Manager",
        email="manager@stockflow.local",
        password_hash=hash_password("manager12345"),
        role=UserRole.manager,
    )
    staff = User(
        name="Sam Staff",
        email="staff@stockflow.local",
        password_hash=hash_password("staff12345"),
        role=UserRole.staff,
    )
    db.add_all([admin, manager, staff])

    electronics = Category(name="Electronics", description="Computer and office electronics")
    office = Category(name="Office supplies", description="Everyday workplace supplies")
    accessories = Category(name="Accessories", description="Peripheral accessories")
    db.add_all([electronics, office, accessories])

    bright_supply = Supplier(
        name="Nora Patel",
        email="nora@brightsupply.local",
        phone="+1-555-0130",
        company_name="Bright Supply Co.",
        address="120 Market Street",
    )
    northwind = Supplier(
        name="Evan Lee",
        email="evan@northwind.local",
        phone="+1-555-0142",
        company_name="Northwind Traders",
        address="48 Warehouse Lane",
    )
    db.add_all([bright_supply, northwind])
    db.flush()

    products = [
        Product(
            name="Wireless Mouse",
            sku="WM-001",
            category_id=electronics.id,
            supplier_id=bright_supply.id,
            purchase_price=14.5,
            selling_price=24.99,
            current_stock=8,
            minimum_stock=10,
            description="Ergonomic wireless mouse",
        ),
        Product(
            name="USB-C Hub",
            sku="UCH-204",
            category_id=accessories.id,
            supplier_id=bright_supply.id,
            purchase_price=28,
            selling_price=49.99,
            current_stock=42,
            minimum_stock=12,
            description="Multi-port USB-C hub",
        ),
        Product(
            name="Notebook Pack",
            sku="NB-120",
            category_id=office.id,
            supplier_id=northwind.id,
            purchase_price=3.25,
            selling_price=6.5,
            current_stock=0,
            minimum_stock=20,
            description="Pack of ruled notebooks",
        ),
        Product(
            name="Mechanical Keyboard",
            sku="MK-410",
            category_id=electronics.id,
            supplier_id=bright_supply.id,
            purchase_price=54,
            selling_price=89,
            current_stock=17,
            minimum_stock=8,
            description="Compact mechanical keyboard",
        ),
    ]
    db.add_all(products)
    db.flush()

    db.add_all(
        [
            StockTransaction(
                product_id=products[0].id,
                type=StockTransactionType.stock_in,
                quantity=50,
                reason="Opening stock",
                created_by=admin.id,
            ),
            StockTransaction(
                product_id=products[0].id,
                type=StockTransactionType.stock_out,
                quantity=42,
                reason="Demo sales",
                created_by=staff.id,
            ),
            StockTransaction(
                product_id=products[2].id,
                type=StockTransactionType.stock_out,
                quantity=20,
                reason="Bulk order",
                created_by=staff.id,
            ),
        ]
    )

    for product in products:
        sync_alerts_for_product(db, product)

    db.commit()


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
