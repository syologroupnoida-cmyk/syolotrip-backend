import test from 'node:test';
import assert from 'node:assert/strict';

// Import route context functions
import { 
  normalizePath, 
  isVendorPath, 
  isProtectedVendorPath, 
  getHeaderRouteContext 
} from '../src/utils/routeContext.ts';

test('1. Normalizes path with uppercase, query params, trailing slashes', () => {
  assert.equal(normalizePath('/Hotels/'), '/hotels');
  assert.equal(normalizePath('/LIST-YOUR-PROPERTY?ref=banner'), '/list-your-property');
  assert.equal(normalizePath('/partner/login#section'), '/partner/login');
  assert.equal(normalizePath(''), '/');
});

test('2. Customer guest routes identify as Customer Guest with "Login / Sign Up"', () => {
  const customerRoutes = ['/', '/flights', '/hotels', '/trains', '/buses', '/cabs', '/packages'];
  
  for (const path of customerRoutes) {
    const ctx = getHeaderRouteContext(path, undefined, null);
    assert.equal(ctx.isVendorArea, false, `Expected ${path} to NOT be vendor area`);
    assert.equal(ctx.authMode, 'CUSTOMER_GUEST');
    assert.equal(ctx.loginButtonLabel, 'Login / Sign Up');
    assert.equal(ctx.loginTargetUrl, '/login');
  }
});

test('3. Vendor onboarding routes identify as Vendor Guest with "Partner Login"', () => {
  const vendorGuestRoutes = [
    '/list-your-property', 
    '/list-your-property/', 
    '/list-property', 
    '/partner/register', 
    '/partner/login'
  ];

  for (const path of vendorGuestRoutes) {
    const ctx = getHeaderRouteContext(path, undefined, null);
    assert.equal(ctx.isVendorArea, true, `Expected ${path} to be vendor area`);
    assert.equal(ctx.authMode, 'VENDOR_GUEST');
    assert.equal(ctx.loginButtonLabel, 'Partner Login');
    assert.equal(ctx.loginTargetUrl, '/partner/login');
  }
});

test('4. Protected vendor routes with Partner credentials render VENDOR_AUTH', () => {
  const partnerUser = {
    id: 'vendor-123',
    email: 'hotelier@retreats.com',
    role: 'PARTNER',
    name: 'Retreats Partner'
  };

  const protectedRoutes = [
    '/partner/dashboard',
    '/partner/kyc',
    '/partner/properties',
    '/partner/profile'
  ];

  for (const path of protectedRoutes) {
    const ctx = getHeaderRouteContext(path, undefined, partnerUser);
    assert.equal(ctx.isVendorArea, true);
    assert.equal(ctx.isProtectedVendorArea, true);
    assert.equal(ctx.authMode, 'VENDOR_AUTH');
    assert.equal(ctx.loginButtonLabel, 'Partner Extranet');
    assert.equal(ctx.loginTargetUrl, '/partner/dashboard');
  }
});

test('5. Customer user cannot access Vendor Auth in vendor routes', () => {
  const customerUser = {
    id: 'cust-456',
    email: 'traveler@ssjourney.com',
    role: 'CUSTOMER',
    name: 'Traveler'
  };

  // If a customer navigates to /partner/dashboard, they must NOT get VENDOR_AUTH
  const ctx = getHeaderRouteContext('/partner/dashboard', undefined, customerUser);
  assert.equal(ctx.authMode, 'VENDOR_GUEST');
  assert.equal(ctx.loginButtonLabel, 'Partner Login');
});

test('6. Authenticated customer on customer routes gets CUSTOMER_AUTH', () => {
  const customerUser = {
    id: 'cust-456',
    email: 'traveler@ssjourney.com',
    role: 'CUSTOMER',
    name: 'Traveler'
  };

  const ctx = getHeaderRouteContext('/hotels', 'hotels', customerUser);
  assert.equal(ctx.isVendorArea, false);
  assert.equal(ctx.authMode, 'CUSTOMER_AUTH');
  assert.equal(ctx.loginButtonLabel, 'My Account');
  assert.equal(ctx.loginTargetUrl, '/dashboard');
});

