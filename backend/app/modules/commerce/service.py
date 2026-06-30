import hashlib
import hmac
from collections.abc import Sequence
from decimal import ROUND_HALF_UP, Decimal
from urllib.parse import parse_qsl

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import Settings
from app.core.errors import ApiError
from app.modules.commerce.models import (
    Category,
    Order,
    OrderItem,
    PaymentProfile,
    Product,
    ProductImage,
    ProductVariant,
    Tenant,
)
from app.modules.commerce.schemas import (
    OrderCreate,
    OrderItemCreate,
    OrderUpdate,
    PaymentProfileUpdate,
    ProductCreate,
    ProductUpdate,
)

DEFAULT_TENANT_SLUG = "freestyle"
WELCOME_COUPON_CODE = "BIENVENIDA10"
WELCOME_DISCOUNT_RATE = Decimal("0.10")
FREE_SHIPPING_THRESHOLD = Decimal("100000.00")
GIFT_BONUS_THRESHOLD = Decimal("200000.00")
GIFT_BONUS_RATE = Decimal("0.10")
GIFT_BONUS_CODE = "PROXIMA10"
MONEY_QUANT = Decimal("0.01")
MERCADO_PAGO_API_URL = "https://api.mercadopago.com"
AUDIENCE_FILTERS = {"hombre", "mujer", "unisex", "ninos", "bebes", "kids"}
PAID_REQUIRED_ORDER_STATUSES = {"preparing", "ready", "delivered"}
STOCK_RELEASING_ORDER_STATUSES = {"cancelled"}
CATEGORY_ALIASES = {
    "calzado": {"calzado", "calzados", "zapatillas"},
    "ropa": {"ropa", "indumentaria", "remeras", "pantalones", "conjuntos"},
    "accesorios": {"accesorios", "accesorio"},
    "bebes": {"bebes", "bebe"},
    "ninos": {"ninos", "kids", "infantil"},
}


async def get_default_tenant(session: AsyncSession) -> Tenant | None:
    return await session.scalar(select(Tenant).where(Tenant.slug == DEFAULT_TENANT_SLUG))


async def get_or_create_default_tenant(session: AsyncSession) -> Tenant:
    tenant = await session.scalar(select(Tenant).where(Tenant.slug == DEFAULT_TENANT_SLUG))
    if tenant is not None:
        return tenant

    tenant = Tenant(name="FreeStyle", slug=DEFAULT_TENANT_SLUG)
    session.add(tenant)
    await session.flush()
    return tenant


def empty_payment_profile() -> dict[str, object]:
    return {
        "id": None,
        "alias": None,
        "account_holder": None,
        "account_identifier": None,
        "provider": None,
        "qr_image_url": None,
        "instructions": None,
        "is_active": False,
    }


async def get_payment_profile(session: AsyncSession) -> PaymentProfile | dict[str, object]:
    tenant = await get_default_tenant(session)
    if tenant is None:
        return empty_payment_profile()

    payment_profile = await session.scalar(
        select(PaymentProfile).where(PaymentProfile.tenant_id == tenant.id)
    )
    return payment_profile if payment_profile is not None else empty_payment_profile()


async def update_payment_profile(
    session: AsyncSession,
    payload: PaymentProfileUpdate,
) -> PaymentProfile:
    tenant = await get_or_create_default_tenant(session)
    payment_profile = await session.scalar(
        select(PaymentProfile).where(PaymentProfile.tenant_id == tenant.id)
    )
    if payment_profile is None:
        payment_profile = PaymentProfile(tenant_id=tenant.id)
        session.add(payment_profile)

    for field, value in payload.model_dump().items():
        if isinstance(value, str):
            value = value.strip() or None
        setattr(payment_profile, field, value)

    await session.commit()
    await session.refresh(payment_profile)
    return payment_profile


async def get_or_create_category(
    session: AsyncSession,
    tenant: Tenant,
    category_slug: str | None,
) -> Category | None:
    if not category_slug:
        return None

    category = await session.scalar(
        select(Category).where(Category.tenant_id == tenant.id, Category.slug == category_slug)
    )
    if category is not None:
        return category

    category = Category(
        tenant_id=tenant.id,
        slug=category_slug,
        name=category_slug.replace("-", " ").title(),
    )
    session.add(category)
    await session.flush()
    return category


