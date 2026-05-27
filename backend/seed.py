from database import db
from datetime import datetime

# Clear existing data
db.products.delete_many({})
db.customers.delete_many({})

# Products
products = [
    {
        "name": "AquaPure Water Purifier",
        "price": 8999,
        "discount": 15,
        "availability": 50,
        "description": "6-stage RO+UV purification, 10L tank, auto shutoff. 1 year warranty.",
        "category": "Home Appliances",
        "created_at": datetime.utcnow()
    },
    {
        "name": "FitPro Smart Watch",
        "price": 4499,
        "discount": 20,
        "availability": 75,
        "description": "Heart rate, SpO2, sleep tracking, 7 day battery. Works with iOS and Android.",
        "category": "Electronics",
        "created_at": datetime.utcnow()
    },
    {
        "name": "ChefMate Air Fryer 5L",
        "price": 6299,
        "discount": 10,
        "availability": 30,
        "description": "5L capacity, 8 preset modes, 360 degree rapid air, easy clean basket.",
        "category": "Kitchen",
        "created_at": datetime.utcnow()
    },
    {
        "name": "SleepWell Ortho Mattress",
        "price": 12999,
        "discount": 25,
        "availability": 20,
        "description": "7 inch high density foam, pressure relief layer, anti microbial cover.",
        "category": "Home",
        "created_at": datetime.utcnow()
    },
    {
        "name": "StudyPro Laptop Stand",
        "price": 1299,
        "discount": 5,
        "availability": 200,
        "description": "Aluminium, 6 height levels, foldable, fits 10 to 17 inch laptops.",
        "category": "Accessories",
        "created_at": datetime.utcnow()
    }
]

inserted_products = db.products.insert_many(products)
product_ids = [str(pid) for pid in inserted_products.inserted_ids]
print(f"Inserted {len(product_ids)} products")

# Customers
customers = [
    {
        "name": "Priya Sharma",
        "phone": "+919876543210",
        "email": "priya@example.com",
        "interested_product_ids": [product_ids[0], product_ids[2]],
        "notes": "Interested in kitchen and home appliances. Very responsive.",
        "total_calls": 0,
        "acceptance_rate": 0.0,
        "created_at": datetime.utcnow()
    },
    {
        "name": "Ravi Verma",
        "phone": "+919123456780",
        "email": "ravi@example.com",
        "interested_product_ids": [product_ids[1]],
        "notes": "Fitness enthusiast. Open to tech gadgets.",
        "total_calls": 0,
        "acceptance_rate": 0.0,
        "created_at": datetime.utcnow()
    },
    {
        "name": "Ananya Iyer",
        "phone": "+918800112233",
        "email": "ananya@example.com",
        "interested_product_ids": [product_ids[3], product_ids[4]],
        "notes": "Works from home. Interested in ergonomic and home products.",
        "total_calls": 0,
        "acceptance_rate": 0.0,
        "created_at": datetime.utcnow()
    },
    {
        "name": "Kiran Patel",
        "phone": "+917700223344",
        "email": "kiran@example.com",
        "interested_product_ids": [product_ids[0], product_ids[1]],
        "notes": "Budget conscious. Responds well to discount offers.",
        "total_calls": 0,
        "acceptance_rate": 0.0,
        "created_at": datetime.utcnow()
    }
]

inserted_customers = db.customers.insert_many(customers)
print(f"Inserted {len(inserted_customers.inserted_ids)} customers")
print("Seed complete")