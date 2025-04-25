# app/models.py
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Date, DateTime, func
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    address = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    avatar_url = Column(String, nullable=True)  # URL de la imagen del avatar
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # relationships, si necesitas
    orders = relationship("Order", back_populates="user")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    type = Column(String(50), nullable=False, default='product')  # Discriminador para identificar el tipo de producto
    image_url = Column(String, nullable=True)  # URL de la imagen del producto

    __mapper_args__ = {
        'polymorphic_identity': 'product',
        'polymorphic_on': type
    }
    
    # Relación con OrderDetail
    order_details = relationship("OrderDetail", back_populates="product")

class SportsProduct(Product):
    __tablename__ = "sports_products"

    id = Column(Integer, ForeignKey("products.id"), primary_key=True)
    size = Column(String, nullable=True)  # Por ejemplo: "S", "M", "L", "XL" o numérico
    color = Column(String, nullable=True)  # Color del producto
    brand = Column(String, nullable=True)  # Marca del producto
    model = Column(String, nullable=True)  # Modelo del producto
    
    __mapper_args__ = {
        'polymorphic_identity': 'sports_product',
    }
    

class FoodProduct(Product):
    __tablename__ = "food_products"

    id = Column(Integer, ForeignKey("products.id"), primary_key=True)
    expiration_date = Column(Date)  # Fecha de vencimiento
    brand = Column(String, nullable=True)  # Marca del producto

    __mapper_args__ = {
        'polymorphic_identity': 'food_product',
    }

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total = Column(Float, default=0.0)
    status = Column(String, default="pending")

    # Relación con OrderDetail
    items = relationship("OrderDetail", back_populates="order")
    
    # Relación inversa con User
    user = relationship("User", back_populates="orders")

class OrderDetail(Base):
    __tablename__ = "order_details"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    price_unit = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_details") # si quieres la relación inversa

class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Relación para leer los items
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")
    
    
class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")  # si necesitas acceder al producto directamente
    
    
class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    discount_percentage = Column(Float, nullable=False)  # Por ejemplo, 10.0 para 10%
    expiration_date = Column(DateTime, nullable=False)
    active = Column(Boolean, default=True)  # Si el cupón está activo o no
    usage_limit = Column(Integer, default=1)  # Número máximo de usos
    used_count = Column(Integer, default=0)  # Veces que se ha usado

    def is_valid(self):
        """Verifica si el cupón es válido (no expirado, activo y dentro del límite de uso)."""
        if not self.active:
            return False
        if datetime.utcnow() > self.expiration_date:
            return False
        if self.used_count >= self.usage_limit:
            return False
        return True