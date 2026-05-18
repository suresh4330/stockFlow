from collections import defaultdict
from datetime import date, timedelta
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..models import Product, StockTransaction, StockTransactionType, Supplier, Category
from ..schemas import DashboardSummary, StockTransactionRead

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    products = db.query(Product).all()
    return DashboardSummary(
        total_products=len(products),
        total_categories=db.query(Category).count(),
        total_suppliers=db.query(Supplier).count(),
        low_stock_items=sum(1 for product in products if 0 < product.current_stock <= product.minimum_stock),
        out_of_stock_items=sum(1 for product in products if product.current_stock == 0),
        total_inventory_value=round(sum(product.current_stock * product.purchase_price for product in products), 2),
        recent_transactions=db.query(StockTransaction).count(),
    )


@router.get("/charts")
def dashboard_charts(db: Session = Depends(get_db)) -> dict[str, Any]:
    category_distribution = (
        db.query(Category.name, func.count(Product.id))
        .join(Product, Product.category_id == Category.id)
        .group_by(Category.name)
        .order_by(Category.name)
        .all()
    )

    transactions = db.query(StockTransaction).order_by(StockTransaction.created_at.asc()).all()
    movement_by_day: dict[date, dict[str, int]] = defaultdict(lambda: {"stock_in": 0, "stock_out": 0})
    for transaction in transactions:
        day = transaction.created_at.date()
        movement_by_day[day][transaction.type.value] += transaction.quantity

    today = date.today()
    stock_movement = []
    for offset in range(29, -1, -1):
        day = today - timedelta(days=offset)
        stock_movement.append({"date": day.isoformat(), **movement_by_day[day]})

    top_products = (
        db.query(Product)
        .order_by(Product.current_stock.desc(), Product.name)
        .limit(7)
        .all()
    )

    return {
        "category_distribution": [
            {"name": category_name, "value": count} for category_name, count in category_distribution
        ],
        "stock_movement": stock_movement,
        "top_products": [
            {"name": product.name, "sku": product.sku, "stock": product.current_stock} for product in top_products
        ],
        "low_stock": [
            {
                "name": product.name,
                "sku": product.sku,
                "current_stock": product.current_stock,
                "minimum_stock": product.minimum_stock,
            }
            for product in db.query(Product)
            .filter(Product.current_stock <= Product.minimum_stock)
            .order_by(Product.current_stock.asc(), Product.name)
            .limit(8)
            .all()
        ],
    }


@router.get("/recent-transactions", response_model=list[StockTransactionRead])
def recent_transactions(db: Session = Depends(get_db)) -> list[StockTransaction]:
    return db.query(StockTransaction).order_by(StockTransaction.created_at.desc()).limit(6).all()


@router.get("/low-stock")
def low_stock_products(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    products = (
        db.query(Product)
        .filter(Product.current_stock <= Product.minimum_stock)
        .order_by(Product.current_stock.asc(), Product.name)
        .all()
    )
    return [
        {
            "id": product.id,
            "name": product.name,
            "sku": product.sku,
            "current_stock": product.current_stock,
            "minimum_stock": product.minimum_stock,
            "status": "out" if product.current_stock == 0 else "low",
        }
        for product in products
    ]