def _product_options() -> tuple:
    return (
        selectinload(Product.category),
        selectinload(Product.images),
        selectinload(Product.variants),
    )


def _order_options() -> tuple:
    return (
        selectinload(Order.items),
    )


def _slug_tokens(slug: str | None) -> set[str]:
    if not slug:
        return set()
    return {token for token in slug.split("-") if token}


def _attribute_text(product: Product, key: str) -> str | None:
    value = product.attributes.get(key)
    return value.lower() if isinstance(value, str) else None


def _variant_attribute_text(variant: ProductVariant | None, keys: tuple[str, ...]) -> str | None:
    if variant is None:
        return None
    for key in keys:
        value = variant.attributes.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _order_stock_reserved(order: Order) -> bool:
    return bool(order.order_metadata.get("stock_reserved"))


def _set_order_stock_reserved(order: Order, is_reserved: bool) -> None:
    order.order_metadata = {
        **(order.order_metadata or {}),
        "stock_reserved": is_reserved,
    }


def _money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


async def _welcome_discount_for_customer(
    session: AsyncSession,
    tenant: Tenant,
    customer_email: str | None,
    subtotal: Decimal,
) -> Decimal:
    if not customer_email or subtotal <= 0:
        return Decimal("0.00")

    existing_order_id = await session.scalar(
        select(Order.id)
        .where(Order.tenant_id == tenant.id, Order.customer_email == customer_email.lower())
        .limit(1)
    )
    return calculate_welcome_discount(
        has_existing_order=existing_order_id is not None,
        customer_email=customer_email,
        subtotal=subtotal,
    )


def calculate_welcome_discount(
    *,
    has_existing_order: bool,
    customer_email: str | None,
    subtotal: Decimal,
) -> Decimal:
    if not customer_email or subtotal <= 0 or has_existing_order:
        return Decimal("0.00")

    return _money(subtotal * WELCOME_DISCOUNT_RATE)


def order_commercial_benefits(final_total: Decimal) -> dict[str, object]:
    benefits: dict[str, object] = {}
    if final_total > FREE_SHIPPING_THRESHOLD:
        benefits.update(
            {
                "free_shipping": True,
                "free_shipping_label": "Envío gratis",
                "free_shipping_threshold": str(FREE_SHIPPING_THRESHOLD),
            }
        )
    if final_total > GIFT_BONUS_THRESHOLD:
        benefits.update(
            {
                "gift_coupon_code": GIFT_BONUS_CODE,
                "gift_coupon_label": "Bono 10% para próxima compra",
                "gift_coupon_rate": float(GIFT_BONUS_RATE),
                "gift_coupon_threshold": str(GIFT_BONUS_THRESHOLD),
            }
        )
    return benefits


def order_payment_submission_metadata(
    *,
    payment_reference: str | None,
    payment_proof_url: str | None,
) -> dict[str, object]:
    reference = payment_reference.strip() if payment_reference else ""
    proof_url = payment_proof_url.strip() if payment_proof_url else ""
    if not reference and not proof_url:
        return {}

    metadata: dict[str, object] = {
        "payment_submitted": True,
        "payment_review_required": True,
    }
    if reference:
        metadata["payment_reference"] = reference
    if proof_url:
        metadata["payment_proof_url"] = proof_url
    return metadata


def _mp_headers(settings: Settings) -> dict[str, str]:
    if not settings.mercado_pago_access_token:
        raise ApiError(
            503,
            "mercado_pago_not_configured",
            "Mercado Pago no esta configurado para cobrar online",
        )
    return {
        "Authorization": f"Bearer {settings.mercado_pago_access_token}",
        "Content-Type": "application/json",
    }


def _order_code(order_id: str) -> str:
    return order_id[:8].upper()


def _metadata_with_order_fields(order: Order, values: dict[str, object]) -> dict[str, object]:
    return {**(order.order_metadata or {}), **values}


