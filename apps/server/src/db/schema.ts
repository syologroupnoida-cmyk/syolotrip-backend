import { query } from '../db/index.js';

export async function initDbSchema() {
  await query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      hashed_password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      is_verified BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS partner_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      business_name VARCHAR(255) NOT NULL,
      business_type VARCHAR(100) NOT NULL,
      phone VARCHAR(50),
      city VARCHAR(100),
      address VARCHAR(300),
      country VARCHAR(100) DEFAULT 'India',
      tax_id VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      is_verified BOOLEAN NOT NULL DEFAULT FALSE,
      commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
      is_commission_active BOOLEAN NOT NULL DEFAULT TRUE,
      rejection_reason TEXT,
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS flights (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      airline VARCHAR(100) NOT NULL,
      airline_code VARCHAR(10) NOT NULL,
      flight_number VARCHAR(20) NOT NULL,
      aircraft VARCHAR(100) NOT NULL,
      origin_code VARCHAR(10) NOT NULL,
      origin_name VARCHAR(200) NOT NULL,
      origin_city VARCHAR(100) NOT NULL,
      origin_country VARCHAR(100) DEFAULT 'India',
      destination_code VARCHAR(10) NOT NULL,
      destination_name VARCHAR(200) NOT NULL,
      destination_city VARCHAR(100) NOT NULL,
      destination_country VARCHAR(100) DEFAULT 'India',
      departure_time VARCHAR(50) NOT NULL,
      arrival_time VARCHAR(50) NOT NULL,
      duration_minutes INT NOT NULL,
      stops INT NOT NULL DEFAULT 0,
      stops_info VARCHAR(150),
      cabin_class VARCHAR(30) NOT NULL DEFAULT 'ECONOMY',
      available_seats INT NOT NULL DEFAULT 50,
      base_fare NUMERIC(12, 2) NOT NULL,
      taxes NUMERIC(12, 2) NOT NULL,
      total_price NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      logo_url VARCHAR(500),
      baggage_info VARCHAR(100) DEFAULT '2 × 23kg checked',
      emissions_kg INT,
      emissions_rating VARCHAR(20) DEFAULT 'low',
      tags JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS hotels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(200) NOT NULL,
      property_type VARCHAR(50) NOT NULL DEFAULT 'HOTEL',
      partner_id UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
      publication_status VARCHAR(30) NOT NULL DEFAULT 'APPROVED',
      admin_rejection_reason TEXT,
      approved_at TIMESTAMPTZ,
      approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      star_rating INT NOT NULL DEFAULT 4,
      guest_rating FLOAT NOT NULL DEFAULT 8.8,
      rating_label VARCHAR(50) NOT NULL DEFAULT 'Excellent',
      review_count INT NOT NULL DEFAULT 100,
      address VARCHAR(300) NOT NULL,
      city VARCHAR(100) NOT NULL,
      country VARCHAR(100) NOT NULL DEFAULT 'India',
      neighborhood VARCHAR(150),
      latitude FLOAT,
      longitude FLOAT,
      overview TEXT NOT NULL,
      amenities JSONB DEFAULT '[]'::jsonb,
      tags JSONB DEFAULT '[]'::jsonb,
      featured_image VARCHAR(500) NOT NULL,
      images JSONB DEFAULT '[]'::jsonb,
      starting_price NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS hotel_rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
      room_type VARCHAR(150) NOT NULL,
      bed_type VARCHAR(100) NOT NULL DEFAULT 'King Bed',
      max_occupancy INT NOT NULL DEFAULT 2,
      price_per_night NUMERIC(12, 2) NOT NULL,
      taxes_per_night NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
      available_rooms INT NOT NULL DEFAULT 5,
      amenities JSONB DEFAULT '[]'::jsonb,
      images JSONB DEFAULT '[]'::jsonb,
      is_available BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS room_daily_inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID NOT NULL REFERENCES hotel_rooms(id) ON DELETE CASCADE,
      date VARCHAR(10) NOT NULL,
      available_rooms INT NOT NULL,
      price_override NUMERIC(12, 2),
      is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_room_date UNIQUE (room_id, date)
    );

    CREATE TABLE IF NOT EXISTS buses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      operator_name VARCHAR(150) NOT NULL,
      bus_type VARCHAR(100) NOT NULL,
      from_city VARCHAR(100) NOT NULL,
      to_city VARCHAR(100) NOT NULL,
      boarding_point VARCHAR(200) NOT NULL,
      dropping_point VARCHAR(200) NOT NULL,
      departure_time VARCHAR(50) NOT NULL,
      arrival_time VARCHAR(50) NOT NULL,
      duration_minutes INT NOT NULL,
      available_seats INT NOT NULL DEFAULT 30,
      base_fare NUMERIC(12, 2) NOT NULL,
      rating FLOAT NOT NULL DEFAULT 4.5,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS holiday_packages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(250) NOT NULL,
      destination VARCHAR(150) NOT NULL,
      duration_days INT NOT NULL,
      duration_nights INT NOT NULL,
      overview TEXT NOT NULL,
      inclusions JSONB DEFAULT '[]'::jsonb,
      exclusions JSONB DEFAULT '[]'::jsonb,
      itinerary JSONB DEFAULT '[]'::jsonb,
      price_per_person NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      featured_image VARCHAR(500) NOT NULL,
      rating FLOAT NOT NULL DEFAULT 4.8,
      available_capacity INT NOT NULL DEFAULT 20,
      is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS trains (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      train_number VARCHAR(20) NOT NULL,
      train_name VARCHAR(150) NOT NULL,
      train_type VARCHAR(100) NOT NULL DEFAULT 'Superfast Express',
      from_station_code VARCHAR(10) NOT NULL,
      from_station_name VARCHAR(150) NOT NULL,
      from_city VARCHAR(100) NOT NULL,
      to_station_code VARCHAR(10) NOT NULL,
      to_station_name VARCHAR(150) NOT NULL,
      to_city VARCHAR(100) NOT NULL,
      departure_time VARCHAR(50) NOT NULL,
      arrival_time VARCHAR(50) NOT NULL,
      duration_minutes INT NOT NULL,
      train_class VARCHAR(50) NOT NULL DEFAULT 'AC Chair Car (CC)',
      available_seats INT NOT NULL DEFAULT 120,
      base_fare NUMERIC(12, 2) NOT NULL,
      rating FLOAT NOT NULL DEFAULT 4.8,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cabs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cab_type VARCHAR(100) NOT NULL,
      vehicle_model VARCHAR(150) NOT NULL,
      city VARCHAR(100) NOT NULL,
      pickup_area VARCHAR(200) NOT NULL,
      drop_area VARCHAR(200) NOT NULL,
      driver_name VARCHAR(150) NOT NULL DEFAULT 'Verified Chauffeur',
      driver_rating FLOAT NOT NULL DEFAULT 4.9,
      capacity INT NOT NULL DEFAULT 4,
      base_fare NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      eta_minutes INT NOT NULL DEFAULT 15,
      features JSONB DEFAULT '[]'::jsonb,
      is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_reference VARCHAR(50) UNIQUE NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      service_type VARCHAR(30) NOT NULL DEFAULT 'FLIGHT',
      status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      provider VARCHAR(100) NOT NULL DEFAULT 'SIMULATED_SS_JOURNEY',
      is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
      guest_name VARCHAR(255),
      contact_email VARCHAR(255) NOT NULL,
      contact_phone VARCHAR(50) NOT NULL,
      check_in_date VARCHAR(30),
      check_out_date VARCHAR(30),
      cancellation_token VARCHAR(100),
      base_amount NUMERIC(12, 2) NOT NULL,
      taxes_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
      discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
      total_amount NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      cancellation_reason TEXT,
      details_snapshot JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS booking_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      item_type VARCHAR(50) NOT NULL,
      item_reference_id VARCHAR(100) NOT NULL,
      title VARCHAR(250) NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
      room_id UUID REFERENCES hotel_rooms(id) ON DELETE SET NULL,
      check_in_date VARCHAR(30),
      check_out_date VARCHAR(30),
      unit_price NUMERIC(12, 2) NOT NULL,
      total_price NUMERIC(12, 2) NOT NULL,
      meta_data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS passengers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      title VARCHAR(20) NOT NULL DEFAULT 'Mr',
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      passenger_type VARCHAR(20) NOT NULL DEFAULT 'ADULT',
      gender VARCHAR(20) NOT NULL DEFAULT 'MALE',
      date_of_birth VARCHAR(50),
      passport_number VARCHAR(50),
      seat_preference VARCHAR(50),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      payment_reference VARCHAR(100) UNIQUE NOT NULL,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'DEMO_SIMULATION',
      amount NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      is_demo BOOLEAN NOT NULL DEFAULT TRUE,
      gateway_response JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      description VARCHAR(255) NOT NULL,
      discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE',
      discount_value NUMERIC(10, 2) NOT NULL,
      min_booking_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
      max_discount_amount NUMERIC(10, 2),
      applicable_services JSONB DEFAULT '["FLIGHT","HOTEL","BUS","TRAIN","CAB","PACKAGE"]'::jsonb,
      usage_limit INT DEFAULT 1000,
      used_count INT DEFAULT 0,
      valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      valid_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      service_type VARCHAR(50) NOT NULL,
      item_id VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(255),
      image VARCHAR(500),
      price NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      rating FLOAT,
      location VARCHAR(255),
      badge VARCHAR(100),
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_wishlist_user_service_item UNIQUE (user_id, service_type, item_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id VARCHAR(100),
      ip_address VARCHAR(50),
      details JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS mybiz_companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      registration_number VARCHAR(100),
      gstin VARCHAR(50),
      pan VARCHAR(50),
      industry VARCHAR(100),
      company_size VARCHAR(50) DEFAULT '1-10',
      address VARCHAR(300),
      city VARCHAR(100),
      state VARCHAR(100),
      country VARCHAR(100) DEFAULT 'India',
      postal_code VARCHAR(20),
      billing_email VARCHAR(255) NOT NULL,
      billing_phone VARCHAR(50),
      credit_limit NUMERIC(12, 2) DEFAULT 100000.0,
      used_credit NUMERIC(12, 2) DEFAULT 0.0,
      created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS mybiz_employees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES mybiz_companies(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      email VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      department VARCHAR(100),
      designation VARCHAR(100),
      employee_id VARCHAR(50),
      role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      monthly_budget NUMERIC(12, 2) DEFAULT 50000.0,
      used_budget_this_month NUMERIC(12, 2) DEFAULT 0.0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS mybiz_travel_policies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL UNIQUE REFERENCES mybiz_companies(id) ON DELETE CASCADE,
      policy_name VARCHAR(150) NOT NULL DEFAULT 'Default Corporate Policy',
      flight_class VARCHAR(50) DEFAULT 'ECONOMY',
      max_flight_budget_domestic NUMERIC(12, 2) DEFAULT 15000.0,
      max_flight_budget_international NUMERIC(12, 2) DEFAULT 75000.0,
      hotel_max_star_rating INT DEFAULT 4,
      hotel_max_price_per_night NUMERIC(12, 2) DEFAULT 8000.0,
      requires_approval_above NUMERIC(12, 2) DEFAULT 10000.0,
      auto_approve_under NUMERIC(12, 2) DEFAULT 5000.0,
      allowed_services JSONB DEFAULT '["FLIGHT","HOTEL","BUS","TRAIN","CAB"]'::jsonb,
      rules JSONB DEFAULT '{"flight_max_budget": 15000, "hotel_max_budget": 8000, "allow_premium_economy": true, "require_manager_approval": true}'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS mybiz_trip_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES mybiz_companies(id) ON DELETE CASCADE,
      employee_id UUID NOT NULL REFERENCES mybiz_employees(id) ON DELETE CASCADE,
      service_type VARCHAR(50) NOT NULL,
      booking_details JSONB NOT NULL DEFAULT '{}'::jsonb,
      estimated_amount NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      purpose_of_travel TEXT,
      project_code VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      approval_comment TEXT,
      approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS mybiz_invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES mybiz_companies(id) ON DELETE CASCADE,
      invoice_number VARCHAR(100) UNIQUE NOT NULL,
      invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      due_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
      amount NUMERIC(12, 2) NOT NULL,
      tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
      total_amount NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      paid_at TIMESTAMPTZ,
      items JSONB DEFAULT '[]'::jsonb,
      pdf_url VARCHAR(500),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pricing_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      channel VARCHAR(20) NOT NULL DEFAULT 'B2C', -- 'B2C', 'B2B', 'ALL'
      service_type VARCHAR(30) NOT NULL DEFAULT 'ALL', -- 'FLIGHT', 'HOTEL', 'TRAIN', 'BUS', 'CAB', 'PACKAGE', 'ALL'
      company_id UUID REFERENCES mybiz_companies(id) ON DELETE CASCADE,
      calculation_type VARCHAR(30) NOT NULL DEFAULT 'PERCENTAGE_MARKUP', -- 'PERCENTAGE_MARKUP', 'FIXED_MARKUP', 'PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT'
      value NUMERIC(12, 2) NOT NULL DEFAULT 5.00,
      min_markup_amount NUMERIC(12, 2) DEFAULT 0.00,
      max_markup_amount NUMERIC(12, 2),
      priority INT NOT NULL DEFAULT 100,
      valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      valid_until TIMESTAMPTZ,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      description TEXT,
      created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pricing_audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rule_id UUID REFERENCES pricing_rules(id) ON DELETE SET NULL,
      admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
      admin_email VARCHAR(255) NOT NULL,
      action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'TOGGLE'
      previous_state JSONB DEFAULT '{}'::jsonb,
      new_state JSONB DEFAULT '{}'::jsonb,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Seed initial base rules if none exist
    INSERT INTO pricing_rules (name, channel, service_type, calculation_type, value, priority, description)
    SELECT 'Standard B2C Retail Flight Markup', 'B2C', 'FLIGHT', 'PERCENTAGE_MARKUP', 5.00, 50, 'Standard 5% retail markup on supplier flight base fare'
    WHERE NOT EXISTS (SELECT 1 FROM pricing_rules WHERE channel = 'B2C' AND service_type = 'FLIGHT');

    INSERT INTO pricing_rules (name, channel, service_type, calculation_type, value, priority, description)
    SELECT 'Standard B2C Retail Hotel Markup', 'B2C', 'HOTEL', 'PERCENTAGE_MARKUP', 8.00, 50, 'Standard 8% retail markup on supplier hotel base rate'
    WHERE NOT EXISTS (SELECT 1 FROM pricing_rules WHERE channel = 'B2C' AND service_type = 'HOTEL');

    INSERT INTO pricing_rules (name, channel, service_type, calculation_type, value, priority, description)
    SELECT 'myBiz Corporate Flight Corporate Rate', 'B2B', 'FLIGHT', 'FIXED_MARKUP', 199.00, 50, 'Exclusive corporate flat fee of ₹199 per ticket for myBiz accounts'
    WHERE NOT EXISTS (SELECT 1 FROM pricing_rules WHERE channel = 'B2B' AND service_type = 'FLIGHT');

    INSERT INTO pricing_rules (name, channel, service_type, calculation_type, value, priority, description)
    SELECT 'myBiz Corporate Hotel Corporate Rate', 'B2B', 'HOTEL', 'PERCENTAGE_MARKUP', 3.00, 50, 'Special negotiated corporate markup of 3% for myBiz hotel stays'
    WHERE NOT EXISTS (SELECT 1 FROM pricing_rules WHERE channel = 'B2B' AND service_type = 'HOTEL');

    INSERT INTO pricing_rules (name, channel, service_type, calculation_type, value, priority, description)
    SELECT 'General B2C Category Default', 'B2C', 'ALL', 'PERCENTAGE_MARKUP', 4.00, 100, 'Global 4% fallback markup on ancillary travel services'
    WHERE NOT EXISTS (SELECT 1 FROM pricing_rules WHERE channel = 'B2C' AND service_type = 'ALL');

    INSERT INTO pricing_rules (name, channel, service_type, calculation_type, value, priority, description)
    SELECT 'General B2B Corporate Default', 'B2B', 'ALL', 'PERCENTAGE_MARKUP', 2.00, 100, 'Global 2% fallback corporate fee on ancillary services'
    WHERE NOT EXISTS (SELECT 1 FROM pricing_rules WHERE channel = 'B2B' AND service_type = 'ALL');
  `);
}

