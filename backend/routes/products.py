#handles evrything related to the products - listing them, creating new ones, uupdating and deleting. 

from fastapi import APIRouter, HTTPException
from database import db, to_json, to_json_list, valid_id
from models import ProductCreate, ProductUpdate
from datetime import datetime

#a fastapi object that groups all product related endpoints together under this path
router = APIRouter(prefix="/products", tags=["products"])


#fetches every product from mongodb
@router.get("/")
def get_all_products():
    products = list(db.products.find())
    return to_json_list(products)

#FETCHES A SINGLE PRODUCT BY ITS id
@router.get("/{product_id}")
def get_product(product_id: str):
    product = db.products.find_one({"_id": valid_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return to_json(product)

#takes data from the request, adds a timestamp, saves to mongodb and returns the created product
@router.post("/")
def create_product(data: ProductCreate):
    product = data.model_dump()
    product["created_at"] = datetime.utcnow()
    result = db.products.insert_one(product)
    product["_id"] = result.inserted_id
    return to_json(product)

#only updates the fields that were actually sent
@router.put("/{product_id}")
def update_product(product_id: str, data: ProductUpdate):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = db.products.update_one(
        {"_id": valid_id(product_id)},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated"}

#removes a product by ID.
@router.delete("/{product_id}")
def delete_product(product_id: str):
    result = db.products.delete_one({"_id": valid_id(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}