async def create_mercado_pago_preference(
    session: AsyncSession,
    order_id: str,
    settings: Settings,
) -> dict[str, str | None]:
    order = await get_order_by_id(session, order_id)
    if order.payment_status == "paid":
        raise ApiError(409, "order_already_paid", "Este pedido ya tiene el pago confirmado")
    if order.status == "cancelled":
        raise ApiError(409, "order_cancelled", "No se puede pagar una reserva cancelada")

    notification_url = f"{settings.public_api_url.rstrip('/')}/commerce/webhooks/mercado-pago"
    order_url = f"{settings.public_app_url.rstrip('/')}/pedido/{order.id}"
    payload = {
        "items": [
            {
                "title": f"Pedido FreeStyle #{_order_code(order.id)}",
                "quantity": 1,
                "currency_id": order.currency,
                "unit_price": float(order.total),
            }
        ],
        "external_reference": order.id,
        "notification_url": notification_url,
        "back_urls": {
            "success": order_url,
            "pending": order_url,
            "failure": order_url,
        },
        "auto_return": "approved",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            f"{MERCADO_PAGO_API_URL}/checkout/preferences",
            headers=_mp_headers(settings),
            json=payload,
        )
    if response.status_code >= 400:
        raise ApiError(
            502,
            "mercado_pago_preference_failed",
            "No pudimos preparar el pago con Mercado Pago",
        )

    preference = response.json()
    preference_id = str(preference.get("id") or "")
    init_point = str(preference.get("init_point") or "")
    sandbox_init_point = preference.get("sandbox_init_point")
    if not preference_id or not init_point:
        raise ApiError(
            502,
            "mercado_pago_preference_invalid",
            "Mercado Pago no devolvio un link de pago valido",
        )

    order.payment_status = "pending"
    order.order_metadata = _metadata_with_order_fields(
        order,
        {
            "mercado_pago_preference_id": preference_id,
            "mercado_pago_init_point": init_point,
            "mercado_pago_sandbox_init_point": sandbox_init_point,
            "mercado_pago_payment_requested": True,
        },
    )
    await session.commit()
    await session.refresh(order, attribute_names=["items"])
    return {
        "preference_id": preference_id,
        "init_point": init_point,
        "sandbox_init_point": str(sandbox_init_point) if sandbox_init_point else None,
    }


def parse_mercado_pago_signature(signature_header: str | None) -> dict[str, str]:
    if not signature_header:
        return {}
    return {
        key.strip(): value.strip()
        for key, value in parse_qsl(signature_header.replace(",", "&"), keep_blank_values=True)
        if key.strip()
    }


def validate_mercado_pago_webhook_signature(
    *,
    signature_header: str | None,
    request_id: str | None,
    data_id: str | None,
    secret: str | None,
) -> bool:
    if not secret:
        return True
    signature_parts = parse_mercado_pago_signature(signature_header)
    timestamp = signature_parts.get("ts")
    received_signature = signature_parts.get("v1")
    if not timestamp or not received_signature or not request_id or not data_id:
        return False

    manifest = f"id:{data_id};request-id:{request_id};ts:{timestamp};"
    expected_signature = hmac.new(
        secret.encode("utf-8"),
        manifest.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected_signature, received_signature)


def mercado_pago_payment_status(status: str | None) -> str:
    if status == "approved":
        return "paid"
    if status in {"pending", "in_process", "authorized"}:
        return "pending"
    if status in {"rejected", "cancelled"}:
        return "failed"
    if status == "refunded":
        return "refunded"
    return "pending"


async def get_mercado_pago_payment(
    payment_id: str,
    settings: Settings,
) -> dict[str, object]:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            f"{MERCADO_PAGO_API_URL}/v1/payments/{payment_id}",
            headers=_mp_headers(settings),
        )
    if response.status_code >= 400:
        raise ApiError(
            502,
            "mercado_pago_payment_fetch_failed",
            "No pudimos validar el pago con Mercado Pago",
        )
    return response.json()


