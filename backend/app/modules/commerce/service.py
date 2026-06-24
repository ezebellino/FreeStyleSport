from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ApiError
from app.modules.commerce.models import (
    Category,
    Order,
    OrderItem,
    Product,
    ProductImage,
    ProductVariant,
    Tenant,
)
from app.modules.commerce.schemas import OrderCreate, OrderUpdate, ProductCreate, ProductUpdate

DEFAULT_TENANT_SLUG = "freestyle"
AUDIENCE_FILTERS = {"hombre", "mujer", "unisex", "ninos", "bebes", "kids"}
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


async def create_order(session: AsyncSession, payload: OrderCreate) -> Order:
    tenant = await get_or_create_default_tenant(session)
    requested_quantities: dict[str, int] = {}
    for item in payload.items:
        requested_quantities[item.product_slug] = (
            requested_quantities.get(item.product_slug, 0) + item.quantity
        )

    products = await session.scalars(
        select(Product)
        .options(*_product_options())
        .where(
            Product.tenant_id == tenant.id,
            Product.status == "published",
            Product.slug.in_(requested_quantities.keys()),
        )
    )
    products_by_slug = {product.slug: product for product in products.unique().all()}
    missing_slugs = sorted(set(requested_quantities) - set(products_by_slug))
    if missing_slugs:
        raise ApiError(
            404,
            "order_product_unavailable",
            f"No encontramos estos productos: {', '.join(missing_slugs)}",
        )

    currency = next(iter(products_by_slug.values())).currency if products_by_slug else "ARS"
    order_items: list[OrderItem] = []
    subtotal = 0
    for slug, quantity in requested_quantities.items():
        product = products_by_slug[slug]
        unit_price = product.base_price
        line_total = unit_price * quantity
        subtotal += line_total
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
                },
            )
        )

    order = Order(
        tenant_id=tenant.id,
        status="pending",
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        payment_method=payload.payment_method,
        fulfillment_method=payload.fulfillment_method,
        notes=payload.notes,
        subtotal=subtotal,
        total=subtotal,
        currency=currency,
        order_metadata={"source": "storefront_cart"},
    )
    order.items = order_items
    session.add(order)
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

    order.status = payload.status
    await session.commit()
    await session.refresh(order, attribute_names=["items"])
    return order
