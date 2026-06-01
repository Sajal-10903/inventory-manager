import random
import traceback
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .models import Product

TECH_PRODUCTS = [
    {"sku": "IP-15P", "name": "Apple iPhone 15 Pro", "price": 999.00},
    {"sku": "MAC-AIR-M3", "name": "MacBook Air M3", "price": 1099.00},
    {"sku": "SG-S24U", "name": "Samsung Galaxy S24 Ultra", "price": 1299.00},
    {"sku": "SONY-PS5", "name": "Sony PlayStation 5", "price": 499.00},
    {"sku": "LG-65-OLED", "name": "LG 65-inch OLED TV", "price": 1499.00},
    {"sku": "DAIKIN-1.5-AC", "name": "Daikin 1.5 Ton AC", "price": 550.00},
    {"sku": "IPAD-P11", "name": "iPad Pro 11-inch", "price": 799.00},
    {"sku": "AW-S9", "name": "Apple Watch Series 9", "price": 399.00},
    {"sku": "AIRPODS-P2", "name": "AirPods Pro (2nd Gen)", "price": 249.00},
    {"sku": "NS-OLED", "name": "Nintendo Switch OLED", "price": 349.00},
    {"sku": "BOSE-QCU", "name": "Bose QuietComfort Ultra", "price": 429.00},
    {"sku": "PIXEL-8P", "name": "Google Pixel 8 Pro", "price": 999.00},
    {"sku": "XBOX-SX", "name": "Microsoft Xbox Series X", "price": 499.00},
    {"sku": "DELL-XPS15", "name": "Dell XPS 15", "price": 1299.00},
    {"sku": "ASUS-G14", "name": "Asus ROG Zephyrus G14", "price": 1399.00},
    {"sku": "DYSON-V15", "name": "Dyson V15 Detect Vacuum", "price": 749.00},
    {"sku": "CANON-R5", "name": "Canon EOS R5 Camera", "price": 3899.00},
    {"sku": "SONY-XM5", "name": "Sony WH-1000XM5 Headphones", "price": 398.00},
    {"sku": "GOPRO-H12", "name": "GoPro HERO12 Black", "price": 399.00},
    {"sku": "SAM-990-2TB", "name": "Samsung 990 PRO 2TB SSD", "price": 169.00},
]


async def seed_products(session: AsyncSession) -> None:
    """Seed the database with 20 tech products if they don't already exist."""
    try:
        for item in TECH_PRODUCTS:
            result = await session.execute(select(Product).where(Product.sku == item["sku"]))
            if result.scalars().first() is None:
                product = Product(
                    sku=item["sku"],
                    name=item["name"],
                    price=item["price"],
                    stock=random.randint(200, 300)
                )
                session.add(product)

        await session.commit()
        print(f"Seeder finished. {len(TECH_PRODUCTS)} products checked/inserted.")
    except Exception as e:
        print(f"Seeder error (non-fatal): {e}")
        traceback.print_exc()