async def apply_mercado_pago_payment(
    session: AsyncSession,
    payment: dict[str, object],
) -> Order | None:
    external_reference = payment.get("external_reference")
    if not isinstance(external_reference, str) or not external_reference:
        return None

    order = await get_order_by_id(session, external_reference)
    payment_id = str(payment.get("id") or "")
    status = payment.get("status")
    currency = payment.get("currency_id")
    transaction_amount = Decimal(str(payment.get("transaction_amount") or "0"))
    is_matching_order = (
        transaction_amount == Decimal(order.total)
        and (not currency or str(currency).upper() == order.currency.upper())
    )
    next_payment_status = mercado_pago_payment_status(status if isinstance(status, str) else None)
    if next_payment_status == "paid" and not is_matching_order:
        next_payment_status = "pending"

    order.payment_status = next_payment_status
    order.order_metadata = _metadata_with_order_fields(
        order,
        {
            "mercado_pago_payment_id": payment_id,
            "mercado_pago_payment_status": status,
            "mercado_pago_payment_amount": str(transaction_amount),
            "mercado_pago_payment_currency": currency,
            "mercado_pago_payment_validated": is_matching_order,
            "mercado_pago_payment_raw_status_detail": payment.get("status_detail"),
        },
    )
    await session.commit()
    await session.refresh(order, attribute_names=["items"])
    return order


def _order_variant_quantities(order: Order) -> dict[str, int]:
    quantities: dict[str, int] = {}
    for item in order.items:
        variant_id = item.attributes.get("variant_id")
        if isinstance(variant_id, str) and variant_id:
            quantities[variant_id] = quantities.get(variant_id, 0) + item.quantity
    return quantities


def _reserve_variant_quantities(
    variants_by_id: dict[str, ProductVariant | None],
    quantities: dict[str, int],
) -> None:
    for variant_id, quantity in quantities.items():
        variant = variants_by_id.get(variant_id)
        if variant is None:
            raise ApiError(
                409,
                "order_variant_unavailable",
                "No encontramos una variante de la reserva para reservar stock",
            )
        if variant.stock_quantity < quantity:
            raise ApiError(
                409,
                "order_variant_out_of_stock",
                f"No hay stock suficiente para {variant.label}",
            )

    for variant_id, quantity in quantities.items():
        variant = variants_by_id[variant_id]
        variant.stock_quantity -= quantity


def _release_variant_quantities(
    variants_by_id: dict[str, ProductVariant | None],
    quantities: dict[str, int],
) -> None:
    for variant_id, quantity in quantities.items():
        variant = variants_by_id.get(variant_id)
        if variant is not None:
            variant.stock_quantity += quantity


async def _reserve_order_stock(session: AsyncSession, order: Order) -> None:
    if _order_stock_reserved(order):
        return

    quantities = _order_variant_quantities(order)
    variants_by_id = {
        variant_id: await session.get(ProductVariant, variant_id)
        for variant_id in quantities
    }
    _reserve_variant_quantities(variants_by_id, quantities)

    _set_order_stock_reserved(order, True)


async def _release_order_stock(session: AsyncSession, order: Order) -> None:
    if not _order_stock_reserved(order):
        return

    quantities = _order_variant_quantities(order)
    variants_by_id = {
        variant_id: await session.get(ProductVariant, variant_id)
        for variant_id in quantities
    }
    _release_variant_quantities(variants_by_id, quantities)

    _set_order_stock_reserved(order, False)


def product_matches_catalog_filters(
    product: Product,
    category_slug: str | None = None,
    audience_slug: str | None = None,
) -> bool:
    category_tokens = _slug_tokens(product.category.slug if product.category else None)

    if category_slug:
        accepted_category_tokens = CATEGORY_ALIASES.get(category_slug, {category_slug})
        category_match = bool(category_tokens & accepted_category_tokens)
        if not category_match:
            return False

    if audience_slug:
        audience_match = (
            _attribute_text(product, "linea") == audience_slug
            or _attribute_text(product, "genero") == audience_slug
            or audience_slug in category_tokens
        )
        if not audience_match:
            return False

    return True


async def list_public_products(
    session: AsyncSession,
    category_slug: str | None = None,
    audience_slug: str | None = None,
) -> Sequence[Product]:
    tenant = await get_default_tenant(session)
    if tenant is None:
        return []
    if category_slug in AUDIENCE_FILTERS and audience_slug is None:
        audience_slug = category_slug
        category_slug = None
    statement = (
        select(Product)
        .options(*_product_options())
        .where(Product.tenant_id == tenant.id, Product.status == "published")
        .order_by(Product.created_at.desc())
    )
    result = await session.scalars(statement)
    products = result.unique().all()
    return [
        product
        for product in products
        if product_matches_catalog_filters(product, category_slug, audience_slug)
    ]


