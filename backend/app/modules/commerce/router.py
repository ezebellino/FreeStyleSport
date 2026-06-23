from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.errors import ApiError
from app.db.session import get_session
from app.modules.commerce.schemas import ProductCreate, ProductRead, ProductUpdate
from app.modules.commerce.service import (
    create_product,
    get_public_product_by_slug,
    list_admin_products,
    list_public_products,
    update_product,
)
from app.modules.identity.audit import record_audit_event
from app.modules.identity.schemas import PublicUser
from app.modules.identity.service import IdentityService, get_identity_service

router = APIRouter(prefix="/commerce", tags=["commerce"])

SessionDependency = Annotated[AsyncSession, Depends(get_session)]
SettingsDependency = Annotated[Settings, Depends(get_settings)]
IdentityServiceDependency = Annotated[IdentityService, Depends(get_identity_service)]


async def require_store_admin(
    request: Request,
    settings: SettingsDependency,
    identity_service: IdentityServiceDependency,
) -> PublicUser:
    user = await identity_service.current_user(request.cookies.get(settings.session_cookie_name))
    if user.role not in {"admin", "superadmin"}:
        raise ApiError(403, "forbidden", "No tenes permiso para gestionar productos")
    return user


StoreAdminDependency = Annotated[PublicUser, Depends(require_store_admin)]


@router.get("/products", response_model=list[ProductRead])
async def products(
    session: SessionDependency,
    category: str | None = None,
    linea: str | None = None,
) -> list[ProductRead]:
    return list(await list_public_products(session, category, linea))


@router.get("/products/{slug}", response_model=ProductRead)
async def product_detail(slug: str, session: SessionDependency) -> ProductRead:
    return await get_public_product_by_slug(session, slug)


@router.get("/admin/products", response_model=list[ProductRead])
async def admin_products(
    session: SessionDependency,
    admin: StoreAdminDependency,
) -> list[ProductRead]:
    return list(await list_admin_products(session))


@router.post("/admin/products", response_model=ProductRead, status_code=201)
async def admin_create_product(
    payload: ProductCreate,
    request: Request,
    session: SessionDependency,
    admin: StoreAdminDependency,
) -> ProductRead:
    product = await create_product(session, payload)
    await record_audit_event(
        session,
        request,
        "commerce.product_created",
        getattr(admin, "id", None),
    )
    await session.commit()
    return product


@router.put("/admin/products/{product_id}", response_model=ProductRead)
async def admin_update_product(
    product_id: str,
    payload: ProductUpdate,
    request: Request,
    session: SessionDependency,
    admin: StoreAdminDependency,
) -> ProductRead:
    product = await update_product(session, product_id, payload)
    await record_audit_event(
        session,
        request,
        "commerce.product_updated",
        getattr(admin, "id", None),
    )
    await session.commit()
    return product
