from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Customer schemas
# ---------------------------------------------------------------------------

class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=1, max_length=255)


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, min_length=1, max_length=255)


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Product schemas
# ---------------------------------------------------------------------------

class ProductCreate(BaseModel):
    sku: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    price: Decimal = Field(..., ge=0, decimal_places=2)
    stock: int = Field(..., ge=0)


class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    stock: Optional[int] = Field(None, ge=0)


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sku: str
    name: str
    price: Decimal
    stock: int
    created_at: datetime


# ---------------------------------------------------------------------------
# Order schemas
# ---------------------------------------------------------------------------

class OrderCreate(BaseModel):
    customer_id: int
    product_id: int
    quantity: int = Field(..., gt=0)


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    product_id: int
    quantity: int
    total_price: Decimal
    status: str
    created_at: datetime
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    product_sku: Optional[str] = None

    @classmethod
    def from_order(cls, order) -> "OrderResponse":
        """Build an OrderResponse from an Order ORM instance with loaded relationships."""
        return cls(
            id=order.id,
            customer_id=order.customer_id,
            product_id=order.product_id,
            quantity=order.quantity,
            total_price=order.total_price,
            status=order.status,
            created_at=order.created_at,
            customer_name=order.customer.name if order.customer else None,
            product_name=order.product.name if order.product else None,
            product_sku=order.product.sku if order.product else None,
        )