async def list_admin_products(session: AsyncSession) -> Sequence[Product]:
    tenant = await get_default_tenant(session)
    if tenant is None:
        return []
    result = await session.scalars(
        select(Product)
        .options(*_product_options())
        .where(Product.tenant_id == tenant.id)
        .order_by(Product.created_at.desc())
    )
    return result.unique().all()


async def get_public_product_by_slug(session: AsyncSession, slug: str) -> Product:
    tenant = await get_default_tenant(session)
    if tenant is None:
        raise ApiError(404, "product_not_found", "No encontramos ese producto")
    product = await session.scalar(
        select(Product)
        .options(*_product_options())
        .where(Product.tenant_id == tenant.id, Product.slug == slug, Product.status == "published")
    )
    if product is None:
        raise ApiError(404, "product_not_found", "No encontramos ese producto")
    return product


async def create_product(session: AsyncSession, payload: ProductCreate) -> Product:
    tenant = await get_or_create_default_tenant(session)
    existing = await session.scalar(
        select(Product).where(Product.tenant_id == tenant.id, Product.slug == payload.slug)
    )
    if existing is not None:
        raise ApiError(409, "product_slug_exists", "Ya existe un producto con ese enlace")

    category = await get_or_create_category(session, tenant, payload.category_slug)
    product = Product(
        tenant_id=tenant.id,
        category_id=category.id if category else None,
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        brand=payload.brand,
        status=payload.status,
        base_price=payload.base_price,
        compare_at_price=payload.compare_at_price,
        currency=payload.currency.upper(),
        attributes=payload.attributes,
    )
    product.images = [
        ProductImage(
            url=str(image.url),
            alt_text=image.alt_text,
            provider=image.provider,
            provider_public_id=image.provider_public_id,
            sort_order=image.sort_order,
        )
        for image in payload.images
    ]
    product.variants = [
        ProductVariant(
            sku=variant.sku,
            label=variant.label,
            price=variant.price,
            stock_quantity=variant.stock_quantity,
            attributes=variant.attributes,
            sort_order=variant.sort_order,
        )
        for variant in payload.variants
    ]
    session.add(product)
    await session.commit()
    await session.refresh(product, attribute_names=["category", "images", "variants"])
    return product


async def update_product(session: AsyncSession, product_id: str, payload: ProductUpdate) -> Product:
    tenant = await get_or_create_default_tenant(session)
    product = await session.scalar(
        select(Product)
        .options(*_product_options())
        .where(Product.tenant_id == tenant.id, Product.id == product_id)
    )
    if product is None:
        raise ApiError(404, "product_not_found", "No encontramos ese producto")

    if payload.slug and payload.slug != product.slug:
        existing = await session.scalar(
            select(Product).where(Product.tenant_id == tenant.id, Product.slug == payload.slug)
        )
        if existing is not None:
            raise ApiError(409, "product_slug_exists", "Ya existe un producto con ese enlace")

    update_data = payload.model_dump(
        exclude_unset=True,
        exclude={"category_slug", "images", "variants"},
    )
    for field, value in update_data.items():
        if field == "currency" and isinstance(value, str):
            value = value.upper()
        setattr(product, field, value)

    if "category_slug" in payload.model_fields_set:
        category = await get_or_create_category(session, tenant, payload.category_slug)
        product.category_id = category.id if category else None

    if payload.images is not None:
        product.images = [
            ProductImage(
                url=str(image.url),
                alt_text=image.alt_text,
                provider=image.provider,
                provider_public_id=image.provider_public_id,
                sort_order=image.sort_order,
            )
            for image in payload.images
        ]

    if payload.variants is not None:
        product.variants = [
            ProductVariant(
                sku=variant.sku,
                label=variant.label,
                price=variant.price,
                stock_quantity=variant.stock_quantity,
                attributes=variant.attributes,
                sort_order=variant.sort_order,
            )
            for variant in payload.variants
        ]

    await session.commit()
    await session.refresh(product, attribute_names=["category", "images", "variants"])
    return product


