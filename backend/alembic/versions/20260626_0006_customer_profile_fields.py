"""customer profile fields

Revision ID: 20260626_0006
Revises: 20260624_0005
Create Date: 2026-06-26
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260626_0006"
down_revision: str | None = "20260624_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("identity_users", sa.Column("first_name", sa.String(length=80), nullable=True))
    op.add_column("identity_users", sa.Column("last_name", sa.String(length=80), nullable=True))
    op.add_column("identity_users", sa.Column("phone", sa.String(length=40), nullable=True))


def downgrade() -> None:
    op.drop_column("identity_users", "phone")
    op.drop_column("identity_users", "last_name")
    op.drop_column("identity_users", "first_name")
