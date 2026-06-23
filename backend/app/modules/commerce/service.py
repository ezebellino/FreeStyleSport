from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ApiError
from app.modules.commerce.models import Category, Product, ProductImage, ProductVariant, Tenant
from app.modules.commerce.schemas import ProductCreate, ProductUpdate

DEFAULT_TENANT_SLUG = "freestyle"


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


async def list_public_products(
    session: AsyncSession,
    category_slug: str | None = None,
) -> Sequence[Product]:
    tenant = await get_default_tenant(session)
    if tenant is None:
        return []
    statement = (
        select(Product)
        .options(*_product_options())
        .where(Product.tenant_id == tenant.id, Product.status == "published")
        .order_by(Product.created_at.desc())
    )
    if category_slug:
        statement = statement.join(Category).where(Category.slug == category_slug)
    result = await session.scalars(statement)
    return result.unique().all()


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
