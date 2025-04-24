# app/routers/products_admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import get_current_user
from .permissions import verify_is_admin
from .. import models, schemas

router = APIRouter()

@router.post("/create/", response_model=schemas.ProductShow)
def create_product(
    product_data: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_is_admin(current_user)
    new_product = models.Product(**product_data.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.put("/{product_id}", response_model=schemas.ProductShow)
def update_product(
    product_id: int,
    product_data: schemas.ProductBase,  # o un ProductUpdate
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_is_admin(current_user)
    db_product = db.query(models.Product).filter_by(id=product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    db_product.name = product_data.name
    db_product.description = product_data.description
    db_product.price = product_data.price
    db_product.stock = product_data.stock
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}", response_model=schemas.ProductShow)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_is_admin(current_user)
    db_product = db.query(models.Product).filter_by(id=product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    db.delete(db_product)
    db.commit()
    return db_product



@router.post("/sports/", response_model=schemas.SportsProductShow)
def create_sports_product(
    product_data: schemas.SportsProductCreate,
    db: Session = Depends(get_db)
):
    product = models.SportsProduct(
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        stock=product_data.stock,
        size=product_data.size,
        color=product_data.color,
        brand=product_data.brand,
        model=product_data.model
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.post("/food/", response_model=schemas.FoodProductShow)
def create_food_product(
    product_data: schemas.FoodProductCreate,
    db: Session = Depends(get_db)
):
    # Crea la instancia de FoodProduct
    product = models.FoodProduct(
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        stock=product_data.stock,
        expiration_date=product_data.expiration_date,
        brand=product_data.brand
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product