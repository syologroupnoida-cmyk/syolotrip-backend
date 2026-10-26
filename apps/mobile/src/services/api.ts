import {
  FlightOption,
  HotelOption,
  TrainOption,
  BusOption,
  CabOption,
  PackageOption,
} from '../types/travel';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

/**
 * Dynamically resolves the API base URL:
 * 1. Explicit EXPO_PUBLIC_API_URL environment variable
 * 2. Host IP dynamically extracted from Expo Constants (works automatically on physical devices over LAN)
 * 3. 10.0.2.2 for Android Emulator
 * 4. localhost for Web / iOS Simulator
 */
export const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Extract host IP from Expo debugger connection (e.g. 192.168.1.43:8081)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8000/api/v1`;
    }
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

const TOKEN_KEY = 'ss_mobile_access_token';
let memoryToken: string | null = null;
let cachedUser: any | null = null;

/**
 * Retrieve securely stored bearer token
 */
export const getStoredToken = async (): Promise<string | null> => {
  if (memoryToken) return memoryToken;
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        memoryToken = localStorage.getItem(TOKEN_KEY);
      }
    } else {
      memoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (err) {
    console.warn('[MobileAPI] Error reading secure token:', err);
  }
  return memoryToken;
};

/**
 * Persist bearer token into native secure store or localStorage
 */
export const setStoredToken = async (token: string | null): Promise<void> => {
  memoryToken = token;
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
      }
    } else {
      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    }
  } catch (err) {
    console.warn('[MobileAPI] Error writing secure token:', err);
  }
};

/**
 * Build headers with current bearer token if authenticated
 */
const getAuthHeaders = async (includeJson: boolean = true): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = await getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<{ status: string; database: string } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) return null;
    const json: ApiResponse<any> = await res.json();
    return json.data;
  } catch (err) {
    console.warn('[MobileAPI] Backend health ping failed:', err);
    return null;
  }
}

/**
 * Customer Authentication: Login
 */
export async function loginMobileApi(email: string, password: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Authentication failed' }));
    throw new Error(errData.detail || 'Incorrect email or password');
  }
  const json: ApiResponse<any> = await res.json();
  const token = json.data?.tokens?.accessToken || json.data?.tokens?.access_token;
  if (token) {
    await setStoredToken(token);
  }
  cachedUser = json.data?.user;
  return json.data;
}

/**
 * Customer Authentication: Registration
 */
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
    await setStoredToken(token);
  }
  cachedUser = json.data?.user;
  return json.data;
}

/**
 * Session restoration: fetches authenticated user profile from /auth/me
 */
export async function getCurrentUserMobileApi(): Promise<any | null> {
  const token = await getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) {
        await setStoredToken(null);
        cachedUser = null;
      }
      return null;
    }
    const json: ApiResponse<any> = await res.json();
    cachedUser = json.data;
    return json.data;
  } catch (err) {
    console.warn('[MobileAPI] Session verification failed:', err);
    return cachedUser;
  }
}

/**
 * Customer Logout: clean stored tokens and in-memory session
 */
export async function logoutMobileApi(): Promise<void> {
  await setStoredToken(null);
  cachedUser = null;
}

/**
 * Helper to extract array from either paginated { items: [...] } or direct array
 */
function extractItems<T = any>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.items && Array.isArray(data.items)) return data.items;
  return [];
}

/**
 * Search Flights from backend with query parameters
 */
export async function fetchFlightsApi(params?: {
  from_code?: string;
  to_code?: string;
  from_city?: string;
  to_city?: string;
  cabin_class?: string;
  non_stop?: boolean;
}): Promise<FlightOption[]> {
  const query = new URLSearchParams();
  if (params?.from_code) query.append('from_code', params.from_code);
  if (params?.to_code) query.append('to_code', params.to_code);
  if (params?.from_city) query.append('from_city', params.from_city);
  if (params?.to_city) query.append('to_city', params.to_city);
  if (params?.cabin_class) query.append('cabin_class', params.cabin_class);
  if (params?.non_stop !== undefined) query.append('non_stop', String(params.non_stop));

  const url = `${API_BASE_URL}/flights${query.toString() ? '?' + query.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch flights' }));
    throw new Error(err.detail || `Server returned ${res.status}`);
  }
  const json: ApiResponse<any> = await res.json();
  const rawFlights = extractItems(json.data);

  return rawFlights.map((f: any) => ({
    id: String(f.id), // Real PostgreSQL UUID
    airline: f.airline || 'Airline',
    flightCode: f.flight_number || f.airline_code || 'FLIGHT',
    aircraft: f.aircraft || 'Commercial Aircraft',
    originCode: f.origin?.code || f.origin_code || 'DEL',
    originTerminal: f.origin?.name || 'Terminal 1',
    departureTime: f.departure_time || '10:00 AM',
    destCode: f.destination?.code || f.destination_code || 'BOM',
    destTerminal: f.destination?.name || 'Terminal 2',
    arrivalTime: f.arrival_time || '12:00 PM',
    duration: f.duration_minutes
      ? `${Math.floor(f.duration_minutes / 60)}h ${f.duration_minutes % 60}m`
      : '2h 00m',
    isNextDay: false,
    stopsText: f.stops === 0 ? 'Non-stop' : `${f.stops} stop`,
    isDirect: f.stops === 0,
    price: Number(f.total_price || f.base_fare || 0),
    badge: f.stops === 0 ? 'Non-stop' : 'Popular',
    badgeVariant: f.stops === 0 ? 'recommended' : 'schedule',
    perks: ['Cabin Bag 7kg', 'Live Seat Selection'],
  }));
}

