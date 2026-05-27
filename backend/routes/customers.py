from fastapi import APIRouter, HTTPException
from database import db, to_json, to_json_list, valid_id
from models import CustomerCreate, CustomerUpdate
from datetime import datetime

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/")
def get_all_customers():
    customers = list(db.customers.find())
    return to_json_list(customers)


@router.get("/{customer_id}")
def get_customer(customer_id: str):
    customer = db.customers.find_one({"_id": valid_id(customer_id)})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return to_json(customer)


@router.post("/")
def create_customer(data: CustomerCreate):
    customer = data.model_dump()
    customer["total_calls"] = 0
    customer["acceptance_rate"] = 0.0
    customer["created_at"] = datetime.utcnow()
    result = db.customers.insert_one(customer)
    customer["_id"] = result.inserted_id
    return to_json(customer)


@router.put("/{customer_id}")
def update_customer(customer_id: str, data: CustomerUpdate):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = db.customers.update_one(
        {"_id": valid_id(customer_id)},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer updated"}


@router.delete("/{customer_id}")
def delete_customer(customer_id: str):
    result = db.customers.delete_one({"_id": valid_id(customer_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted"}