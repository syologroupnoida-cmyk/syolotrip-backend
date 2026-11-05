import { query } from '../db/index.js';

export async function initDbSchema() {
  await query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Ensure default gen_random_uuid() for id columns on legacy tables
    DO $$ BEGIN
      ALTER TABLE flights ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE hotels ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE hotel_rooms ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE trains ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE buses ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE cabs ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE holiday_packages ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE partner_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE bookings ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE booking_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE coupons ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE wishlist_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION WHEN OTHERS THEN NULL; END $$;

    -- Ensure default TRUE for is_simulated across legacy tables
    DO $$ BEGIN
      ALTER TABLE flights ALTER COLUMN is_simulated SET DEFAULT TRUE;
    EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE hotels ALTER COLUMN is_simulated SET DEFAULT TRUE;
    EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE trains ALTER COLUMN is_simulated SET DEFAULT TRUE;
    EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE buses ALTER COLUMN is_simulated SET DEFAULT TRUE;
    EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE cabs ALTER COLUMN is_simulated SET DEFAULT TRUE;
    EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE holiday_packages ALTER COLUMN is_simulated SET DEFAULT TRUE;
    EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

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

    ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(300);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(150);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS passport_expiry DATE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS passport_issuing_country VARCHAR(100) DEFAULT 'India';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_card_number VARCHAR(20);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_insurance_preferences JSONB DEFAULT '{"domestic_hotel": false, "domestic_flight": false, "international_hotel": false, "international_flight": false}'::jsonb;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS frequent_flyer_details JSONB DEFAULT '[]'::jsonb;

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
      package_id VARCHAR(50) UNIQUE,
      slug VARCHAR(300) UNIQUE,
      title VARCHAR(250) NOT NULL,
      destination VARCHAR(150) NOT NULL,
      region VARCHAR(50) NOT NULL DEFAULT 'National',
      theme VARCHAR(100),
      package_type VARCHAR(100) DEFAULT 'Holiday',
      duration VARCHAR(100),
      duration_days INT NOT NULL DEFAULT 5,
      duration_nights INT NOT NULL DEFAULT 4,
      overview TEXT NOT NULL,
      inclusions JSONB DEFAULT '[]'::jsonb,
      exclusions JSONB DEFAULT '[]'::jsonb,
      itinerary JSONB DEFAULT '[]'::jsonb,
      price_per_person NUMERIC(12, 2) NOT NULL,
      old_price NUMERIC(12, 2),
      discount_percent INT DEFAULT 0,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      route VARCHAR(500),
      highlights JSONB DEFAULT '[]'::jsonb,
      places_covered JSONB DEFAULT '[]'::jsonb,
      activities JSONB DEFAULT '[]'::jsonb,
      hotel_category VARCHAR(150),
      transfers VARCHAR(255),
      meals VARCHAR(255),
      sightseeing VARCHAR(255),
      best_time_to_visit VARCHAR(150),
      suitable_for VARCHAR(150),
      offer_title VARCHAR(300),
      offer_description TEXT,
      cancellation_policy TEXT,
      seo_title VARCHAR(300),
      seo_description TEXT,
      seo_keywords TEXT,
      day_wise_itinerary_text TEXT,
      publication_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
      featured_image VARCHAR(500) NOT NULL DEFAULT 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
      rating FLOAT NOT NULL DEFAULT 4.8,
      available_capacity INT NOT NULL DEFAULT 20,
      is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Schema upgrades for existing holiday_packages installations
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS package_id VARCHAR(50);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS slug VARCHAR(300);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'National';
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS theme VARCHAR(100);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS package_type VARCHAR(100) DEFAULT 'Holiday';
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS duration VARCHAR(100);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS old_price NUMERIC(12, 2);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS discount_percent INT DEFAULT 0;
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS route VARCHAR(500);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS places_covered JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS activities JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS hotel_category VARCHAR(150);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS transfers VARCHAR(255);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS meals VARCHAR(255);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS sightseeing VARCHAR(255);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS best_time_to_visit VARCHAR(150);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS suitable_for VARCHAR(150);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS offer_title VARCHAR(300);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS offer_description TEXT;
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS seo_title VARCHAR(300);
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS seo_description TEXT;
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS day_wise_itinerary_text TEXT;
    ALTER TABLE holiday_packages ADD COLUMN IF NOT EXISTS publication_status VARCHAR(50) DEFAULT 'DRAFT';

    DO $$ BEGIN
      ALTER TABLE holiday_packages ADD CONSTRAINT uq_holiday_packages_package_id UNIQUE (package_id);
    EXCEPTION WHEN OTHERS THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE holiday_packages ADD CONSTRAINT uq_holiday_packages_slug UNIQUE (slug);
    EXCEPTION WHEN OTHERS THEN NULL; END $$;

    -- Relational Day-Wise Itineraries Table
    CREATE TABLE IF NOT EXISTS package_itineraries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      package_id VARCHAR(50) NOT NULL,
      destination VARCHAR(150),
      package_title VARCHAR(250),
      day_number INT NOT NULL,
      itinerary_description TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_pkg_itin_day UNIQUE (package_id, day_number)
    );

    CREATE INDEX IF NOT EXISTS idx_pkg_region ON holiday_packages(LOWER(region));
    CREATE INDEX IF NOT EXISTS idx_pkg_theme ON holiday_packages(LOWER(theme));
    CREATE INDEX IF NOT EXISTS idx_pkg_status ON holiday_packages(publication_status, is_active);
    CREATE INDEX IF NOT EXISTS idx_pkg_dest ON holiday_packages(LOWER(destination));
    CREATE INDEX IF NOT EXISTS idx_itin_pkg_id ON package_itineraries(package_id);
    CREATE INDEX IF NOT EXISTS idx_itin_day ON package_itineraries(package_id, day_number);

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

    CREATE TABLE IF NOT EXISTS saved_travellers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(10) NOT NULL DEFAULT 'Mr',
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      gender VARCHAR(20) NOT NULL DEFAULT 'MALE',
      date_of_birth DATE,
      passenger_type VARCHAR(20) NOT NULL DEFAULT 'ADULT',
      phone VARCHAR(50),
      email VARCHAR(255),
      passport_number VARCHAR(50),
      passport_expiry DATE,
      nationality VARCHAR(50) DEFAULT 'Indian',
      meal_preference VARCHAR(50),
      seat_preference VARCHAR(50),
      relationship VARCHAR(50),
      berth_preference VARCHAR(50),
      passport_issuing_country VARCHAR(100) DEFAULT 'India',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE saved_travellers ADD COLUMN IF NOT EXISTS relationship VARCHAR(50);
    ALTER TABLE saved_travellers ADD COLUMN IF NOT EXISTS berth_preference VARCHAR(50);
    ALTER TABLE saved_travellers ADD COLUMN IF NOT EXISTS passport_issuing_country VARCHAR(100) DEFAULT 'India';

    CREATE INDEX IF NOT EXISTS idx_saved_travellers_user_id ON saved_travellers(user_id);

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

    -- ============================================================
    -- PHASE 1: MASTER LOCATION DISCOVERY & REFERENCE TABLES
    -- ============================================================

    -- 1. COUNTRIES MASTER TABLE
    CREATE TABLE IF NOT EXISTS countries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(10) UNIQUE NOT NULL, -- ISO-3166-1 alpha-2 (e.g. 'IN', 'AE', 'US')
      iso3 VARCHAR(10) UNIQUE NOT NULL, -- ISO-3166-1 alpha-3 (e.g. 'IND', 'ARE', 'USA')
      name VARCHAR(200) NOT NULL,
      official_name VARCHAR(255),
      continent VARCHAR(100) NOT NULL,
      flag_emoji VARCHAR(20) NOT NULL DEFAULT '🌐',
      currency_code VARCHAR(10) DEFAULT 'INR',
      requires_visa_for_indian_passports BOOLEAN NOT NULL DEFAULT FALSE,
      visa_types_available JSONB DEFAULT '[]'::jsonb,
      aliases JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      source VARCHAR(100) NOT NULL DEFAULT 'ISO-3166',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 2. DESTINATIONS & CITIES MASTER TABLE
    CREATE TABLE IF NOT EXISTS destinations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR(150) UNIQUE NOT NULL,
      name VARCHAR(200) NOT NULL,
      city VARCHAR(150),
      display_name VARCHAR(300) NOT NULL,
      state VARCHAR(150),
      country VARCHAR(150) NOT NULL DEFAULT 'India',
      country_code VARCHAR(10),
      destination_type VARCHAR(50) NOT NULL DEFAULT 'CITY', -- 'CITY', 'HILL_STATION', 'BEACH', 'HERITAGE', 'METRO', 'ISLAND'
      latitude FLOAT,
      longitude FLOAT,
      timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
      popular_services JSONB DEFAULT '["hotels", "cabs"]'::jsonb,
      aliases JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      source VARCHAR(100) NOT NULL DEFAULT 'GEO_MASTER',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS city VARCHAR(150);

    -- 3. AIRPORTS MASTER TABLE
    CREATE TABLE IF NOT EXISTS airports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      iata_code VARCHAR(10),
      icao_code VARCHAR(10),
      name VARCHAR(255) NOT NULL,
      city VARCHAR(150) NOT NULL,
      state VARCHAR(150),
      country VARCHAR(150) NOT NULL,
      country_code VARCHAR(10),
      latitude FLOAT,
      longitude FLOAT,
      elevation_ft INT,
      airport_type VARCHAR(50) NOT NULL DEFAULT 'large_airport',
      is_commercial BOOLEAN NOT NULL DEFAULT TRUE,
      aliases JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      source VARCHAR(100) NOT NULL DEFAULT 'OurAirports',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS uq_airports_iata ON airports(iata_code) WHERE iata_code IS NOT NULL;

    -- 4. RAILWAY STATIONS MASTER TABLE
    CREATE TABLE IF NOT EXISTS railway_stations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      station_code VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      city VARCHAR(150) NOT NULL,
      state VARCHAR(150) NOT NULL,
      country VARCHAR(150) NOT NULL DEFAULT 'India',
      zone VARCHAR(50),
      division VARCHAR(50),
      latitude FLOAT,
      longitude FLOAT,
      station_category VARCHAR(50) DEFAULT 'NSG-1',
      aliases JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      source VARCHAR(100) NOT NULL DEFAULT 'IndianRailways-OpenData',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 5. BUS TERMINALS AND STOPS MASTER TABLE
    CREATE TABLE IF NOT EXISTS bus_terminals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      terminal_code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      city VARCHAR(150) NOT NULL,
      state VARCHAR(150) NOT NULL,
      country VARCHAR(150) NOT NULL DEFAULT 'India',
      terminal_type VARCHAR(50) NOT NULL DEFAULT 'ISBT',
      address VARCHAR(300),
      latitude FLOAT,
      longitude FLOAT,
      aliases JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      source VARCHAR(100) NOT NULL DEFAULT 'OpenStreetMap-Transport',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 6. TOURS MASTER TABLE
    CREATE TABLE IF NOT EXISTS tours (
      id VARCHAR(100) PRIMARY KEY,
      slug VARCHAR(200) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      city VARCHAR(150) NOT NULL,
      country VARCHAR(150) NOT NULL,
      duration VARCHAR(100) NOT NULL,
      category VARCHAR(150) NOT NULL,
      rating FLOAT NOT NULL DEFAULT 4.8,
      review_count INT NOT NULL DEFAULT 100,
      price_per_person NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      featured_image VARCHAR(500) NOT NULL,
      highlights JSONB DEFAULT '[]'::jsonb,
      cancellation_policy TEXT NOT NULL DEFAULT 'Free cancellation up to 24 hours',
      instant_confirmation BOOLEAN NOT NULL DEFAULT TRUE,
      overview TEXT,
      itinerary JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      source VARCHAR(100) NOT NULL DEFAULT 'SS_JOURNEY_CURATED',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 7. VISA REQUIREMENTS MASTER TABLE
    CREATE TABLE IF NOT EXISTS visa_requirements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      country_code VARCHAR(10) NOT NULL,
      country_name VARCHAR(150) NOT NULL,
      visa_slug VARCHAR(150) UNIQUE NOT NULL,
      visa_name VARCHAR(255) NOT NULL,
      flag_emoji VARCHAR(20) NOT NULL DEFAULT '🌐',
      validity VARCHAR(100) NOT NULL,
      stay_period VARCHAR(100) NOT NULL,
      processing_time VARCHAR(100) NOT NULL,
      express_available BOOLEAN NOT NULL DEFAULT FALSE,
      base_fee NUMERIC(12, 2) NOT NULL,
      embassy_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
      service_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
      total_price NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      requirements JSONB DEFAULT '[]'::jsonb,
      approval_rate VARCHAR(20) DEFAULT '99%',
      aliases JSONB DEFAULT '[]'::jsonb,
      last_verified_at TIMESTAMPTZ DEFAULT NOW(),
      review_status VARCHAR(50) DEFAULT 'VERIFIED',
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      source VARCHAR(100) NOT NULL DEFAULT 'EMBASSY_RULES',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE visa_requirements ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE visa_requirements ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'VERIFIED';
    ALTER TABLE visa_requirements ADD COLUMN IF NOT EXISTS description TEXT;

    -- 8. TRAVEL INSURANCE PLANS
    CREATE TABLE IF NOT EXISTS travel_insurance_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_code VARCHAR(50) UNIQUE NOT NULL,
      plan_name VARCHAR(200) NOT NULL,
      provider_name VARCHAR(150) NOT NULL,
      coverage_zone VARCHAR(100) NOT NULL DEFAULT 'Worldwide',
      max_medical_coverage NUMERIC(12, 2) NOT NULL DEFAULT 5000000.00,
      baggage_loss_coverage NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
      trip_cancellation_coverage NUMERIC(12, 2) NOT NULL DEFAULT 100000.00,
      daily_premium NUMERIC(12, 2) NOT NULL DEFAULT 99.00,
      base_premium NUMERIC(12, 2) NOT NULL DEFAULT 499.00,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      validity_days INT NOT NULL DEFAULT 30,
      policy_benefits JSONB DEFAULT '[]'::jsonb,
      policy_exclusions JSONB DEFAULT '[]'::jsonb,
      eligibility_min_age INT NOT NULL DEFAULT 1,
      eligibility_max_age INT NOT NULL DEFAULT 75,
      has_covid_coverage BOOLEAN NOT NULL DEFAULT TRUE,
      has_adventure_sports BOOLEAN NOT NULL DEFAULT FALSE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      source VARCHAR(100) NOT NULL DEFAULT 'SS_INSURE_PARTNERS',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 9. UNIVERSAL IMPORT JOBS
    CREATE TABLE IF NOT EXISTS import_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type VARCHAR(100) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_format VARCHAR(20) NOT NULL DEFAULT 'XLSX',
      total_records INT NOT NULL DEFAULT 0,
      successful_records INT NOT NULL DEFAULT 0,
      failed_records INT NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
      error_summary JSONB DEFAULT '[]'::jsonb,
      imported_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Schema upgrades for audit_logs & hotels
    ALTER TABLE audit_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_state JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_state JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS reason TEXT;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

    ALTER TABLE hotels ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE hotels ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE hotels ADD COLUMN IF NOT EXISTS check_in_time VARCHAR(20) DEFAULT '14:00';
    ALTER TABLE hotels ADD COLUMN IF NOT EXISTS check_out_time VARCHAR(20) DEFAULT '11:00';
    ALTER TABLE hotels ADD COLUMN IF NOT EXISTS house_rules JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE hotels ADD COLUMN IF NOT EXISTS cancellation_policy TEXT DEFAULT 'Free cancellation up to 48 hours before check-in';
    ALTER TABLE hotels ALTER COLUMN star_rating SET DEFAULT 4;
    ALTER TABLE hotels ALTER COLUMN guest_rating SET DEFAULT 8.8;
    ALTER TABLE hotels ALTER COLUMN rating_label SET DEFAULT 'Excellent';
    ALTER TABLE hotels ALTER COLUMN review_count SET DEFAULT 120;
    ALTER TABLE hotels ALTER COLUMN address SET DEFAULT 'Main Central Area';
    ALTER TABLE hotels ALTER COLUMN country SET DEFAULT 'India';
    ALTER TABLE hotels ALTER COLUMN overview SET DEFAULT 'Quality travel accommodation with modern amenities.';
    ALTER TABLE hotels ALTER COLUMN featured_image SET DEFAULT 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
    ALTER TABLE hotels ALTER COLUMN currency SET DEFAULT 'INR';
    ALTER TABLE hotels ALTER COLUMN is_active SET DEFAULT true;
    ALTER TABLE hotels ALTER COLUMN featured SET DEFAULT false;
    ALTER TABLE travel_insurance_plans ALTER COLUMN provider_name SET DEFAULT 'SS Shield Global';

    -- Seed Travel Insurance Plans
    INSERT INTO travel_insurance_plans (plan_code, plan_name, provider_name, coverage_zone, max_medical_coverage, baggage_loss_coverage, trip_cancellation_coverage, daily_premium, base_premium, policy_benefits, policy_exclusions, is_active)
    SELECT 'SHIELD-DOM-01', 'SS Shield Domestic Express', 'Tata AIG General Insurance', 'Domestic', 1500000.00, 25000.00, 50000.00, 49.00, 299.00,
           '["Emergency Medical Hospitalization up to ₹15 Lakh", "Flight Delay Compensation up to ₹10,000", "Lost Baggage Reimbursement", "Personal Accident Protection"]'::jsonb,
           '["Pre-existing diseases without declaration", "Extreme adventure sports without rider"]'::jsonb, true
    WHERE NOT EXISTS (SELECT 1 FROM travel_insurance_plans WHERE plan_code = 'SHIELD-DOM-01');

    INSERT INTO travel_insurance_plans (plan_code, plan_name, provider_name, coverage_zone, max_medical_coverage, baggage_loss_coverage, trip_cancellation_coverage, daily_premium, base_premium, policy_benefits, policy_exclusions, is_active)
    SELECT 'SHIELD-INT-02', 'SS Shield Global World Explorer', 'HDFC ERGO General Insurance', 'Worldwide', 10000000.00, 75000.00, 250000.00, 149.00, 899.00,
           '["Schengen & Worldwide Visa Compliant $250k Coverage", "Emergency Medical Evacuation", "Trip Cancellation & Interruption", "Loss of Passport & Documents Assistance", "24x7 Global Assistance Helpline"]'::jsonb,
           '["War zones or unadvised territories", "Non-medical personal expenditures"]'::jsonb, true
    WHERE NOT EXISTS (SELECT 1 FROM travel_insurance_plans WHERE plan_code = 'SHIELD-INT-02');

    -- ============================================================
    -- PERFORMANCE INDEXES (REFERENCE & INVENTORY)
    -- ============================================================
    CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata_code);
    CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(LOWER(city));
    CREATE INDEX IF NOT EXISTS idx_airports_name ON airports(LOWER(name));
    CREATE INDEX IF NOT EXISTS idx_airports_country ON airports(LOWER(country));
    CREATE INDEX IF NOT EXISTS idx_airports_active ON airports(is_active, is_commercial);

    CREATE INDEX IF NOT EXISTS idx_stations_code ON railway_stations(station_code);
    CREATE INDEX IF NOT EXISTS idx_stations_city ON railway_stations(LOWER(city));
    CREATE INDEX IF NOT EXISTS idx_stations_name ON railway_stations(LOWER(name));
    CREATE INDEX IF NOT EXISTS idx_stations_state ON railway_stations(LOWER(state));
    CREATE INDEX IF NOT EXISTS idx_stations_active ON railway_stations(is_active);

    CREATE INDEX IF NOT EXISTS idx_bus_terminals_city ON bus_terminals(LOWER(city));
    CREATE INDEX IF NOT EXISTS idx_bus_terminals_name ON bus_terminals(LOWER(name));
    CREATE INDEX IF NOT EXISTS idx_bus_terminals_active ON bus_terminals(is_active);

    CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
    CREATE INDEX IF NOT EXISTS idx_countries_iso3 ON countries(iso3);
    CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(LOWER(name));
    CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(is_active);

    CREATE INDEX IF NOT EXISTS idx_destinations_city ON destinations(LOWER(city));
    CREATE INDEX IF NOT EXISTS idx_destinations_name ON destinations(LOWER(name));
    CREATE INDEX IF NOT EXISTS idx_destinations_country ON destinations(LOWER(country));
    CREATE INDEX IF NOT EXISTS idx_destinations_active ON destinations(is_active);

    CREATE INDEX IF NOT EXISTS idx_tours_city ON tours(LOWER(city));
    CREATE INDEX IF NOT EXISTS idx_tours_country ON tours(LOWER(country));
    CREATE INDEX IF NOT EXISTS idx_tours_category ON tours(LOWER(category));
    CREATE INDEX IF NOT EXISTS idx_tours_active ON tours(is_active);

    CREATE INDEX IF NOT EXISTS idx_visa_country_code ON visa_requirements(country_code);
    CREATE INDEX IF NOT EXISTS idx_visa_country_name ON visa_requirements(LOWER(country_name));
    CREATE INDEX IF NOT EXISTS idx_visa_active ON visa_requirements(is_active);

    -- Search indexes on live inventory tables
    CREATE INDEX IF NOT EXISTS idx_flights_route ON flights(origin_code, destination_code, is_active);
    CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(LOWER(city), is_active);
    CREATE INDEX IF NOT EXISTS idx_trains_route ON trains(from_station_code, to_station_code, is_active);
    CREATE INDEX IF NOT EXISTS idx_buses_route ON buses(LOWER(from_city), LOWER(to_city), is_active);
    CREATE INDEX IF NOT EXISTS idx_packages_dest ON holiday_packages(LOWER(destination), is_active);

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

    INSERT INTO cabs (cab_type, vehicle_model, city, pickup_area, drop_area, driver_name, driver_rating, capacity, base_fare, currency, eta_minutes, features, is_active)
    SELECT 'Sedan Prime', 'Maruti Suzuki Dzire / Toyota Etios', 'Goa', 'Dabolim / MOPA Airport (GOI/GOX)', 'Candolim & Calangute Beach', 'Ashley Fernandes (Goa Certified)', 4.94, 4, 950, 'INR', 8, '["AC", "Beach Route Expert", "Zero Surge Guarantee", "FASTag Included"]'::jsonb, true
    WHERE NOT EXISTS (SELECT 1 FROM cabs WHERE city = 'Goa' AND cab_type = 'Sedan Prime');

    INSERT INTO cabs (cab_type, vehicle_model, city, pickup_area, drop_area, driver_name, driver_rating, capacity, base_fare, currency, eta_minutes, features, is_active)
    SELECT 'SUV XL Executive', 'Toyota Innova Crysta', 'Goa', 'Manohar Intl Airport (MOPA)', 'Anjuna / Vagator / Assagao', 'Savitri Naik (Top Rated)', 4.97, 6, 1550, 'INR', 10, '["AC", "Extra Luggage Space", "Chauffeur Driven", "Tolls Included"]'::jsonb, true
    WHERE NOT EXISTS (SELECT 1 FROM cabs WHERE city = 'Goa' AND cab_type = 'SUV XL Executive');

    INSERT INTO cabs (cab_type, vehicle_model, city, pickup_area, drop_area, driver_name, driver_rating, capacity, base_fare, currency, eta_minutes, features, is_active)
    SELECT 'Luxury Sedan', 'Lexus ES 300h / Camry Hybrid', 'Dubai', 'Dubai International Airport (DXB T1/T3)', 'Downtown Dubai / Burj Khalifa & Palm Jumeirah', 'Ahmed Al-Mansoor (RTA Licensed)', 4.98, 4, 2800, 'INR', 5, '["RTA Approved Chauffeur", "Flight Delay Tracking", "Salik Tolls Included"]'::jsonb, true
    WHERE NOT EXISTS (SELECT 1 FROM cabs WHERE city = 'Dubai' AND cab_type = 'Luxury Sedan');

    INSERT INTO cabs (cab_type, vehicle_model, city, pickup_area, drop_area, driver_name, driver_rating, capacity, base_fare, currency, eta_minutes, features, is_active)
    SELECT 'Sedan Prime', 'Mercedes-Benz C-Class / Peugeot 508', 'Paris', 'Charles de Gaulle Airport (CDG T2)', 'Central Paris (Champs-Élysées / Eiffel Tower)', 'Pierre Laurent (Chauffeur VTC)', 4.96, 4, 4200, 'INR', 10, '["English Speaking Chauffeur", "Fixed Airport Flat Fare", "Meet & Greet at Terminal"]'::jsonb, true
    WHERE NOT EXISTS (SELECT 1 FROM cabs WHERE city = 'Paris' AND cab_type = 'Sedan Prime');

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

    -- ========================================================
    -- DUAL WALLET FINANCIAL SUBSYSTEM SCHEMA (PHASE 1)
    -- ========================================================

    -- 1. Wallet Accounts Table (Dual balance: Cash + Promotional)
    CREATE TABLE IF NOT EXISTS wallet_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      cash_available_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (cash_available_balance >= 0),
      cash_reserved_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (cash_reserved_balance >= 0),
      promotional_available_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (promotional_available_balance >= 0),
      promotional_reserved_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (promotional_reserved_balance >= 0),
      status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      freeze_reason TEXT,
      frozen_at TIMESTAMPTZ,
      frozen_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_wallet_accounts_customer_id ON wallet_accounts(customer_id);
    CREATE INDEX IF NOT EXISTS idx_wallet_accounts_status ON wallet_accounts(status);

    -- 2. Wallet Journals (Double-Entry Header)
    CREATE TABLE IF NOT EXISTS wallet_journals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      transaction_reference VARCHAR(100) UNIQUE NOT NULL,
      transaction_type VARCHAR(50) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'POSTED',
      description TEXT NOT NULL,
      idempotency_key VARCHAR(150) UNIQUE,
      related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
      related_payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_wallet_journals_reference ON wallet_journals(transaction_reference);
    CREATE INDEX IF NOT EXISTS idx_wallet_journals_booking_id ON wallet_journals(related_booking_id);
    CREATE INDEX IF NOT EXISTS idx_wallet_journals_idempotency ON wallet_journals(idempotency_key);

    -- 3. Wallet Ledger Entries (Immutable double-entry lines: debits == credits)
    CREATE TABLE IF NOT EXISTS wallet_ledger_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      journal_id UUID NOT NULL REFERENCES wallet_journals(id) ON DELETE RESTRICT,
      account_code VARCHAR(100) NOT NULL,
      wallet_account_id UUID REFERENCES wallet_accounts(id) ON DELETE RESTRICT,
      debit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (debit_amount >= 0),
      credit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (credit_amount >= 0),
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_wallet_ledger_entries_journal_id ON wallet_ledger_entries(journal_id);
    CREATE INDEX IF NOT EXISTS idx_wallet_ledger_entries_account ON wallet_ledger_entries(account_code);
    CREATE INDEX IF NOT EXISTS idx_wallet_ledger_entries_wallet_id ON wallet_ledger_entries(wallet_account_id);

    -- 4. Customer-Readable Wallet Transactions Log
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      transaction_id VARCHAR(100) UNIQUE NOT NULL,
      customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      wallet_account_id UUID NOT NULL REFERENCES wallet_accounts(id) ON DELETE CASCADE,
      journal_id UUID REFERENCES wallet_journals(id) ON DELETE SET NULL,
      wallet_type VARCHAR(20) NOT NULL,
      direction VARCHAR(10) NOT NULL,
      transaction_type VARCHAR(50) NOT NULL,
      amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
      description TEXT NOT NULL,
      reference_id VARCHAR(100),
      booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
      payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
      idempotency_key VARCHAR(150),
      balance_after NUMERIC(14, 2),
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_wallet_tx_customer ON wallet_transactions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_account_id);
    CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON wallet_transactions(transaction_type);
    CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at DESC);

    -- 5. Promotional Credit Lots (Expiry-bound lots with service restrictions)
    CREATE TABLE IF NOT EXISTS promotional_credit_lots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      wallet_account_id UUID NOT NULL REFERENCES wallet_accounts(id) ON DELETE CASCADE,
      lot_reference VARCHAR(100) UNIQUE NOT NULL,
      reward_source VARCHAR(50) NOT NULL,
      original_amount NUMERIC(14, 2) NOT NULL CHECK (original_amount > 0),
      remaining_amount NUMERIC(14, 2) NOT NULL CHECK (remaining_amount >= 0),
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      campaign_id UUID,
      applicable_services JSONB DEFAULT '["FLIGHT","HOTEL","VILLA","PACKAGE","TRAIN","BUS","CAB","TOUR","VISA","INSURANCE"]'::jsonb,
      min_booking_amount NUMERIC(14, 2) DEFAULT 0.00,
      max_usable_amount NUMERIC(14, 2),
      issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expiry_date TIMESTAMPTZ NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_promo_lots_customer ON promotional_credit_lots(customer_id);
    CREATE INDEX IF NOT EXISTS idx_promo_lots_expiry ON promotional_credit_lots(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_promo_lots_status ON promotional_credit_lots(status);

    -- 6. Wallet Reservations (Atomic funds reservation during checkout)
    CREATE TABLE IF NOT EXISTS wallet_reservations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reservation_reference VARCHAR(100) UNIQUE NOT NULL,
      customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      wallet_account_id UUID NOT NULL REFERENCES wallet_accounts(id) ON DELETE CASCADE,
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      cash_reserved NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
      promotional_reserved NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
      lots_reserved JSONB DEFAULT '[]'::jsonb,
      status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_wallet_reservations_booking ON wallet_reservations(booking_id);
    CREATE INDEX IF NOT EXISTS idx_wallet_reservations_status ON wallet_reservations(status);

    -- 7. Promotional Campaigns Table (Admin manageable reward campaigns)
    CREATE TABLE IF NOT EXISTS promotional_campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      campaign_type VARCHAR(50) NOT NULL DEFAULT 'CASHBACK',
      reward_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE',
      reward_value NUMERIC(10, 2) NOT NULL,
      max_reward_amount NUMERIC(10, 2),
      min_booking_amount NUMERIC(10, 2) DEFAULT 0.00,
      applicable_services JSONB DEFAULT '["FLIGHT","HOTEL","VILLA","PACKAGE","TRAIN","BUS","CAB","TOUR","VISA","INSURANCE"]'::jsonb,
      validity_days INT DEFAULT 90,
      start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      total_budget NUMERIC(14, 2) DEFAULT 1000000.00,
      total_issued NUMERIC(14, 2) DEFAULT 0.00,
      total_redeemed NUMERIC(14, 2) DEFAULT 0.00,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 8. Regulatory & Feature Flag Configuration Table
    CREATE TABLE IF NOT EXISTS wallet_config (
      key VARCHAR(100) PRIMARY KEY,
      value VARCHAR(255) NOT NULL,
      description TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    INSERT INTO wallet_config (key, value, description)
    VALUES
      ('WALLET_ENABLED', 'true', 'Master switch for wallet subsystem'),
      ('CASH_WALLET_ENABLED', 'true', 'Allows cash wallet balance usage and refund storage'),
      ('CASH_TOPUP_ENABLED', 'false', 'Requires regulatory RBI/PPI license before enabling public stored-value topup'),
      ('PROMOTIONAL_WALLET_ENABLED', 'true', 'Enables marketing rewards, cashback, and promotional credit redemption'),
      ('CASH_WITHDRAWAL_ENABLED', 'false', 'Locked: customer cash withdrawals to bank account disabled'),
      ('WALLET_PAYMENT_ENABLED', 'true', 'Enables wallet checkout payment option')
    ON CONFLICT (key) DO NOTHING;

    -- Seed Default Promotional Cashback Campaign if none exists
    INSERT INTO promotional_campaigns (name, code, campaign_type, reward_type, reward_value, max_reward_amount, min_booking_amount, validity_days)
    VALUES ('SS Journey Travel Cashback', 'SSJ_CASHBACK_5', 'CASHBACK', 'PERCENTAGE', 5.00, 500.00, 1000.00, 90)
    ON CONFLICT (code) DO NOTHING;

    -- Mixed Payment columns on Bookings & Payments
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cash_wallet_amount NUMERIC(12, 2) DEFAULT 0.00;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promotional_wallet_amount NUMERIC(12, 2) DEFAULT 0.00;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS online_payment_amount NUMERIC(12, 2) DEFAULT 0.00;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS cash_wallet_amount NUMERIC(12, 2) DEFAULT 0.00;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS promotional_wallet_amount NUMERIC(12, 2) DEFAULT 0.00;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_amount NUMERIC(12, 2) DEFAULT 0.00;
  `);
}

