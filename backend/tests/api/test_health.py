from fastapi.testclient import TestClient

from app.health.router import ReadinessProbe
from app.main import create_app


class HealthyProbe:
    async def check(self) -> None:
        return None


class FailingProbe:
    async def check(self) -> None:
        raise RuntimeError("database unavailable")


def test_liveness_returns_request_id() -> None:
    client = TestClient(create_app(readiness_probe=HealthyProbe()))

    response = client.get("/health/live", headers={"x-request-id": "test-request"})

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["x-request-id"] == "test-request"


def test_readiness_uses_stable_problem_response() -> None:
    probe: ReadinessProbe = FailingProbe()
    client = TestClient(create_app(readiness_probe=probe))

    response = client.get("/health/ready")

    assert response.status_code == 503
    assert response.json()["code"] == "service_not_ready"
    assert response.json()["message"] == "Service dependencies are unavailable"
    assert response.json()["request_id"] == response.headers["x-request-id"]
