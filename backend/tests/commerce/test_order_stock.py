from decimal import Decimal
from types import SimpleNamespace

import pytest

from app.core.errors import ApiError
from app.modules.commerce.service import (
    GIFT_BONUS_CODE,
    WELCOME_COUPON_CODE,
    _release_variant_quantities,
    _reserve_variant_quantities,
    calculate_welcome_discount,
    order_commercial_benefits,
)


def test_reserve_order_stock_decrements_variant_stock() -> None:
    quantities = {"variant-1": 2}
    variant = SimpleNamespace(label="Verde / 41", stock_quantity=3)

    _reserve_variant_quantities({"variant-1": variant}, quantities)

    assert variant.stock_quantity == 1


def test_release_order_stock_restores_variant_stock_once() -> None:
    quantities = {"variant-1": 2}
    variant = SimpleNamespace(label="Verde / 41", stock_quantity=1)

    _release_variant_quantities({"variant-1": variant}, quantities)

    assert variant.stock_quantity == 3


def test_reserve_order_stock_rejects_unavailable_stock() -> None:
    quantities = {"variant-1": 2}
    variant = SimpleNamespace(label="Verde / 41", stock_quantity=1)

    with pytest.raises(ApiError) as caught:
        _reserve_variant_quantities({"variant-1": variant}, quantities)

    assert caught.value.code == "order_variant_out_of_stock"
    assert variant.stock_quantity == 1


def test_reserve_order_stock_does_not_partially_decrement_when_one_variant_fails() -> None:
    quantities = {"variant-1": 1, "variant-2": 2}
    first_variant = SimpleNamespace(label="Verde / 41", stock_quantity=3)
    second_variant = SimpleNamespace(label="Negra / 42", stock_quantity=1)

    with pytest.raises(ApiError):
        _reserve_variant_quantities(
            {"variant-1": first_variant, "variant-2": second_variant},
            quantities,
        )

    assert first_variant.stock_quantity == 3
    assert second_variant.stock_quantity == 1


def test_welcome_discount_is_ten_percent_for_first_registered_order() -> None:
    discount = calculate_welcome_discount(
        has_existing_order=False,
        customer_email="buyer@example.com",
        subtotal=Decimal("10000.00"),
    )

    assert WELCOME_COUPON_CODE == "BIENVENIDA10"
    assert discount == Decimal("1000.00")


def test_welcome_discount_is_not_reused_for_existing_customer_order() -> None:
    discount = calculate_welcome_discount(
        has_existing_order=True,
        customer_email="buyer@example.com",
        subtotal=Decimal("10000.00"),
    )

    assert discount == Decimal("0.00")


def test_welcome_discount_requires_registered_customer_email() -> None:
    discount = calculate_welcome_discount(
        has_existing_order=False,
        customer_email=None,
        subtotal=Decimal("10000.00"),
    )

    assert discount == Decimal("0.00")


def test_order_commercial_benefits_require_exceeding_free_shipping_threshold() -> None:
    benefits_at_threshold = order_commercial_benefits(Decimal("100000.00"))
    benefits_above_threshold = order_commercial_benefits(Decimal("100000.01"))

    assert "free_shipping" not in benefits_at_threshold
    assert benefits_above_threshold["free_shipping"] is True
    assert benefits_above_threshold["free_shipping_threshold"] == "100000.00"


def test_order_commercial_benefits_require_exceeding_gift_bonus_threshold() -> None:
    benefits_at_threshold = order_commercial_benefits(Decimal("200000.00"))
    benefits_above_threshold = order_commercial_benefits(Decimal("200000.01"))

    assert "gift_coupon_code" not in benefits_at_threshold
    assert benefits_above_threshold["free_shipping"] is True
    assert benefits_above_threshold["gift_coupon_code"] == GIFT_BONUS_CODE
    assert benefits_above_threshold["gift_coupon_rate"] == 0.1