/**
 * Search Hotels from backend with query parameters
 */
export async function fetchHotelsApi(params?: {
  city?: string;
  min_rating?: number;
  max_price?: number;
}): Promise<HotelOption[]> {
  const query = new URLSearchParams();
  if (params?.city) query.append('city', params.city);
  if (params?.min_rating) query.append('min_rating', String(params.min_rating));
  if (params?.max_price) query.append('max_price', String(params.max_price));

  const url = `${API_BASE_URL}/hotels${query.toString() ? '?' + query.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch hotels' }));
    throw new Error(err.detail || `Server returned ${res.status}`);
  }
  const json: ApiResponse<any> = await res.json();
  const rawHotels = extractItems(json.data);

  return rawHotels.map((h: any) => {
    const startingPrice = Number(h.starting_price || 0);
    const rooms = h.rooms || [];
    const defaultRoom = rooms.find((r: any) => r.is_available) || rooms[0];

    return {
      id: String(h.id), // Real PostgreSQL Hotel UUID
      name: h.name,
      stars: h.star_rating || 4,
      ratingScore: Number(h.rating || 9.0),
      ratingLabel: (h.rating || 9.0) >= 9 ? 'Exceptional' : 'Excellent',
      reviewCount: 240,
      neighborhood: h.address || h.city || 'Central Area',
      distance: 'Central Location',
      pricePerNight: startingPrice,
      totalPrice: startingPrice * 7,
      cancellationText: 'Free cancellation up to 24h before',
      breakfastIncluded: true,
      image:
        h.featured_image ||
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=700&auto=format&fit=crop&q=80',
      tags: Array.isArray(h.amenities) ? h.amenities : ['Free Wi-Fi', 'Swimming Pool', 'Room Service'],
      lat: Number(h.latitude || 28.6139),
      lng: Number(h.longitude || 77.2090),
      defaultRoomId: defaultRoom ? String(defaultRoom.id) : undefined,
      rooms: rooms.map((r: any) => ({
        id: String(r.id),
        roomType: r.room_type,
        pricePerNight: Number(r.price_per_night),
        availableRooms: r.available_rooms,
        isAvailable: r.is_available,
      })),
    };
  });
}

/**
 * Fetch trains from backend
 */
export async function fetchTrainsApi(): Promise<TrainOption[]> {
  const res = await fetch(`${API_BASE_URL}/trains`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch trains' }));
    throw new Error(err.detail || `Server returned ${res.status}`);
  }
  const json: ApiResponse<any> = await res.json();
  const items = extractItems(json.data);

  return items.map((t: any) => ({
    id: String(t.id),
    trainNumber: t.train_number,
    trainName: t.train_name,
    trainType: t.train_type || 'Express',
    fromStationCode: t.from_station_code || 'NDLS',
    fromStationName: t.from_station_name || t.from_city || 'New Delhi',
    toStationCode: t.to_station_code || 'BOM',
    toStationName: t.to_station_name || t.to_city || 'Mumbai Central',
    departureTime: t.departure_time || '06:00',
    arrivalTime: t.arrival_time || '14:00',
    duration: t.duration_minutes
      ? `${Math.floor(t.duration_minutes / 60)}h ${t.duration_minutes % 60}m`
      : '8h 00m',
    trainClass: t.train_class || '3A',
    availableSeats: t.available_seats || 40,
    price: Number(t.base_fare || 0),
    rating: Number(t.rating || 4.5),
  }));
}

/**
 * Fetch buses from backend
 */
export async function fetchBusesApi(): Promise<BusOption[]> {
  const res = await fetch(`${API_BASE_URL}/buses`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch buses' }));
    throw new Error(err.detail || `Server returned ${res.status}`);
  }
  const json: ApiResponse<any> = await res.json();
  const items = extractItems(json.data);

  return items.map((b: any) => ({
    id: String(b.id),
    operatorName: b.operator_name,
    busType: b.bus_type || 'AC Sleeper',
    fromCity: b.from_city,
    toCity: b.to_city,
    boardingPoint: b.boarding_point || b.from_city,
    droppingPoint: b.dropping_point || b.to_city,
    departureTime: b.departure_time || '20:00',
    arrivalTime: b.arrival_time || '06:00',
    duration: b.duration_minutes
      ? `${Math.floor(b.duration_minutes / 60)}h ${b.duration_minutes % 60}m`
      : '10h 00m',
    availableSeats: b.available_seats || 25,
    price: Number(b.base_fare || 0),
    rating: Number(b.rating || 4.4),
  }));
}

/**
 * Fetch cabs from backend
 */
export async function fetchCabsApi(): Promise<CabOption[]> {
  const res = await fetch(`${API_BASE_URL}/cabs`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch cabs' }));
    throw new Error(err.detail || `Server returned ${res.status}`);
  }
  const json: ApiResponse<any> = await res.json();
  const items = extractItems(json.data);

  return items.map((c: any) => ({
    id: String(c.id),
    cabType: c.cab_type,
    vehicleModel: c.vehicle_model,
    city: c.city,
    pickupArea: c.pickup_area,
    dropArea: c.drop_area,
    driverName: c.driver_name,
    driverRating: Number(c.driver_rating || 4.8),
    capacity: c.capacity || 4,
    price: Number(c.base_fare || 0),
    etaMinutes: c.eta_minutes || 5,
    features: Array.isArray(c.features) ? c.features : ['Clean Cab', 'AC', 'Top Driver'],
  }));
}

/**
 * Fetch holiday packages from backend
 */
export async function fetchPackagesApi(): Promise<PackageOption[]> {
  const res = await fetch(`${API_BASE_URL}/packages`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch packages' }));
    throw new Error(err.detail || `Server returned ${res.status}`);
  }
  const json: ApiResponse<any> = await res.json();
  const items = extractItems(json.data);

  return items.map((p: any) => ({
    id: String(p.id),
    title: p.title,
    destination: p.destination,
    durationDays: p.duration_days || 5,
    durationNights: p.duration_nights || 4,
    overview: p.overview || '',
    inclusions: Array.isArray(p.inclusions) ? p.inclusions : ['Hotel', 'Breakfast', 'Sightseeing'],
    price: Number(p.price_per_person || 0),
    rating: Number(p.rating || 4.7),
    image:
      p.featured_image ||
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=700&auto=format&fit=crop&q=80',
  }));
}

/**
 * Submit mobile booking and execute demo payment:
 * 1. POST /api/v1/bookings -> returns persisted booking in PENDING status
 * 2. POST /api/v1/payments/demo -> authorizes simulated payment and moves booking to CONFIRMED
 * NO silent fake-data fallbacks!
 */
export async function submitMobileBookingApi(payload: {
  serviceType: 'FLIGHT' | 'HOTEL' | 'BUS' | 'PACKAGE' | 'TRAIN' | 'CAB' | 'VILLA' | 'TOUR' | 'VISA' | 'INSURANCE';
  itemId: string;
  totalAmount: number;
  contactEmail: string;
  contactPhone: string;
  passengerName: string;
  promoCode?: string;
  hasInsurance?: boolean;
}): Promise<{
  bookingId: string;
  bookingReference: string;
  id: string;
  status: string;
  totalAmount: number;
  serviceType: string;
}> {
  const headers = await getAuthHeaders(true);

  let itemType: string = payload.serviceType;
  if (itemType === 'HOTEL') itemType = 'HOTEL_ROOM';

  const nameParts = (payload.passengerName || 'Guest Traveler').trim().split(' ');
  const firstName = nameParts[0] || 'Guest';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Traveler';

  // 1. Create booking in PostgreSQL
  const bookingRes = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      service_type: payload.serviceType,
      contact_email: payload.contactEmail.trim().toLowerCase(),
      contact_phone: payload.contactPhone.trim(),
      has_insurance: Boolean(payload.hasInsurance),
      promo_code: payload.promoCode || undefined,
      items: [
        {
          item_type: itemType,
          item_reference_id: payload.itemId,
          quantity: 1,
        },
      ],
      passengers: [
        {
          title: 'Mr',
          first_name: firstName,
          last_name: lastName,
          passenger_type: 'ADULT',
          gender: 'MALE',
        },
      ],
    }),
  });

  if (!bookingRes.ok) {
    const errData = await bookingRes.json().catch(() => ({ detail: 'Failed to create booking' }));
    throw new Error(errData.detail || `Booking creation failed with status ${bookingRes.status}`);
  }

  const bookingJson: ApiResponse<any> = await bookingRes.json();
  const createdBooking = bookingJson.data;
  const bookingId = createdBooking.id;
  const bookingRef = createdBooking.booking_reference;

  // 2. Execute Demo Payment authorization
  const paymentRes = await fetch(`${API_BASE_URL}/payments/demo`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      booking_id: bookingId,
      payment_method: 'UPI',
    }),
  });

  if (!paymentRes.ok) {
    const payErr = await paymentRes.json().catch(() => ({ detail: 'Payment authorization failed' }));
    throw new Error(
      `Booking ${bookingRef} was created, but simulated payment authorization failed: ${payErr.detail || paymentRes.status}`
    );
  }

  return {
    bookingId: bookingRef,
    bookingReference: bookingRef,
    id: bookingId,
    status: 'CONFIRMED',
    totalAmount: createdBooking.total_amount || payload.totalAmount,
    serviceType: payload.serviceType,
  };
}

// ================= Razorpay Mobile Payment APIs =================
export interface MobileRazorpayOrder {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  booking_id: string;
  booking_reference: string;
  service_type: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

export interface MobileRazorpayVerifyResult {
  success: boolean;
  payment_id: string;
  order_id: string;
  booking_id: string;
  booking_reference: string;
  status: string;
  amount: number;
  currency: string;
  message: string;
}

/**
 * Create a server-verified Razorpay order for mobile
 */
export async function createRazorpayOrderMobileApi(payload: {
  booking_id: string;
  guest_token?: string;
}): Promise<MobileRazorpayOrder> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE_URL}/payments/razorpay/order`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create Razorpay order' }));
    throw new Error(err.detail || `Order creation failed (${res.status})`);
  }
  const json: ApiResponse<MobileRazorpayOrder> = await res.json();
  return json.data;
}

