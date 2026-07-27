import pytest

from app.core.errors import ApiError
from app.modules.commerce.schemas import ProductVariantInput
from app.modules.commerce.service import validate_product_variants


def variant(
    *,
    color: str,
    label: str,
    sku: str | None = None,
) -> ProductVariantInput:
    return ProductVariantInput(
        label=label,
        sku=sku,
        stock_quantity=1,
        attributes={"color": color, "talle": label},
    )


def test_validate_product_variants_rejects_duplicate_sku() -> None:
    variants = [
        variant(color="Verde", label="39", sku="NIKE-SB-39"),
        variant(color="Negro", label="41", sku="nike-sb-39"),
    ]

    with pytest.raises(ApiError) as exc:
        validate_product_variants(variants)

    assert exc.value.status_code == 409
    assert exc.value.code == "product_variant_sku_duplicate"


def test_validate_product_variants_rejects_duplicate_color_and_size() -> None:
    variants = [
        variant(color="Verde", label="39"),
        variant(color=" verde ", label="39"),
    ]

    with pytest.raises(ApiError) as exc:
        validate_product_variants(variants)

    assert exc.value.status_code == 409
    assert exc.value.code == "product_variant_duplicate"


def test_validate_product_variants_allows_empty_skus() -> None:
    validate_product_variants(
        [
            variant(color="Verde", label="39", sku=""),
            variant(color="Verde", label="40", sku=None),
        ]
    )
