from dataclasses import dataclass

import pytest
from starlette.requests import Request

from app.core.errors import ApiError
from app.modules.identity.audit import record_audit_event
from app.modules.identity.dependencies import require_active_user, require_role
from app.modules.identity.models import AuditEvent


@dataclass
class Principal:
    role: str
    is_active: bool = True


class CapturingSession:
    def __init__(self) -> None:
        self.added: list[object] = []

    def add(self, instance: object) -> None:
        self.added.append(instance)


def drive_async(coro: object) -> None:
    with pytest.raises(StopIteration):
        coro.send(None)  # type: ignore[attr-defined]


def build_request() -> Request:
    request = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/identity/login",
            "headers": [(b"user-agent", b"pytest-agent")],
            "client": ("203.0.113.10", 12345),
        }
    )
    request.state.request_id = "req_123"
    return request


def test_inactive_users_are_rejected() -> None:
    with pytest.raises(ApiError) as exc_info:
        require_active_user(Principal(role="admin", is_active=False))

    assert exc_info.value.status_code == 401
    assert exc_info.value.code == "not_authenticated"


def test_require_role_accepts_admin() -> None:
    user = Principal(role="admin")

    assert require_role("admin")(user) is user


@pytest.mark.parametrize("role", ["seller", "customer"])
def test_require_role_rejects_non_admin_roles(role: str) -> None:
    with pytest.raises(ApiError) as exc_info:
        require_role("admin")(Principal(role=role))

    assert exc_info.value.status_code == 403
    assert exc_info.value.code == "forbidden"


def test_require_role_rejects_inactive_user_before_role_check() -> None:
    with pytest.raises(ApiError) as exc_info:
        require_role("admin")(Principal(role="admin", is_active=False))

    assert exc_info.value.status_code == 401
    assert exc_info.value.code == "not_authenticated"


def test_audit_records_request_context() -> None:
    session = CapturingSession()
    request = build_request()

    drive_async(
        record_audit_event(
            session=session,  # type: ignore[arg-type]
            request=request,
            action="identity.login",
            actor_user_id="user_123",
        )
    )

    assert len(session.added) == 1
    audit_event = session.added[0]
    assert isinstance(audit_event, AuditEvent)
    assert audit_event.request_id == "req_123"
    assert audit_event.action == "identity.login"
    assert audit_event.actor_user_id == "user_123"
    assert audit_event.ip_address == "203.0.113.10"
    assert audit_event.user_agent == "pytest-agent"
