import {
  FlightOption,
  HotelOption,
  TrainOption,
  BusOption,
  CabOption,
  PackageOption,
} from '../types/travel';
import { Platform } from 'react-native';

// In Expo/React Native:
// - Android Emulator: 10.0.2.2
// - iOS Simulator / Web: localhost
// - LAN / Device: fallback or env variable
const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

export const API_BASE_URL = getBaseUrl();

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

// In-memory & web storage token cache
let memoryToken: string | null = null;
let cachedUser: any | null = null;

export const getStoredToken = (): string | null => {
  if (memoryToken) return memoryToken;
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('ss_mobile_access_token');
    }
  } catch {}
  return null;
};

export const setStoredToken = (token: string | null) => {
  memoryToken = token;
  try {
    if (typeof localStorage !== 'undefined') {
      if (token) localStorage.setItem('ss_mobile_access_token', token);
      else localStorage.removeItem('ss_mobile_access_token');
    }
  } catch {}
};

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<{ status: string; database: string } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { credentials: 'omit' });
    if (!res.ok) return null;
    const json: ApiResponse<any> = await res.json();
    return json.data;
  } catch (err) {
    console.warn('[MobileAPI] Backend health ping failed, using local offline mode.', err);
    return null;
  }
}

/**
 * Customer Authentication
 */
export async function loginMobileApi(email: string, password: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Authentication failed' }));
    throw new Error(errData.detail || 'Incorrect email or password');
  }
  const json: ApiResponse<any> = await res.json();
  const token = json.data?.tokens?.accessToken || json.data?.tokens?.access_token;
  if (token) {
    setStoredToken(token);
  }
  cachedUser = json.data?.user;
  return json.data;
}

export async function registerMobileApi(payload: {
  email: string;
  full_name: string;
  password: string;
  phone?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(errData.detail || 'Email already registered');
  }
  const json: ApiResponse<any> = await res.json();
  const token = json.data?.tokens?.accessToken || json.data?.tokens?.access_token;
  if (token) {
    setStoredToken(token);
  }
  cachedUser = json.data?.user;
  return json.data;
}

export async function getCurrentUserMobileApi(): Promise<any | null> {
  const token = getStoredToken();
  if (!token) return cachedUser;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setStoredToken(null);
      cachedUser = null;
      return null;
    }
    const json: ApiResponse<any> = await res.json();
    cachedUser = json.data;
    return json.data;
  } catch {
    return cachedUser;
  }
}

export async function logoutMobileApi(): Promise<void> {
  setStoredToken(null);
  cachedUser = null;
}

/**
 * Fetch flights from backend with fallback
 */
export async function fetchFlightsApi(fallback: FlightOption[]): Promise<FlightOption[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/flights`);
    if (!res.ok) return fallback;
    const json: ApiResponse<any[]> = await res.json();
    if (json.data && Array.isArray(json.data) && json.data.length > 0) {
      return json.data.map((f: any) => ({
        id: String(f.id),
        airline: f.airline || 'Unknown Airline',
        flightCode: f.flight_number || f.flightCode || 'FL-001',
        aircraft: f.aircraft || 'Airbus A320',
        originCode: f.origin?.code || f.originCode || 'DEL',
        originTerminal: f.originTerminal || 'Terminal 1',
        departureTime: f.departure_time || f.departureTime || '10:00 AM',
        destCode: f.destination?.code || f.destCode || 'BOM',
        destTerminal: f.destTerminal || 'Terminal 2',
        arrivalTime: f.arrival_time || f.arrivalTime || '12:00 PM',
        duration: f.duration_minutes ? `${Math.floor(f.duration_minutes / 60)}h ${f.duration_minutes % 60}m` : (f.duration || '2h 00m'),
        isNextDay: false,
        stopsText: f.stops === 0 ? 'Non-stop' : `${f.stops} stop`,
        isDirect: f.stops === 0,
        price: f.total_price || f.totalPrice || f.price || 4999,
        badge: f.badge || 'Available',
        badgeVariant: 'recommended',
        perks: f.perks || ['Free Meal', 'Cabin Bag 7kg'],
      }));
    }
  } catch (err) {
    console.warn('[MobileAPI] Flights fetch failed, falling back to local data.');
  }
  return fallback;
}

/**
 * Fetch hotels from backend with fallback
 */
export async function fetchHotelsApi(fallback: HotelOption[]): Promise<HotelOption[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/hotels`);
    if (!res.ok) return fallback;
    const json: ApiResponse<any[]> = await res.json();
    if (json.data && Array.isArray(json.data) && json.data.length > 0) {
      return json.data.map((h: any) => ({
        id: String(h.id),
        name: h.name,
        stars: h.star_rating || h.starRating || 4,
        ratingScore: h.rating || 9.0,
        ratingLabel: (h.rating || 9.0) >= 9 ? 'Exceptional' : 'Excellent',
        reviewCount: 320,
        neighborhood: h.city || h.address || 'Central City',
        distance: '1.0 km to Central Station',
        pricePerNight: h.starting_price || h.startingPrice || 14900,
        totalPrice: (h.starting_price || 14900) * 7,
        cancellationText: 'Free cancellation up to 24h before',
        breakfastIncluded: true,
        image: h.featured_image || h.featuredImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=700&auto=format&fit=crop&q=80',
        tags: h.amenities || ['Free Wi-Fi', 'Breakfast Included'],
        lat: h.latitude || 35.6852,
        lng: h.longitude || 139.691,
      }));
    }
  } catch (err) {
    console.warn('[MobileAPI] Hotels fetch failed, falling back to local data.');
  }
  return fallback;
}

