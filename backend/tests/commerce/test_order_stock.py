import hashlib
import hmac
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
    mercado_pago_payment_status,
    order_commercial_benefits,
    order_payment_submission_metadata,
    validate_mercado_pago_webhook_signature,
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


def test_order_payment_submission_metadata_tracks_reference_and_proof() -> None:
    metadata = order_payment_submission_metadata(
        payment_reference="  MP-12345  ",
        payment_proof_url="  https://example.com/comprobante.jpg  ",
    )

    assert metadata["payment_submitted"] is True
    assert metadata["payment_review_required"] is True
    assert metadata["payment_reference"] == "MP-12345"
    assert metadata["payment_proof_url"] == "https://example.com/comprobante.jpg"


def test_order_payment_submission_metadata_ignores_empty_values() -> None:
    metadata = order_payment_submission_metadata(payment_reference=" ", payment_proof_url=None)

    assert metadata == {}


def test_mercado_pago_webhook_signature_validation_accepts_valid_signature() -> None:
    secret = "webhook-secret"
    data_id = "123456"
    request_id = "request-1"
    timestamp = "1704908010"
    manifest = f"id:{data_id};request-id:{request_id};ts:{timestamp};"
    signature = hmac.new(
        secret.encode("utf-8"),
        manifest.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    is_valid = validate_mercado_pago_webhook_signature(
        signature_header=f"ts={timestamp},v1={signature}",
        request_id=request_id,
        data_id=data_id,
        secret=secret,
    )

    assert is_valid is True


def test_mercado_pago_webhook_signature_validation_rejects_invalid_signature() -> None:
    is_valid = validate_mercado_pago_webhook_signature(
        signature_header="ts=1704908010,v1=bad",
        request_id="request-1",
        data_id="123456",
        secret="webhook-secret",
    )

    assert is_valid is False


def test_mercado_pago_payment_status_maps_to_internal_payment_status() -> None:
    assert mercado_pago_payment_status("approved") == "paid"
    assert mercado_pago_payment_status("in_process") == "pending"
    assert mercado_pago_payment_status("rejected") == "failed"
    assert mercado_pago_payment_status("refunded") == "refunded"
