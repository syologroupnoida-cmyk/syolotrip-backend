import axios from 'axios';
import type {
  ApiResponse,
  HealthCheckResponse,
  AuthResponse,
  UserProfile,
} from '@traveler/contracts';

export type { UserProfile, AuthResponse };

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const checkSystemHealth = async (): Promise<HealthCheckResponse> => {
  const response = await apiClient.get<ApiResponse<HealthCheckResponse>>('/health');
  return response.data.data;
};

// ================= Flights API =================
export const searchFlightsApi = async (params?: {
  from_city?: string;
  to_city?: string;
  from_code?: string;
  to_code?: string;
  cabin_class?: string;
  max_price?: number;
  non_stop?: boolean;
}): Promise<any[]> => {
  try {
    const res = await apiClient.get<ApiResponse<{ items: any[] }>>('/flights', { params });
    return res.data.data.items;
  } catch (err) {
    console.warn('Flight API error, falling back', err);
    return [];
  }
};

// ================= Hotels API =================
export const searchHotelsApi = async (params?: {
  city?: string;
  min_stars?: number;
  max_price?: number;
  featured_only?: boolean;
}): Promise<any[]> => {
  try {
    const res = await apiClient.get<ApiResponse<{ items: any[] }>>('/hotels', { params });
    return res.data.data.items;
  } catch (err) {
    console.warn('Hotel API error, falling back', err);
    return [];
  }
};

// ================= Trains API =================
export const searchTrainsApi = async (params?: {
  from_city?: string;
  to_city?: string;
  from_station?: string;
  to_station?: string;
  train_class?: string;
  max_price?: number;
}): Promise<any[]> => {
  try {
    const res = await apiClient.get<ApiResponse<{ items: any[] }>>('/trains', { params });
    return res.data.data.items;
  } catch (err) {
    console.warn('Train API error, falling back', err);
    return [];
  }
};

// ================= Buses API =================
export const searchBusesApi = async (params?: {
  from_city?: string;
  to_city?: string;
  max_price?: number;
}): Promise<any[]> => {
  try {
    const res = await apiClient.get<ApiResponse<{ items: any[] }>>('/buses', { params });
    return res.data.data.items;
  } catch (err) {
    console.warn('Bus API error, falling back', err);
    return [];
  }
};

// ================= Cabs API =================
export const searchCabsApi = async (params?: {
  city?: string;
  cab_type?: string;
  max_price?: number;
}): Promise<any[]> => {
  try {
    const res = await apiClient.get<ApiResponse<{ items: any[] }>>('/cabs', { params });
    return res.data.data.items;
  } catch (err) {
    console.warn('Cab API error, falling back', err);
    return [];
  }
};

// ================= Holiday Packages API =================
export const searchPackagesApi = async (params?: {
  destination?: string;
  max_price?: number;
  min_days?: number;
  max_days?: number;
}): Promise<any[]> => {
  try {
    const res = await apiClient.get<ApiResponse<{ items: any[] }>>('/packages', { params });
    return res.data.data.items;
  } catch (err) {
    console.warn('Package API error, falling back', err);
    return [];
  }
};

// ================= Bookings API =================
export const createBookingApi = async (payload: {
  service_type: string;
  contact_email: string;
  contact_phone: string;
  promo_code?: string;
  has_insurance?: boolean;
  items: Array<{
    item_type: string;
    item_reference_id: string;
    quantity: number;
    meta_data?: any;
  }>;
  passengers: Array<{
    title?: string;
    first_name: string;
    last_name: string;
    passenger_type?: string;
    gender?: string;
    passport_number?: string;
  }>;
}): Promise<any> => {
  const res = await apiClient.post<ApiResponse<any>>('/bookings', payload);
  return res.data.data;
};

export const payDemoBookingApi = async (payload: {
  booking_id: string;
  payment_method?: string;
  simulate_failure?: boolean;
  card_last_four?: string;
}): Promise<any> => {
  const res = await apiClient.post<ApiResponse<any>>('/payments/demo', payload);
  return res.data.data;
};

export const getMyTripsApi = async (): Promise<any[]> => {
  const res = await apiClient.get<ApiResponse<any[]>>('/bookings/my-trips');
  return res.data.data;
};

export const cancelBookingApi = async (bookingId: string, reason: string): Promise<any> => {
  const res = await apiClient.post<ApiResponse<any>>(`/bookings/${bookingId}/cancel`, { reason });
  return res.data.data;
};

// ================= Customer Auth API =================
export const loginApi = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
  const data = res.data.data;
  const token = data?.tokens?.accessToken || (data?.tokens as any)?.access_token;
  if (token) {
    localStorage.setItem('ss_access_token', token);
  }
  return data;
};

export const registerApi = async (payload: {
  email: string;
  full_name: string;
  password: string;
  phone?: string;
}): Promise<AuthResponse> => {
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);
  const data = res.data.data;
  const token = data?.tokens?.accessToken || (data?.tokens as any)?.access_token;
  if (token) {
    localStorage.setItem('ss_access_token', token);
  }
  return data;
};

export const getCurrentUserApi = async (): Promise<UserProfile | null> => {
  const token = localStorage.getItem('ss_access_token');
  if (!token) return null;
  try {
    const res = await apiClient.get<ApiResponse<UserProfile>>('/auth/me');
    return res.data.data;
  } catch {
    localStorage.removeItem('ss_access_token');
    return null;
  }
};

export const logoutApi = (): void => {
  localStorage.removeItem('ss_access_token');
};
