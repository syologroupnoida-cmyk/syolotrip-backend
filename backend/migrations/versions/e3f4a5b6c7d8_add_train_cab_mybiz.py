"""add_train_cab_mybiz

Revision ID: e3f4a5b6c7d8
Revises: 7c57891885b5
Create Date: 2026-10-23 13:45:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3f4a5b6c7d8'
down_revision: Union[str, None] = '7c57891885b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    # --- Trains table ---
    if 'trains' not in existing_tables:
        op.create_table(
            'trains',
            sa.Column('train_number', sa.String(length=20), nullable=False),
            sa.Column('train_name', sa.String(length=150), nullable=False),
            sa.Column('train_type', sa.String(length=100), nullable=False),
            sa.Column('from_station_code', sa.String(length=10), nullable=False),
            sa.Column('from_station_name', sa.String(length=150), nullable=False),
            sa.Column('from_city', sa.String(length=100), nullable=False),
            sa.Column('to_station_code', sa.String(length=10), nullable=False),
            sa.Column('to_station_name', sa.String(length=150), nullable=False),
            sa.Column('to_city', sa.String(length=100), nullable=False),
            sa.Column('departure_time', sa.String(length=50), nullable=False),
            sa.Column('arrival_time', sa.String(length=50), nullable=False),
            sa.Column('duration_minutes', sa.Integer(), nullable=False),
            sa.Column('train_class', sa.String(length=50), nullable=False),
            sa.Column('available_seats', sa.Integer(), nullable=False),
            sa.Column('base_fare', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('rating', sa.Float(), nullable=False),
            sa.Column('currency', sa.String(length=10), nullable=False),
            sa.Column('is_simulated', sa.Boolean(), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_train_search', 'trains', ['from_city', 'to_city', 'is_active'], unique=False)
        op.create_index('idx_train_stations', 'trains', ['from_station_code', 'to_station_code'], unique=False)
        op.create_index(op.f('ix_trains_base_fare'), 'trains', ['base_fare'], unique=False)
        op.create_index(op.f('ix_trains_from_city'), 'trains', ['from_city'], unique=False)
        op.create_index(op.f('ix_trains_from_station_code'), 'trains', ['from_station_code'], unique=False)
        op.create_index(op.f('ix_trains_to_city'), 'trains', ['to_city'], unique=False)
        op.create_index(op.f('ix_trains_to_station_code'), 'trains', ['to_station_code'], unique=False)
        op.create_index(op.f('ix_trains_train_name'), 'trains', ['train_name'], unique=False)
        op.create_index(op.f('ix_trains_train_number'), 'trains', ['train_number'], unique=False)

    # --- Cabs table ---
    if 'cabs' not in existing_tables:
        op.create_table(
            'cabs',
            sa.Column('cab_type', sa.String(length=100), nullable=False),
            sa.Column('vehicle_model', sa.String(length=150), nullable=False),
            sa.Column('city', sa.String(length=100), nullable=False),
            sa.Column('pickup_area', sa.String(length=200), nullable=False),
            sa.Column('drop_area', sa.String(length=200), nullable=False),
            sa.Column('driver_name', sa.String(length=150), nullable=False),
            sa.Column('driver_rating', sa.Float(), nullable=False),
            sa.Column('capacity', sa.Integer(), nullable=False),
            sa.Column('base_fare', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('currency', sa.String(length=10), nullable=False),
            sa.Column('eta_minutes', sa.Integer(), nullable=False),
            sa.Column('features', sa.JSON(), nullable=True),
            sa.Column('is_simulated', sa.Boolean(), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_cab_search', 'cabs', ['city', 'cab_type', 'is_active'], unique=False)
        op.create_index(op.f('ix_cabs_base_fare'), 'cabs', ['base_fare'], unique=False)
        op.create_index(op.f('ix_cabs_cab_type'), 'cabs', ['cab_type'], unique=False)
        op.create_index(op.f('ix_cabs_city'), 'cabs', ['city'], unique=False)

    # --- Companies table ---
    if 'companies' not in existing_tables:
        op.create_table(
            'companies',
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('gstin', sa.String(length=20), nullable=True),
            sa.Column('pan', sa.String(length=20), nullable=True),
            sa.Column('industry', sa.String(length=100), nullable=True),
            sa.Column('employee_count_range', sa.String(length=20), nullable=False),
            sa.Column('billing_address', sa.Text(), nullable=True),
            sa.Column('city', sa.String(length=100), nullable=True),
            sa.Column('state', sa.String(length=100), nullable=True),
            sa.Column('pincode', sa.String(length=10), nullable=True),
            sa.Column('website', sa.String(length=255), nullable=True),
            sa.Column('logo_url', sa.String(length=500), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('created_by_user_id', sa.Uuid(), nullable=False),
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_companies_gstin'), 'companies', ['gstin'], unique=False)
        op.create_index(op.f('ix_companies_name'), 'companies', ['name'], unique=False)

    # --- Company Employees ---
    if 'company_employees' not in existing_tables:
        op.create_table(
            'company_employees',
            sa.Column('company_id', sa.Uuid(), nullable=False),
            sa.Column('user_id', sa.Uuid(), nullable=True),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('full_name', sa.String(length=255), nullable=False),
            sa.Column('role', sa.String(length=30), nullable=False),
            sa.Column('department', sa.String(length=100), nullable=True),
            sa.Column('designation', sa.String(length=100), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=False),
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_company_employee_unique', 'company_employees', ['company_id', 'email'], unique=True)
        op.create_index(op.f('ix_company_employees_company_id'), 'company_employees', ['company_id'], unique=False)
        op.create_index(op.f('ix_company_employees_email'), 'company_employees', ['email'], unique=False)
        op.create_index(op.f('ix_company_employees_user_id'), 'company_employees', ['user_id'], unique=False)

    # --- Travel Policies ---
    if 'travel_policies' not in existing_tables:
        op.create_table(
            'travel_policies',
            sa.Column('company_id', sa.Uuid(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('rules', sa.JSON(), nullable=True),
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_travel_policies_company_id'), 'travel_policies', ['company_id'], unique=False)

    # --- Trip Requests ---
    if 'trip_requests' not in existing_tables:
        op.create_table(
            'trip_requests',
            sa.Column('company_id', sa.Uuid(), nullable=False),
            sa.Column('employee_user_id', sa.Uuid(), nullable=False),
            sa.Column('approver_user_id', sa.Uuid(), nullable=True),
            sa.Column('service_type', sa.String(length=30), nullable=False),
            sa.Column('trip_purpose', sa.Text(), nullable=True),
            sa.Column('destination', sa.String(length=255), nullable=True),
            sa.Column('travel_date_from', sa.String(length=30), nullable=True),
            sa.Column('travel_date_to', sa.String(length=30), nullable=True),
            sa.Column('estimated_amount', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False),
            sa.Column('rejection_reason', sa.Text(), nullable=True),
            sa.Column('booking_id', sa.Uuid(), nullable=True),
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['approver_user_id'], ['users.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['employee_user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_trip_requests_company_id'), 'trip_requests', ['company_id'], unique=False)
        op.create_index(op.f('ix_trip_requests_employee_user_id'), 'trip_requests', ['employee_user_id'], unique=False)
        op.create_index(op.f('ix_trip_requests_status'), 'trip_requests', ['status'], unique=False)

    # --- Company Invoices ---
    if 'company_invoices' not in existing_tables:
        op.create_table(
            'company_invoices',
            sa.Column('company_id', sa.Uuid(), nullable=False),
            sa.Column('booking_id', sa.Uuid(), nullable=False),
            sa.Column('invoice_number', sa.String(length=50), nullable=False),
            sa.Column('gstin', sa.String(length=20), nullable=True),
            sa.Column('company_name', sa.String(length=255), nullable=False),
            sa.Column('billing_address', sa.Text(), nullable=True),
            sa.Column('base_amount', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('tax_amount', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('currency', sa.String(length=10), nullable=False),
            sa.Column('tax_breakdown', sa.JSON(), nullable=True),
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_company_invoices_booking_id'), 'company_invoices', ['booking_id'], unique=False)
        op.create_index(op.f('ix_company_invoices_company_id'), 'company_invoices', ['company_id'], unique=False)
        op.create_index(op.f('ix_company_invoices_invoice_number'), 'company_invoices', ['invoice_number'], unique=True)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    if 'company_invoices' in existing_tables:
        op.drop_table('company_invoices')
    if 'trip_requests' in existing_tables:
        op.drop_table('trip_requests')
    if 'travel_policies' in existing_tables:
        op.drop_table('travel_policies')
    if 'company_employees' in existing_tables:
        op.drop_table('company_employees')
    if 'companies' in existing_tables:
        op.drop_table('companies')
    if 'cabs' in existing_tables:
        op.drop_table('cabs')
    if 'trains' in existing_tables:
        op.drop_table('trains')
