import os
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import customers, orders, products


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: run startup/shutdown logic."""
    if settings.DATABASE_URL:
        try:
            from .database import init_db, async_session
            from .seeder import seed_products

            print("Starting database initialization...")
            await init_db()
            print("Database tables created successfully.")

            print("Starting product seeder...")
            async with async_session() as session:
                await seed_products(session)
            print("Product seeder completed successfully.")
        except Exception as e:
            print(f"DB STARTUP ERROR (non-fatal): {e}")
            traceback.print_exc()
    else:
        print("Skipping DB init — DATABASE_URL is not configured.")

    yield
    # Shutdown — nothing to clean up for now


app = FastAPI(
    title="Inventory & Order Management API",
    lifespan=lifespan,
)

# ── CORS Middleware ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting Uvicorn on 0.0.0.0:{port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
