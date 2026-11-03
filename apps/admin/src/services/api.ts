import axios from 'axios';
import type { ApiResponse, HealthCheckResponse, DashboardStats, AuthResponse } from '@traveler/contracts';

export const adminApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

adminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If request returns 401 Unauthorized
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      // Do not clear tokens or emit unauthorized event for the actual login attempt
      if (!isLoginRequest) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.dispatchEvent(new CustomEvent('admin:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Interactive Admin Login: Authenticates an administrator with the backend.
 * Never stores or embeds credentials in the source code or bundle.
 */
export const loginAdmin = async (payload: { email: string; password: string }): Promise<AuthResponse> => {
  const response = await adminApiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);
  const authData = response.data.data;
  const token = authData.tokens?.accessToken || (authData.tokens as any)?.access_token;
  if (token) {
    localStorage.setItem('admin_token', token);
    if (authData.user) {
      localStorage.setItem('admin_user', JSON.stringify(authData.user));
    }
  }
  return authData;
};

/**
 * 1-Click Security Bypass / Demo Login for Admin console.
 */
export const demoLoginAdmin = async (role: 'ADMIN' = 'ADMIN'): Promise<AuthResponse> => {
  const response = await adminApiClient.post<ApiResponse<AuthResponse>>('/auth/demo-login', { role });
  const authData = response.data.data;
  const token = authData.tokens?.accessToken || (authData.tokens as any)?.access_token;
  if (token) {
    localStorage.setItem('admin_token', token);
    if (authData.user) {
      localStorage.setItem('admin_user', JSON.stringify(authData.user));
    }
  }
  return authData;
};

/**
 * Admin Logout: Clears stored session tokens and notifies the application.
 */
export const logoutAdmin = (): void => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  window.dispatchEvent(new CustomEvent('admin:logout'));
};

export const getAdminHealth = async (): Promise<HealthCheckResponse> => {
  const response = await adminApiClient.get<ApiResponse<HealthCheckResponse>>('/health');
  return response.data.data;
};

export const getAdminOverview = async (): Promise<DashboardStats> => {
  const response = await adminApiClient.get<ApiResponse<DashboardStats>>('/admin/overview');
  return response.data.data;
};

export const getAdminBookings = async (params?: { status?: string; page?: number; limit?: number }) => {
  const response = await adminApiClient.get('/admin/bookings', { params });
  return response.data.data;
};

export const getAdminFlights = async () => {
  const response = await adminApiClient.get('/flights');
  return response.data.data;
};

export const getAdminHotels = async () => {
  const response = await adminApiClient.get('/hotels');
  return response.data.data;
};

export const getAdminBuses = async () => {
  const response = await adminApiClient.get('/buses');
  return response.data.data;
};

