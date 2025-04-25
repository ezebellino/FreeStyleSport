from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime


class UserBase(BaseModel):
    email: EmailStr
    is_active: bool = True

class UserCreate(UserBase):
    password: str  # Campo necesario para crear, pero no se devuelve tal cual
    is_admin: Optional[bool] = False  # Solo para admins
    avatar_url: Optional[str] = None  
    
class UserShow(UserBase):
    id: int
    is_admin: bool = False
    avatar_url: Optional[str] = None  
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    address: Optional[str] = None
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    avatar_url: Optional[str] = None  
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True

class UserChangePassword(BaseModel):
    old_password: str
    new_password: str

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    type: Optional[str] = "product"  # "sports" o "food" # Para determinar el tipo de producto
    
    image_url : Optional[str] = None  # URL de la imagen del producto

class ProductCreate(ProductBase):
    size: str                # Campo obligatorio
    color: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None  

class ProductShow(ProductBase):
    id: int
    size: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    type: str  # "sports" o "food" # Para determinar el tipo de producto

    class Config:
        from_attributes = True

# Schema específico para SportsProduct
class SportsProductCreate(ProductCreate):
    size: str
    color: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    type: Optional[str] = "sports_product"  # Valor por defecto para productos deportivos

class SportsProductShow(ProductShow):
    id: int
    size: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None

    class Config:
        from_attributes = True

# Schema específico para FoodProduct
class FoodProductCreate(ProductCreate):
    expiration_date: date
    brand: Optional[str] = None
    type: Optional[str] = "food_product"  # Valor por defecto para productos alimenticios

class FoodProductShow(ProductShow):
    id: int
    expiration_date: date
    brand: Optional[str] = None

    class Config:
        from_attributes = True

class OrderDetailCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    user_id: int
    items: List[OrderDetailCreate]

class OrderDetailShow(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_unit: float
    
    class Config:
        from_attributes = True

class OrderShow(BaseModel):
    id: int
    user_id: int
    total: float
    status: str
    items: List[OrderDetailShow]

    class Config:
        from_attributes = True

class OrderTotal(BaseModel):
    id: int
    total: float

    class Config:
        from_attributes = True        
        
class CartItemBase(BaseModel):
    product_id: int
    quantity: int
    
class CartItemShow(BaseModel):
    id: int
    
    class Config:
        from_attributes = True
        
class CartShow(BaseModel):
    id: int
    items: List[CartItemShow] = []

    class Config:
        from_attributes = True
        
class AddToCart(BaseModel):
    product_id: int
    quantity: int = 1
    
    
class CouponBase(BaseModel):
    code: str
    discount: float
    expiration_date: date
    is_active: bool = True

class CouponShow(CouponBase):
    id: int
    active: bool
    usage_limit: int
    used_count: int

    class Config:
        from_attributes = True
        
class CouponCreate(CouponBase):
    usage_limit: int
    used_count: int = 0

    class Config:
        from_attributes = True
        
class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount: Optional[float] = None
    expiration_date: Optional[date] = None
    is_active: Optional[bool] = None
    usage_limit: Optional[int] = None
    used_count: Optional[int] = None

    class Config:
        from_attributes = True
        
class CouponValidate(BaseModel):
    code: str

    class Config:
        from_attributes = True