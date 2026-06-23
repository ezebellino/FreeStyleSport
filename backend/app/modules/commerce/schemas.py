from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

ProductStatus = Literal["draft", "published", "paused", "archived"]


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
