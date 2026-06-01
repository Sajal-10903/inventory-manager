from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import relationship

from .database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    orders = relationship("Order", back_populates="customer")

    def __repr__(self) -> str:
        return f"<Customer(id={self.id}, name='{self.name}', email='{self.email}')>"


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_products_price_non_negative"),
        CheckConstraint("stock >= 0", name="ck_products_stock_non_negative"),
    )

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    orders = relationship("Order", back_populates="product")

    def __repr__(self) -> str:
        return f"<Product(id={self.id}, sku='{self.sku}', name='{self.name}')>"


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_orders_quantity_positive"),
    )

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(
        Integer, ForeignKey("customers.id"), nullable=False, index=True
    )
    product_id = Column(
        Integer, ForeignKey("products.id"), nullable=False, index=True
    )
    quantity = Column(Integer, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    status = Column(String(50), default="completed", nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    customer = relationship("Customer", back_populates="orders", lazy="selectin")
    product = relationship("Product", back_populates="orders", lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<Order(id={self.id}, customer_id={self.customer_id}, "
            f"product_id={self.product_id}, quantity={self.quantity})>"
        )