async def create_order(
    session: AsyncSession,
    payload: OrderCreate,
    registered_customer_email: str | None = None,
) -> Order:
    tenant = await get_or_create_default_tenant(session)
    requested_quantities: dict[tuple[str, str | None], int] = {}
    item_details: dict[tuple[str, str | None], OrderItemCreate] = {}
    for item in payload.items:
        key = (item.product_slug, item.variant_id or item.variant_label)
        requested_quantities[key] = requested_quantities.get(key, 0) + item.quantity
        item_details[key] = item

    requested_slugs = {product_slug for product_slug, _variant_key in requested_quantities}

    products = await session.scalars(
        select(Product)
        .options(*_product_options())
        .where(
            Product.tenant_id == tenant.id,
            Product.status == "published",
            Product.slug.in_(requested_slugs),
        )
    )
    products_by_slug = {product.slug: product for product in products.unique().all()}
    missing_slugs = sorted(requested_slugs - set(products_by_slug))
    if missing_slugs:
        raise ApiError(
            404,
            "order_product_unavailable",
            f"No encontramos estos productos: {', '.join(missing_slugs)}",
        )

    currency = next(iter(products_by_slug.values())).currency if products_by_slug else "ARS"
    order_items: list[OrderItem] = []
    subtotal = 0
    for (slug, variant_key), quantity in requested_quantities.items():
        product = products_by_slug[slug]
        requested_item = item_details[(slug, variant_key)]
        requested_variant_id = requested_item.variant_id or ""
        requested_variant_label = requested_item.variant_label
        selected_variant = next(
            (
                variant
                for variant in product.variants
                if (requested_variant_id and variant.id == requested_variant_id)
                or (
                    requested_variant_label
                    and variant.label.lower() == requested_variant_label.lower()
                )
            ),
            None,
        )
        if (requested_variant_id or requested_variant_label) and selected_variant is None:
            raise ApiError(
                409,
                "order_variant_unavailable",
                f"No encontramos la variante seleccionada para {product.name}",
            )
        if selected_variant is not None and selected_variant.stock_quantity < quantity:
            raise ApiError(
                409,
                "order_variant_out_of_stock",
                f"No hay stock suficiente para {product.name} - {selected_variant.label}",
            )
        unit_price = (
            selected_variant.price or product.base_price
            if selected_variant
            else product.base_price
        )
        line_total = unit_price * quantity
        subtotal += line_total
        variant_color = (
            _variant_attribute_text(selected_variant, ("color", "colour", "color_nombre"))
            or requested_item.variant_color
        )
        variant_size = (
            _variant_attribute_text(selected_variant, ("talle", "numero", "size", "medida"))
            or requested_item.variant_size
        )
        variant_display_parts = [
            f"Color: {variant_color}" if variant_color else None,
            f"Talle: {variant_size}" if variant_size else None,
        ]
        variant_display = " · ".join(
            value for value in variant_display_parts if value
        ) or (selected_variant.label if selected_variant else requested_variant_label)
        order_items.append(
            OrderItem(
                product_id=product.id,
                product_slug=product.slug,
                product_name=product.name,
                image_url=product.images[0].url if product.images else None,
                unit_price=unit_price,
                quantity=quantity,
                line_total=line_total,
                currency=product.currency,
                attributes={
                    "category": product.category.slug if product.category else None,
                    "brand": product.brand,
                    "variant_id": (
                        selected_variant.id if selected_variant else requested_variant_id or None
                    ),
                    "variant_label": selected_variant.label
                    if selected_variant
                    else requested_variant_label,
                    "variant_color": variant_color,
                    "variant_size": variant_size,
                    "variant_display": variant_display,
                },
            )
        )

    effective_customer_email = (
        registered_customer_email.lower()
        if registered_customer_email
        else payload.customer_email.lower()
        if payload.customer_email
        else None
    )
    welcome_discount = await _welcome_discount_for_customer(
        session,
        tenant,
        registered_customer_email,
        subtotal,
    )
    total = _money(subtotal - welcome_discount)
    order_metadata: dict[str, object] = {"source": "storefront_cart"}
    order_metadata.update(order_commercial_benefits(total))
    payment_submission = order_payment_submission_metadata(
        payment_reference=payload.payment_reference,
        payment_proof_url=payload.payment_proof_url,
    )
    order_metadata.update(payment_submission)
    if welcome_discount > 0:
        order_metadata.update(
            {
                "coupon_code": WELCOME_COUPON_CODE,
                "discount_label": "Bienvenida 10%",
                "discount_rate": float(WELCOME_DISCOUNT_RATE),
                "discount_total": str(welcome_discount),
                "discount_kind": "welcome_first_order",
            }
        )

    order = Order(
        tenant_id=tenant.id,
        status="pending",
        payment_status="pending" if payment_submission else "unpaid",
        customer_name=payload.customer_name,
        customer_email=effective_customer_email,
        customer_phone=payload.customer_phone,
        payment_method=payload.payment_method,
        fulfillment_method=payload.fulfillment_method,
        notes=payload.notes,
        subtotal=subtotal,
        total=total,
        currency=currency,
        order_metadata=order_metadata,
    )
    order.items = order_items
    session.add(order)
    await _reserve_order_stock(session, order)
    await session.commit()
    await session.refresh(order, attribute_names=["items"])
    return order


