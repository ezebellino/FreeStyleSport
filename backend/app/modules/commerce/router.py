import hashlib
import time
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.errors import ApiError
from app.db.session import get_session
from app.modules.commerce.schemas import (
    CloudinarySignatureRead,
    MercadoPagoPreferenceRead,
    MercadoPagoWebhookRead,
    OrderCreate,
    OrderRead,
    OrderUpdate,
    PaymentProfileRead,
    PaymentProfileUpdate,
    ProductCreate,
    ProductRead,
    ProductUpdate,
)
from app.modules.commerce.service import (
    apply_mercado_pago_payment,
    create_mercado_pago_preference,
    create_order,
    create_product,
    get_mercado_pago_payment,
    get_order_by_id,
    get_payment_profile,
    get_public_product_by_slug,
    list_admin_orders,
    list_admin_products,
    list_orders_by_customer_email,
    list_public_products,
    update_order,
    update_payment_profile,
    update_product,
    validate_mercado_pago_webhook_signature,
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


async def optional_current_user(
    request: Request,
    settings: Settings,
    identity_service: IdentityService,
) -> PublicUser | None:
    try:
        return await identity_service.current_user(
            request.cookies.get(settings.session_cookie_name)
        )
    except ApiError as exc:
        if exc.status_code == 401:
            return None
        raise


def _cloudinary_signature(settings: Settings) -> CloudinarySignatureRead:
    if (
        not settings.cloudinary_cloud_name
        or not settings.cloudinary_api_key
        or not settings.cloudinary_api_secret
    ):
        raise ApiError(
            503,
            "cloudinary_not_configured",
            "Cloudinary no esta configurado para subir imagenes",
        )

    timestamp = int(time.time())
    folder = settings.cloudinary_upload_folder
    signature_payload = f"folder={folder}&timestamp={timestamp}{settings.cloudinary_api_secret}"
    signature = hashlib.sha1(signature_payload.encode("utf-8")).hexdigest()
    return CloudinarySignatureRead(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        folder=folder,
        timestamp=timestamp,
        signature=signature,
        upload_url=f"https://api.cloudinary.com/v1_1/{settings.cloudinary_cloud_name}/image/upload",
    )


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


@router.get("/payment-profile", response_model=PaymentProfileRead)
async def payment_profile(session: SessionDependency) -> PaymentProfileRead:
    return await get_payment_profile(session)


@router.post("/orders", response_model=OrderRead, status_code=201)
async def order_create(
    payload: OrderCreate,
    request: Request,
    session: SessionDependency,
    settings: SettingsDependency,
    identity_service: IdentityServiceDependency,
) -> OrderRead:
    user = await optional_current_user(request, settings, identity_service)
    order = await create_order(
        session,
        payload,
        registered_customer_email=user.email if user and user.role == "customer" else None,
    )
    await record_audit_event(session, request, "commerce.order_created", None)
    await session.commit()
    return order


@router.get("/orders/{order_id}", response_model=OrderRead)
async def order_detail(order_id: str, session: SessionDependency) -> OrderRead:
    return await get_order_by_id(session, order_id)


@router.post("/orders/{order_id}/mercado-pago/preference", response_model=MercadoPagoPreferenceRead)
async def order_mercado_pago_preference(
    order_id: str,
    session: SessionDependency,
    settings: SettingsDependency,
) -> MercadoPagoPreferenceRead:
    return await create_mercado_pago_preference(session, order_id, settings)


@router.post("/webhooks/mercado-pago", response_model=MercadoPagoWebhookRead)
async def mercado_pago_webhook(
    request: Request,
    session: SessionDependency,
    settings: SettingsDependency,
) -> MercadoPagoWebhookRead:
    payload = await request.json()
    data = payload.get("data") if isinstance(payload, dict) else None
    payment_id = data.get("id") if isinstance(data, dict) else None
    if not payment_id:
        payment_id = request.query_params.get("data.id") or request.query_params.get("id")
    if not payment_id:
        return MercadoPagoWebhookRead(received=True)

    is_valid_signature = validate_mercado_pago_webhook_signature(
        signature_header=request.headers.get("x-signature"),
        request_id=request.headers.get("x-request-id"),
        data_id=str(payment_id),
        secret=settings.mercado_pago_webhook_secret,
    )
    if not is_valid_signature:
        raise ApiError(401, "invalid_mercado_pago_signature", "Webhook de Mercado Pago invalido")

    payment = await get_mercado_pago_payment(str(payment_id), settings)
    await apply_mercado_pago_payment(session, payment)
    return MercadoPagoWebhookRead(received=True)


@router.get("/my/orders", response_model=list[OrderRead])
async def my_orders(
    request: Request,
    session: SessionDependency,
    settings: SettingsDependency,
    identity_service: IdentityServiceDependency,
) -> list[OrderRead]:
    user = await identity_service.current_user(request.cookies.get(settings.session_cookie_name))
    return list(await list_orders_by_customer_email(session, user.email))


@router.get("/admin/products", response_model=list[ProductRead])
async def admin_products(
    session: SessionDependency,
    admin: StoreAdminDependency,
) -> list[ProductRead]:
    return list(await list_admin_products(session))


@router.get("/admin/uploads/cloudinary-signature", response_model=CloudinarySignatureRead)
async def admin_cloudinary_signature(
    settings: SettingsDependency,
    admin: StoreAdminDependency,
) -> CloudinarySignatureRead:
    return _cloudinary_signature(settings)


@router.get("/admin/payment-profile", response_model=PaymentProfileRead)
async def admin_payment_profile(
    session: SessionDependency,
    admin: StoreAdminDependency,
) -> PaymentProfileRead:
    return await get_payment_profile(session)


@router.put("/admin/payment-profile", response_model=PaymentProfileRead)
async def admin_update_payment_profile(
    payload: PaymentProfileUpdate,
    request: Request,
    session: SessionDependency,
    admin: StoreAdminDependency,
) -> PaymentProfileRead:
    payment_profile = await update_payment_profile(session, payload)
    await record_audit_event(
        session,
        request,
        "commerce.payment_profile_updated",
        getattr(admin, "id", None),
    )
    await session.commit()
    return payment_profile


@router.get("/admin/orders", response_model=list[OrderRead])
async def admin_orders(
    session: SessionDependency,
    admin: StoreAdminDependency,
) -> list[OrderRead]:
    return list(await list_admin_orders(session))


@router.patch("/admin/orders/{order_id}", response_model=OrderRead)
async def admin_update_order(
    order_id: str,
    payload: OrderUpdate,
    request: Request,
    session: SessionDependency,
    admin: StoreAdminDependency,
) -> OrderRead:
    order = await update_order(session, order_id, payload)
    await record_audit_event(
        session,
        request,
        "commerce.order_updated",
        getattr(admin, "id", None),
    )
    await session.commit()
    return order


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
