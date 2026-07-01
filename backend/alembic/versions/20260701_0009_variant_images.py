"""Add optional product variant images.

Revision ID: 20260701_0009
Revises: 20260701_0008
Create Date: 2026-07-01
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260701_0009"
down_revision: str | None = "20260701_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "commerce_product_variants",
        sa.Column("image_url", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("commerce_product_variants", "image_url")
