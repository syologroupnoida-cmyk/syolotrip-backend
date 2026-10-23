"""add_partner_marketplace_schema

Revision ID: f9a8b7c6d5e4
Revises: e3f4a5b6c7d8
Create Date: 2026-10-23 13:46:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f9a8b7c6d5e4'
down_revision: Union[str, None] = 'e3f4a5b6c7d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    # --- 1. Partner Profiles Table ---
    if 'partner_profiles' not in existing_tables:
        op.create_table(
            'partner_profiles',
            sa.Column('user_id', sa.Uuid(), nullable=False),
            sa.Column('business_name', sa.String(length=255), nullable=False),
            sa.Column('business_type', sa.String(length=100), server_default='HOTELIER', nullable=False),
            sa.Column('phone', sa.String(length=50), nullable=True),
            sa.Column('city', sa.String(length=100), nullable=True),
            sa.Column('address', sa.String(length=300), nullable=True),
            sa.Column('country', sa.String(length=100), server_default='India', nullable=False),
            sa.Column('tax_id', sa.String(length=50), nullable=True),
            sa.Column('status', sa.String(length=30), server_default='PENDING', nullable=False),
            sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False),
            sa.Column('commission_rate', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
            sa.Column('is_commission_active', sa.Boolean(), server_default='false', nullable=False),
            sa.Column('rejection_reason', sa.Text(), nullable=True),
            sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('verified_by_user_id', sa.Uuid(), nullable=True),
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['verified_by_user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_partner_profiles_status'), 'partner_profiles', ['status'], unique=False)
        op.create_index(op.f('ix_partner_profiles_user_id'), 'partner_profiles', ['user_id'], unique=True)

    # --- 2. Add Partner Ownership and Publication Status to Hotels ---
    hotel_columns = {col['name'] for col in inspector.get_columns('hotels')}
    if 'property_type' not in hotel_columns:
        op.add_column('hotels', sa.Column('property_type', sa.String(length=50), server_default='HOTEL', nullable=False))
        op.create_index(op.f('ix_hotels_property_type'), 'hotels', ['property_type'], unique=False)
    if 'partner_id' not in hotel_columns:
        op.add_column('hotels', sa.Column('partner_id', sa.Uuid(), nullable=True))
        op.create_foreign_key('fk_hotels_partner_id', 'hotels', 'partner_profiles', ['partner_id'], ['id'], ondelete='SET NULL')
        op.create_index(op.f('ix_hotels_partner_id'), 'hotels', ['partner_id'], unique=False)
    if 'publication_status' not in hotel_columns:
        op.add_column('hotels', sa.Column('publication_status', sa.String(length=30), server_default='APPROVED', nullable=False))
        op.create_index(op.f('ix_hotels_publication_status'), 'hotels', ['publication_status'], unique=False)
    if 'admin_rejection_reason' not in hotel_columns:
        op.add_column('hotels', sa.Column('admin_rejection_reason', sa.Text(), nullable=True))
    if 'approved_at' not in hotel_columns:
        op.add_column('hotels', sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True))
    if 'approved_by_user_id' not in hotel_columns:
        op.add_column('hotels', sa.Column('approved_by_user_id', sa.Uuid(), nullable=True))
        op.create_foreign_key('fk_hotels_approved_by_user_id', 'hotels', 'users', ['approved_by_user_id'], ['id'], ondelete='SET NULL')

    hotel_indexes = {idx['name'] for idx in inspector.get_indexes('hotels')}
    if 'idx_hotel_partner_status' not in hotel_indexes:
        op.create_index('idx_hotel_partner_status', 'hotels', ['partner_id', 'publication_status'], unique=False)
    if 'idx_hotel_property_type' not in hotel_indexes:
        op.create_index('idx_hotel_property_type', 'hotels', ['property_type', 'publication_status', 'is_active'], unique=False)

    # --- 3. Room Daily Inventory ---
    if 'room_daily_inventory' not in existing_tables:
        op.create_table(
            'room_daily_inventory',
            sa.Column('room_id', sa.Uuid(), nullable=False),
            sa.Column('date', sa.String(length=10), nullable=False),
            sa.Column('available_rooms', sa.Integer(), nullable=False),
            sa.Column('price_override', sa.Numeric(precision=12, scale=2), nullable=True),
            sa.Column('is_blocked', sa.Boolean(), server_default='false', nullable=False),
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['room_id'], ['hotel_rooms.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_room_daily_date_unique', 'room_daily_inventory', ['room_id', 'date'], unique=True)
        op.create_index(op.f('ix_room_daily_inventory_date'), 'room_daily_inventory', ['date'], unique=False)
        op.create_index(op.f('ix_room_daily_inventory_room_id'), 'room_daily_inventory', ['room_id'], unique=False)

    # --- 4. Enhance Bookings ---
    booking_columns = {col['name'] for col in inspector.get_columns('bookings')}
    if 'guest_name' not in booking_columns:
        op.add_column('bookings', sa.Column('guest_name', sa.String(length=255), nullable=True))
    if 'check_in_date' not in booking_columns:
        op.add_column('bookings', sa.Column('check_in_date', sa.String(length=30), nullable=True))
    if 'check_out_date' not in booking_columns:
        op.add_column('bookings', sa.Column('check_out_date', sa.String(length=30), nullable=True))
    if 'cancellation_token' not in booking_columns:
        op.add_column('bookings', sa.Column('cancellation_token', sa.String(length=100), nullable=True))
        op.create_index(op.f('ix_bookings_cancellation_token'), 'bookings', ['cancellation_token'], unique=False)

    booking_indexes = {idx['name'] for idx in inspector.get_indexes('bookings')}
    if 'idx_booking_cancellation_token' not in booking_indexes:
        op.create_index('idx_booking_cancellation_token', 'bookings', ['cancellation_token'], unique=False)

    # --- 5. Enhance Booking Items ---
    item_columns = {col['name'] for col in inspector.get_columns('booking_items')}
    if 'hotel_id' not in item_columns:
        op.add_column('booking_items', sa.Column('hotel_id', sa.Uuid(), nullable=True))
        op.create_foreign_key('fk_booking_items_hotel_id', 'booking_items', 'hotels', ['hotel_id'], ['id'], ondelete='SET NULL')
        op.create_index(op.f('ix_booking_items_hotel_id'), 'booking_items', ['hotel_id'], unique=False)
    if 'room_id' not in item_columns:
        op.add_column('booking_items', sa.Column('room_id', sa.Uuid(), nullable=True))
        op.create_foreign_key('fk_booking_items_room_id', 'booking_items', 'hotel_rooms', ['room_id'], ['id'], ondelete='SET NULL')
        op.create_index(op.f('ix_booking_items_room_id'), 'booking_items', ['room_id'], unique=False)
    if 'check_in_date' not in item_columns:
        op.add_column('booking_items', sa.Column('check_in_date', sa.String(length=30), nullable=True))
    if 'check_out_date' not in item_columns:
        op.add_column('booking_items', sa.Column('check_out_date', sa.String(length=30), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    # Booking items
    if 'booking_items' in existing_tables:
        item_columns = {col['name'] for col in inspector.get_columns('booking_items')}
        if 'room_id' in item_columns:
            op.drop_constraint('fk_booking_items_room_id', 'booking_items', type_='foreignkey')
            op.drop_column('booking_items', 'room_id')
        if 'hotel_id' in item_columns:
            op.drop_constraint('fk_booking_items_hotel_id', 'booking_items', type_='foreignkey')
            op.drop_column('booking_items', 'hotel_id')
        if 'check_out_date' in item_columns:
            op.drop_column('booking_items', 'check_out_date')
        if 'check_in_date' in item_columns:
            op.drop_column('booking_items', 'check_in_date')

    # Bookings
    if 'bookings' in existing_tables:
        booking_columns = {col['name'] for col in inspector.get_columns('bookings')}
        if 'cancellation_token' in booking_columns:
            op.drop_column('bookings', 'cancellation_token')
        if 'check_out_date' in booking_columns:
            op.drop_column('bookings', 'check_out_date')
        if 'check_in_date' in booking_columns:
            op.drop_column('bookings', 'check_in_date')
        if 'guest_name' in booking_columns:
            op.drop_column('bookings', 'guest_name')

    # Room daily inventory
    if 'room_daily_inventory' in existing_tables:
        op.drop_table('room_daily_inventory')

    # Hotels
    if 'hotels' in existing_tables:
        hotel_columns = {col['name'] for col in inspector.get_columns('hotels')}
        if 'approved_by_user_id' in hotel_columns:
            op.drop_constraint('fk_hotels_approved_by_user_id', 'hotels', type_='foreignkey')
            op.drop_column('hotels', 'approved_by_user_id')
        if 'approved_at' in hotel_columns:
            op.drop_column('hotels', 'approved_at')
        if 'admin_rejection_reason' in hotel_columns:
            op.drop_column('hotels', 'admin_rejection_reason')
        if 'partner_id' in hotel_columns:
            op.drop_constraint('fk_hotels_partner_id', 'hotels', type_='foreignkey')
            op.drop_column('hotels', 'partner_id')
        if 'publication_status' in hotel_columns:
            op.drop_column('hotels', 'publication_status')
        if 'property_type' in hotel_columns:
            op.drop_column('hotels', 'property_type')

    # Partner profiles
    if 'partner_profiles' in existing_tables:
        op.drop_table('partner_profiles')
