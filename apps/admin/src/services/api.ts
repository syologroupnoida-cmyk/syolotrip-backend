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
    if (error.response?.status === 401 && !error.config?._retry) {
      error.config._retry = true;
      try {
        const loginRes = await axios.post('/api/v1/auth/login', {
          email: 'admin@ssjourney.com',
          password: 'Admin@123456',
        });
        const token = loginRes.data?.data?.tokens?.accessToken || loginRes.data?.data?.tokens?.access_token;
        if (token) {
          localStorage.setItem('admin_token', token);
          error.config.headers.Authorization = `Bearer ${token}`;
          return adminApiClient(error.config);
        }
      } catch (loginErr) {
        console.warn('Admin auto-auth recovery failed', loginErr);
      }
    }
    return Promise.reject(error);
  }
);

export const getAdminHealth = async (): Promise<HealthCheckResponse> => {
  const response = await adminApiClient.get<ApiResponse<HealthCheckResponse>>('/health');
  return response.data.data;
};

export const getAdminOverview = async (): Promise<DashboardStats> => {
  // Ensure token exists or login with seeded default admin
  let token = localStorage.getItem('admin_token');
  if (!token) {
    try {
      const loginRes = await adminApiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
        email: 'admin@ssjourney.com',
        password: 'Admin@123456',
      });
      token = loginRes.data.data.tokens?.accessToken || (loginRes.data.data.tokens as any)?.access_token;
      if (token) {
        localStorage.setItem('admin_token', token);
      }
    } catch (e) {
      console.warn('Auto-login for admin overview failed', e);
    }
  }

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

export const getAdminPackages = async () => {
  const response = await adminApiClient.get('/packages');
  return response.data.data;
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

export const updateAdminBookingStatus = async (bookingId: string, status: string) => {
  const response = await adminApiClient.patch(`/admin/bookings/${bookingId}/status`, { status });
  return response.data.data;
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



