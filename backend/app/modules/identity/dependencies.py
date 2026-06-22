from collections.abc import Callable
from typing import Protocol

from app.core.errors import ApiError


class IdentityPrincipal(Protocol):
    role: str
    is_active: bool


def require_active_user(user: IdentityPrincipal) -> IdentityPrincipal:
    if not user.is_active:
        raise ApiError(401, "not_authenticated", "Authentication is required")
    return user


def require_role(role: str) -> Callable[[IdentityPrincipal], IdentityPrincipal]:
    def dependency(user: IdentityPrincipal) -> IdentityPrincipal:
        require_active_user(user)
        if user.role != role:
            raise ApiError(403, "forbidden", "You do not have access to this resource")
        return user

    return dependency
