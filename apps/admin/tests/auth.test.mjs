import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminRoot = path.resolve(__dirname, '..');

test('SEC-02: Absence of hardcoded credentials in admin api.ts source code', () => {
  const apiTsPath = path.join(adminRoot, 'src', 'services', 'api.ts');
  const content = fs.readFileSync(apiTsPath, 'utf-8');

  // Must not contain hardcoded demo passwords
  assert.equal(content.includes('Admin@123'), false, 'api.ts must not contain Admin@123');
  assert.equal(content.includes('Admin@123456'), false, 'api.ts must not contain Admin@123456');
  assert.equal(content.includes('Customer@123'), false, 'api.ts must not contain Customer@123');
  assert.equal(content.includes('Customer@123456'), false, 'api.ts must not contain Customer@123456');

  // Must not have auto-login in interceptor
  assert.equal(content.includes('Admin auto-auth recovery failed'), false, 'Auto-auth recovery must be removed');
  assert.equal(content.includes('_retry = true'), false, 'Automatic retry loop must be removed from 401 interceptor');
});

test('SEC-02: Response interceptor handles 401 by clearing session and emitting unauthorized event', () => {
  const apiTsPath = path.join(adminRoot, 'src', 'services', 'api.ts');
  const content = fs.readFileSync(apiTsPath, 'utf-8');

  assert.ok(content.includes("localStorage.removeItem('admin_token')"), 'Must remove admin_token on 401');
  assert.ok(content.includes("localStorage.removeItem('admin_user')"), 'Must remove admin_user on 401');
  assert.ok(content.includes("new CustomEvent('admin:unauthorized')"), 'Must dispatch admin:unauthorized on 401');
});

test('SEC-02: Interactive loginAdmin function exists and stores token upon user submission', () => {
  const apiTsPath = path.join(adminRoot, 'src', 'services', 'api.ts');
  const content = fs.readFileSync(apiTsPath, 'utf-8');

  assert.ok(content.includes('export const loginAdmin = async'), 'loginAdmin export must exist');
  assert.ok(content.includes("localStorage.setItem('admin_token', token)"), 'Must save token in storage on login');
});

test('SEC-02: Interactive logoutAdmin function clears session completely', () => {
  const apiTsPath = path.join(adminRoot, 'src', 'services', 'api.ts');
  const content = fs.readFileSync(apiTsPath, 'utf-8');

  assert.ok(content.includes('export const logoutAdmin = (): void'), 'logoutAdmin export must exist');
  assert.ok(content.includes("new CustomEvent('admin:logout')"), 'Must dispatch admin:logout');
});

test('SEC-02: AdminLoginPage renders interactive form with zero hardcoded default credentials', () => {
  const loginPagePath = path.join(adminRoot, 'src', 'pages', 'AdminLoginPage.tsx');
  const content = fs.readFileSync(loginPagePath, 'utf-8');

  // Verify form inputs
  assert.ok(content.includes('type="email"'), 'Must render email input');
  assert.ok(content.includes('type={showPassword ? \'text\' : \'password\'}'), 'Must render password input with visibility toggle');
  assert.ok(content.includes('handleSubmit'), 'Must handle submission');
  assert.ok(content.includes('login(trimmedEmail, password)'), 'Must authenticate via interactive input');

  // No hardcoded credential defaults
  assert.ok(content.includes("const [email, setEmail] = useState('');"), 'Email must initialize empty');
  assert.ok(content.includes("const [password, setPassword] = useState('');"), 'Password must initialize empty');
});

test('SEC-02: App.tsx enforces unauthenticated redirect to AdminLoginPage', () => {
  const appPath = path.join(adminRoot, 'src', 'App.tsx');
  const content = fs.readFileSync(appPath, 'utf-8');

  assert.ok(content.includes('useAdminAuth'), 'Must use useAdminAuth hook');
  assert.ok(content.includes('if (!isAuthenticated)'), 'Must check isAuthenticated');
  assert.ok(content.includes('<AdminLoginPage />'), 'Must render AdminLoginPage when unauthenticated');
});

test('SEC-02: Production JavaScript bundles contain zero embedded administrator credentials', () => {
  const distAssetsDir = path.join(adminRoot, 'dist', 'assets');
  if (fs.existsSync(distAssetsDir)) {
    const files = fs.readdirSync(distAssetsDir).filter(f => f.endsWith('.js'));
    assert.ok(files.length > 0, 'Production bundle JS file must exist');

    for (const file of files) {
      const code = fs.readFileSync(path.join(distAssetsDir, file), 'utf-8');
      assert.equal(code.includes('Admin@123'), false, `${file} must not contain Admin@123`);
      assert.equal(code.includes('Admin@123456'), false, `${file} must not contain Admin@123456`);
      assert.equal(code.includes('Customer@123'), false, `${file} must not contain Customer@123`);
      assert.equal(code.includes('Customer@123456'), false, `${file} must not contain Customer@123456`);
    }
  }
});
