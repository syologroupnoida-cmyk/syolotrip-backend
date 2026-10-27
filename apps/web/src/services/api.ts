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

// ================= Search API Interfaces =================
export interface FlightApiResponse {
  id: string;
  airline: string;
  airline_code: string;
  flight_number: string;
  aircraft?: string;
  origin: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  destination: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  stops: number;
  stops_info?: string;
  cabin_class: string;
  available_seats: number;
  base_fare: number;
  taxes: number;
  total_price: number;
  currency: string;
  logo_url?: string;
  baggage_info?: string;
  tags?: string[];
  is_simulated?: boolean;
}

export interface HotelRoomApiResponse {
  id: string;
  room_type: string;
  bed_type: string;
  max_occupancy: number;
  price_per_night: number;
  taxes_per_night: number;
  available_rooms: number;
  amenities?: string[];
  images?: string[];
  is_available: boolean;
}

export interface HotelApiResponse {
  id: string;
  name: string;
  property_type: string;
  partner_id?: string;
  publication_status: string;
  star_rating: number;
  guest_rating: number;
  rating_label: string;
  review_count: number;
  address: string;
  city: string;
  country: string;
  neighborhood?: string;
  overview: string;
  amenities?: string[];
  tags?: string[];
  featured_image: string;
  images?: string[];
  starting_price: number;
  currency: string;
  featured?: boolean;
  is_simulated?: boolean;
  rooms?: HotelRoomApiResponse[];
}

export interface TrainApiResponse {
  id: string;
  train_number: string;
  train_name: string;
  train_type: string;
  from_station_code: string;
  from_station_name: string;
  from_city: string;
  to_station_code: string;
  to_station_name: string;
  to_city: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  train_class: string;
  available_seats: number;
  base_fare: number;
  rating: number;
  currency: string;
  is_simulated?: boolean;
}

export interface BusApiResponse {
  id: string;
  operator_name: string;
  bus_type: string;
  from_city: string;
  to_city: string;
  boarding_point?: string;
  dropping_point?: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  available_seats: number;
  base_fare: number;
  rating: number;
  currency: string;
  is_simulated?: boolean;
}

export interface CabApiResponse {
  id: string;
  cab_type: string;
  vehicle_model: string;
  city: string;
  pickup_area: string;
  drop_area: string;
  driver_name: string;
  driver_rating: number;
  capacity: number;
  base_fare: number;
  currency: string;
  eta_minutes: number;
  features?: string[];
  is_simulated?: boolean;
}

export interface PackageApiResponse {
  id: string;
  title: string;
  destination: string;
  duration_days: number;
  duration_nights: number;
  overview: string;
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: Array<{ day?: number; title?: string; description?: string }>;
  price_per_person: number;
  currency: string;
  featured_image: string;
  rating: number;
  available_capacity: number;
  is_simulated?: boolean;
}

// ================= Flights API =================
export const searchFlightsApi = async (params?: {
  from_city?: string;
  to_city?: string;
  from_code?: string;
  to_code?: string;
  cabin_class?: string;
  max_price?: number;
  non_stop?: boolean;
}): Promise<FlightApiResponse[]> => {
  const res = await apiClient.get<ApiResponse<{ items: FlightApiResponse[]; pagination: any }>>('/flights', { params });
  return res.data?.data?.items || [];
};

// ================= Hotels API =================
export const searchHotelsApi = async (params?: {
  city?: string;
  min_stars?: number;
  max_price?: number;
  featured_only?: boolean;
}): Promise<HotelApiResponse[]> => {
  const res = await apiClient.get<ApiResponse<{ items: HotelApiResponse[]; pagination: any }>>('/hotels', { params });
  return res.data?.data?.items || [];
};

// ================= Trains API =================
export const searchTrainsApi = async (params?: {
  from_city?: string;
  to_city?: string;
  from_station?: string;
  to_station?: string;
  train_class?: string;
  max_price?: number;
}): Promise<TrainApiResponse[]> => {
  const res = await apiClient.get<ApiResponse<{ items: TrainApiResponse[]; pagination: any }>>('/trains', { params });
  return res.data?.data?.items || [];
};

// ================= Buses API =================
export const searchBusesApi = async (params?: {
  from_city?: string;
  to_city?: string;
  max_price?: number;
}): Promise<BusApiResponse[]> => {
  const res = await apiClient.get<ApiResponse<{ items: BusApiResponse[]; pagination: any }>>('/buses', { params });
  return res.data?.data?.items || [];
};

// ================= Cabs API =================
export const searchCabsApi = async (params?: {
  city?: string;
  cab_type?: string;
  max_price?: number;
}): Promise<CabApiResponse[]> => {
  const res = await apiClient.get<ApiResponse<{ items: CabApiResponse[]; pagination: any }>>('/cabs', { params });
  return res.data?.data?.items || [];
};

// ================= Holiday Packages API =================
export const searchPackagesApi = async (params?: {
  destination?: string;
  max_price?: number;
  min_days?: number;
  max_days?: number;
}): Promise<PackageApiResponse[]> => {
  const res = await apiClient.get<ApiResponse<{ items: PackageApiResponse[]; pagination: any }>>('/packages', { params });
  return res.data?.data?.items || [];
};

