from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class Tenant(Base):
    __tablename__ = "commerce_tenants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )

    categories: Mapped[list["Category"]] = relationship(back_populates="tenant")
    products: Mapped[list["Product"]] = relationship(back_populates="tenant")
    orders: Mapped[list["Order"]] = relationship(back_populates="tenant")
    payment_profile: Mapped["PaymentProfile | None"] = relationship(back_populates="tenant")
    promotion_settings: Mapped["PromotionSettings | None"] = relationship(back_populates="tenant")


class PaymentProfile(Base):
    __tablename__ = "commerce_payment_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(
        ForeignKey("commerce_tenants.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    alias: Mapped[str | None] = mapped_column(String(120), nullable=True)
    account_holder: Mapped[str | None] = mapped_column(String(160), nullable=True)
    account_identifier: Mapped[str | None] = mapped_column(String(80), nullable=True)
    provider: Mapped[str | None] = mapped_column(String(80), nullable=True)
    qr_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    payment_options: Mapped[list[dict[str, object]]] = mapped_column(JSON, default=list)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )

    tenant: Mapped[Tenant] = relationship(back_populates="payment_profile")


class PromotionSettings(Base):
    __tablename__ = "commerce_promotion_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(
        ForeignKey("commerce_tenants.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    hero_badge: Mapped[str | None] = mapped_column(String(120), nullable=True)
    hero_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    hero_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    welcome_coupon_enabled: Mapped[bool] = mapped_column(default=True)
    welcome_coupon_code: Mapped[str] = mapped_column(String(40), default="BIENVENIDA10")
    welcome_discount_rate: Mapped[Decimal] = mapped_column(Numeric(5, 4), default=Decimal("0.10"))
    free_shipping_enabled: Mapped[bool] = mapped_column(default=True)
    free_shipping_threshold: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("100000.00"),
    )
    gift_bonus_enabled: Mapped[bool] = mapped_column(default=True)
    gift_bonus_threshold: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("200000.00"),
    )
    gift_bonus_code: Mapped[str] = mapped_column(String(40), default="PROXIMA10")
    gift_bonus_rate: Mapped[Decimal] = mapped_column(Numeric(5, 4), default=Decimal("0.10"))
    payment_promotions: Mapped[str | None] = mapped_column(Text, nullable=True)
    checkout_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )

    tenant: Mapped[Tenant] = relationship(back_populates="promotion_settings")


class Category(Base):
    __tablename__ = "commerce_categories"
    __table_args__ = (
        UniqueConstraint("tenant_id", "slug", name="uq_commerce_categories_tenant_slug"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(
        ForeignKey("commerce_tenants.id", ondelete="CASCADE"),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )

    tenant: Mapped[Tenant] = relationship(back_populates="categories")
    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "commerce_products"
    __table_args__ = (
        UniqueConstraint("tenant_id", "slug", name="uq_commerce_products_tenant_slug"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(
        ForeignKey("commerce_tenants.id", ondelete="CASCADE"),
        index=True,
    )
    category_id: Mapped[str | None] = mapped_column(
        ForeignKey("commerce_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(160), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft", index=True)
    base_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    compare_at_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="ARS")
    attributes: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )

    tenant: Mapped[Tenant] = relationship(back_populates="products")
    category: Mapped[Category | None] = relationship(back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.sort_order",
    )
    variants: Mapped[list["ProductVariant"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductVariant.sort_order",
    )
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")


class ProductImage(Base):
    __tablename__ = "commerce_product_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    product_id: Mapped[str] = mapped_column(
        ForeignKey("commerce_products.id", ondelete="CASCADE"),
        index=True,
    )
    url: Mapped[str] = mapped_column(Text)
    alt_text: Mapped[str | None] = mapped_column(String(240), nullable=True)
    provider: Mapped[str | None] = mapped_column(String(40), nullable=True)
    provider_public_id: Mapped[str | None] = mapped_column(String(240), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    product: Mapped[Product] = relationship(back_populates="images")


class ProductVariant(Base):
    __tablename__ = "commerce_product_variants"
    __table_args__ = (
        UniqueConstraint("product_id", "sku", name="uq_commerce_variants_product_sku"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    product_id: Mapped[str] = mapped_column(
        ForeignKey("commerce_products.id", ondelete="CASCADE"),
        index=True,
    )
    sku: Mapped[str | None] = mapped_column(String(80), nullable=True)
    label: Mapped[str] = mapped_column(String(160))
    price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    attributes: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )

    product: Mapped[Product] = relationship(back_populates="variants")


class Order(Base):
    __tablename__ = "commerce_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(
        ForeignKey("commerce_tenants.id", ondelete="CASCADE"),
        index=True,
    )
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    payment_status: Mapped[str] = mapped_column(String(32), default="unpaid", index=True)
    customer_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(240), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(80), nullable=True)
    payment_method: Mapped[str] = mapped_column(String(40), default="to_confirm")
    fulfillment_method: Mapped[str] = mapped_column(String(40), default="pickup")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="ARS")
    order_metadata: Mapped[dict[str, object]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )

    tenant: Mapped[Tenant] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderItem.created_at",
    )


class OrderItem(Base):
    __tablename__ = "commerce_order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    order_id: Mapped[str] = mapped_column(
        ForeignKey("commerce_orders.id", ondelete="CASCADE"),
        index=True,
    )
    product_id: Mapped[str | None] = mapped_column(
        ForeignKey("commerce_products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    product_slug: Mapped[str] = mapped_column(String(160))
    product_name: Mapped[str] = mapped_column(String(200))
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    quantity: Mapped[int] = mapped_column(Integer)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="ARS")
    attributes: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    order: Mapped[Order] = relationship(back_populates="items")
    product: Mapped[Product | None] = relationship(back_populates="order_items")
