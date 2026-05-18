from sqlalchemy.orm import Session

from ..models import Alert, AlertType, Product


def sync_alerts_for_product(db: Session, product: Product) -> None:
    _sync_alert(
        db=db,
        product=product,
        alert_type=AlertType.low_stock,
        is_active=product.current_stock <= product.minimum_stock,
        message=f"{product.name} is low stock: {product.current_stock}/{product.minimum_stock} units available.",
    )
    _sync_alert(
        db=db,
        product=product,
        alert_type=AlertType.out_of_stock,
        is_active=product.current_stock == 0,
        message=f"{product.name} is out of stock.",
    )


def _sync_alert(db: Session, product: Product, alert_type: AlertType, is_active: bool, message: str) -> None:
    alert = (
        db.query(Alert)
        .filter(
            Alert.product_id == product.id,
            Alert.alert_type == alert_type,
            Alert.is_resolved.is_(False),
        )
        .first()
    )

    if is_active and alert is None:
        db.add(Alert(product_id=product.id, alert_type=alert_type, message=message))
    elif is_active and alert is not None:
        alert.message = message
    elif not is_active and alert is not None:
        alert.is_resolved = True

