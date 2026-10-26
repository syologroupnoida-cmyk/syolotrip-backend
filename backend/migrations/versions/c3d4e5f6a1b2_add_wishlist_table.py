"""add_wishlist_table

Revision ID: c3d4e5f6a1b2
Revises: b2c3d4e5f6a1
Create Date: 2026-10-26 13:10:00.000000+00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a1b2'
down_revision: Union[str, None] = 'b2c3d4e5f6a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    if 'wishlist_items' not in existing_tables:
        op.create_table(
            'wishlist_items',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('user_id', sa.Uuid(), nullable=False),
            sa.Column('item_key', sa.String(length=100), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('category', sa.String(length=50), nullable=False, server_default='HOTEL'),
            sa.Column('location', sa.String(length=255), nullable=False, server_default=''),
            sa.Column('price', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
            sa.Column('rating', sa.Float(), nullable=True),
            sa.Column('image', sa.Text(), nullable=False, server_default=''),
            sa.Column('badge', sa.String(length=100), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id', 'item_key', name='uq_user_wishlist_item')
        )
        op.create_index(op.f('ix_wishlist_items_user_id'), 'wishlist_items', ['user_id'], unique=False)
        op.create_index(op.f('ix_wishlist_items_item_key'), 'wishlist_items', ['item_key'], unique=False)
        op.create_index('ix_wishlist_user_created', 'wishlist_items', ['user_id', 'created_at'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    if 'wishlist_items' in existing_tables:
        op.drop_index('ix_wishlist_user_created', table_name='wishlist_items')
        op.drop_index(op.f('ix_wishlist_items_item_key'), table_name='wishlist_items')
        op.drop_index(op.f('ix_wishlist_items_user_id'), table_name='wishlist_items')
        op.drop_table('wishlist_items')
