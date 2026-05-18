import csv
from io import StringIO
from typing import Any

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from ..dependencies import get_db, require_roles
from ..models import Product, StockTransaction, UserRole

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/inventory")
def inventory_report(
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(UserRole.admin, UserRole.manager)),
) -> list[dict[str, Any]]:
    products = db.query(Product).order_by(Product.name).all()
    return [format_inventory_row(product) for product in products]


@router.get("/low-stock")
def low_stock_report(
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(UserRole.admin, UserRole.manager)),
) -> list[dict[str, Any]]:
    products = (
        db.query(Product)
        .filter(Product.current_stock <= Product.minimum_stock)
        .order_by(Product.current_stock.asc(), Product.name)
        .all()
    )
    return [format_inventory_row(product) for product in products]


@router.get("/transactions")
def transaction_report(
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(UserRole.admin, UserRole.manager)),
) -> list[dict[str, Any]]:
    transactions = db.query(StockTransaction).order_by(StockTransaction.created_at.desc()).all()
    return [
        {
            "id": transaction.id,
            "product_id": transaction.product_id,
            "product_name": transaction.product.name,
            "type": transaction.type.value,
            "quantity": transaction.quantity,
            "reason": transaction.reason,
            "created_by": transaction.created_by_user.email,
            "created_at": transaction.created_at.isoformat(),
        }
        for transaction in transactions
    ]


@router.get("/export/csv")
def export_inventory_csv(
    report: str = "inventory",
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(UserRole.admin, UserRole.manager)),
) -> Response:
    if report == "low-stock":
        rows = low_stock_report(db, _)
    elif report == "transactions":
        rows = transaction_report(db, _)
    else:
        rows = inventory_report(db, _)

    output = StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    else:
        output.write("message\nNo data available\n")

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{report}-report.csv"'},
    )


def format_inventory_row(product: Product) -> dict[str, Any]:
    status = "healthy"
    if product.current_stock == 0:
        status = "out"
    elif product.current_stock <= product.minimum_stock:
        status = "low"

    return {
        "id": product.id,
        "name": product.name,
        "sku": product.sku,
        "category": product.category.name,
        "supplier": product.supplier.company_name,
        "current_stock": product.current_stock,
        "minimum_stock": product.minimum_stock,
        "purchase_price": product.purchase_price,
        "selling_price": product.selling_price,
        "inventory_value": round(product.current_stock * product.purchase_price, 2),
        "status": status,
    }