/**
 * Fetch trains from backend with fallback
 */
export async function fetchTrainsApi(fallback: TrainOption[]): Promise<TrainOption[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/trains`);
    if (res.ok) {
      const json: ApiResponse<{ items: any[] }> = await res.json();
      if (json.data?.items?.length) {
        return json.data.items.map((t) => ({
          id: t.id,
          trainNumber: t.train_number,
          trainName: t.train_name,
          trainType: t.train_type,
          fromStationCode: t.from_station_code,
          fromStationName: t.from_station_name,
          toStationCode: t.to_station_code,
          toStationName: t.to_station_name,
          departureTime: t.departure_time,
          arrivalTime: t.arrival_time,
          duration: `${Math.floor(t.duration_minutes / 60)}h ${t.duration_minutes % 60}m`,
          trainClass: t.train_class,
          availableSeats: t.available_seats,
          price: t.base_fare,
          rating: t.rating,
        }));
      }
    }
  } catch (err) {
    console.warn('[MobileAPI] Trains fetch failed, using fallback.', err);
  }
  return fallback;
}

/**
 * Fetch buses from backend with fallback
 */
export async function fetchBusesApi(fallback: BusOption[]): Promise<BusOption[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/buses`);
    if (res.ok) {
      const json: ApiResponse<{ items: any[] }> = await res.json();
      if (json.data?.items?.length) {
        return json.data.items.map((b) => ({
          id: b.id,
          operatorName: b.operator_name,
          busType: b.bus_type,
          fromCity: b.from_city,
          toCity: b.to_city,
          boardingPoint: b.boarding_point,
          droppingPoint: b.dropping_point,
          departureTime: b.departure_time,
          arrivalTime: b.arrival_time,
          duration: `${Math.floor(b.duration_minutes / 60)}h ${b.duration_minutes % 60}m`,
          availableSeats: b.available_seats,
          price: b.base_fare,
          rating: b.rating,
        }));
      }
    }
  } catch (err) {
    console.warn('[MobileAPI] Buses fetch failed, using fallback.', err);
  }
  return fallback;
}

/**
 * Fetch cabs from backend with fallback
 */
export async function fetchCabsApi(fallback: CabOption[]): Promise<CabOption[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/cabs`);
    if (res.ok) {
      const json: ApiResponse<{ items: any[] }> = await res.json();
      if (json.data?.items?.length) {
        return json.data.items.map((c) => ({
          id: c.id,
          cabType: c.cab_type,
          vehicleModel: c.vehicle_model,
          city: c.city,
          pickupArea: c.pickup_area,
          dropArea: c.drop_area,
          driverName: c.driver_name,
          driverRating: c.driver_rating,
          capacity: c.capacity,
          price: c.base_fare,
          etaMinutes: c.eta_minutes,
          features: c.features || [],
        }));
      }
    }
  } catch (err) {
    console.warn('[MobileAPI] Cabs fetch failed, using fallback.', err);
  }
  return fallback;
}

/**
 * Fetch packages from backend with fallback
 */
export async function fetchPackagesApi(fallback: PackageOption[]): Promise<PackageOption[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/packages`);
    if (res.ok) {
      const json: ApiResponse<{ items: any[] }> = await res.json();
      if (json.data?.items?.length) {
        return json.data.items.map((p) => ({
          id: p.id,
          title: p.title,
          destination: p.destination,
          durationDays: p.duration_days,
          durationNights: p.duration_nights,
          overview: p.overview,
          inclusions: p.inclusions || [],
          price: p.price_per_person,
          rating: p.rating,
          image: p.featured_image,
        }));
      }
    }
  } catch (err) {
    console.warn('[MobileAPI] Packages fetch failed, using fallback.', err);
  }
  return fallback;
}

/**
 * Submit booking and trigger demo payment
 */
