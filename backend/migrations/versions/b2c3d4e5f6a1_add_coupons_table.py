"""add_coupons_table

Revision ID: b2c3d4e5f6a1
Revises: f9a8b7c6d5e4
Create Date: 2026-10-23 16:35:00.000000+00:00

"""
from typing import Sequence, Union
import uuid
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a1'
down_revision: Union[str, None] = 'f9a8b7c6d5e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    if 'coupons' not in existing_tables:
        op.create_table(
            'coupons',
            sa.Column('id', sa.Uuid(), primary_key=True, default=uuid.uuid4, nullable=False),
            sa.Column('code', sa.String(length=50), nullable=False, unique=True),
            sa.Column('discount_type', sa.String(length=20), server_default='FLAT', nullable=False),
            sa.Column('discount_value', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('max_discount_amount', sa.Numeric(precision=10, scale=2), nullable=True),
            sa.Column('min_order_amount', sa.Numeric(precision=10, scale=2), server_default='0.00', nullable=False),
            sa.Column('service_type', sa.String(length=30), server_default='ALL', nullable=False),
            sa.Column('description', sa.String(length=255), nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
            sa.Column('valid_from', sa.DateTime(timezone=True), nullable=True),
            sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True),
            sa.Column('usage_limit', sa.Integer(), nullable=True),
            sa.Column('times_used', sa.Integer(), server_default='0', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        )

        op.create_index('idx_coupon_code_active', 'coupons', ['code', 'is_active'])
        op.create_index('idx_coupon_service', 'coupons', ['service_type', 'is_active'])

        # Seed initial standard coupons
        coupons_table = sa.table(
            'coupons',
            sa.column('id', sa.Uuid()),
            sa.column('code', sa.String),
            sa.column('discount_type', sa.String),
            sa.column('discount_value', sa.Numeric),
            sa.column('max_discount_amount', sa.Numeric),
            sa.column('min_order_amount', sa.Numeric),
            sa.column('service_type', sa.String),
            sa.column('description', sa.String),
            sa.column('is_active', sa.Boolean),
            sa.column('times_used', sa.Integer),
            sa.column('created_at', sa.DateTime(timezone=True)),
            sa.column('updated_at', sa.DateTime(timezone=True)),
        )

        now = datetime.now(timezone.utc)
        initial_coupons = [
            {
                'id': uuid.uuid4(),
                'code': 'SSJFLIGHT',
                'discount_type': 'FLAT',
                'discount_value': 1250.00,
                'max_discount_amount': None,
                'min_order_amount': 5000.00,
                'service_type': 'FLIGHT',
                'description': 'Instant ₹1,250 savings on flight bookings.',
                'is_active': True,
                'times_used': 0,
                'created_at': now,
                'updated_at': now,
            },
            {
                'id': uuid.uuid4(),
                'code': 'SSJHOTEL',
                'discount_type': 'PERCENTAGE',
                'discount_value': 25.00,
                'max_discount_amount': 2500.00,
                'min_order_amount': 3000.00,
                'service_type': 'HOTEL',
                'description': '25% OFF (Up to ₹2,500) on handpicked luxury stays.',
                'is_active': True,
                'times_used': 0,
                'created_at': now,
                'updated_at': now,
            },
            {
                'id': uuid.uuid4(),
                'code': 'SSJHOLIDAY',
                'discount_type': 'FLAT',
                'discount_value': 2500.00,
                'max_discount_amount': None,
                'min_order_amount': 15000.00,
                'service_type': 'PACKAGE',
                'description': '₹2,500 FLAT OFF on holiday package bundles.',
                'is_active': True,
                'times_used': 0,
                'created_at': now,
                'updated_at': now,
            },
            {
                'id': uuid.uuid4(),
                'code': 'SSJTRAIN',
                'discount_type': 'FLAT',
                'discount_value': 150.00,
                'max_discount_amount': None,
                'min_order_amount': 800.00,
                'service_type': 'TRAIN',
                'description': 'Zero booking fee on IRCTC confirmed tickets.',
                'is_active': True,
                'times_used': 0,
                'created_at': now,
                'updated_at': now,
            },
            {
                'id': uuid.uuid4(),
                'code': 'SSJBUS',
                'discount_type': 'FLAT',
                'discount_value': 200.00,
                'max_discount_amount': None,
                'min_order_amount': 700.00,
                'service_type': 'BUS',
                'description': '₹200 Instant Off on bus bookings.',
                'is_active': True,
                'times_used': 0,
                'created_at': now,
                'updated_at': now,
            },
            {
                'id': uuid.uuid4(),
                'code': 'SSJCAB',
                'discount_type': 'FLAT',
                'discount_value': 100.00,
                'max_discount_amount': None,
                'min_order_amount': 500.00,
                'service_type': 'CAB',
                'description': '₹100 toll cashback on cab rides.',
                'is_active': True,
                'times_used': 0,
                'created_at': now,
                'updated_at': now,
            },
            {
                'id': uuid.uuid4(),
                'code': 'MYBIZCORP',
                'discount_type': 'PERCENTAGE',
                'discount_value': 10.00,
                'max_discount_amount': 10000.00,
                'min_order_amount': 10000.00,
                'service_type': 'ALL',
                'description': 'Corporate 10% Extra for registered enterprise accounts.',
                'is_active': True,
                'times_used': 0,
                'created_at': now,
                'updated_at': now,
            },
            {
                'id': uuid.uuid4(),
                'code': 'WELCOME',
                'discount_type': 'PERCENTAGE',
                'discount_value': 10.00,
                'max_discount_amount': 5000.00,
                'min_order_amount': 1000.00,
                'service_type': 'ALL',
                'description': 'Welcome 10% discount for first-time bookings.',
                'is_active': True,
                'times_used': 0,
                'created_at': now,
                'updated_at': now,
            },
            {
                'id': uuid.uuid4(),
                'code': 'WANDERLUST',
                'discount_type': 'PERCENTAGE',
                'discount_value': 10.00,
                'max_discount_amount': 12500.00,
                'min_order_amount': 2000.00,
                'service_type': 'ALL',
                'description': '10% discount on entire travel itinerary.',
                'is_active': True,
                'times_used': 0,
                'created_at': now,
                'updated_at': now,
            },
            {
                'id': uuid.uuid4(),
                'code': 'SSJOURNEY',
                'discount_type': 'FLAT',
                'discount_value': 500.00,
                'max_discount_amount': None,
                'min_order_amount': 1500.00,
                'service_type': 'ALL',
                'description': 'Flat ₹500 off on your next journey.',
                'is_active': True,
                'times_used': 0,
                'created_at': now,
                'updated_at': now,
            },
        ]

        op.bulk_insert(coupons_table, initial_coupons)


def downgrade() -> None:
    op.drop_index('idx_coupon_service', table_name='coupons')
    op.drop_index('idx_coupon_code_active', table_name='coupons')
    op.drop_table('coupons')
