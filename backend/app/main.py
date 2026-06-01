from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db, async_session
from .routers import customers, orders, products
from .seeder import seed_products


import traceback

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: run startup/shutdown logic."""
    try:
        print("Starting database initialization...")
        # Startup — create tables if they don't exist
        await init_db()
        print("Database initialization successful.")
        
        print("Starting product seeder...")
        # Seed the database
        async with async_session() as session:
            await seed_products(session)
        print("Product seeder completed successfully.")
    except Exception as e:
        print("CRITICAL ERROR DURING STARTUP:")
        traceback.print_exc()
        
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
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
