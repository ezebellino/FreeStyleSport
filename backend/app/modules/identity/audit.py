from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity.models import AuditEvent


async def record_audit_event(
    session: AsyncSession,
    request: Request,
    action: str,
    actor_user_id: str | None = None,
) -> None:
    session.add(
        AuditEvent(
            actor_user_id=actor_user_id,
            action=action,
            request_id=getattr(request.state, "request_id", "unknown"),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )