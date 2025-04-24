from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from passlib.context import CryptContext
from ..auth import get_current_user
from .permissions import verify_user_or_admin, verify_is_admin

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()


@router.get("/", response_model=list[schemas.UserShow])
def read_users(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verifica si el usuario es admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción")
    
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.get("/me", response_model=schemas.UserShow)
def read_user_me(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Devuelve el usuario actual
    return current_user

@router.put("/me", response_model=schemas.UserShow)
def update_profile(user_update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/all_users")  # Ejemplo de ruta solo para admins
def get_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_is_admin(current_user)
    users = db.query(models.User).all()
    return users

@router.post("/register", response_model=schemas.UserShow)
def register_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    # Verifica si el usuario ya existe
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    # Crea el nuevo usuario
    hashed_password = pwd_context.hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        is_active=True,
        is_admin=user.is_admin if user.is_admin is not None else False  # Asigna False si no se proporciona
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.get("/{user_id}", response_model=schemas.UserShow)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    # Verifica si el usuario es el mismo o tiene permisos de admin
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    verify_user_or_admin(user_id, current_user)
    
    return user


@router.put("/{user_id}", response_model=schemas.UserShow)
def update_user(
    user_id: int,
    user: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    # Verifica si el usuario es el mismo o tiene permisos de admin
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    verify_user_or_admin(user_id, current_user)
    
    if user.email is not None:
        db_user.email = user.email
    if user.is_active is not None:
        db_user.is_active = user.is_active
    if user.is_admin is not None:
        # Solo un admin puede cambiar el rol de otro usuario
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="No tienes permisos para cambiar rol")
        db_user.is_admin = user.is_admin
    
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.delete("/{user_id}", response_model=schemas.UserShow)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    # Verifica si el usuario es el mismo o tiene permisos de admin
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    verify_user_or_admin(user_id, current_user)
    
    # Elimina el usuario
    db.delete(db_user)
    db.commit()
    
    return db_user

# hacer admin a un usuario
@router.put("/{user_id}/make_admin")
def make_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Solo un admin (o superadmin) puede conceder admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    db_user.is_admin = True
    db.commit()
    db.refresh(db_user)
    return db_user

#cambiar la contraseña del usuario
@router.put("/me/change_password", response_model=schemas.UserShow)
def change_password(
    passwords: schemas.UserChangePassword,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verifica si el usuario es el mismo o tiene permisos de admin
    if not pwd_context.verify(passwords.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña anterior incorrecta")
    
    current_user.hashed_password = pwd_context.hash(passwords.new_password)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user