from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Customer, Order, Product
from ..schemas import OrderCreate, OrderResponse

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.get("/", response_model=List[OrderResponse])
async def list_orders(db: AsyncSession = Depends(get_db)):
    """Return all orders with eager-loaded customer and product details."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.customer), selectinload(Order.product))
        .order_by(Order.id)
    )
    orders = result.scalars().all()
    return [OrderResponse.from_order(order) for order in orders]


@router.post("/", response_model=OrderResponse, status_code=201)
async def create_order(
    payload: OrderCreate, db: AsyncSession = Depends(get_db)
):
    """
    Create an order with transactional stock management.

    Steps:
      1. Acquire a row-level lock on the product (SELECT … FOR UPDATE).
      2. Validate that the product and customer exist.
      3. Verify sufficient stock.
      4. Deduct stock and persist the order in a single transaction.
    """
    async with db.begin():
        # 1. Lock the product row for the duration of this transaction
        product_result = await db.execute(
            select(Product)
            .where(Product.id == payload.product_id)
            .with_for_update()
        )
        product = product_result.scalars().first()

        if not product:
            raise HTTPException(status_code=404, detail="Product not found.")

        # 2. Validate customer existence
        customer = await db.get(Customer, payload.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found.")

        # 3. Check stock availability
        if product.stock < payload.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient stock. Available: {product.stock}, "
                    f"Requested: {payload.quantity}"
                ),
            )

        # 4. Deduct stock and create the order
        product.stock -= payload.quantity

        order = Order(
            customer_id=payload.customer_id,
            product_id=payload.product_id,
            quantity=payload.quantity,
            total_price=product.price * payload.quantity,
        )
        db.add(order)

    # Refresh to load relationships after commit
    await db.refresh(order, attribute_names=["customer", "product"])

    return OrderResponse.from_order(order)
