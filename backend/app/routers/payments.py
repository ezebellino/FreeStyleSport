import mercadopago
from ..core.config import MERCADOPAGO_ACCESS_TOKEN
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..auth import get_current_user
from ..models import Order


router = APIRouter()

@router.post("/create")
def create_payment(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1) Verifica que la orden exista y pertenezca a current_user (o es admin).
    # 2) Configura la preferencia de pago con items, precio total, descripción, etc.
    sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)
    preference_data = {
        "items": [
            {
                "title": "Compra en MiTienda",
                "quantity": 1,
                "currency_id": "ARS",
                "unit_price": Order.total  # Ejemplo
            }
        ],
        "payer": {
            "email": current_user.email
        },
        # link a tus rutas de success/failure
        "back_urls": {
            "success": "https://tu-dominio.com/pagos/success",
            "failure": "https://tu-dominio.com/pagos/failure"
        }
    }
    preference_response = sdk.preference().create(preference_data)
    return preference_response
