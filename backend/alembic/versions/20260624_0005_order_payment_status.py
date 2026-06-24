"""order payment status

Revision ID: 20260624_0005
Revises: 20260623_0004
Create Date: 2026-06-24
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260624_0005"
down_revision: str | None = "20260623_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "commerce_orders",
        sa.Column(
            "payment_status",
            sa.String(length=32),
            nullable=False,
            server_default="unpaid",
        ),
    )
    op.create_index(
        op.f("ix_commerce_orders_payment_status"),
        "commerce_orders",
        ["payment_status"],
        unique=False,
    )
    op.alter_column("commerce_orders", "payment_status", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_commerce_orders_payment_status"), table_name="commerce_orders")
    op.drop_column("commerce_orders", "payment_status")