/**
 * Mobile Test Mode Authorization helper (computes HMAC signature server-side in test mode)
 */
export async function testAuthorizeRazorpayMobileApi(payload: {
  booking_id: string;
  razorpay_order_id: string;
  guest_token?: string;
}): Promise<{
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE_URL}/payments/razorpay/test-authorize`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Test authorization failed' }));
    throw new Error(err.detail || `Test authorization failed (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

/**
 * Server-side payment verification using HMAC-SHA256 signature check
 */
export async function verifyRazorpayPaymentMobileApi(payload: {
  booking_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  guest_token?: string;
}): Promise<MobileRazorpayVerifyResult> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE_URL}/payments/razorpay/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Payment verification failed' }));
    throw new Error(err.detail || `Payment verification failed (${res.status})`);
  }
  const json: ApiResponse<MobileRazorpayVerifyResult> = await res.json();
  return json.data;
}

/**
 * Create raw booking in PostgreSQL in PENDING state
 */
export async function createPendingMobileBookingApi(payload: {
  serviceType: 'FLIGHT' | 'HOTEL' | 'BUS' | 'PACKAGE' | 'TRAIN' | 'CAB' | 'VILLA' | 'TOUR' | 'VISA' | 'INSURANCE';
  itemId: string;
  totalAmount: number;
  contactEmail: string;
  contactPhone: string;
  passengerName: string;
  promoCode?: string;
  hasInsurance?: boolean;
}): Promise<any> {
  const headers = await getAuthHeaders(true);
  let itemType: string = payload.serviceType;
  if (itemType === 'HOTEL') itemType = 'HOTEL_ROOM';

  const nameParts = (payload.passengerName || 'Guest Traveler').trim().split(' ');
  const firstName = nameParts[0] || 'Guest';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Traveler';

  const bookingRes = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      service_type: payload.serviceType,
      contact_email: payload.contactEmail.trim().toLowerCase(),
      contact_phone: payload.contactPhone.trim(),
      has_insurance: Boolean(payload.hasInsurance),
      promo_code: payload.promoCode || undefined,
      items: [
        {
          item_type: itemType,
          item_reference_id: payload.itemId,
          quantity: 1,
        },
      ],
      passengers: [
        {
          title: 'Mr',
          first_name: firstName,
          last_name: lastName,
          passenger_type: 'ADULT',
          gender: 'MALE',
        },
      ],
    }),
  });

  if (!bookingRes.ok) {
    const errData = await bookingRes.json().catch(() => ({ detail: 'Failed to create booking' }));
    throw new Error(errData.detail || `Booking creation failed with status ${bookingRes.status}`);
  }

  const bookingJson: ApiResponse<any> = await bookingRes.json();
  return bookingJson.data;
}