export async function submitMobileBookingApi(payload: {
  serviceType: 'FLIGHT' | 'HOTEL' | 'BUS' | 'PACKAGE' | 'TRAIN' | 'CAB';
  itemId?: string;
  totalAmount: number;
  contactEmail: string;
  contactPhone: string;
  passengerName: string;
}): Promise<{ bookingId: string; status: string; paymentStatus: string }> {
  const token = getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    let resolvedItemId = payload.itemId;
    let itemType: string = payload.serviceType;
    if (itemType === 'HOTEL') itemType = 'HOTEL_ROOM';

    // If no itemId was provided, resolve first available item ID from backend
    if (!resolvedItemId) {
      try {
        let ep = 'flights';
        if (payload.serviceType === 'TRAIN') ep = 'trains';
        else if (payload.serviceType === 'CAB') ep = 'cabs';
        else if (payload.serviceType === 'BUS') ep = 'buses';
        else if (payload.serviceType === 'PACKAGE') ep = 'packages';
        else if (payload.serviceType === 'HOTEL') ep = 'hotels';

        const r = await fetch(`${API_BASE_URL}/${ep}`);
        if (r.ok) {
          const j = await r.json();
          if (payload.serviceType === 'HOTEL' && j.data?.items?.[0]?.rooms?.[0]) {
            resolvedItemId = j.data.items[0].rooms[0].id;
          } else if (j.data?.items?.[0]?.id) {
            resolvedItemId = j.data.items[0].id;
          }
        }
      } catch {}
    }

    if (resolvedItemId) {
      const bookingRes = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          service_type: payload.serviceType,
          contact_email: payload.contactEmail || 'traveler@ssjourney.com',
          contact_phone: payload.contactPhone || '+91 98765 43210',
          items: [
            {
              item_type: itemType,
              item_reference_id: resolvedItemId,
              quantity: 1,
            },
          ],
          passengers: [
            {
              title: 'Mr',
              first_name: payload.passengerName.split(' ')[0] || 'Traveler',
              last_name: payload.passengerName.split(' ').slice(1).join(' ') || 'Guest',
              gender: 'MALE',
            },
          ],
        }),
      });

      if (bookingRes.ok) {
        const bookingData: ApiResponse<any> = await bookingRes.json();
        const bookingId = bookingData.data?.id;

        if (bookingId) {
          const paymentRes = await fetch(`${API_BASE_URL}/payments/demo`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              booking_id: bookingId,
              payment_method: 'UPI',
            }),
          });

          if (paymentRes.ok) {
            return {
              bookingId: bookingData.data?.booking_reference || bookingId,
              status: 'CONFIRMED',
              paymentStatus: 'COMPLETED',
            };
          }
        }
        return {
          bookingId: bookingData.data?.booking_reference || bookingId || 'SS-' + Date.now(),
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
        };
      }
    }
  } catch (err) {
    console.warn('[MobileAPI] Booking submission fallback to offline confirmation', err);
  }

  // Graceful offline fallback
  return {
    bookingId: 'SSJ-' + Math.floor(100000 + Math.random() * 900000),
    status: 'CONFIRMED',
    paymentStatus: 'COMPLETED',
  };
}

/**
 * Fetch booked trips
 */
export async function getMyTripsMobileApi(): Promise<any[]> {
  const token = getStoredToken();
  if (token) {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/my-trips`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json: ApiResponse<any[]> = await res.json();
        if (json.data && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[MobileAPI] Fetch trips error', e);
    }
  }

  // Fallback demo bookings for previewing trips
  return [
    {
      id: 'demo-booking-1',
      booking_reference: 'SS-94821',
      service_type: 'FLIGHT',
      status: 'CONFIRMED',
      price_breakdown: {
        total_amount: 64890,
        currency: 'INR',
      },
      contact_email: cachedUser?.email || 'customer@ssjourney.com',
      created_at: new Date().toISOString(),
      details_snapshot: {
        airline: 'All Nippon Airways (ANA)',
        flight_number: 'NH 107',
        origin: { city: 'San Francisco', code: 'SFO' },
        destination: { city: 'Tokyo', code: 'HND' },
        departure_time: '11:30 AM',
        arrival_time: '3:20 PM',
      },
    },
    {
      id: 'demo-booking-2',
      booking_reference: 'SS-81920',
      service_type: 'HOTEL',
      status: 'CONFIRMED',
      price_breakdown: {
        total_amount: 104300,
        currency: 'INR',
      },
      contact_email: cachedUser?.email || 'customer@ssjourney.com',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      details_snapshot: {
        hotel_name: 'Hotel Gracery Shinjuku',
        city: 'Tokyo',
        nights: 7,
        room_type: 'Superior Double City View',
      },
    },
  ];
}

/**
 * Cancel a booking
 */
export async function cancelBookingMobileApi(bookingId: string, reason: string): Promise<any> {
  const token = getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Cancellation failed' }));
    throw new Error(err.detail || 'Cancellation failed');
  }
  return res.json();
}
