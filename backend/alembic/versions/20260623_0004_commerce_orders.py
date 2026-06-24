"""commerce orders

Revision ID: 20260623_0004
Revises: 20260623_0003
Create Date: 2026-06-23
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260623_0004"
down_revision: str | None = "20260623_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "commerce_orders",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("customer_name", sa.String(length=160), nullable=True),
        sa.Column("customer_email", sa.String(length=240), nullable=True),
        sa.Column("customer_phone", sa.String(length=80), nullable=True),
        sa.Column("payment_method", sa.String(length=40), nullable=False),
        sa.Column("fulfillment_method", sa.String(length=40), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
        sa.Column("total", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["commerce_tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_commerce_orders_status"), "commerce_orders", ["status"], unique=False)
    op.create_index(
        op.f("ix_commerce_orders_tenant_id"),
        "commerce_orders",
        ["tenant_id"],
        unique=False,
    )

    op.create_table(
        "commerce_order_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("order_id", sa.String(length=36), nullable=False),
        sa.Column("product_id", sa.String(length=36), nullable=True),
        sa.Column("product_slug", sa.String(length=160), nullable=False),
        sa.Column("product_name", sa.String(length=200), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("line_total", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["commerce_orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["commerce_products.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_commerce_order_items_order_id"),
        "commerce_order_items",
        ["order_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_commerce_order_items_product_id"),
        "commerce_order_items",
        ["product_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_commerce_order_items_product_id"), table_name="commerce_order_items")
    op.drop_index(op.f("ix_commerce_order_items_order_id"), table_name="commerce_order_items")
    op.drop_table("commerce_order_items")
    op.drop_index(op.f("ix_commerce_orders_tenant_id"), table_name="commerce_orders")
    op.drop_index(op.f("ix_commerce_orders_status"), table_name="commerce_orders")
    op.drop_table("commerce_orders")
