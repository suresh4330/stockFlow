from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..dependencies import get_db, require_roles
from ..models import Alert, AlertType, UserRole
from ..schemas import AlertRead

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/low-stock", response_model=list[AlertRead])
def low_stock_alerts(db: Session = Depends(get_db)) -> list[Alert]:
    return (
        db.query(Alert)
        .filter(Alert.alert_type == AlertType.low_stock, Alert.is_resolved.is_(False))
        .order_by(Alert.created_at.desc())
        .all()
    )


@router.get("/out-of-stock", response_model=list[AlertRead])
def out_of_stock_alerts(db: Session = Depends(get_db)) -> list[Alert]:
    return (
        db.query(Alert)
        .filter(Alert.alert_type == AlertType.out_of_stock, Alert.is_resolved.is_(False))
        .order_by(Alert.created_at.desc())
        .all()
    )


@router.put("/{alert_id}/resolve", response_model=AlertRead)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(UserRole.admin, UserRole.manager)),
) -> Alert:
    alert = db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    alert.is_resolved = True
    db.commit()
    db.refresh(alert)
    return alert
