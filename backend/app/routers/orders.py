from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.OrderShow)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        # Iniciar una transacción
        db_order = models.Order(
            user_id=order_data.user_id,
            status="pending"
        )
        db.add(db_order)
        db.flush()  # Para asignar el id al order sin hacer commit aún

        total = 0
        for item in order_data.items:
            # Producto y verificar stock
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Producto {item.product_id} no existe")
            
            if product.stock < item.quantity:
                raise HTTPException(status_code=400, detail=f"No hay stock suficiente para el producto '{product.name}'. Quedan {product.stock} unidades.")
            
            # Crear el detalle de orden
            detail = models.OrderDetail(
                order_id=db_order.id,
                product_id=product.id,
                quantity=item.quantity,
                price_unit=product.price
            )
            db.add(detail)

            # Acumular total y descontar stock
            total += product.price * item.quantity
            product.stock -= item.quantity
        
        db_order.total = total
        db.commit()  # Commit único al final
        db.refresh(db_order)
        return db_order

    except Exception as e:
        db.rollback()  # Revertir cualquier cambio en caso de error
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{order_id}", response_model=schemas.OrderShow)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/", response_model=List[schemas.OrderShow])
def get_orders(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    orders = db.query(models.Order).offset(skip).limit(limit).all()
    return orders

@router.put("/{order_id}", response_model=schemas.OrderShow)
def update_order(order_id: int, order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    for key, value in order_data.dict(exclude_unset=True).items():
        setattr(order, key, value)

    db.commit()
    db.refresh(order)
    return order

@router.delete("/{order_id}", response_model=schemas.OrderShow)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    db.delete(order)
    db.commit()
    return order

@router.get("/user/{user_id}", response_model=List[schemas.OrderShow])
def get_orders_by_user(user_id: int, db: Session = Depends(get_db)):
    orders = db.query(models.Order).filter(models.Order.user_id == user_id).all()
    if not orders:
        raise HTTPException(status_code=404, detail="No orders found for this user")
    return orders

@router.get("/status/{status}", response_model=List[schemas.OrderShow])
def get_orders_by_status(status: str, db: Session = Depends(get_db)):
    orders = db.query(models.Order).filter(models.Order.status == status).all()
    if not orders:
        raise HTTPException(status_code=404, detail="No orders found with this status")
    return orders

@router.get("/total/{user_id}", response_model=schemas.OrderTotal)
def get_total_orders_by_user(user_id: int, db: Session = Depends(get_db)):
    total = db.query(func.sum(models.Order.total)).filter(models.Order.user_id == user_id).scalar()
    if total is None:
        raise HTTPException(status_code=404, detail="No orders found for this user")
    return {"total": total}
