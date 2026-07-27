"""Add payment profile options.

Revision ID: 20260726_0010
Revises: 20260701_0009
Create Date: 2026-07-26
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260726_0010"
down_revision: str | None = "20260701_0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "commerce_payment_profiles",
        sa.Column("payment_options", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
    )


def downgrade() -> None:
    op.drop_column("commerce_payment_profiles", "payment_options")
