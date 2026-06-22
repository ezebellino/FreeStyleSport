from typing import Annotated, Protocol

from fastapi import APIRouter, Depends

from app.core.errors import ApiError

router = APIRouter(prefix="/health", tags=["health"])


class ReadinessProbe(Protocol):
    async def check(self) -> None: ...


class ApplicationReadinessProbe:
    async def check(self) -> None:
        return None


def get_readiness_probe() -> ReadinessProbe:
    return ApplicationReadinessProbe()


ReadinessProbeDependency = Annotated[ReadinessProbe, Depends(get_readiness_probe)]


@router.get("/live")
async def live() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
async def ready(probe: ReadinessProbeDependency) -> dict[str, str]:
    try:
        await probe.check()
    except Exception as exc:
        raise ApiError(503, "service_not_ready", "Service dependencies are unavailable") from exc
    return {"status": "ready"}
