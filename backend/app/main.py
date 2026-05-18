from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import alerts, auth, categories, dashboard, devops, products, reports, stock, suppliers

try:
    from prometheus_fastapi_instrumentator import Instrumentator
except Exception:  # pragma: no cover - only used when optional dependency is missing locally.
    Instrumentator = None


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    if settings.auto_create_tables:
        init_db()
    yield


app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root() -> dict[str, str]:
    return {"service": "StockFlow backend", "version": settings.app_version}


@app.get("/api")
def api_root() -> dict[str, str]:
    return {"service": "StockFlow API", "status": "ready"}


app.include_router(auth.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(suppliers.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(stock.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(devops.router, prefix="/api")

if Instrumentator is not None:
    Instrumentator().instrument(app).expose(app, endpoint="/api/metrics", include_in_schema=False)
