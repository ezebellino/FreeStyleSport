"""store promotion settings

Revision ID: 20260701_0008
Revises: 20260630_0007
Create Date: 2026-07-01
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260701_0008"
down_revision: str | None = "20260630_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "commerce_promotion_settings",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("hero_badge", sa.String(length=120), nullable=True),
        sa.Column("hero_title", sa.String(length=200), nullable=True),
        sa.Column("hero_description", sa.Text(), nullable=True),
        sa.Column("welcome_coupon_enabled", sa.Boolean(), nullable=False),
        sa.Column("welcome_coupon_code", sa.String(length=40), nullable=False),
        sa.Column("welcome_discount_rate", sa.Numeric(5, 4), nullable=False),
        sa.Column("free_shipping_enabled", sa.Boolean(), nullable=False),
        sa.Column("free_shipping_threshold", sa.Numeric(12, 2), nullable=False),
        sa.Column("gift_bonus_enabled", sa.Boolean(), nullable=False),
        sa.Column("gift_bonus_threshold", sa.Numeric(12, 2), nullable=False),
        sa.Column("gift_bonus_code", sa.String(length=40), nullable=False),
        sa.Column("gift_bonus_rate", sa.Numeric(5, 4), nullable=False),
        sa.Column("payment_promotions", sa.Text(), nullable=True),
        sa.Column("checkout_message", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["commerce_tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id"),
    )
    op.create_index(
        op.f("ix_commerce_promotion_settings_tenant_id"),
        "commerce_promotion_settings",
        ["tenant_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_commerce_promotion_settings_tenant_id"),
        table_name="commerce_promotion_settings",
    )
    op.drop_table("commerce_promotion_settings")