export const getAdminPackages = async (params?: {
  status?: string;
  search?: string;
  region?: string;
  theme?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await adminApiClient.get('/admin/packages', { params: { limit: 100, ...params } });
  return response.data.data;
};

export const updateAdminPackageStatus = async (packageId: string, status: string) => {
  const response = await adminApiClient.patch(`/admin/packages/${packageId}/status`, { status });
  return response.data;
};

export const bulkUpdateAdminPackageStatus = async (status: string, packageIds?: string[]) => {
  const response = await adminApiClient.post('/admin/packages/bulk-status', { status, package_ids: packageIds });
  return response.data;
};

export const getAdminTrains = async () => {
  const response = await adminApiClient.get('/trains');
  return response.data.data;
};

export const getAdminCabs = async () => {
  const response = await adminApiClient.get('/cabs');
  return response.data.data;
};

export const getAdminUsers = async (params?: { page?: number; limit?: number }) => {
  const response = await adminApiClient.get('/admin/users', { params });
  return response.data.data;
};

export const getAdminAuditLogs = async (limit = 50) => {
  const response = await adminApiClient.get('/admin/audit-logs', { params: { limit } });
  return response.data.data;
};

export const getAdminCoupons = async () => {
  const response = await adminApiClient.get('/admin/coupons');
  return response.data.data;
};

export const updateAdminBookingStatus = async (
  bookingId: string,
  payload: string | { status: string; cancellation_reason?: string }
) => {
  const body = typeof payload === 'string' ? { status: payload } : payload;
  const response = await adminApiClient.patch(`/admin/bookings/${bookingId}/status`, body);
  return response.data;
};

export const createAdminFlight = async (payload: any) => {
  const response = await adminApiClient.post('/admin/flights', payload);
  return response.data.data;
};

export const createAdminHotel = async (payload: any) => {
  const response = await adminApiClient.post('/admin/hotels', payload);
  return response.data.data;
};

export const createAdminBus = async (payload: any) => {
  const response = await adminApiClient.post('/admin/buses', payload);
  return response.data.data;
};

export const createAdminTrain = async (payload: any) => {
  const response = await adminApiClient.post('/admin/trains', payload);
  return response.data.data;
};

export const createAdminCab = async (payload: any) => {
  const response = await adminApiClient.post('/admin/cabs', payload);
  return response.data.data;
};

export const createAdminPackage = async (payload: any) => {
  const response = await adminApiClient.post('/admin/packages', payload);
  return response.data.data;
};

export const deleteAdminInventoryItem = async (itemType: string, itemId: string) => {
  const response = await adminApiClient.delete(`/admin/inventory/${itemType}/${itemId}`);
  return response.data;
};

export const updateAdminInventoryItem = async (itemType: string, itemId: string, payload: Record<string, any>) => {
  const response = await adminApiClient.patch(`/admin/inventory/${itemType}/${itemId}`, payload);
  return response.data;
};

export const updateAdminUserStatus = async (userId: string, isActive: boolean) => {
  const response = await adminApiClient.patch(`/admin/users/${userId}/status`, { is_active: isActive });
  return response.data;
};

export const createAdminCoupon = async (payload: {
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount_amount?: number | null;
  min_order_amount: number;
  service_type: string;
  description?: string;
  is_active?: boolean;
}) => {
  const response = await adminApiClient.post('/admin/coupons', payload);
  return response.data.data;
};

export const updateAdminCoupon = async (couponId: string, payload: {
  discount_type?: string;
  discount_value?: number;
  max_discount_amount?: number | null;
  min_order_amount?: number;
  service_type?: string;
  description?: string;
  is_active?: boolean;
}) => {
  const response = await adminApiClient.patch(`/admin/coupons/${couponId}`, payload);
  return response.data.data;
};

export const deleteAdminCoupon = async (couponId: string) => {
  const response = await adminApiClient.delete(`/admin/coupons/${couponId}`);
  return response.data;
};

export const getAdminPendingProperties = async () => {
  const response = await adminApiClient.get('/admin/properties/pending');
  return response.data.data;
};

export const approveAdminProperty = async (propertyId: string) => {
  const response = await adminApiClient.post(`/admin/properties/${propertyId}/approve`);
  return response.data;
};

export const rejectAdminProperty = async (propertyId: string, rejectionReason?: string) => {
  const response = await adminApiClient.post(`/admin/properties/${propertyId}/reject`, {
    rejection_reason: rejectionReason || 'Does not meet platform standards',
  });
  return response.data;
};

// ================= Pricing & Dynamic Markup API =================
export interface AdminPricingRule {
  id: string;
  name: string;
  channel: 'B2C' | 'B2B' | 'ALL';
  service_type: string;
  company_id?: string | null;
  company_name?: string | null;
  calculation_type: 'PERCENTAGE_MARKUP' | 'FIXED_MARKUP' | 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT';
  value: number;
  min_markup_amount?: number | null;
  max_markup_amount?: number | null;
  priority: number;
  valid_from: string;
  valid_until?: string | null;
  is_active: boolean;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingSimulationResult {
  supplier_base_fare: number;
  supplier_taxes: number;
  markup_amount: number;
  markup_percentage: number;
  selling_base_fare: number;
  total_selling_price: number;
  platform_margin: number;
  channel: string;
  service_type: string;
  rule_applied: {
    id: string;
    name: string;
    calculation_type: string;
    value: number;
    channel: string;
    priority: number;
  } | null;
}

export interface PricingComparisonResult {
  base_fare: number;
  taxes: number;
  service_type: string;
  b2c: PricingSimulationResult;
  b2b: PricingSimulationResult;
  difference: {
    markup_difference: number;
    total_price_difference: number;
    b2b_savings_percentage: number;
  };
}

export interface PricingAuditLog {
  id: string;
  rule_id?: string | null;
  rule_name?: string | null;
  admin_id?: string | null;
  admin_email: string;
  action: string;
  previous_state: Record<string, any>;
  new_state: Record<string, any>;
  reason?: string;
  created_at: string;
}

export const getAdminPricingRules = async (params?: { channel?: string; service_type?: string }) => {
  const response = await adminApiClient.get('/admin/pricing/rules', { params });
  return response.data.data as AdminPricingRule[];
};

export const createAdminPricingRule = async (payload: Partial<AdminPricingRule> & { reason?: string }) => {
  const response = await adminApiClient.post('/admin/pricing/rules', payload);
  return response.data.data as AdminPricingRule;
};

export const updateAdminPricingRule = async (id: string, payload: Partial<AdminPricingRule> & { reason?: string }) => {
  const response = await adminApiClient.put(`/admin/pricing/rules/${id}`, payload);
  return response.data.data as AdminPricingRule;
};

export const toggleAdminPricingRule = async (id: string) => {
  const response = await adminApiClient.patch(`/admin/pricing/rules/${id}/toggle`);
  return response.data;
};

export const deleteAdminPricingRule = async (id: string) => {
  const response = await adminApiClient.delete(`/admin/pricing/rules/${id}`);
  return response.data;
};

export const simulateAdminPricingQuote = async (payload: {
  base_fare: number;
  taxes?: number;
  channel: 'B2C' | 'B2B';
  service_type: string;
  company_id?: string | null;
  custom_rule?: {
    calculation_type: string;
    value: number;
    min_markup_amount?: number;
    max_markup_amount?: number;
  };
}) => {
  const response = await adminApiClient.post('/admin/pricing/simulate', payload);
  return response.data.data as PricingSimulationResult;
};

export const getAdminPricingComparison = async (params: {
  base_fare: number;
  taxes?: number;
  service_type: string;
}) => {
  const response = await adminApiClient.get('/admin/pricing/comparison', { params });
  return response.data.data as PricingComparisonResult;
};

export const getAdminPricingAuditLogs = async (limit = 50) => {
  const response = await adminApiClient.get('/admin/pricing/audit-logs', { params: { limit } });
  return response.data.data as PricingAuditLog[];
};

export const getAdminCompanies = async () => {
  const response = await adminApiClient.get('/admin/companies');
  return response.data.data;
};

export const toggleAdminCompanyStatus = async (companyId: string, isActive: boolean) => {
  const response = await adminApiClient.patch(`/admin/companies/${companyId}/status`, { is_active: isActive });
  return response.data;
};

export const getAdminPartners = async () => {
  const response = await adminApiClient.get('/admin/partners');
  return response.data.data;
};

export const updateAdminPartnerStatus = async (partnerId: string, payload: { status: string; is_verified: boolean; rejection_reason?: string }) => {
  const response = await adminApiClient.patch(`/admin/partners/${partnerId}/status`, payload);
  return response.data;
};

export const getAdminPayments = async (limit = 100) => {
  const response = await adminApiClient.get('/admin/payments', { params: { limit } });
  return response.data.data;
};

// ================= Universal Service Management API =================
export const getAdminServiceItems = async (
  entity: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean | string;
    publication_status?: string;
    region?: string;
    sort?: string;
  }
) => {
  const response = await adminApiClient.get(`/admin/services/${entity}`, { params });
  return response.data.data;
};

export const getAdminServiceItemDetails = async (entity: string, id: string) => {
  const response = await adminApiClient.get(`/admin/services/${entity}/${id}`);
  return response.data.data;
};

export const createAdminServiceItem = async (entity: string, payload: Record<string, any>) => {
  const response = await adminApiClient.post(`/admin/services/${entity}`, payload);
  return response.data.data;
};

export const updateAdminServiceItemRecord = async (
  entity: string,
  id: string,
  payload: Record<string, any>
) => {
  const response = await adminApiClient.put(`/admin/services/${entity}/${id}`, payload);
  return response.data.data;
};

export const patchAdminServiceItemStatus = async (
  entity: string,
  id: string,
  payload: { status?: string; is_active?: boolean }
) => {
  const response = await adminApiClient.patch(`/admin/services/${entity}/${id}/status`, payload);
  return response.data.data;
};

export const deleteAdminServiceItemRecord = async (entity: string, id: string) => {
  const response = await adminApiClient.delete(`/admin/services/${entity}/${id}`);
  return response.data;
};

export const bulkUpdateAdminServiceStatus = async (
  entity: string,
  payload: { status?: string; is_active?: boolean; ids?: string[] }
) => {
  const response = await adminApiClient.post(`/admin/services/${entity}/bulk-status`, payload);
  return response.data;
};

// ================= Universal Import & Export API =================
export const previewAdminImport = async (
  entity: string,
  payload: { rows?: any[]; file_data?: string; file_name?: string }
) => {
  const response = await adminApiClient.post(`/admin/io/${entity}/preview`, payload);
  return response.data.data;
};

export const executeAdminImport = async (
  entity: string,
  payload: { rows: any[]; file_name?: string }
) => {
  const response = await adminApiClient.post(`/admin/io/${entity}/import`, payload);
  return response.data;
};

export const getAdminImportHistory = async () => {
  const response = await adminApiClient.get('/admin/io/history');
  return response.data.data;
};

// ================= Extended Admin Operations =================
export const getAdminDashboardOverview = async (params?: {
  date_range?: string;
  channel?: string;
  service?: string;
}) => {
  const response = await adminApiClient.get('/admin/overview', { params });
  return response.data.data;
};

export const getAdminCustomers = async (params?: { search?: string; status?: string }) => {
  const response = await adminApiClient.get('/admin/customers', { params });
  return response.data.data;
};

export const updateAdminCustomerStatus = async (
  customerId: string,
  payload: { is_active: boolean; reason?: string }
) => {
  const response = await adminApiClient.patch(`/admin/customers/${customerId}/status`, payload);
  return response.data;
};

export const getAdminBookingDetails = async (bookingId: string) => {
  const response = await adminApiClient.get(`/admin/bookings/${bookingId}`);
  return response.data.data;
};


export const getAdminRoles = async () => {
  const response = await adminApiClient.get('/admin/roles');
  return response.data.data;
};

export const updateAdminUserRole = async (userId: string, role: string) => {
  const response = await adminApiClient.patch(`/admin/users/${userId}/role`, { role });
  return response.data;
};