// ================= Bookings API =================
export const createBookingApi = async (payload: {
  service_type: string;
  guest_name?: string;
  contact_email: string;
  contact_phone: string;
  check_in_date?: string;
  check_out_date?: string;
  promo_code?: string;
  has_insurance?: boolean;
  items: Array<{
    item_type: string;
    item_reference_id: string;
    quantity: number;
    hotel_id?: string;
    room_id?: string;
    check_in_date?: string;
    check_out_date?: string;
    meta_data?: any;
  }>;
  passengers: Array<{
    title?: string;
    first_name: string;
    last_name: string;
    passenger_type?: string;
    gender?: string;
    date_of_birth?: string;
    passport_number?: string;
    seat_preference?: string;
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

// ================= Razorpay Payment APIs =================
export interface RazorpayOrderData {
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

export interface RazorpayVerifyData {
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

export const createRazorpayOrderApi = async (payload: {
  booking_id: string;
  guest_token?: string;
}): Promise<RazorpayOrderData> => {
  const res = await apiClient.post<ApiResponse<RazorpayOrderData>>('/payments/razorpay/order', payload);
  return res.data.data;
};

export const verifyRazorpayPaymentApi = async (payload: {
  booking_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  guest_token?: string;
}): Promise<RazorpayVerifyData> => {
  const res = await apiClient.post<ApiResponse<RazorpayVerifyData>>('/payments/razorpay/verify', payload);
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

export const demoLoginApi = async (role: 'CUSTOMER' | 'ADMIN' | 'PARTNER' = 'CUSTOMER'): Promise<AuthResponse> => {
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/demo-login', { role });
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

// ================= Coupon & Offers APIs =================
export interface CouponValidateResult {
  valid: boolean;
  code: string;
  discount_type: 'PERCENTAGE' | 'FLAT' | 'NONE';
  discount_value: number;
  discount_amount: number;
  final_amount: number;
  message: string;
}

export const validateCouponApi = async (
  code: string,
  orderAmount: number,
  serviceType?: string
): Promise<CouponValidateResult> => {
  const res = await apiClient.post<ApiResponse<CouponValidateResult>>('/coupons/validate', {
    code,
    order_amount: orderAmount,
    service_type: serviceType || 'ALL',
  });
  return res.data.data;
};

export const getActiveCouponsApi = async (serviceType?: string): Promise<any[]> => {
  const res = await apiClient.get<ApiResponse<any[]>>('/coupons/active', {
    params: serviceType ? { service_type: serviceType } : {},
  });
  return res.data.data;
};

// ================= Partner Marketplace API =================
export interface PartnerRegisterPayload {
  business_name: string;
  business_type: string;
  phone?: string;
  city?: string;
  address?: string;
  tax_id?: string;
}

export interface PartnerProfileData {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  phone?: string;
  city?: string;
  address?: string;
  country: string;
  tax_id?: string;
  status: string;
  is_verified: boolean;
  commission_rate: number;
  is_commission_active: boolean;
  rejection_reason?: string;
  verified_at?: string;
  created_at: string;
}

export const registerPartnerApi = async (payload: PartnerRegisterPayload): Promise<PartnerProfileData> => {
  const res = await apiClient.post<ApiResponse<PartnerProfileData>>('/partner/register', payload);
  return res.data.data;
};

export const getPartnerProfileApi = async (): Promise<PartnerProfileData> => {
  const res = await apiClient.get<ApiResponse<PartnerProfileData>>('/partner/profile');
  return res.data.data;
};

// ================= Wishlist API =================
export interface BackendWishlistItem {
  id: string;
  title: string;
  category: string;
  location: string;
  price: number;
  rating?: number;
  image: string;
  badge?: string;
  added_at?: string;
  addedAt?: string;
}

export const getWishlistApi = async (): Promise<BackendWishlistItem[]> => {
  const res = await apiClient.get<ApiResponse<{ items: BackendWishlistItem[]; count: number }>>('/wishlist');
  return res.data?.data?.items || [];
};

export const addToWishlistApi = async (item: {
  id: string;
  title: string;
  category: string;
  location: string;
  price: number;
  rating?: number;
  image: string;
  badge?: string;
}): Promise<BackendWishlistItem> => {
  const res = await apiClient.post<ApiResponse<BackendWishlistItem>>('/wishlist', item);
  return res.data?.data;
};

export const removeFromWishlistApi = async (itemKey: string): Promise<boolean> => {
  const res = await apiClient.delete<ApiResponse<{ removed: boolean }>>(`/wishlist/${itemKey}`);
  return res.data?.data?.removed ?? true;
};

export const clearWishlistApi = async (): Promise<number> => {
  const res = await apiClient.delete<ApiResponse<{ cleared_count: number }>>('/wishlist');
  return res.data?.data?.cleared_count ?? 0;
};

export const syncWishlistApi = async (items: any[]): Promise<BackendWishlistItem[]> => {
  const res = await apiClient.post<ApiResponse<{ items: BackendWishlistItem[]; count: number }>>('/wishlist/sync', { items });
  return res.data?.data?.items || [];
};

// ================= Locations & Route Validation API =================
export interface LocationOptionItem {
  category: string;
  code?: string;
  name: string;
  city: string;
  country?: string;
  role: string;
}

export interface LocationsResponseData {
  airports: LocationOptionItem[];
  hotel_cities: LocationOptionItem[];
  train_stations: LocationOptionItem[];
  bus_cities: LocationOptionItem[];
  cab_cities: LocationOptionItem[];
  package_destinations: LocationOptionItem[];
}

export const getLocationsApi = async (query?: string): Promise<LocationsResponseData> => {
  const res = await apiClient.get<ApiResponse<LocationsResponseData>>('/locations', {
    params: query ? { query } : {},
  });
  return res.data?.data;
};

export const validateRouteApi = async (
  category: string,
  origin: string,
  destination: string
): Promise<{
  is_valid: boolean;
  is_same_location: boolean;
  message: string;
  suggested_destinations?: LocationOptionItem[];
}> => {
  const res = await apiClient.post<ApiResponse<any>>('/locations/validate-route', {
    category,
    origin,
    destination,
  });
  return res.data?.data;
};


