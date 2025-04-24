from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.get("/", response_model=list[schemas.CouponShow])
def list_coupons(db: Session = Depends(get_db)):
    coupons = db.query(models.Coupon).all()
    # Filtra solo cupones válidos (por ejemplo)
    valid_coupons = [coupon for coupon in coupons if coupon.is_valid()]
    return valid_coupons

@router.post("/", response_model=schemas.CouponShow)
def create_coupon(coupon: schemas.CouponCreate, db: Session = Depends(get_db)):
    db_coupon = models.Coupon(**coupon.dict())
    db.add(db_coupon)
    db.commit()
    db.refresh(db_coupon)
    return db_coupon

# validate coupon
@router.post("/validate/", response_model=schemas.CouponShow)
def validate_coupon(coupon_code: str, db: Session = Depends(get_db)):
    coupon = db.query(models.Coupon).filter(models.Coupon.code == coupon_code).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    if not coupon.is_valid():
        raise HTTPException(status_code=400, detail="Coupon is not valid")
    return coupon


@router.delete("/{coupon_id}", response_model=schemas.CouponShow)
def delete_coupon(coupon_id: int, db: Session = Depends(get_db)):
    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    db.delete(coupon)
    db.commit()
    return coupon

@router.put("/{coupon_id}", response_model=schemas.CouponShow)
def update_coupon(coupon_id: int, coupon_data: schemas.CouponUpdate, db: Session = Depends(get_db)):
    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    for key, value in coupon_data.dict(exclude_unset=True).items():
        setattr(coupon, key, value)

    db.commit()
    db.refresh(coupon)
    return coupon

@router.get("/{coupon_id}", response_model=schemas.CouponShow)
def get_coupon(coupon_id: int, db: Session = Depends(get_db)):
    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return coupon