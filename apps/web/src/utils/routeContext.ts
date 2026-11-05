export interface RouteUser {
  id?: string;
  email?: string;
  role?: string;
  name?: string;
  fullName?: string;
}

export type HeaderAuthMode = 
  | 'CUSTOMER_GUEST' 
  | 'CUSTOMER_AUTH' 
  | 'VENDOR_GUEST' 
  | 'VENDOR_AUTH' 
  | 'BUSINESS_GUEST' 
  | 'BUSINESS_AUTH';

export interface RouteContextInfo {
  isVendorArea: boolean;
  isProtectedVendorArea: boolean;
  isBusinessArea: boolean;
  isProtectedBusinessArea: boolean;
  authMode: HeaderAuthMode;
  loginButtonLabel: string;
  loginTargetUrl: string;
}

/**
 * Normalizes pathname to ensure consistent matching
 */
export function normalizePath(pathname?: string): string {
  if (!pathname) return '/';
  const clean = pathname.trim().toLowerCase().split('?')[0].split('#')[0];
  if (clean.length > 1 && clean.endsWith('/')) {
    return clean.slice(0, -1);
  }
  return clean || '/';
}

/**
 * Checks whether the current path or screen belongs to the Vendor section
 */
export function isVendorPath(pathname: string, activeScreen?: string): boolean {
  const norm = normalizePath(pathname);
  if (
    norm === '/list-your-property' ||
    norm === '/list-property' ||
    norm.startsWith('/partner')
  ) {
    return true;
  }
  if (
    activeScreen === 'list-property' ||
    activeScreen === 'vendor-register' ||
    activeScreen === 'vendor-kyc' ||
    activeScreen === 'vendor-dashboard'
  ) {
    return true;
  }
  return false;
}

/**
 * Checks whether the current path is a protected vendor route
 */
export function isProtectedVendorPath(pathname: string, activeScreen?: string): boolean {
  const norm = normalizePath(pathname);
  if (
    norm.startsWith('/partner/dashboard') ||
    norm.startsWith('/partner/kyc') ||
    norm.startsWith('/partner/properties') ||
    norm.startsWith('/partner/profile')
  ) {
    return true;
  }
  if (activeScreen === 'vendor-dashboard' || activeScreen === 'vendor-kyc') {
    return true;
  }
  return false;
}

/**
 * Checks whether the current path belongs to the myBiz B2B Business section
 */
export function isBusinessPath(pathname: string, activeScreen?: string): boolean {
  const norm = normalizePath(pathname);
  if (norm === '/business' || norm.startsWith('/business/') || norm === '/mybiz' || norm === '/mybiz-dashboard') {
    return true;
  }
  if (
    activeScreen === 'mybiz' ||
    activeScreen === 'mybiz-dashboard' ||
    activeScreen === 'business' ||
    activeScreen === 'business-register' ||
    activeScreen === 'business-login' ||
    activeScreen === 'business-dashboard'
  ) {
    return true;
  }
  return false;
}

/**
 * Checks whether the current path is a protected myBiz business route
 */
export function isProtectedBusinessPath(pathname: string, activeScreen?: string): boolean {
  const norm = normalizePath(pathname);
  if (
    norm.startsWith('/business/dashboard') ||
    norm.startsWith('/business/bookings') ||
    norm.startsWith('/business/employees') ||
    norm.startsWith('/business/agents') ||
    norm.startsWith('/business/approvals') ||
    norm.startsWith('/business/travel-policies') ||
    norm.startsWith('/business/invoices') ||
    norm.startsWith('/business/payments') ||
    norm.startsWith('/business/reports') ||
    norm.startsWith('/business/company-profile') ||
    norm.startsWith('/business/settings') ||
    norm === '/mybiz-dashboard'
  ) {
    return true;
  }
  if (activeScreen === 'mybiz-dashboard' || activeScreen === 'business-dashboard') {
    return true;
  }
  return false;
}

/**
 * Resolves context-aware Header Authentication configuration
 */
export function getHeaderRouteContext(
  pathname: string,
  activeScreen?: string,
  user?: RouteUser | null,
  isBizUser?: boolean
): RouteContextInfo {
  const isVendor = isVendorPath(pathname, activeScreen);
  const isProtectedVendor = isProtectedVendorPath(pathname, activeScreen);
  const isBusiness = isBusinessPath(pathname, activeScreen);
  const isProtectedBusiness = isProtectedBusinessPath(pathname, activeScreen);

  // 1. Authenticated Partner in Vendor Section
  if (isVendor && user && (user.role === 'PARTNER' || user.role === 'ADMIN')) {
    return {
      isVendorArea: true,
      isProtectedVendorArea: isProtectedVendor,
      isBusinessArea: false,
      isProtectedBusinessArea: false,
      authMode: 'VENDOR_AUTH',
      loginButtonLabel: 'Partner Extranet',
      loginTargetUrl: '/partner/dashboard',
    };
  }

  // 2. Unauthenticated or Visitor in Vendor Section
  if (isVendor) {
    return {
      isVendorArea: true,
      isProtectedVendorArea: isProtectedVendor,
      isBusinessArea: false,
      isProtectedBusinessArea: false,
      authMode: 'VENDOR_GUEST',
      loginButtonLabel: 'Partner Login',
      loginTargetUrl: '/partner/login',
    };
  }

  // 3. Authenticated Business Member in Business Section
  const hasBusinessRole =
    user &&
    (user.role === 'BUSINESS_ADMIN' ||
      user.role === 'BUSINESS_OWNER' ||
      user.role === 'AGENCY_ADMIN' ||
      user.role === 'AGENCY_AGENT' ||
      user.role === 'ADMIN' ||
      isBizUser);

  if (isBusiness && hasBusinessRole) {
    return {
      isVendorArea: false,
      isProtectedVendorArea: false,
      isBusinessArea: true,
      isProtectedBusinessArea: isProtectedBusiness,
      authMode: 'BUSINESS_AUTH',
      loginButtonLabel: 'myBiz Portal',
      loginTargetUrl: '/business/dashboard',
    };
  }

  // 4. Public or Unauthenticated Visitor in Business Section
  if (isBusiness) {
    return {
      isVendorArea: false,
      isProtectedVendorArea: false,
      isBusinessArea: true,
      isProtectedBusinessArea: isProtectedBusiness,
      authMode: 'BUSINESS_GUEST',
      loginButtonLabel: 'Business Login',
      loginTargetUrl: '/business/login',
    };
  }

  // 5. Authenticated Customer in Customer Area
  if (user) {
    return {
      isVendorArea: false,
      isProtectedVendorArea: false,
      isBusinessArea: false,
      isProtectedBusinessArea: false,
      authMode: 'CUSTOMER_AUTH',
      loginButtonLabel: user.fullName || 'My Account',
      loginTargetUrl: '/dashboard',
    };
  }

  // 6. Unauthenticated Visitor in Customer Area
  return {
    isVendorArea: false,
    isProtectedVendorArea: false,
    isBusinessArea: false,
    isProtectedBusinessArea: false,
    authMode: 'CUSTOMER_GUEST',
    loginButtonLabel: 'Login / Sign Up',
    loginTargetUrl: '/login',
  };
}
