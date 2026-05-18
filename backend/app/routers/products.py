from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..dependencies import get_db, require_roles
from ..models import Category, Product, Supplier, UserRole
from ..schemas import ProductCreate, ProductRead, ProductUpdate
from ..services.inventory import sync_alerts_for_product

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
def list_products(
    search: str | None = None,
    category_id: int | None = None,
    stock_status: str | None = Query(default=None, pattern="^(healthy|low|out)$"),
    db: Session = Depends(get_db),
) -> list[Product]:
    query = db.query(Product)
    if search:
        search_like = f"%{search}%"
        query = query.filter((Product.name.ilike(search_like)) | (Product.sku.ilike(search_like)))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if stock_status == "healthy":
        query = query.filter(Product.current_stock > Product.minimum_stock)
    elif stock_status == "low":
        query = query.filter(Product.current_stock <= Product.minimum_stock, Product.current_stock > 0)
    elif stock_status == "out":
        query = query.filter(Product.current_stock == 0)
    return query.order_by(Product.name).all()


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(UserRole.admin, UserRole.manager)),
) -> Product:
    ensure_product_relations(db, payload.category_id, payload.supplier_id)
    existing = db.query(Product).filter(Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists")

    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    sync_alerts_for_product(db, product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(UserRole.admin, UserRole.manager)),
) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "category_id" in update_data or "supplier_id" in update_data:
        ensure_product_relations(
            db,
            update_data.get("category_id", product.category_id),
            update_data.get("supplier_id", product.supplier_id),
        )
    if "sku" in update_data:
        existing = db.query(Product).filter(Product.sku == update_data["sku"], Product.id != product_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists")

    for field, value in update_data.items():
        setattr(product, field, value)

    sync_alerts_for_product(db, product)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(UserRole.admin, UserRole.manager)),
) -> None:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    db.delete(product)
    db.commit()


def ensure_product_relations(db: Session, category_id: int, supplier_id: int) -> None:
    if db.get(Category, category_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category does not exist")
    if db.get(Supplier, supplier_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supplier does not exist")
