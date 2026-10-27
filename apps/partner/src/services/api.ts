import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import {
  UserProfile,
  PartnerProfileData,
  PartnerPropertyData,
  HotelRoomData,
  DailyInventoryData,
  PartnerBookingData,
} from '../types/partner';

export const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // On Web: Always use current browser hostname so it works with localhost, 127.0.0.1, or LAN IP
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8000/api/v1`;
  }

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

const TOKEN_KEY = 'ss_partner_access_token';
let memoryToken: string | null = null;

export const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Robust fetch wrapper that guarantees requests will never hang indefinitely.
 * Aborts after timeoutMs (default 15s) and transforms raw network rejections
 * into readable, user-friendly error messages.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      throw new Error(
        `Network request timed out (${timeoutMs / 1000}s). The server took too long to respond. Please check your internet connection.`
      );
    }
    if (err.message === 'Network request failed' || err instanceof TypeError) {
      throw new Error(
        `Unable to reach SS Journey server. Please verify network connectivity and that the backend service is running.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

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
    console.warn('[PartnerAPI] Error reading secure token:', err);
  }
  return memoryToken;
};

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
    console.warn('[PartnerAPI] Error writing secure token:', err);
  }
};

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

// ────────── Authentication ──────────
export async function loginPartnerApi(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    if (!res.ok) {
      await setStoredToken(null);
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Incorrect email or password');
    }
    const json: ApiResponse<any> = await res.json();
    const token = json.data?.tokens?.accessToken || json.data?.tokens?.access_token;
    if (!token) {
      await setStoredToken(null);
      throw new Error('Authentication failed: missing access token');
    }
    await setStoredToken(token);
    return { token, user: json.data?.user };
  } catch (err) {
    await setStoredToken(null);
    throw err;
  }
}

export async function registerPartnerAccountApi(payload: {
  email: string;
  full_name: string;
  password: string;
  phone?: string;
}): Promise<{ user: UserProfile }> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
      full_name: payload.full_name.trim(),
      password: payload.password,
      phone: payload.phone?.trim() || undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(err.detail || 'Email already registered');
  }
  const json: ApiResponse<any> = await res.json();
  // SEC-CRITICAL: Never persist registration token or maintain session on registration.
  await setStoredToken(null);
  return { user: json.data?.user };
}

export interface RegisterPartnerFlowPayload {
  email: string;
  full_name: string;
  password: string;
  phone?: string;
  business_name: string;
  business_type: string;
  business_phone?: string;
  city: string;
  address?: string;
  tax_id?: string;
}

export interface RegisterPartnerFlowResult {
  success: boolean;
  message: string;
  partialState?: {
    accountCreated: boolean;
    email: string;
    error: string;
  };
}

