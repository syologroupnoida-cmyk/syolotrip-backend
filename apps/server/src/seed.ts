import bcrypt from 'bcrypt';
import { query } from './db/index.js';
import { initDbSchema } from './db/schema.js';
import { ingestAllReferenceData } from './db/ingestReferenceData.js';

async function seed() {
  console.log('[SEED] Initializing database schema...');
  await initDbSchema();

  console.log('[SEED] Ingesting master reference datasets...');
  await ingestAllReferenceData();

  console.log('[SEED] Starting database seed...');

  // 1. Users
  const adminRawPass = process.env.ADMIN_PASSWORD || 'ADMIN~321';
  const adminPass = await bcrypt.hash(adminRawPass, 10);
  await query(
    `INSERT INTO users (email, full_name, phone, hashed_password, role, is_active, is_verified)
     VALUES ('admin@ssjourney.com', 'Operations Admin', '+91 98765 43210', $1, 'ADMIN', true, true)
     ON CONFLICT (email) DO UPDATE SET hashed_password = $1`,
    [adminPass]
  );

  const custPass = await bcrypt.hash('Customer@123456', 10);
  await query(
    `INSERT INTO users (email, full_name, phone, hashed_password, role, is_active, is_verified)
     VALUES ('customer@ssjourney.com', 'John Doe', '+91 98111 22233', $1, 'CUSTOMER', true, true)
     ON CONFLICT (email) DO NOTHING`,
    [custPass]
  );

  const partnerPass = await bcrypt.hash('Partner@123456', 10);
  const partnerUserRes = await query(
    `INSERT INTO users (email, full_name, phone, hashed_password, role, is_active, is_verified)
     VALUES ('partner@ssjourney.com', 'Ramesh Kumar', '+91 98111 88899', $1, 'PARTNER', true, true)
     ON CONFLICT (email) DO UPDATE SET role = 'PARTNER'
     RETURNING id`,
    [partnerPass]
  );

  const partnerUserId = partnerUserRes.rows[0]?.id;
  if (partnerUserId) {
    await query(
      `INSERT INTO partner_profiles (user_id, business_name, business_type, phone, city, address, country, tax_id, status, is_verified)
       VALUES ($1, 'SS Grand Luxury Resort & Suites', 'HOTELIER', '+91 98111 88899', 'Goa', 'Candolim Beach Road, North Goa', 'India', '30AAAAA0000A1Z5', 'VERIFIED', true)
       ON CONFLICT (user_id) DO NOTHING`,
      [partnerUserId]
    );
  }

  // 2. Flights
  await query(
    `INSERT INTO flights (
      airline, airline_code, flight_number, aircraft, origin_code, origin_name, origin_city, origin_country,
      destination_code, destination_name, destination_city, destination_country, departure_time, arrival_time,
      duration_minutes, stops, cabin_class, available_seats, base_fare, taxes, total_price, currency, is_active
    ) VALUES
    ('Air India', 'AI', 'AI-101', 'Boeing 787-8', 'DEL', 'Indira Gandhi Intl', 'Delhi', 'India', 'BOM', 'Chhatrapati Shivaji Intl', 'Mumbai', 'India', '06:00', '08:15', 135, 0, 'ECONOMY', 45, 4500, 750, 5250, 'INR', true),
    ('IndiGo', '6E', '6E-204', 'Airbus A320neo', 'DEL', 'Indira Gandhi Intl', 'Delhi', 'India', 'BLR', 'Kempegowda Intl', 'Bengaluru', 'India', '09:30', '12:15', 165, 0, 'ECONOMY', 32, 5200, 800, 6000, 'INR', true),
    ('Vistara', 'UK', 'UK-811', 'Airbus A321neo', 'BOM', 'Chhatrapati Shivaji Intl', 'Mumbai', 'India', 'GOI', 'Dabolim Airport', 'Goa', 'India', '14:00', '15:15', 75, 0, 'ECONOMY', 28, 3800, 600, 4400, 'INR', true),
    ('Air India', 'AI', 'AI-308', 'Boeing 777-300ER', 'DEL', 'Indira Gandhi Intl', 'Delhi', 'India', 'DXB', 'Dubai Intl', 'Dubai', 'UAE', '18:30', '21:00', 210, 0, 'BUSINESS', 12, 28000, 4200, 32200, 'INR', true)
    ON CONFLICT DO NOTHING`
  );

  // 3. Hotels
  const hotelRes = await query(
    `INSERT INTO hotels (
      name, property_type, star_rating, guest_rating, rating_label, review_count, address, city, country,
      overview, featured_image, starting_price, currency, is_active, featured
    ) VALUES
    ('The Taj Mahal Palace', 'HOTEL', 5, 9.4, 'Exceptional', 420, 'Apollo Bunder, Colaba', 'Mumbai', 'India', 'Historic luxury landmark overlooking the Gateway of India with royal hospitality and fine dining.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945', 22000, 'INR', true, true),
    ('The Leela Palace', 'HOTEL', 5, 9.2, 'Superb', 310, 'Diplomatic Enclave, Chanakyapuri', 'Delhi', 'India', 'Palatial elegance blending Lutyens architecture with modern luxury in the heart of Delhi.', 'https://images.unsplash.com/photo-1582719508461-905c673771fd', 18500, 'INR', true, true),
    ('W Goa Beachfront Resort', 'HOTEL', 5, 9.0, 'Wonderful', 540, 'Vagator Beach', 'Goa', 'India', 'Vibrant coastal escape featuring dramatic cliffs, pristine sand, and signature poolside beats.', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4', 16000, 'INR', true, true)
    RETURNING id, name`
  );

  if (hotelRes.rows.length > 0) {
    for (const h of hotelRes.rows) {
      await query(
        `INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, max_occupancy, price_per_night, taxes_per_night, available_rooms, is_available)
         VALUES
         ($1, 'Deluxe Room', 'King Bed', 2, 12000, 1440, 8, true),
         ($1, 'Heritage Suite', 'King Bed', 3, 24000, 2880, 3, true)`,
        [h.id]
      );
    }
  }

  // 4. Trains
  await query(
    `INSERT INTO trains (
      train_number, train_name, train_type, from_station_code, from_station_name, from_city,
      to_station_code, to_station_name, to_city, departure_time, arrival_time, duration_minutes,
      train_class, available_seats, base_fare, rating, currency, is_active
    ) VALUES
    ('22436', 'Vande Bharat Express', 'Vande Bharat', 'NDLS', 'New Delhi', 'Delhi', 'BSB', 'Varanasi Junction', 'Varanasi', '06:00', '14:00', 480, 'Executive Class (EC)', 52, 3300, 4.9, 'INR', true),
    ('12952', 'Mumbai Rajdhani Express', 'Rajdhani', 'NDLS', 'New Delhi', 'Delhi', 'MMCT', 'Mumbai Central', 'Mumbai', '16:55', '08:35', 940, '1st AC (1A)', 34, 4850, 4.8, 'INR', true)
    ON CONFLICT DO NOTHING`
  );

  // 5. Buses
  await query(
    `INSERT INTO buses (
      operator_name, bus_type, from_city, to_city, boarding_point, dropping_point,
      departure_time, arrival_time, duration_minutes, available_seats, base_fare, rating, currency, is_active
    ) VALUES
    ('Zingbus Express', 'Volvo AC Multi-Axle Sleeper', 'Delhi', 'Manali', 'Kashmere Gate ISBT', 'Private Bus Stand Manali', '20:30', '08:00', 690, 22, 1450, 4.7, 'INR', true),
    ('IntrCity SmartBus', 'Scania AC Seater/Sleeper', 'Bengaluru', 'Goa', 'Majestic', 'Panjim', '21:00', '07:30', 630, 18, 1650, 4.6, 'INR', true)
    ON CONFLICT DO NOTHING`
  );

  // 6. Cabs
  await query(
    `INSERT INTO cabs (
      cab_type, vehicle_model, city, pickup_area, drop_area, driver_name, driver_rating, capacity, base_fare, currency, eta_minutes, is_active
    ) VALUES
    ('Sedan', 'Maruti Suzuki Dzire', 'Delhi', 'Airport Terminal 3', 'Connaught Place', 'Rajinder Singh', 4.9, 4, 650, 'INR', 8, true),
    ('SUV', 'Toyota Innova Crysta', 'Mumbai', 'Chhatrapati Shivaji Airport', 'South Mumbai', 'Manoj Patil', 4.8, 6, 1450, 'INR', 12, true)
    ON CONFLICT DO NOTHING`
  );

  // 7. Holiday Packages
  await query(
    `INSERT INTO holiday_packages (
      title, destination, duration_days, duration_nights, overview, price_per_person, currency,
      featured_image, rating, available_capacity, is_active
    ) VALUES
    ('Royal Rajasthan Heritage Tour', 'Jaipur & Udaipur', 6, 5, 'Discover the majestic forts, royal palaces, and desert sunsets of Rajasthan with luxury heritage stays.', 34999, 'INR', 'https://images.unsplash.com/photo-1599661046289-e31897846e41', 4.9, 15, true),
    ('Enchanting Kerala Backwaters & Hills', 'Kochi & Munnar', 5, 4, 'Relax on tranquil houseboats along Alleppey and explore emerald tea plantations in Munnar.', 26500, 'INR', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944', 4.8, 20, true)
    ON CONFLICT DO NOTHING`
  );

  // 8. Coupons
  await query(
    `INSERT INTO coupons (code, description, discount_type, discount_value, min_booking_amount, max_discount_amount, is_active)
     VALUES
     ('WELCOME10', 'Get 10% off on your first booking up to ₹1,500', 'PERCENTAGE', 10.0, 2000, 1500, true),
     ('FLIGHT500', 'Flat ₹500 discount on domestic flight bookings', 'FLAT', 500.0, 4000, 500, true),
     ('SUMMER2026', 'Enjoy 15% discount on luxury resort stays', 'PERCENTAGE', 15.0, 5000, 3000, true)
     ON CONFLICT (code) DO NOTHING`
  );

  console.log('[SEED] Seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[SEED] Error during seeding:', err);
  process.exit(1);
});

