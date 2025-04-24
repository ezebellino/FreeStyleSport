from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import get_current_user
from .permissions import verify_is_admin  # Si necesitaras en algún endpoint
from .. import models, schemas

router = APIRouter()

@router.get("/", response_model=schemas.CartShow)
def get_my_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart = db.query(models.Cart).filter_by(user_id=current_user.id).first()
    if not cart:
        # Crear un carrito vacío para el usuario
        cart = models.Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

@router.post("/add", response_model=schemas.CartShow)
def add_to_cart(
    item_data: schemas.AddToCart,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cart = db.query(models.Cart).filter_by(user_id=current_user.id).first()
    if not cart:
        cart = models.Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    
    # Verificar si ya existe CartItem para ese product_id
    cart_item = db.query(models.CartItem).filter_by(cart_id=cart.id, product_id=item_data.product_id).first()
    if cart_item:
        cart_item.quantity += item_data.quantity
    else:
        cart_item = models.CartItem(
            cart_id=cart.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity
        )
        db.add(cart_item)
    db.commit()
    db.refresh(cart)
    return cart

@router.put("/update_item", response_model=schemas.CartShow)
def update_cart_item(
    item_data: schemas.AddToCart,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cart = db.query(models.Cart).filter_by(user_id=current_user.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="El carrito está vacío o no existe.")
    
    cart_item = db.query(models.CartItem).filter_by(cart_id=cart.id, product_id=item_data.product_id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="El item no está en el carrito.")
    
    if item_data.quantity <= 0:
        db.delete(cart_item)
    else:
        cart_item.quantity = item_data.quantity
    
    db.commit()
    db.refresh(cart)
    return cart

@router.delete("/remove_item/{product_id}", response_model=schemas.CartShow)
def remove_item(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cart = db.query(models.Cart).filter_by(user_id=current_user.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="El carrito está vacío o no existe.")
    
    cart_item = db.query(models.CartItem).filter_by(cart_id=cart.id, product_id=product_id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="El item no está en el carrito.")
    
    db.delete(cart_item)
    db.commit()
    db.refresh(cart)
    return cart

@router.delete("/clear", response_model=schemas.CartShow)
def clear_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):

    cart = db.query(models.Cart).filter_by(user_id=current_user.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="El carrito está vacío o no existe.")
    
    # Borramos todos los items
    for item in cart.items:
        db.delete(item)
    db.commit()
    db.refresh(cart)
    return cart

@router.post("/checkout", response_model=schemas.OrderShow)
def checkout_cart(coupon_code: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart = db.query(models.Cart).filter_by(user_id=current_user.id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="El carrito está vacío.")

    new_order = models.Order(
        user_id=current_user.id,
        status="pending",
        total=0
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    total = 0
    for item in cart.items:
        product = db.query(models.Product).filter_by(id=item.product_id).first()
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"No hay stock suficiente para el producto '{product.name}'."
            )
        product.stock -= item.quantity
        detail = models.OrderDetail(
            order_id=new_order.id,
            product_id=product.id,
            quantity=item.quantity,
            price_unit=product.price
        )
        db.add(detail)
        total += product.price * item.quantity

    # Si se proporciona un cupón, validarlo y aplicar el descuento
    discount = 0
    if coupon_code:
        coupon = db.query(models.Coupon).filter(models.Coupon.code == coupon_code).first()
        if not coupon or not coupon.is_valid():
            raise HTTPException(status_code=400, detail="Cupón no es válido")
        discount = total * (coupon.discount_percentage / 100)
        coupon.used_count += 1  # Actualizar el contador
        db.add(coupon)

    new_order.total = total - discount
    db.commit()
    db.refresh(new_order)

    # Vaciar el carrito
    for item in cart.items:
        db.delete(item)
    db.commit()

    return new_order