export async function registerPartnerFlowApi(
  payload: RegisterPartnerFlowPayload,
  onStepProgress?: (step: 'ACCOUNT' | 'PROFILE') => void
): Promise<RegisterPartnerFlowResult> {
  // 1. Submit user account registration
  onStepProgress?.('ACCOUNT');
  let regRes: Response;
  try {
    regRes = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
        full_name: payload.full_name.trim(),
        password: payload.password,
        phone: payload.phone?.trim() || undefined,
      }),
    });
  } catch (err: any) {
    throw new Error(err.message || 'Failed to submit account registration. Please check your connection.');
  }

  if (!regRes.ok) {
    const err = await regRes.json().catch(() => ({ detail: 'Registration failed' }));
    const detail = err.detail || 'Registration failed';
    if (detail.toLowerCase().includes('already registered')) {
      throw new Error('This email address is already registered. If you already have an account, please sign in.');
    }
    throw new Error(detail);
  }

  const regJson: ApiResponse<any> = await regRes.json();
  const tempToken = regJson.data?.tokens?.accessToken || regJson.data?.tokens?.access_token;

  if (!tempToken) {
    await setStoredToken(null);
    return {
      success: false,
      message: 'Account created, but temporary authorization token was missing.',
      partialState: {
        accountCreated: true,
        email: payload.email.trim().toLowerCase(),
        error: 'Missing temporary session token. Please sign in to finish onboarding.',
      },
    };
  }

  // 2. Register partner business profile using the temporary authorization token
  onStepProgress?.('PROFILE');
  let profRes: Response;
  try {
    profRes = await fetchWithTimeout(`${API_BASE_URL}/partner/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tempToken}`,
      },
      body: JSON.stringify({
        business_name: payload.business_name.trim(),
        business_type: payload.business_type.toUpperCase(),
        phone: payload.business_phone?.trim() || payload.phone?.trim() || undefined,
        city: payload.city.trim(),
        address: payload.address?.trim() || undefined,
        tax_id: payload.tax_id?.trim() || undefined,
      }),
    });
  } catch (err: any) {
    // Account was created, but profile onboarding encountered network/timeout error
    await setStoredToken(null);
    return {
      success: false,
      message: 'Account created, but business profile onboarding could not be completed.',
      partialState: {
        accountCreated: true,
        email: payload.email.trim().toLowerCase(),
        error: err.message || 'Network error occurred during business profile registration.',
      },
    };
  }

  if (!profRes.ok) {
    const pErr = await profRes.json().catch(() => ({ detail: 'Profile onboarding failed' }));
    const errorDetail = pErr.detail || `Server returned status ${profRes.status}`;
    await setStoredToken(null);
    return {
      success: false,
      message: 'Account created, but business profile onboarding could not be completed.',
      partialState: {
        accountCreated: true,
        email: payload.email.trim().toLowerCase(),
        error: errorDetail,
      },
    };
  }

  // 3. SEC-CRITICAL: Explicitly ensure all stored tokens and temporary state are cleared
  await setStoredToken(null);

  return {
    success: true,
    message: 'Registration submitted successfully! Your partner application is under review. Please sign in with your email and password.',
  };
}

export async function getCurrentUserApi(): Promise<UserProfile | null> {
  try {
    const headers = await getAuthHeaders();
    if (!headers['Authorization']) return null;
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, { headers });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        await setStoredToken(null);
      }
      return null;
    }
    const json: ApiResponse<UserProfile> = await res.json();
    return json.data;
  } catch (err) {
    await setStoredToken(null);
    return null;
  }
}

// ────────── Partner Profile ──────────
export async function createPartnerProfileApi(payload: {
  business_name: string;
  business_type: string;
  phone?: string;
  city?: string;
  address?: string;
  tax_id?: string;
}): Promise<PartnerProfileData> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}/partner/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create partner profile' }));
    throw new Error(err.detail || 'Partner profile registration failed');
  }
  const json: ApiResponse<PartnerProfileData> = await res.json();
  return json.data;
}

export async function getPartnerProfileApi(): Promise<PartnerProfileData | null> {
  try {
    const headers = await getAuthHeaders();
    if (!headers['Authorization']) return null;
    const res = await fetchWithTimeout(`${API_BASE_URL}/partner/profile`, { headers });
    if (!res.ok) return null;
    const json: ApiResponse<PartnerProfileData> = await res.json();
    return json.data;
  } catch (err) {
    return null;
  }
}

export async function updatePartnerProfileApi(payload: Partial<PartnerProfileData>): Promise<PartnerProfileData> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}/partner/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update profile' }));
    throw new Error(err.detail || 'Profile update failed');
  }
  const json: ApiResponse<PartnerProfileData> = await res.json();
  return json.data;
}

// ────────── Properties ──────────
export async function getPartnerPropertiesApi(statusFilter?: string): Promise<PartnerPropertyData[]> {
  const headers = await getAuthHeaders();
  const url = statusFilter
    ? `${API_BASE_URL}/partner/properties?status=${statusFilter}`
    : `${API_BASE_URL}/partner/properties`;
  const res = await fetchWithTimeout(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch properties' }));
    throw new Error(err.detail || 'Failed to fetch properties');
  }
  const json: ApiResponse<PartnerPropertyData[]> = await res.json();
  return json.data || [];
}

export async function getPartnerPropertyByIdApi(propertyId: string): Promise<PartnerPropertyData> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}/partner/properties/${propertyId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch property' }));
    throw new Error(err.detail || 'Property not found');
  }
  const json: ApiResponse<PartnerPropertyData> = await res.json();
  return json.data;
}

