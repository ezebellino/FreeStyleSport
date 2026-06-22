"""identity access foundation

Revision ID: 20260622_0001
Revises:
Create Date: 2026-06-22
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260622_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "identity_users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_identity_users_email"), "identity_users", ["email"], unique=True)

    op.create_table(
        "identity_sessions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("csrf_token", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["identity_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_identity_sessions_token_hash"),
        "identity_sessions",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        op.f("ix_identity_sessions_user_id"),
        "identity_sessions",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "audit_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("actor_user_id", sa.String(length=36), nullable=True),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("request_id", sa.String(length=128), nullable=False),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("request_id", "action", name="uq_audit_request_action"),
    )
    op.create_index(
        op.f("ix_audit_events_actor_user_id"),
        "audit_events",
        ["actor_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_audit_events_request_id"),
        "audit_events",
        ["request_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_events_request_id"), table_name="audit_events")
    op.drop_index(op.f("ix_audit_events_actor_user_id"), table_name="audit_events")
    op.drop_table("audit_events")
    op.drop_index(op.f("ix_identity_sessions_user_id"), table_name="identity_sessions")
    op.drop_index(op.f("ix_identity_sessions_token_hash"), table_name="identity_sessions")
    op.drop_table("identity_sessions")
    op.drop_index(op.f("ix_identity_users_email"), table_name="identity_users")
    op.drop_table("identity_users")