from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Order, Product
from ..schemas import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("/", response_model=List[ProductResponse])
async def list_products(db: AsyncSession = Depends(get_db)):
    """Return all products."""
    result = await db.execute(select(Product).order_by(Product.id))
    products = result.scalars().all()
    return products


@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(
    payload: ProductCreate, db: AsyncSession = Depends(get_db)
):
    """Create a new product. SKU must be unique."""
    product = Product(
        sku=payload.sku,
        name=payload.name,
        price=payload.price,
        stock=payload.stock,
    )
    db.add(product)
    try:
        await db.commit()
        await db.refresh(product)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A product with this SKU already exists.",
        )
    return product


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve a single product by ID."""
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing product."""
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    try:
        await db.commit()
        await db.refresh(product)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A product with this SKU already exists.",
        )
    return product


@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a product. Fails if the product has existing orders."""
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Check for existing orders
    order_check = await db.execute(
        select(Order.id).where(Order.product_id == product_id).limit(1)
    )
    if order_check.scalars().first() is not None:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete product with existing orders.",
        )

    await db.delete(product)
    await db.commit()
    return None
