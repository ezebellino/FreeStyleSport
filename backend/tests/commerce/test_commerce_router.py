from fastapi.testclient import TestClient

from app.main import create_app


class HealthyProbe:
    async def check(self) -> None:
        return None


def test_commerce_routes_are_registered() -> None:
    client = TestClient(create_app(readiness_probe=HealthyProbe()))

    response = client.get("/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/commerce/products" in paths
    assert "/commerce/products/{slug}" in paths
    assert "/commerce/orders" in paths
    assert "/commerce/admin/products" in paths
    assert "/commerce/admin/products/{product_id}" in paths
    assert "/commerce/admin/orders" in paths
