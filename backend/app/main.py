from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import customers, orders, products


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: run startup/shutdown logic."""
    # Startup — create tables if they don't exist
    await init_db()
    yield
    # Shutdown — nothing to clean up for now


app = FastAPI(
    title="Inventory & Order Management API",
    lifespan=lifespan,
)

# ── CORS Middleware ──────────────────────────────────────────────────────────
origins = [
    origin.strip()
    for origin in settings.CORS_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(orders.router)


# ── Health Check ─────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Simple health-check endpoint."""
    return {"status": "healthy"}
