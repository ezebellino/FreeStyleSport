from fastapi import HTTPException
from .. import models


def verify_is_admin(current_user: models.User):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403, 
            detail="Solo un administrador puede realizar esta acción"
        )
        
def verify_user_or_admin(user_id: int, current_user: models.User):
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(
            status_code=403, 
            detail="No tienes permisos para realizar esta acción"
        )
        