/**
 * Fetch authenticated customer bookings
 */
export async function getMyTripsMobileApi(): Promise<any[]> {
  const token = await getStoredToken();
  if (!token) {
    return [];
  }

  const headers = await getAuthHeaders(false);
  const res = await fetch(`${API_BASE_URL}/bookings/my-trips`, {
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      await setStoredToken(null);
      cachedUser = null;
      return [];
    }
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch trips' }));
    throw new Error(err.detail || `Server returned ${res.status}`);
  }

  const json: ApiResponse<any[]> = await res.json();
  return extractItems(json.data);
}

/**
 * Cancel a booking
 */
export async function cancelBookingMobileApi(bookingId: string, reason: string): Promise<any> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Cancellation failed' }));
    throw new Error(err.detail || `Cancellation failed with status ${res.status}`);
  }
  const json: ApiResponse<any> = await res.json();
  return json.data;
}

// ================= Mobile Wishlist API =================
export async function getWishlistMobileApi(): Promise<any[]> {
  const headers = await getAuthHeaders(false);
  const res = await fetch(`${API_BASE_URL}/wishlist`, { headers });
  if (!res.ok) {
    if (res.status === 401) return [];
    return [];
  }
  const json = await res.json();
  return json.data?.items || [];
}

export async function addToWishlistMobileApi(item: any): Promise<any> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE_URL}/wishlist`, {
    method: 'POST',
    headers,
    body: JSON.stringify(item),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export async function removeFromWishlistMobileApi(itemKey: string): Promise<boolean> {
  const headers = await getAuthHeaders(false);
  const res = await fetch(`${API_BASE_URL}/wishlist/${itemKey}`, {
    method: 'DELETE',
    headers,
  });
  return res.ok;
}

export async function syncWishlistMobileApi(items: any[]): Promise<any[]> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE_URL}/wishlist/sync`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ items }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data?.items || [];
}

// ================= Mobile Locations API =================
export async function getLocationsMobileApi(query?: string): Promise<any> {
  const q = query ? `?query=${encodeURIComponent(query)}` : '';
  const res = await fetch(`${API_BASE_URL}/locations${q}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export async function validateRouteMobileApi(category: string, origin: string, destination: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/locations/validate-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, origin, destination }),
  });
  if (!res.ok) return { is_valid: true, is_same_location: false, message: 'OK' };
  const json = await res.json();
  return json.data;
}

