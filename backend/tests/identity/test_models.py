from app.db.base import Base
from app.modules.identity.models import AuditEvent, EmailConfirmation, User, UserSession


def test_identity_tables_are_registered() -> None:
    assert User.__tablename__ in Base.metadata.tables
    assert UserSession.__tablename__ in Base.metadata.tables
    assert AuditEvent.__tablename__ in Base.metadata.tables
    assert EmailConfirmation.__tablename__ in Base.metadata.tables


def test_user_roles_are_stored_as_strings() -> None:
    role_column = User.__table__.c.role
    assert str(role_column.type).lower().startswith("varchar")


def test_user_has_email_confirmation_timestamp() -> None:
    assert "email_confirmed_at" in User.__table__.c


def test_user_has_customer_contact_fields() -> None:
    assert "first_name" in User.__table__.c
    assert "last_name" in User.__table__.c
    assert "phone" in User.__table__.c