async def list_admin_orders(session: AsyncSession) -> Sequence[Order]:
    tenant = await get_default_tenant(session)
    if tenant is None:
        return []
    result = await session.scalars(
        select(Order)
        .options(*_order_options())
        .where(Order.tenant_id == tenant.id)
        .order_by(Order.created_at.desc())
    )
    return result.unique().all()


async def list_orders_by_customer_email(
    session: AsyncSession,
    customer_email: str,
) -> Sequence[Order]:
    tenant = await get_default_tenant(session)
    if tenant is None:
        return []
    result = await session.scalars(
        select(Order)
        .options(*_order_options())
        .where(Order.tenant_id == tenant.id, Order.customer_email == customer_email.lower())
        .order_by(Order.created_at.desc())
    )
    return result.unique().all()


async def get_order_by_id(session: AsyncSession, order_id: str) -> Order:
    tenant = await get_default_tenant(session)
    if tenant is None:
        raise ApiError(404, "order_not_found", "No encontramos esa reserva")

    order = await session.scalar(
        select(Order)
        .options(*_order_options())
        .where(Order.tenant_id == tenant.id, Order.id == order_id)
    )
    if order is None:
        raise ApiError(404, "order_not_found", "No encontramos esa reserva")
    return order


async def update_order(session: AsyncSession, order_id: str, payload: OrderUpdate) -> Order:
    tenant = await get_default_tenant(session)
    if tenant is None:
        raise ApiError(404, "order_not_found", "No encontramos esa reserva")
    order = await session.scalar(
        select(Order)
        .options(*_order_options())
        .where(Order.tenant_id == tenant.id, Order.id == order_id)
    )
    if order is None:
        raise ApiError(404, "order_not_found", "No encontramos esa reserva")

    next_status = payload.status or order.status
    next_payment_status = payload.payment_status or order.payment_status
    if next_status in PAID_REQUIRED_ORDER_STATUSES and next_payment_status != "paid":
        raise ApiError(
            409,
            "order_payment_required",
            "Para avanzar esta reserva primero tenes que confirmar el pago",
        )

    if payload.status is not None:
        is_releasing_stock = (
            order.status not in STOCK_RELEASING_ORDER_STATUSES
            and payload.status in STOCK_RELEASING_ORDER_STATUSES
        )
        is_reserving_stock = (
            order.status in STOCK_RELEASING_ORDER_STATUSES
            and payload.status not in STOCK_RELEASING_ORDER_STATUSES
        )
        if is_releasing_stock:
            await _release_order_stock(session, order)
        elif is_reserving_stock:
            await _reserve_order_stock(session, order)
        order.status = payload.status
    if payload.payment_status is not None:
        order.payment_status = payload.payment_status
    await session.commit()
    await session.refresh(order, attribute_names=["items"])
    return order
