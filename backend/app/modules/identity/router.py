from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response

from app.core.config import Settings, get_settings
from app.core.errors import ApiError
from app.core.security import build_cookie_settings
from app.modules.identity.schemas import BootstrapAdminRequest, LoginRequest, PublicUser
from app.modules.identity.service import IdentityService, get_identity_service
from app.modules.identity.sessions import require_matching_csrf

router = APIRouter(prefix="/identity", tags=["identity"])

SettingsDependency = Annotated[Settings, Depends(get_settings)]
IdentityServiceDependency = Annotated[IdentityService, Depends(get_identity_service)]


def _set_auth_cookies(
    response: Response,
    settings: Settings,
    raw_session_token: str,
    csrf_token: str,
) -> None:
    response.set_cookie(
        value=raw_session_token,
        max_age=settings.session_ttl_seconds,
        **build_cookie_settings(settings, "session"),
    )
    response.set_cookie(
        value=csrf_token,
        max_age=settings.session_ttl_seconds,
        **build_cookie_settings(settings, "csrf"),
    )


def _clear_auth_cookies(response: Response, settings: Settings) -> None:
    response.delete_cookie(settings.session_cookie_name, path="/", domain=settings.cookie_domain)
    response.delete_cookie(settings.csrf_cookie_name, path="/", domain=settings.cookie_domain)


@router.post("/bootstrap-admin", response_model=PublicUser, status_code=201)
async def bootstrap_admin(
    payload: BootstrapAdminRequest,
    request: Request,
    identity_service: IdentityServiceDependency,
) -> PublicUser:
    return await identity_service.bootstrap_admin(payload, request)


@router.post("/login", response_model=PublicUser)
async def login(
    payload: LoginRequest,
    response: Response,
    request: Request,
    identity_service: IdentityServiceDependency,
    settings: SettingsDependency,
) -> PublicUser:
    user, tokens = await identity_service.login(payload, request, settings)
    _set_auth_cookies(response, settings, tokens.raw_session_token, tokens.csrf_token)
    return user


@router.get("/me", response_model=PublicUser)
async def me(
    request: Request,
    identity_service: IdentityServiceDependency,
    settings: SettingsDependency,
) -> PublicUser:
    return await identity_service.current_user(request.cookies.get(settings.session_cookie_name))


@router.post("/logout")
async def logout(
    response: Response,
    request: Request,
    identity_service: IdentityServiceDependency,
    settings: SettingsDependency,
) -> dict[str, str]:
    try:
        require_matching_csrf(
            request.cookies.get(settings.csrf_cookie_name),
            request.headers.get(settings.csrf_header_name),
        )
    except ValueError as exc:
        raise ApiError(403, "csrf_failed", "CSRF validation failed") from exc

    await identity_service.logout(request.cookies.get(settings.session_cookie_name), request)
    _clear_auth_cookies(response, settings)
    return {"status": "ok"}