from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db, require_roles
from ..models import Product, StockTransaction, StockTransactionType, User, UserRole
from ..schemas import StockMovementRequest, StockTransactionRead
from ..services.inventory import sync_alerts_for_product

router = APIRouter(prefix="/stock", tags=["stock"])


@router.post("/in", response_model=StockTransactionRead, status_code=status.HTTP_201_CREATED)
def stock_in(
    payload: StockMovementRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.manager, UserRole.staff)),
) -> StockTransaction:
    return apply_stock_movement(db, payload, StockTransactionType.stock_in, current_user)


@router.post("/out", response_model=StockTransactionRead, status_code=status.HTTP_201_CREATED)
def stock_out(
    payload: StockMovementRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.manager, UserRole.staff)),
) -> StockTransaction:
    return apply_stock_movement(db, payload, StockTransactionType.stock_out, current_user)


@router.get("/transactions", response_model=list[StockTransactionRead])
def list_transactions(
    transaction_type: StockTransactionType | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[StockTransaction]:
    query = db.query(StockTransaction)
    if transaction_type:
        query = query.filter(StockTransaction.type == transaction_type)
    return query.order_by(StockTransaction.created_at.desc(), StockTransaction.id.desc()).all()


@router.get("/transactions/{transaction_id}", response_model=StockTransactionRead)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> StockTransaction:
    transaction = db.get(StockTransaction, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock transaction not found")
    return transaction


def apply_stock_movement(
    db: Session,
    payload: StockMovementRequest,
    transaction_type: StockTransactionType,
    current_user: User,
) -> StockTransaction:
    product = db.get(Product, payload.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if transaction_type == StockTransactionType.stock_out and product.current_stock < payload.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock out quantity exceeds current stock")

    if transaction_type == StockTransactionType.stock_in:
        product.current_stock += payload.quantity
    else:
        product.current_stock -= payload.quantity

    transaction = StockTransaction(
        product_id=product.id,
        type=transaction_type,
        quantity=payload.quantity,
        reason=payload.reason,
        created_by=current_user.id,
    )
    db.add(transaction)
    sync_alerts_for_product(db, product)
    db.commit()
    db.refresh(transaction)
    return transaction

