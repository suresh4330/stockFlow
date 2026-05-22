from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db, require_roles
from ..models import OrderStatus, Product, SalesOrder, SalesOrderItem, StockTransaction, StockTransactionType, User, UserRole
from ..schemas import SalesOrderCreate, SalesOrderRead, SalesOrderUpdateStatus
from ..services.inventory import sync_alerts_for_product

router = APIRouter(prefix="/sales", tags=["sales"])


@router.post("", response_model=SalesOrderRead, status_code=status.HTTP_201_CREATED)
def create_sales_order(
    payload: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.manager, UserRole.staff)),
) -> SalesOrder:
    # 1. First validate all products exist
    items_to_create = []
    total_amount = 0.0

    for item in payload.items:
        product = db.get(Product, item.product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found"
            )
        
        # Calculate line total
        line_total = round(item.quantity * item.unit_price, 2)
        total_amount = round(total_amount + line_total, 2)
        
        items_to_create.append((product, item.quantity, item.unit_price, line_total))

    # 2. If order is immediately completed, validate stock availability
    if payload.status == OrderStatus.completed:
        for product, quantity, _, _ in items_to_create:
            if product.current_stock < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}'. Available: {product.current_stock}, Requested: {quantity}"
                )

    # 3. Create the Sales Order
    order = SalesOrder(
        customer_name=payload.customer_name,
        status=payload.status,
        total_amount=total_amount,
        created_by=current_user.id,
    )
    db.add(order)
    db.flush()  # Populates order.id

    # 4. Create line items and apply stock changes if completed
    for product, quantity, unit_price, line_total in items_to_create:
        order_item = SalesOrderItem(
            sales_order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=unit_price,
            total_price=line_total,
        )
        db.add(order_item)

        if payload.status == OrderStatus.completed:
            # Deduct stock
            product.current_stock -= quantity
            # Create transaction record
            tx = StockTransaction(
                product_id=product.id,
                type=StockTransactionType.stock_out,
                quantity=quantity,
                reason=f"Sales Order #{order.id} (Customer: {order.customer_name})",
                created_by=current_user.id,
            )
            db.add(tx)
            # Sync alerts
            sync_alerts_for_product(db, product)

    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[SalesOrderRead])
def list_sales_orders(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[SalesOrder]:
    return db.query(SalesOrder).order_by(SalesOrder.created_at.desc(), SalesOrder.id.desc()).all()


@router.get("/{order_id}", response_model=SalesOrderRead)
def get_sales_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> SalesOrder:
    order = db.get(SalesOrder, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found"
        )
    return order


@router.put("/{order_id}/status", response_model=SalesOrderRead)
def update_sales_order_status(
    order_id: int,
    payload: SalesOrderUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.manager, UserRole.staff)),
) -> SalesOrder:
    order = db.get(SalesOrder, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found"
        )

    old_status = order.status
    new_status = payload.status

    if old_status == new_status:
        return order

    # Define allowed state transitions
    # pending -> completed
    # pending -> cancelled
    # completed -> cancelled
    # Any other transition is forbidden
    if old_status == OrderStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a cancelled Sales Order."
        )
    
    if old_status == OrderStatus.completed and new_status == OrderStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot revert a completed Sales Order back to pending."
        )

    # Apply business logic based on transition
    if old_status == OrderStatus.pending and new_status == OrderStatus.completed:
        # Validate stock availability for all items first
        for item in order.items:
            product = db.get(Product, item.product_id)
            if product.current_stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}'. Available: {product.current_stock}, Requested: {item.quantity}"
                )

        # Apply stock deduction and log transactions
        for item in order.items:
            product = db.get(Product, item.product_id)
            product.current_stock -= item.quantity
            
            tx = StockTransaction(
                product_id=product.id,
                type=StockTransactionType.stock_out,
                quantity=item.quantity,
                reason=f"Sales Order #{order.id} (Completed)",
                created_by=current_user.id,
            )
            db.add(tx)
            sync_alerts_for_product(db, product)

    elif old_status == OrderStatus.completed and new_status == OrderStatus.cancelled:
        # Reverse the stock deduction (return items to inventory)
        for item in order.items:
            product = db.get(Product, item.product_id)
            product.current_stock += item.quantity
            
            tx = StockTransaction(
                product_id=product.id,
                type=StockTransactionType.stock_in,
                quantity=item.quantity,
                reason=f"Sales Order #{order.id} (Cancelled - Reversal)",
                created_by=current_user.id,
            )
            db.add(tx)
            sync_alerts_for_product(db, product)

    # Transition the status
    order.status = new_status
    db.commit()
    db.refresh(order)
    return order
