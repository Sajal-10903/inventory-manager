from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Customer, Order
from ..schemas import CustomerCreate, CustomerResponse, CustomerUpdate

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("/", response_model=List[CustomerResponse])
async def list_customers(db: AsyncSession = Depends(get_db)):
    """Return all customers."""
    result = await db.execute(select(Customer).order_by(Customer.id))
    customers = result.scalars().all()
    return customers


@router.post("/", response_model=CustomerResponse, status_code=201)
async def create_customer(
    payload: CustomerCreate, db: AsyncSession = Depends(get_db)
):
    """Create a new customer. Email must be unique."""
    customer = Customer(name=payload.name, email=payload.email)
    db.add(customer)
    try:
        await db.commit()
        await db.refresh(customer)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A customer with this email already exists.",
        )
    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve a single customer by ID."""
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing customer."""
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)

    try:
        await db.commit()
        await db.refresh(customer)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A customer with this email already exists.",
        )
    return customer


@router.delete("/{customer_id}", status_code=204)
async def delete_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a customer. Fails if the customer has existing orders."""
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    # Check for existing orders
    order_check = await db.execute(
        select(Order.id).where(Order.customer_id == customer_id).limit(1)
    )
    if order_check.scalars().first() is not None:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete customer with existing orders.",
        )

    await db.delete(customer)
    await db.commit()
    return None
