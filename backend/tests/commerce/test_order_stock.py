from types import SimpleNamespace

import pytest

from app.core.errors import ApiError
from app.modules.commerce.service import _release_variant_quantities, _reserve_variant_quantities


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
