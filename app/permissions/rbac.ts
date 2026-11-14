// ==============================================================================
// SyoloTrip Centralized Role-Based Access Control (RBAC) Engine
// ==============================================================================

export type Permission =
  // Universal Service & Catalog Permissions
  | 'services:view'
  | 'services:create'
  | 'services:edit'
  | 'services:delete'
  | 'services:import'
  | 'services:export'
  // Booking Permissions
  | 'bookings:view_all'
  | 'bookings:view_own'
  | 'bookings:create'
  | 'bookings:cancel'
  | 'bookings:manage'
  // Vendor & Partner Extranet Permissions
  | 'vendor:register'
  | 'vendor:submit_kyc'
  | 'vendor:review_kyc'
  | 'vendor:approve_kyc'
  | 'vendor:reject_kyc'
  | 'vendor:manage_properties'
  | 'vendor:approve_properties'
  | 'vendor:manage_inventory'
  | 'vendor:view_dashboard'
  // B2B myBiz Corporate & Agency Permissions
  | 'business:view_dashboard'
  | 'business:manage_policies'
  | 'business:manage_employees'
  | 'business:manage_agents'
  | 'business:submit_trip_request'
  | 'business:approve_trip_request'
  | 'business:view_invoices'
  | 'business:manage_payments'
  // Commercials, Pricing & Dual Wallet Permissions
  | 'pricing:view'
  | 'pricing:manage'
  | 'coupons:manage'
  | 'wallet:view_own'
  | 'wallet:manage_all'
  | 'wallet:issue_credit'
  | 'wallet:freeze'
  // System, Roles & Auditing Permissions
  | 'users:view'
  | 'users:manage'
  | 'roles:view'
  | 'roles:assign'
  | 'audit:view'
  | 'settings:manage';

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'services:view', 'services:create', 'services:edit', 'services:delete', 'services:import', 'services:export',
    'bookings:view_all', 'bookings:view_own', 'bookings:create', 'bookings:cancel', 'bookings:manage',
    'vendor:register', 'vendor:submit_kyc', 'vendor:review_kyc', 'vendor:approve_kyc', 'vendor:reject_kyc',
    'vendor:manage_properties', 'vendor:approve_properties', 'vendor:manage_inventory', 'vendor:view_dashboard',
    'business:view_dashboard', 'business:manage_policies', 'business:manage_employees', 'business:manage_agents',
    'business:submit_trip_request', 'business:approve_trip_request', 'business:view_invoices', 'business:manage_payments',
    'pricing:view', 'pricing:manage', 'coupons:manage',
    'wallet:view_own', 'wallet:manage_all', 'wallet:issue_credit', 'wallet:freeze',
    'users:view', 'users:manage', 'roles:view', 'roles:assign', 'audit:view', 'settings:manage',
  ],

  ADMIN: [
    'services:view', 'services:create', 'services:edit', 'services:delete', 'services:import', 'services:export',
    'bookings:view_all', 'bookings:view_own', 'bookings:create', 'bookings:cancel', 'bookings:manage',
    'vendor:review_kyc', 'vendor:approve_kyc', 'vendor:reject_kyc',
    'vendor:manage_properties', 'vendor:approve_properties', 'vendor:manage_inventory', 'vendor:view_dashboard',
    'business:view_dashboard', 'business:manage_policies', 'business:manage_employees',
    'business:approve_trip_request', 'business:view_invoices',
    'pricing:view', 'pricing:manage', 'coupons:manage',
    'wallet:view_own', 'wallet:manage_all', 'wallet:issue_credit', 'wallet:freeze',
    'users:view', 'users:manage', 'roles:view', 'roles:assign', 'audit:view', 'settings:manage',
  ],

  OPERATIONS_ADMIN: [
    'services:view', 'services:edit',
    'bookings:view_all', 'bookings:view_own', 'bookings:cancel', 'bookings:manage',
    'vendor:review_kyc', 'vendor:approve_kyc', 'vendor:reject_kyc',
    'vendor:manage_properties', 'vendor:approve_properties', 'vendor:view_dashboard',
    'business:view_dashboard', 'business:approve_trip_request',
    'wallet:view_own',
    'users:view', 'audit:view',
  ],

  INVENTORY_MANAGER: [
    'services:view', 'services:create', 'services:edit', 'services:delete', 'services:import', 'services:export',
    'vendor:manage_properties', 'vendor:manage_inventory',
    'pricing:view',
  ],

  FINANCE_ADMIN: [
    'bookings:view_all',
    'pricing:view', 'pricing:manage', 'coupons:manage',
    'wallet:view_own', 'wallet:manage_all', 'wallet:issue_credit', 'wallet:freeze',
    'business:view_invoices', 'business:manage_payments',
    'audit:view',
  ],

  SUPPORT_ADMIN: [
    'services:view',
    'bookings:view_all', 'bookings:cancel',
    'users:view',
    'wallet:view_own',
    'audit:view',
  ],

  PARTNER: [
    'vendor:register',
    'vendor:submit_kyc',
    'vendor:manage_properties',
    'vendor:manage_inventory',
    'vendor:view_dashboard',
    'bookings:view_own',
  ],

  BUSINESS_ADMIN: [
    'business:view_dashboard',
    'business:manage_policies',
    'business:manage_employees',
    'business:submit_trip_request',
    'business:approve_trip_request',
    'business:view_invoices',
    'business:manage_payments',
    'bookings:view_own',
    'bookings:create',
  ],

  CORP_ADMIN: [
    'business:view_dashboard',
    'business:manage_policies',
    'business:manage_employees',
    'business:submit_trip_request',
    'business:approve_trip_request',
    'business:view_invoices',
    'business:manage_payments',
    'bookings:view_own',
    'bookings:create',
  ],

  AGENCY_ADMIN: [
    'business:view_dashboard',
    'business:manage_agents',
    'business:submit_trip_request',
    'business:view_invoices',
    'bookings:view_own',
    'bookings:create',
    'wallet:view_own',
  ],

  EMPLOYEE: [
    'business:submit_trip_request',
    'bookings:view_own',
    'bookings:create',
  ],

  CUSTOMER: [
    'services:view',
    'bookings:view_own',
    'bookings:create',
    'bookings:cancel',
    'wallet:view_own',
  ],
};

export function getPermissionsForRole(role: string): Permission[] {
  const normalized = role?.toUpperCase();
  return ROLE_PERMISSIONS[normalized] || ROLE_PERMISSIONS.CUSTOMER;
}

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = getPermissionsForRole(role);
  return perms.includes(permission);
}

