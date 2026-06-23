"""commerce catalog foundation

Revision ID: 20260623_0003
Revises: 20260622_0002
Create Date: 2026-06-23
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260623_0003"
down_revision: str | None = "20260622_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "commerce_tenants",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_commerce_tenants_slug"), "commerce_tenants", ["slug"], unique=True)

    op.create_table(
        "commerce_categories",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["commerce_tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "slug", name="uq_commerce_categories_tenant_slug"),
    )
    op.create_index(
        op.f("ix_commerce_categories_tenant_id"),
        "commerce_categories",
        ["tenant_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_commerce_categories_slug"),
        "commerce_categories",
        ["slug"],
        unique=False,
    )

    op.create_table(
        "commerce_products",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("category_id", sa.String(length=36), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("brand", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("base_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("compare_at_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["commerce_categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tenant_id"], ["commerce_tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "slug", name="uq_commerce_products_tenant_slug"),
    )
    op.create_index(
        op.f("ix_commerce_products_category_id"),
        "commerce_products",
        ["category_id"],
        unique=False,
    )
    op.create_index(op.f("ix_commerce_products_slug"), "commerce_products", ["slug"], unique=False)
    op.create_index(
        op.f("ix_commerce_products_status"),
        "commerce_products",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_commerce_products_tenant_id"),
        "commerce_products",
        ["tenant_id"],
        unique=False,
    )

    op.create_table(
        "commerce_product_images",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("product_id", sa.String(length=36), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("alt_text", sa.String(length=240), nullable=True),
        sa.Column("provider", sa.String(length=40), nullable=True),
        sa.Column("provider_public_id", sa.String(length=240), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["commerce_products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_commerce_product_images_product_id"),
        "commerce_product_images",
        ["product_id"],
        unique=False,
    )

    op.create_table(
        "commerce_product_variants",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("product_id", sa.String(length=36), nullable=False),
        sa.Column("sku", sa.String(length=80), nullable=True),
        sa.Column("label", sa.String(length=160), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=True),
        sa.Column("stock_quantity", sa.Integer(), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["commerce_products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id", "sku", name="uq_commerce_variants_product_sku"),
    )
    op.create_index(
        op.f("ix_commerce_product_variants_product_id"),
        "commerce_product_variants",
        ["product_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_commerce_product_variants_product_id"),
        table_name="commerce_product_variants",
    )
    op.drop_table("commerce_product_variants")
    op.drop_index(
        op.f("ix_commerce_product_images_product_id"),
        table_name="commerce_product_images",
    )
    op.drop_table("commerce_product_images")
    op.drop_index(op.f("ix_commerce_products_tenant_id"), table_name="commerce_products")
    op.drop_index(op.f("ix_commerce_products_status"), table_name="commerce_products")
    op.drop_index(op.f("ix_commerce_products_slug"), table_name="commerce_products")
    op.drop_index(op.f("ix_commerce_products_category_id"), table_name="commerce_products")
    op.drop_table("commerce_products")
    op.drop_index(op.f("ix_commerce_categories_slug"), table_name="commerce_categories")
    op.drop_index(op.f("ix_commerce_categories_tenant_id"), table_name="commerce_categories")
    op.drop_table("commerce_categories")
    op.drop_index(op.f("ix_commerce_tenants_slug"), table_name="commerce_tenants")
    op.drop_table("commerce_tenants")
