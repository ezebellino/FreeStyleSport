import pytest
from app.modules.commerce.schemas import OrderCreate
from pydantic import ValidationError


def test_shipping_order_requires_address_city_and_postal_code() -> None:
    with pytest.raises(ValidationError):
        OrderCreate(
            customer_name="Cliente",
            customer_phone="2245000000",
            fulfillment_method="shipping",
            items=[{"product_slug": "nike-sb", "quantity": 1}],
        )


def test_shipping_order_accepts_shipping_details() -> None:
    order = OrderCreate(
        customer_name="Cliente",
        customer_phone="2245000000",
        fulfillment_method="shipping",
        shipping_address="Buenos Aires 68",
        shipping_city="Dolores",
        shipping_postal_code="7100",
        items=[{"product_slug": "nike-sb", "quantity": 1}],
    )

    assert order.shipping_address == "Buenos Aires 68"
    assert order.shipping_city == "Dolores"
    assert order.shipping_postal_code == "7100"
