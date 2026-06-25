from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response

from app.core.config import Settings, get_settings
from app.core.errors import ApiError
from app.core.security import build_cookie_settings
from app.modules.identity.email import ConsoleEmailSender, EmailSender, ResendEmailSender
from app.modules.identity.schemas import (
    BootstrapAdminRequest,
    ConfirmEmailRequest,
    CsrfResponse,
    LoginRequest,
    MessageResponse,
    PublicUser,
    RegisterRequest,
    ResendConfirmationRequest,
)
from app.modules.identity.service import IdentityService, get_identity_service
from app.modules.identity.sessions import require_matching_csrf

router = APIRouter(prefix="/identity", tags=["identity"])

SettingsDependency = Annotated[Settings, Depends(get_settings)]
IdentityServiceDependency = Annotated[IdentityService, Depends(get_identity_service)]


def get_email_sender(settings: SettingsDependency) -> EmailSender:
    if settings.environment in {"staging", "production"} and settings.resend_api_key:
        return ResendEmailSender(settings)
    return ConsoleEmailSender()


EmailSenderDependency = Annotated[EmailSender, Depends(get_email_sender)]


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


@router.post("/register", response_model=MessageResponse, status_code=201)
async def register(
    payload: RegisterRequest,
    request: Request,
    identity_service: IdentityServiceDependency,
    settings: SettingsDependency,
    email_sender: EmailSenderDependency,
) -> MessageResponse:
    confirmation_email_sent = await identity_service.register(
        payload,
        request,
        settings,
        email_sender,
    )
    if not confirmation_email_sent:
        return MessageResponse(
            message=(
                "Cuenta creada. Ya podes iniciar sesion; "
                "el correo de confirmacion queda pendiente."
            )
        )
    return MessageResponse(message="Te enviamos un correo para confirmar tu cuenta.")


@router.post("/confirm-email", response_model=MessageResponse)
async def confirm_email(
    payload: ConfirmEmailRequest,
    request: Request,
    identity_service: IdentityServiceDependency,
) -> MessageResponse:
    await identity_service.confirm_email(payload, request)
    return MessageResponse(message="Tu cuenta ya esta confirmada.")


@router.post("/resend-confirmation", response_model=MessageResponse)
async def resend_confirmation(
    payload: ResendConfirmationRequest,
    identity_service: IdentityServiceDependency,
    settings: SettingsDependency,
    email_sender: EmailSenderDependency,
) -> MessageResponse:
    await identity_service.resend_confirmation(payload, settings, email_sender)
    return MessageResponse(
        message="Si la cuenta existe, te enviamos un nuevo correo de confirmacion."
    )


@router.get("/me", response_model=PublicUser)
async def me(
    request: Request,
    identity_service: IdentityServiceDependency,
    settings: SettingsDependency,
) -> PublicUser:
    return await identity_service.current_user(request.cookies.get(settings.session_cookie_name))


@router.get("/csrf", response_model=CsrfResponse)
async def csrf_token(
    request: Request,
    identity_service: IdentityServiceDependency,
    settings: SettingsDependency,
) -> CsrfResponse:
    return CsrfResponse(
        csrf_token=await identity_service.csrf_token(
            request.cookies.get(settings.session_cookie_name)
        )
    )


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
