from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.errors import ApiError
from app.core.request_id import RequestIdMiddleware
from app.db.health import DatabaseReadinessProbe
from app.db.session import session_factory
from app.health.router import ReadinessProbe, get_readiness_probe
from app.health.router import router as health_router


def create_app(readiness_probe: ReadinessProbe | None = None) -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID"],
    )

    @app.exception_handler(ApiError)
    async def handle_api_error(request: Request, exc: ApiError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "unknown")
        return JSONResponse(
            status_code=exc.status_code,
            content={"code": exc.code, "message": exc.message, "request_id": request_id},
        )

    if readiness_probe is not None:
        app.dependency_overrides[get_readiness_probe] = lambda: readiness_probe
    app.include_router(health_router)
    return app


app = create_app(readiness_probe=DatabaseReadinessProbe(session_factory))
