"""store payment profile

Revision ID: 20260630_0007
Revises: 20260626_0006
Create Date: 2026-06-30
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260630_0007"
down_revision: str | None = "20260626_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "commerce_payment_profiles",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("alias", sa.String(length=120), nullable=True),
        sa.Column("account_holder", sa.String(length=160), nullable=True),
        sa.Column("account_identifier", sa.String(length=80), nullable=True),
        sa.Column("provider", sa.String(length=80), nullable=True),
        sa.Column("qr_image_url", sa.Text(), nullable=True),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["commerce_tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id"),
    )
    op.create_index(
        op.f("ix_commerce_payment_profiles_tenant_id"),
        "commerce_payment_profiles",
        ["tenant_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_commerce_payment_profiles_tenant_id"),
        table_name="commerce_payment_profiles",
    )
    op.drop_table("commerce_payment_profiles")
