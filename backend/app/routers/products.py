from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter()

@router.get("/", response_model=list[schemas.ProductShow])
def list_products(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    products = db.query(models.SportsProduct).offset(skip).limit(limit).all()
    return products



@router.get("/{product_id}", response_model=schemas.ProductShow)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter_by(id=product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product
