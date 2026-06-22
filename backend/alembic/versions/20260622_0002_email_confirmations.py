"""email confirmations

Revision ID: 20260622_0002
Revises: 20260622_0001
Create Date: 2026-06-22
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260622_0002"
down_revision: str | None = "20260622_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "identity_users",
        sa.Column("email_confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute("UPDATE identity_users SET email_confirmed_at = CURRENT_TIMESTAMP")
    op.create_table(
        "identity_email_confirmations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["identity_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_identity_email_confirmations_token_hash"),
        "identity_email_confirmations",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        op.f("ix_identity_email_confirmations_user_id"),
        "identity_email_confirmations",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_identity_email_confirmations_user_id"),
        table_name="identity_email_confirmations",
    )
    op.drop_index(
        op.f("ix_identity_email_confirmations_token_hash"),
        table_name="identity_email_confirmations",
    )
    op.drop_table("identity_email_confirmations")
    op.drop_column("identity_users", "email_confirmed_at")
