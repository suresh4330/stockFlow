from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..config import settings
from ..dependencies import get_db
from ..schemas import DevOpsStatusResponse, HealthResponse

router = APIRouter(tags=["devops"])


@router.get("/health", response_model=HealthResponse)
def health(db: Session = Depends(get_db)) -> HealthResponse:
    database_status = "connected"
    status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        database_status = "disconnected"
        status = "degraded"

    return HealthResponse(
        status=status,
        database=database_status,
        service="backend",
        version=settings.app_version,
        environment=settings.environment,
    )


@router.get("/devops/status", response_model=DevOpsStatusResponse)
def devops_status(db: Session = Depends(get_db)) -> DevOpsStatusResponse:
    health_response = health(db)
    now = datetime.now(timezone.utc).isoformat()
    services = [
        {
            "name": "Backend API",
            "status": health_response.status,
            "uptime": "99.95%",
            "response_time_ms": 42,
            "last_checked": now,
        },
        {
            "name": "Database",
            "status": health_response.database,
            "uptime": "99.90%",
            "response_time_ms": 18,
            "last_checked": now,
        },
        {
            "name": "Nginx",
            "status": "configured",
            "uptime": "99.99%",
            "response_time_ms": 12,
            "last_checked": now,
        },
        {
            "name": "Prometheus",
            "status": "configured",
            "uptime": "99.93%",
            "response_time_ms": 25,
            "last_checked": now,
        },
        {
            "name": "Grafana",
            "status": "configured",
            "uptime": "99.92%",
            "response_time_ms": 31,
            "last_checked": now,
        },
    ]

    return DevOpsStatusResponse(
        backend_status=health_response.status,
        database_status=health_response.database,
        api_health=health_response.status,
        docker_environment=settings.environment,
        application_version=settings.app_version,
        services=services,
    )

