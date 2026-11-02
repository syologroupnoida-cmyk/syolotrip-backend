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

    -- Auto-seed Flights if empty
    INSERT INTO flights (airline, airline_code, flight_number, aircraft, origin_code, origin_name, origin_city, origin_country, destination_code, destination_name, destination_city, destination_country, departure_time, arrival_time, duration_minutes, stops, cabin_class, available_seats, base_fare, taxes, total_price, currency, is_active)
    SELECT 'Air India', 'AI', 'AI-101', 'Boeing 787-8', 'DEL', 'Indira Gandhi Intl', 'Delhi', 'India', 'BOM', 'Chhatrapati Shivaji Intl', 'Mumbai', 'India', '06:00', '08:15', 135, 0, 'ECONOMY', 45, 4500, 750, 5250, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM flights WHERE origin_code = 'DEL' AND destination_code = 'BOM');

    INSERT INTO flights (airline, airline_code, flight_number, aircraft, origin_code, origin_name, origin_city, origin_country, destination_code, destination_name, destination_city, destination_country, departure_time, arrival_time, duration_minutes, stops, cabin_class, available_seats, base_fare, taxes, total_price, currency, is_active)
    SELECT 'IndiGo', '6E', '6E-204', 'Airbus A320neo', 'DEL', 'Indira Gandhi Intl', 'Delhi', 'India', 'BLR', 'Kempegowda Intl', 'Bengaluru', 'India', '09:30', '12:15', 165, 0, 'ECONOMY', 32, 5200, 800, 6000, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM flights WHERE origin_code = 'DEL' AND destination_code = 'BLR');

    INSERT INTO flights (airline, airline_code, flight_number, aircraft, origin_code, origin_name, origin_city, origin_country, destination_code, destination_name, destination_city, destination_country, departure_time, arrival_time, duration_minutes, stops, cabin_class, available_seats, base_fare, taxes, total_price, currency, is_active)
    SELECT 'Vistara', 'UK', 'UK-811', 'Airbus A321neo', 'BOM', 'Chhatrapati Shivaji Intl', 'Mumbai', 'India', 'GOI', 'Dabolim Airport', 'Goa', 'India', '14:00', '15:15', 75, 0, 'ECONOMY', 28, 3800, 600, 4400, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM flights WHERE origin_code = 'BOM' AND destination_code = 'GOI');

    INSERT INTO flights (airline, airline_code, flight_number, aircraft, origin_code, origin_name, origin_city, origin_country, destination_code, destination_name, destination_city, destination_country, departure_time, arrival_time, duration_minutes, stops, cabin_class, available_seats, base_fare, taxes, total_price, currency, is_active)
    SELECT 'Emirates', 'EK', 'EK-511', 'Boeing 777-300ER', 'DEL', 'Indira Gandhi Intl', 'Delhi', 'India', 'DXB', 'Dubai International', 'Dubai', 'UAE', '10:45', '13:15', 240, 0, 'ECONOMY', 36, 18500, 3200, 21700, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM flights WHERE origin_code = 'DEL' AND destination_code = 'DXB');

    INSERT INTO flights (airline, airline_code, flight_number, aircraft, origin_code, origin_name, origin_city, origin_country, destination_code, destination_name, destination_city, destination_country, departure_time, arrival_time, duration_minutes, stops, cabin_class, available_seats, base_fare, taxes, total_price, currency, is_active)
    SELECT 'British Airways', 'BA', 'BA-142', 'Boeing 787-9', 'DEL', 'Indira Gandhi Intl', 'Delhi', 'India', 'LHR', 'Heathrow Airport', 'London', 'UK', '03:15', '07:45', 540, 0, 'ECONOMY', 22, 42000, 6500, 48500, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM flights WHERE origin_code = 'DEL' AND destination_code = 'LHR');

    INSERT INTO flights (airline, airline_code, flight_number, aircraft, origin_code, origin_name, origin_city, origin_country, destination_code, destination_name, destination_city, destination_country, departure_time, arrival_time, duration_minutes, stops, cabin_class, available_seats, base_fare, taxes, total_price, currency, is_active)
    SELECT 'Air France', 'AF', 'AF-225', 'Airbus A350-900', 'DEL', 'Indira Gandhi Intl', 'Delhi', 'India', 'CDG', 'Charles de Gaulle', 'Paris', 'France', '01:50', '07:05', 525, 0, 'ECONOMY', 19, 44000, 6800, 50800, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM flights WHERE origin_code = 'DEL' AND destination_code = 'CDG');

    INSERT INTO flights (airline, airline_code, flight_number, aircraft, origin_code, origin_name, origin_city, origin_country, destination_code, destination_name, destination_city, destination_country, departure_time, arrival_time, duration_minutes, stops, cabin_class, available_seats, base_fare, taxes, total_price, currency, is_active)
    SELECT 'Singapore Airlines', 'SQ', 'SQ-401', 'Airbus A380', 'DEL', 'Indira Gandhi Intl', 'Delhi', 'India', 'SIN', 'Changi Airport', 'Singapore', 'Singapore', '09:50', '18:05', 345, 0, 'ECONOMY', 48, 22500, 3600, 26100, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM flights WHERE origin_code = 'DEL' AND destination_code = 'SIN');

    INSERT INTO flights (airline, airline_code, flight_number, aircraft, origin_code, origin_name, origin_city, origin_country, destination_code, destination_name, destination_city, destination_country, departure_time, arrival_time, duration_minutes, stops, cabin_class, available_seats, base_fare, taxes, total_price, currency, is_active)
    SELECT 'United Airlines', 'UA', 'UA-802', 'Boeing 777-200LR', 'DEL', 'Indira Gandhi Intl', 'Delhi', 'India', 'NYC', 'JFK International', 'New York', 'USA', '23:35', '06:20+1', 915, 0, 'ECONOMY', 15, 68000, 9200, 77200, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM flights WHERE origin_code = 'DEL' AND destination_code = 'NYC');

    INSERT INTO flights (airline, airline_code, flight_number, aircraft, origin_code, origin_name, origin_city, origin_country, destination_code, destination_name, destination_city, destination_country, departure_time, arrival_time, duration_minutes, stops, cabin_class, available_seats, base_fare, taxes, total_price, currency, is_active)
    SELECT 'Batik Air', 'OD', 'OD-305', 'Boeing 737 MAX 8', 'DEL', 'Indira Gandhi Intl', 'Delhi', 'India', 'DPS', 'Ngurah Rai Intl', 'Bali', 'Indonesia', '22:15', '09:40+1', 535, 1, 'ECONOMY', 24, 26000, 4200, 30200, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM flights WHERE origin_code = 'DEL' AND destination_code = 'DPS');

    -- Auto-seed Hotels if missing key destinations
    INSERT INTO hotels (name, property_type, star_rating, guest_rating, rating_label, review_count, address, city, country, neighborhood, overview, featured_image, starting_price, currency, is_active, featured)
    SELECT 'W Goa Beachfront Resort & Spa', 'HOTEL', 5, 9.1, 'Exceptional', 540, 'Vagator Beach', 'Goa', 'India', 'Vagator Beachfront · North Goa', 'Vibrant coastal escape featuring dramatic cliffs, pristine sand, and signature poolside beats.', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop&q=80', 16500, 'INR', true, true
    WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE city = 'Goa');

    INSERT INTO hotels (name, property_type, star_rating, guest_rating, rating_label, review_count, address, city, country, neighborhood, overview, featured_image, starting_price, currency, is_active, featured)
    SELECT 'Villa Sol Candolim - Private Pool Villa', 'VILLA', 5, 9.5, 'Exceptional', 188, 'Candolim Beach Road', 'Goa', 'India', 'Candolim · 200m to Beach', 'Exclusive 4BHK private pool luxury villa with personal chef, tropical gardens, and private beach access.', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80', 14500, 'INR', true, true
    WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE name = 'Villa Sol Candolim - Private Pool Villa');

    INSERT INTO hotels (name, property_type, star_rating, guest_rating, rating_label, review_count, address, city, country, neighborhood, overview, featured_image, starting_price, currency, is_active, featured)
    SELECT 'Atlantis The Palm Dubai', 'HOTEL', 5, 9.3, 'Exceptional', 3120, 'Crescent Road, The Palm', 'Dubai', 'UAE', 'Palm Jumeirah Waterfront', 'World-famous luxury resort with private sandy beaches, Aquaventure waterpark, and Michelin-star dining.', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80', 26000, 'INR', true, true
    WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE city = 'Dubai');

    INSERT INTO hotels (name, property_type, star_rating, guest_rating, rating_label, review_count, address, city, country, neighborhood, overview, featured_image, starting_price, currency, is_active, featured)
    SELECT 'Four Seasons Resort Bali at Sayan', 'HOTEL', 5, 9.6, 'Exceptional', 890, 'Sayan, Ubud', 'Bali', 'Indonesia', 'Ayung River Valley · Ubud', 'Immerse in lush tropical jungle canopy, private infinity plunge pools, and world-class Balinese wellness.', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80', 32000, 'INR', true, true
    WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE city = 'Bali');

    INSERT INTO hotels (name, property_type, star_rating, guest_rating, rating_label, review_count, address, city, country, neighborhood, overview, featured_image, starting_price, currency, is_active, featured)
    SELECT 'The Ritz London', 'HOTEL', 5, 9.4, 'Exceptional', 1420, '150 Piccadilly', 'London', 'UK', 'Mayfair · St James''s Park', 'The benchmark for global British elegance, legendary Afternoon Tea, and opulent neoclassical architecture.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80', 48000, 'INR', true, true
    WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE city = 'London');

    INSERT INTO hotels (name, property_type, star_rating, guest_rating, rating_label, review_count, address, city, country, neighborhood, overview, featured_image, starting_price, currency, is_active, featured)
    SELECT 'The Taj Mahal Palace', 'HOTEL', 5, 9.4, 'Exceptional', 4200, 'Apollo Bunder, Colaba', 'Mumbai', 'India', 'Colaba · Facing Gateway of India', 'Historic luxury landmark overlooking the Gateway of India with royal hospitality and fine dining.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80', 22000, 'INR', true, true
    WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE city = 'Mumbai');

    INSERT INTO hotels (name, property_type, star_rating, guest_rating, rating_label, review_count, address, city, country, neighborhood, overview, featured_image, starting_price, currency, is_active, featured)
    SELECT 'The Leela Palace New Delhi', 'HOTEL', 5, 9.3, 'Exceptional', 2150, 'Diplomatic Enclave, Chanakyapuri', 'Delhi', 'India', 'Chanakyapuri Diplomatic Enclave', 'Palatial elegance blending Lutyens architecture with modern luxury in the heart of Delhi.', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80', 18500, 'INR', true, true
    WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE city = 'Delhi');

    -- Auto-seed default rooms for hotels that have no rooms
    INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, max_occupancy, price_per_night, taxes_per_night, available_rooms, is_available)
    SELECT h.id, 'Deluxe King Executive Room', 'King Bed', 2, h.starting_price, ROUND(h.starting_price * 0.12, 2), 6, true
    FROM hotels h
    WHERE NOT EXISTS (SELECT 1 FROM hotel_rooms r WHERE r.hotel_id = h.id);

    -- Auto-seed Trains
    INSERT INTO trains (id, train_number, train_name, train_type, from_station_code, from_station_name, from_city, to_station_code, to_station_name, to_city, departure_time, arrival_time, duration_minutes, train_class, available_seats, base_fare, rating, currency, is_active)
    VALUES ('3a823f7d-7480-46d2-94c2-442092bc4f2b', '20172', 'Vande Bharat Express', 'Vande Bharat', 'NDLS', 'New Delhi Railway Station', 'Delhi', 'MMCT', 'Mumbai Central', 'Mumbai', '06:00', '14:05', 485, 'Executive Chair (EC)', 42, 2350, 4.9, 'INR', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO trains (train_number, train_name, train_type, from_station_code, from_station_name, from_city, to_station_code, to_station_name, to_city, departure_time, arrival_time, duration_minutes, train_class, available_seats, base_fare, rating, currency, is_active)
    SELECT '22436', 'Vande Bharat Express', 'Vande Bharat', 'NDLS', 'New Delhi Railway Station', 'Delhi', 'BSB', 'Varanasi Junction', 'Varanasi', '06:00', '14:00', 480, 'Executive Chair (EC)', 54, 3310, 4.9, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM trains WHERE train_number = '22436');

    INSERT INTO trains (train_number, train_name, train_type, from_station_code, from_station_name, from_city, to_station_code, to_station_name, to_city, departure_time, arrival_time, duration_minutes, train_class, available_seats, base_fare, rating, currency, is_active)
    SELECT '12002', 'Bhopal Shatabdi Express', 'Shatabdi', 'NDLS', 'New Delhi Railway Station', 'Delhi', 'AGC', 'Agra Cantt', 'Agra', '06:00', '07:50', 110, 'AC Chair Car (CC)', 88, 750, 4.8, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM trains WHERE train_number = '12002');

    INSERT INTO trains (train_number, train_name, train_type, from_station_code, from_station_name, from_city, to_station_code, to_station_name, to_city, departure_time, arrival_time, duration_minutes, train_class, available_seats, base_fare, rating, currency, is_active)
    SELECT '20608', 'Mysuru - Chennai Vande Bharat', 'Vande Bharat', 'SBC', 'KSR Bengaluru', 'Bengaluru', 'MAS', 'Chennai Central', 'Chennai', '14:50', '19:20', 270, 'AC Chair Car (CC)', 96, 995, 4.9, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM trains WHERE train_number = '20608');

    -- Auto-seed Buses
    INSERT INTO buses (id, operator_name, bus_type, from_city, to_city, boarding_point, dropping_point, departure_time, arrival_time, duration_minutes, available_seats, base_fare, rating, currency, is_active)
    VALUES ('145c8396-2c87-4c67-bb1d-356fefb113ad', 'Zingbus Luxury AC Sleeper (2+1)', 'Volvo 9600 Multi-Axle AC Sleeper', 'Bengaluru', 'Goa', 'Majestic / Silk Board', 'Panjim KTC Bus Stand', '21:00', '07:30+1', 630, 24, 950, 4.8, 'INR', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO buses (operator_name, bus_type, from_city, to_city, boarding_point, dropping_point, departure_time, arrival_time, duration_minutes, available_seats, base_fare, rating, currency, is_active)
    SELECT 'IntrCity SmartBus Volvo Club Class', 'Scania Multi-Axle AC Sleeper', 'Mumbai', 'Goa', 'Borivali West / Dadar', 'Panjim Bus Stand', '22:15', '08:45+1', 630, 18, 1150, 4.9, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM buses WHERE operator_name = 'IntrCity SmartBus Volvo Club Class');

    INSERT INTO buses (operator_name, bus_type, from_city, to_city, boarding_point, dropping_point, departure_time, arrival_time, duration_minutes, available_seats, base_fare, rating, currency, is_active)
    SELECT 'Zingbus Electric Intercity', 'Electric Multi-Axle AC Seater', 'Delhi', 'Jaipur', 'Kashmere Gate ISBT', 'Sindhi Camp Bus Stand', '23:00', '04:30+1', 330, 26, 750, 4.8, 'INR', true
    WHERE NOT EXISTS (SELECT 1 FROM buses WHERE operator_name = 'Zingbus Electric Intercity');

    -- Auto-seed Cabs
    INSERT INTO cabs (id, cab_type, vehicle_model, city, pickup_area, drop_area, driver_name, driver_rating, capacity, base_fare, currency, eta_minutes, features, is_active)
    VALUES ('c394fa80-9c72-4868-8a22-d91b7a624d3d', 'Sedan Prime', 'Maruti Suzuki Dzire / Honda City', 'Delhi', 'IGI Airport Terminal 3', 'Connaught Place / Central Delhi', 'Rajinder Singh (Verified)', 4.92, 4, 650, 'INR', 8, '["AC", "Zero Cancellation Fee", "Clean Cab Guarantee"]'::jsonb, true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO cabs (cab_type, vehicle_model, city, pickup_area, drop_area, driver_name, driver_rating, capacity, base_fare, currency, eta_minutes, features, is_active)
    SELECT 'SUV XL Executive', 'Toyota Innova Crysta', 'Mumbai', 'Chhatrapati Shivaji Maharaj Airport (T2)', 'Bandra Kurla Complex (BKC)', 'Manoj Patil (Top Rated)', 4.95, 6, 1250, 'INR', 10, '["AC", "Extra Luggage Boot", "Tolls Included"]'::jsonb, true
    WHERE NOT EXISTS (SELECT 1 FROM cabs WHERE city = 'Mumbai' AND cab_type = 'SUV XL Executive');

    INSERT INTO cabs (cab_type, vehicle_model, city, pickup_area, drop_area, driver_name, driver_rating, capacity, base_fare, currency, eta_minutes, features, is_active)
    SELECT 'Luxury Electric EV', 'BYD Seal / Ioniq 5', 'Bengaluru', 'Kempegowda International Airport (BLR)', 'Indiranagar / Koramangala', 'Naveen Gowda', 4.98, 4, 1450, 'INR', 10, '["Zero Emissions EV", "Silent Cabin", "Refreshments"]'::jsonb, true
    WHERE NOT EXISTS (SELECT 1 FROM cabs WHERE city = 'Bengaluru' AND cab_type = 'Luxury Electric EV');

    -- Auto-seed Holiday Packages
    INSERT INTO holiday_packages (id, title, destination, duration_days, duration_nights, overview, inclusions, exclusions, itinerary, price_per_person, currency, featured_image, rating, available_capacity, is_active)
    VALUES (
      '69f529cb-0a00-4b6e-bc78-b1be05991eab',
      'Kashmir Paradise: Srinagar, Gulmarg & Pahalgam',
      'Kashmir, India',
      5, 4,
      'Experience the heaven on earth with stays on Dal Lake luxury houseboats, snow peaks of Gulmarg, and saffron fields of Pahalgam.',
      '["Deluxe Houseboat Stay in Srinagar", "Gondola Cable Car Phase 1 Tickets", "Daily Buffet Breakfast & Dinner", "All Private Chauffeur Transfers"]'::jsonb,
      '["Pony rides in Gulmarg"]'::jsonb,
      '[{"day": 1, "title": "Arrival in Srinagar & Dal Lake Shikara", "description": "Check-in to luxury houseboat, evening romantic Shikara cruise"}, {"day": 2, "title": "Gulmarg Meadow of Flowers", "description": "World-famous Gondola ride up Apharwat peak"}, {"day": 3, "title": "Pahalgam Valley & Betaab Valley", "description": "Lidder river stroll, pine forests excursion"}]'::jsonb,
      24500, 'INR',
      'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800&auto=format&fit=crop&q=80',
      4.9, 25, true
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO holiday_packages (title, destination, duration_days, duration_nights, overview, inclusions, exclusions, itinerary, price_per_person, currency, featured_image, rating, available_capacity, is_active)
    SELECT
      'Goa Coastal Bliss: Beachfront Resort & Heritage',
      'Goa, India',
      4, 3,
      'Ultimate beach vacation featuring 5-star beachfront stays, private sunset catamaran cruise, and Old Goa Portuguese heritage tours.',
      '["5-Star Beach Resort Stay", "Private Sunset Catamaran Cruise", "Daily Chef Breakfast", "Airport Roundtrip Transfers"]'::jsonb,
      '["Water sports personal expenses"]'::jsonb,
      '[{"day": 1, "title": "Welcome to Goa", "description": "Private transfer to beachfront resort"}, {"day": 2, "title": "Catamaran Cruise & Dolphin Sightings", "description": "Sunset cruise with refreshments"}, {"day": 3, "title": "Old Goa Latin Quarter Heritage", "description": "Fontainhas historic walking tour"}]'::jsonb,
      16500, 'INR',
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80',
      4.85, 30, true
    WHERE NOT EXISTS (SELECT 1 FROM holiday_packages WHERE title LIKE '%Goa Coastal Bliss%');
  `);
}