export async function createPartnerPropertyApi(payload: {
  name: string;
  property_type: 'HOTEL' | 'HOMESTAY';
  star_rating: number;
  address: string;
  city: string;
  country?: string;
  neighborhood?: string;
  overview: string;
  amenities?: string[];
  tags?: string[];
  featured_image: string;
  images?: string[];
  starting_price: number;
  currency?: string;
}): Promise<PartnerPropertyData> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}/partner/properties`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create property draft' }));
    throw new Error(err.detail || 'Failed to create property draft');
  }
  const json: ApiResponse<PartnerPropertyData> = await res.json();
  return json.data;
}

export async function updatePartnerPropertyApi(
  propertyId: string,
  payload: Partial<PartnerPropertyData>
): Promise<PartnerPropertyData> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}/partner/properties/${propertyId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update property' }));
    throw new Error(err.detail || 'Property update failed');
  }
  const json: ApiResponse<PartnerPropertyData> = await res.json();
  return json.data;
}

export async function submitPropertyForApprovalApi(propertyId: string): Promise<PartnerPropertyData> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}/partner/properties/${propertyId}/submit`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to submit property' }));
    throw new Error(err.detail || 'Property submission failed');
  }
  const json: ApiResponse<PartnerPropertyData> = await res.json();
  return json.data;
}

// ────────── Rooms ──────────
export async function addPropertyRoomApi(
  propertyId: string,
  payload: {
    room_type: string;
    bed_type?: string;
    max_occupancy?: number;
    price_per_night: number;
    taxes_per_night?: number;
    available_rooms: number;
    amenities?: string[];
    images?: string[];
  }
): Promise<HotelRoomData> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}/partner/properties/${propertyId}/rooms`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to add room' }));
    throw new Error(err.detail || 'Failed to add room');
  }
  const json: ApiResponse<HotelRoomData> = await res.json();
  return json.data;
}

export async function updatePropertyRoomApi(
  propertyId: string,
  roomId: string,
  payload: Partial<HotelRoomData>
): Promise<HotelRoomData> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}/partner/properties/${propertyId}/rooms/${roomId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update room' }));
    throw new Error(err.detail || 'Failed to update room');
  }
  const json: ApiResponse<HotelRoomData> = await res.json();
  return json.data;
}

export async function deletePropertyRoomApi(propertyId: string, roomId: string): Promise<boolean> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}/partner/properties/${propertyId}/rooms/${roomId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete room' }));
    throw new Error(err.detail || 'Failed to delete room');
  }
  return true;
}

// ────────── Daily Availability & Inventory ──────────
export async function setDailyInventoryApi(
  propertyId: string,
  roomId: string,
  payload: {
    date: string;
    available_rooms: number;
    price_override?: number | null;
    is_blocked?: boolean;
  }
): Promise<DailyInventoryData> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}/partner/properties/${propertyId}/rooms/${roomId}/availability`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update daily availability' }));
    throw new Error(err.detail || 'Availability update failed');
  }
  const json: ApiResponse<DailyInventoryData> = await res.json();
  return json.data;
}

export async function getDailyInventoryApi(propertyId: string, roomId: string): Promise<DailyInventoryData[]> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}/partner/properties/${propertyId}/rooms/${roomId}/availability`, {
    headers,
  });
  if (!res.ok) return [];
  const json: ApiResponse<DailyInventoryData[]> = await res.json();
  return json.data || [];
}

// ────────── Bookings ──────────
export async function getPartnerBookingsApi(): Promise<PartnerBookingData[]> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}/partner/bookings`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch bookings' }));
    throw new Error(err.detail || 'Failed to fetch bookings');
  }
  const json: ApiResponse<PartnerBookingData[]> = await res.json();
  return json.data || [];
}

export async function updatePartnerBookingStatusApi(bookingId: string, status: string): Promise<PartnerBookingData> {
  const headers = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}/partner/bookings/${bookingId}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update booking status' }));
    throw new Error(err.detail || 'Failed to update booking status');
  }
  const json: ApiResponse<PartnerBookingData> = await res.json();
  return json.data;
}
