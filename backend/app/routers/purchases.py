from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db, require_roles
from ..models import OrderStatus, Product, PurchaseOrder, PurchaseOrderItem, StockTransaction, StockTransactionType, Supplier, User, UserRole
from ..schemas import PurchaseOrderCreate, PurchaseOrderRead, PurchaseOrderUpdateStatus
from ..services.inventory import sync_alerts_for_product

router = APIRouter(prefix="/purchases", tags=["purchases"])


@router.post("", response_model=PurchaseOrderRead, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    payload: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.manager, UserRole.staff)),
) -> PurchaseOrder:
    # 1. Validate that the supplier exists
    supplier = db.get(Supplier, payload.supplier_id)
    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {payload.supplier_id} not found"
        )

    # 2. Validate all products exist
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

    # 3. Create the Purchase Order
    order = PurchaseOrder(
        supplier_id=payload.supplier_id,
        status=payload.status,
        total_amount=total_amount,
        created_by=current_user.id,
    )
    db.add(order)
    db.flush()  # Populates order.id

    # 4. Create line items and apply stock changes if completed
    for product, quantity, unit_price, line_total in items_to_create:
        order_item = PurchaseOrderItem(
            purchase_order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=unit_price,
            total_price=line_total,
        )
        db.add(order_item)

        if payload.status == OrderStatus.completed:
            # Replenish stock
            product.current_stock += quantity
            # Create transaction record
            tx = StockTransaction(
                product_id=product.id,
                type=StockTransactionType.stock_in,
                quantity=quantity,
                reason=f"Purchase Order #{order.id} (Supplier: {supplier.company_name})",
                created_by=current_user.id,
            )
            db.add(tx)
            # Sync alerts
            sync_alerts_for_product(db, product)

    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[PurchaseOrderRead])
def list_purchase_orders(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[PurchaseOrder]:
    return db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc(), PurchaseOrder.id.desc()).all()


@router.get("/{order_id}", response_model=PurchaseOrderRead)
def get_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PurchaseOrder:
    order = db.get(PurchaseOrder, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found"
        )
    return order


@router.put("/{order_id}/status", response_model=PurchaseOrderRead)
def update_purchase_order_status(
    order_id: int,
    payload: PurchaseOrderUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.manager, UserRole.staff)),
) -> PurchaseOrder:
    order = db.get(PurchaseOrder, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found"
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
            detail="Cannot modify a cancelled Purchase Order."
        )
    
    if old_status == OrderStatus.completed and new_status == OrderStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot revert a completed Purchase Order back to pending."
        )

    # Apply business logic based on transition
    if old_status == OrderStatus.pending and new_status == OrderStatus.completed:
        # Apply stock addition and log transactions
        for item in order.items:
            product = db.get(Product, item.product_id)
            product.current_stock += item.quantity
            
            tx = StockTransaction(
                product_id=product.id,
                type=StockTransactionType.stock_in,
                quantity=item.quantity,
                reason=f"Purchase Order #{order.id} (Completed)",
                created_by=current_user.id,
            )
            db.add(tx)
            sync_alerts_for_product(db, product)

    elif old_status == OrderStatus.completed and new_status == OrderStatus.cancelled:
        # Validate that current stock is enough to deduct returned items
        for item in order.items:
            product = db.get(Product, item.product_id)
            if product.current_stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot cancel Purchase Order: Product '{product.name}' has insufficient stock ({product.current_stock} available) to reverse the received quantity of {item.quantity}."
                )

        # Reverse the stock addition (deduct from inventory)
        for item in order.items:
            product = db.get(Product, item.product_id)
            product.current_stock -= item.quantity
            
            tx = StockTransaction(
                product_id=product.id,
                type=StockTransactionType.stock_out,
                quantity=item.quantity,
                reason=f"Purchase Order #{order.id} (Cancelled - Reversal)",
                created_by=current_user.id,
            )
            db.add(tx)
            sync_alerts_for_product(db, product)

    # Transition the status
    order.status = new_status
    db.commit()
    db.refresh(order)
    return order
