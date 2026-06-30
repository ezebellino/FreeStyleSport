from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

ProductStatus = Literal["draft", "published", "paused", "archived"]
OrderStatus = Literal["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]
PaymentStatus = Literal["unpaid", "pending", "paid", "failed", "refunded"]
PaymentMethod = Literal["to_confirm", "cash", "transfer", "mercado_pago", "card", "wallet"]
FulfillmentMethod = Literal["pickup", "shipping", "local_payment"]


class PaymentProfileBase(BaseModel):
    alias: str | None = Field(default=None, max_length=120)
    account_holder: str | None = Field(default=None, max_length=160)
    account_identifier: str | None = Field(default=None, max_length=80)
    provider: str | None = Field(default=None, max_length=80)
    qr_image_url: str | None = Field(default=None, max_length=1000)
    instructions: str | None = Field(default=None, max_length=1000)
    is_active: bool = True


class PaymentProfileUpdate(PaymentProfileBase):
    pass


class PaymentProfileRead(PaymentProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: str | None = None


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    description: str | None = None


class ProductImageInput(BaseModel):
    url: HttpUrl
    alt_text: str | None = Field(default=None, max_length=240)
    provider: str | None = Field(default=None, max_length=40)
    provider_public_id: str | None = Field(default=None, max_length=240)
    sort_order: int = 0


class ProductImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    url: str
    alt_text: str | None = None
    provider: str | None = None
    provider_public_id: str | None = None
    sort_order: int


class ProductVariantInput(BaseModel):
    sku: str | None = Field(default=None, max_length=80)
    label: str = Field(min_length=1, max_length=160)
    price: Decimal | None = Field(default=None, ge=0)
    stock_quantity: int = Field(default=0, ge=0)
    attributes: dict[str, object] = Field(default_factory=dict)
    sort_order: int = 0


class ProductVariantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sku: str | None = None
    label: str
    price: Decimal | None = None
    stock_quantity: int
    attributes: dict[str, object]
    sort_order: int


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=160, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    brand: str | None = Field(default=None, max_length=120)
    category_slug: str | None = Field(default=None, max_length=120)
    status: ProductStatus = "draft"
    base_price: Decimal = Field(ge=0)
    compare_at_price: Decimal | None = Field(default=None, ge=0)
    currency: str = Field(default="ARS", min_length=3, max_length=3)
    attributes: dict[str, object] = Field(default_factory=dict)
    images: list[ProductImageInput] = Field(default_factory=list)
    variants: list[ProductVariantInput] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(
        default=None,
        min_length=1,
        max_length=160,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    description: str | None = None
    brand: str | None = Field(default=None, max_length=120)
    category_slug: str | None = Field(default=None, max_length=120)
    status: ProductStatus | None = None
    base_price: Decimal | None = Field(default=None, ge=0)
    compare_at_price: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    attributes: dict[str, object] | None = None
    images: list[ProductImageInput] | None = None
    variants: list[ProductVariantInput] | None = None


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    description: str | None = None
    brand: str | None = None
    status: str
    base_price: Decimal
    compare_at_price: Decimal | None = None
    currency: str
    attributes: dict[str, object]
    category: CategoryRead | None = None
    images: list[ProductImageRead]
    variants: list[ProductVariantRead]


class OrderItemCreate(BaseModel):
    product_slug: str = Field(min_length=1, max_length=160)
    quantity: int = Field(default=1, ge=1, le=99)
    variant_id: str | None = Field(default=None, max_length=36)
    variant_label: str | None = Field(default=None, max_length=160)
    variant_color: str | None = Field(default=None, max_length=80)
    variant_size: str | None = Field(default=None, max_length=80)


class OrderCreate(BaseModel):
    customer_name: str | None = Field(default=None, max_length=160)
    customer_email: str | None = Field(default=None, max_length=240)
    customer_phone: str | None = Field(default=None, max_length=80)
    payment_method: PaymentMethod = "to_confirm"
    fulfillment_method: FulfillmentMethod = "pickup"
    payment_reference: str | None = Field(default=None, max_length=240)
    payment_proof_url: str | None = Field(default=None, max_length=1000)
    notes: str | None = Field(default=None, max_length=1000)
    items: list[OrderItemCreate] = Field(min_length=1, max_length=80)


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str | None = None
    product_slug: str
    product_name: str
    image_url: str | None = None
    unit_price: Decimal
    quantity: int
    line_total: Decimal
    currency: str
    attributes: dict[str, object]


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    payment_status: str
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    payment_method: str
    fulfillment_method: str
    notes: str | None = None
    subtotal: Decimal
    total: Decimal
    currency: str
    order_metadata: dict[str, object] = Field(default_factory=dict, serialization_alias="metadata")
    created_at: datetime
    items: list[OrderItemRead]


class OrderUpdate(BaseModel):
    status: OrderStatus | None = None
    payment_status: PaymentStatus | None = None


class CloudinarySignatureRead(BaseModel):
    cloud_name: str
    api_key: str
    folder: str
    timestamp: int
    signature: str
    upload_url: str
