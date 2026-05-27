from pydantic import BaseModel
from typing import Optional, List


class ProductCreate(BaseModel):
    name: str
    price: float
    discount: float = 0.0
    availability: int = 100
    description: str
    category: str = "General"


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    discount: Optional[float] = None
    availability: Optional[int] = None
    description: Optional[str] = None
    category: Optional[str] = None


class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    interested_product_ids: List[str] = []
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    interested_product_ids: Optional[List[str]] = None
    notes: Optional[str] = None


class StartSession(BaseModel):
    customer_id: Optional[str] = None
    product_id: Optional[str] = None


class ChatMessage(BaseModel):
    session_id: str
    user_text: str


class EndSession(BaseModel):
    session_id: str
    duration_seconds: Optional[int] = None