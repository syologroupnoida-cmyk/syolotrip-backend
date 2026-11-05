export interface RouteUser {
  id?: string;
  email?: string;
  role?: string;
  name?: string;
  fullName?: string;
}

export type HeaderAuthMode = 'CUSTOMER_GUEST' | 'CUSTOMER_AUTH' | 'VENDOR_GUEST' | 'VENDOR_AUTH';

export interface RouteContextInfo {
  isVendorArea: boolean;
  isProtectedVendorArea: boolean;
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
 * Resolves context-aware Header Authentication configuration
 */
export function getHeaderRouteContext(
  pathname: string,
  activeScreen?: string,
  user?: RouteUser | null
): RouteContextInfo {
  const isVendor = isVendorPath(pathname, activeScreen);
  const isProtectedVendor = isProtectedVendorPath(pathname, activeScreen);

  // Authenticated Partner in Vendor Section
  if (isVendor && user && (user.role === 'PARTNER' || user.role === 'ADMIN')) {
    return {
      isVendorArea: true,
      isProtectedVendorArea: isProtectedVendor,
      authMode: 'VENDOR_AUTH',
      loginButtonLabel: 'Partner Extranet',
      loginTargetUrl: '/partner/dashboard',
    };
  }

  // Unauthenticated or Public Vendor Area
  if (isVendor) {
    return {
      isVendorArea: true,
      isProtectedVendorArea: isProtectedVendor,
      authMode: 'VENDOR_GUEST',
      loginButtonLabel: 'Partner Login',
      loginTargetUrl: '/partner/login',
    };
  }

  // Authenticated Customer in Customer Area
  if (user) {
    return {
      isVendorArea: false,
      isProtectedVendorArea: false,
      authMode: 'CUSTOMER_AUTH',
      loginButtonLabel: user.fullName || 'My Account',
      loginTargetUrl: '/dashboard',
    };
  }

  // Unauthenticated Visitor in Customer Area
  return {
    isVendorArea: false,
    isProtectedVendorArea: false,
    authMode: 'CUSTOMER_GUEST',
    loginButtonLabel: 'Login / Sign Up',
    loginTargetUrl: '/login',
  };
}
