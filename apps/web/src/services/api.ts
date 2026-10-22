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

// ================= myBiz Corporate Travel API =================

export interface MyBizContext {
  is_biz_user: boolean;
  company_id?: string;
  company_name?: string;
  biz_role?: 'BIZ_ADMIN' | 'BIZ_APPROVER' | 'BIZ_EMPLOYEE';
  department?: string;
}

export interface MyBizCompany {
  id: string;
  name: string;
  gstin?: string;
  pan?: string;
  industry?: string;
  employee_count_range: string;
  billing_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  website?: string;
  is_active: boolean;
  created_at: string;
  employee_count: number;
}

export interface MyBizEmployee {
  id: string;
  company_id: string;
  user_id?: string;
  email: string;
  full_name: string;
  role: 'BIZ_ADMIN' | 'BIZ_APPROVER' | 'BIZ_EMPLOYEE';
  department?: string;
  designation?: string;
  status: 'ACTIVE' | 'INVITED' | 'DEACTIVATED';
  created_at: string;
}

export interface MyBizTravelPolicy {
  id: string;
  company_id: string;
  name: string;
  is_active: boolean;
  rules?: {
    flight_max_budget?: number;
    hotel_max_budget?: number;
    cab_max_budget?: number;
    bus_max_budget?: number;
    train_max_budget?: number;
    package_max_budget?: number;
    allowed_flight_classes?: string[];
    allowed_hotel_stars?: number[];
    advance_booking_days?: number;
    requires_approval?: boolean;
    international_requires_approval?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface MyBizTripRequest {
  id: string;
  company_id: string;
  employee_user_id: string;
  employee_name?: string;
  employee_email?: string;
  approver_user_id?: string;
  service_type: string;
  trip_purpose?: string;
  destination?: string;
  travel_date_from?: string;
  travel_date_to?: string;
  estimated_amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejection_reason?: string;
  booking_id?: string;
  created_at: string;
}

export interface MyBizInvoice {
  id: string;
  company_id: string;
  booking_id: string;
  invoice_number: string;
  gstin?: string;
  company_name: string;
  billing_address?: string;
  base_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  tax_breakdown?: Record<string, any>;
  created_at: string;
}

export interface MyBizReport {
  total_bookings: number;
  total_spend: number;
  total_tax: number;
  average_booking_value: number;
  spend_by_service: Record<string, number>;
  spend_by_department: Record<string, number>;
  spend_by_month: Record<string, number>;
  pending_approvals: number;
  active_employees: number;
}

export const getMyBizContextApi = async (): Promise<MyBizContext> => {
  const res = await apiClient.get<ApiResponse<MyBizContext>>('/mybiz/context');
  return res.data.data;
};

export const registerMyBizApi = async (payload: {
  company_name: string;
  gstin?: string;
  pan?: string;
  industry?: string;
  employee_count_range: string;
  billing_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  website?: string;
}): Promise<MyBizCompany> => {
  const res = await apiClient.post<ApiResponse<MyBizCompany>>('/mybiz/register', payload);
  return res.data.data;
};

export const getMyBizCompanyApi = async (): Promise<MyBizCompany> => {
  const res = await apiClient.get<ApiResponse<MyBizCompany>>('/mybiz/company');
  return res.data.data;
};

export const updateMyBizCompanyApi = async (payload: Partial<MyBizCompany>): Promise<MyBizCompany> => {
  const res = await apiClient.put<ApiResponse<MyBizCompany>>('/mybiz/company', payload);
  return res.data.data;
};

export const getMyBizEmployeesApi = async (): Promise<MyBizEmployee[]> => {
  const res = await apiClient.get<ApiResponse<MyBizEmployee[]>>('/mybiz/employees');
  return res.data.data;
};

export const addMyBizEmployeeApi = async (payload: {
  email: string;
  full_name: string;
  role?: string;
  department?: string;
  designation?: string;
}): Promise<MyBizEmployee> => {
  const res = await apiClient.post<ApiResponse<MyBizEmployee>>('/mybiz/employees', payload);
  return res.data.data;
};

export const updateMyBizEmployeeApi = async (
  employeeId: string,
  payload: { role?: string; department?: string; designation?: string; status?: string }
): Promise<MyBizEmployee> => {
  const res = await apiClient.put<ApiResponse<MyBizEmployee>>(`/mybiz/employees/${employeeId}`, payload);
  return res.data.data;
};

export const deleteMyBizEmployeeApi = async (employeeId: string): Promise<void> => {
  await apiClient.delete(`/mybiz/employees/${employeeId}`);
};

export const getMyBizPolicyApi = async (): Promise<MyBizTravelPolicy> => {
  const res = await apiClient.get<ApiResponse<MyBizTravelPolicy>>('/mybiz/policy');
  return res.data.data;
};

export const updateMyBizPolicyApi = async (payload: {
  name?: string;
  rules?: any;
  is_active?: boolean;
}): Promise<MyBizTravelPolicy> => {
  const res = await apiClient.put<ApiResponse<MyBizTravelPolicy>>('/mybiz/policy', payload);
  return res.data.data;
};

export const getMyBizTripRequestsApi = async (statusFilter?: string): Promise<MyBizTripRequest[]> => {
  const res = await apiClient.get<ApiResponse<MyBizTripRequest[]>>('/mybiz/trip-requests', {
    params: statusFilter ? { status_filter: statusFilter } : {},
  });
  return res.data.data;
};

export const createMyBizTripRequestApi = async (payload: {
  service_type: string;
  trip_purpose?: string;
  destination?: string;
  travel_date_from?: string;
  travel_date_to?: string;
  estimated_amount: number;
}): Promise<MyBizTripRequest> => {
  const res = await apiClient.post<ApiResponse<MyBizTripRequest>>('/mybiz/trip-requests', payload);
  return res.data.data;
};

export const approveMyBizTripRequestApi = async (requestId: string): Promise<MyBizTripRequest> => {
  const res = await apiClient.post<ApiResponse<MyBizTripRequest>>(`/mybiz/trip-requests/${requestId}/approve`);
  return res.data.data;
};

export const rejectMyBizTripRequestApi = async (
  requestId: string,
  rejectionReason?: string
): Promise<MyBizTripRequest> => {
  const res = await apiClient.post<ApiResponse<MyBizTripRequest>>(`/mybiz/trip-requests/${requestId}/reject`, {
    rejection_reason: rejectionReason,
  });
  return res.data.data;
};

export const getMyBizInvoicesApi = async (): Promise<MyBizInvoice[]> => {
  const res = await apiClient.get<ApiResponse<MyBizInvoice[]>>('/mybiz/invoices');
  return res.data.data;
};

export const getMyBizReportsApi = async (): Promise<MyBizReport> => {
  const res = await apiClient.get<ApiResponse<MyBizReport>>('/mybiz/reports');
  return res.data.data;
};

export const getMyBizBookingsApi = async (): Promise<any[]> => {
  const res = await apiClient.get<ApiResponse<any[]>>('/mybiz/bookings');
  return res.data.data;
};

