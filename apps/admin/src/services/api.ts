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

export const getAdminHealth = async (): Promise<HealthCheckResponse> => {
  const response = await adminApiClient.get<ApiResponse<HealthCheckResponse>>('/health');
  return response.data.data;
};

export const getAdminOverview = async (): Promise<DashboardStats> => {
  // Try with existing token or login with seeded default admin
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

export const createAdminFlight = async (payload: any) => {
  const response = await adminApiClient.post('/admin/flights', payload);
  return response.data.data;
};


