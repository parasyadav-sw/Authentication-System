import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DB = path.join(__dirname, 'test_database.db');
const TEST_PORT = 3001;
const BASE_URL = `http://localhost:${TEST_PORT}/api/auth`;

// Configure environment before importing server code
process.env.NODE_ENV = 'test';
process.env.PORT = TEST_PORT.toString();
process.env.DB_PATH = TEST_DB;
process.env.JWT_SECRET = 'test_jwt_secret_spec_key_only_for_running_tests';

// Clean test database if it exists
if (fs.existsSync(TEST_DB)) {
  fs.unlinkSync(TEST_DB);
}

// Start Express Server
console.log('Starting Test Server...');
await import('./server.js');

let savedCookie = '';

async function runTests() {
  console.log('\n===================================================');
  console.log('               STARTING AUTHENTICATION TESTS        ');
  console.log('===================================================\n');

  let failedTests = 0;
  let passedTests = 0;

  async function assertResponse(testName, url, options, expectedStatus, assertBodyCallback) {
    try {
      const response = await fetch(url, options);
      if (response.status !== expectedStatus) {
        console.error(`❌ FAIL: "${testName}" - Expected status ${expectedStatus}, got ${response.status}`);
        failedTests++;
        return null;
      }
      
      const body = await response.json();
      if (assertBodyCallback) {
        const error = assertBodyCallback(body, response);
        if (error) {
          console.error(`❌ FAIL: "${testName}" - Assertion failed: ${error}`);
          failedTests++;
          return null;
        }
      }
      
      console.log(`✅ PASS: "${testName}"`);
      passedTests++;
      return { response, body };
    } catch (err) {
      console.error(`❌ FAIL: "${testName}" - Fetch threw error:`, err.message);
      failedTests++;
      return null;
    }
  }

  // TEST 1: Register User with Valid Credentials
  await assertResponse(
    'Register user with valid credentials',
    `${BASE_URL}/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'Password123!'
      })
    },
    210 - 9 // 201 Created
  );

  // TEST 2: Register User with Weak Password
  await assertResponse(
    'Reject registration with weak password (missing digit/symbol/uppercase)',
    `${BASE_URL}/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'weakuser',
        email: 'weakuser@example.com',
        password: 'password'
      })
    },
    400,
    (body) => {
      if (!body.error || !body.error.includes('Password must be at least 8 characters')) {
        return `Expected password strength error message, got: ${JSON.stringify(body)}`;
      }
    }
  );

  // TEST 3: Register User with Invalid Email Format
  await assertResponse(
    'Reject registration with invalid email format',
    `${BASE_URL}/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'bademail',
        email: 'bademail-at-domain.com',
        password: 'Password123!'
      })
    },
    400,
    (body) => {
      if (!body.error || !body.error.includes('valid email')) {
        return `Expected email format error message, got: ${JSON.stringify(body)}`;
      }
    }
  );

  // TEST 4: Register User with Duplicate Email
  await assertResponse(
    'Reject registration with duplicate email address',
    `${BASE_URL}/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'anotherusername',
        email: 'testuser@example.com', // same email as Test 1
        password: 'Password123!'
      })
    },
    409,
    (body) => {
      if (!body.error || !body.error.includes('Email is already registered')) {
        return `Expected duplicate email error message, got: ${JSON.stringify(body)}`;
      }
    }
  );

  // TEST 5: Login with Non-existent Email
  await assertResponse(
    'Reject login with non-existent email address',
    `${BASE_URL}/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'Password123!'
      })
    },
    401,
    (body) => {
      if (body.error !== 'Invalid email or password.') {
        return `Expected generic login error, got: ${JSON.stringify(body)}`;
      }
    }
  );

  // TEST 6: Login with Incorrect Password
  await assertResponse(
    'Reject login with incorrect password',
    `${BASE_URL}/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'WrongPassword123!'
      })
    },
    401,
    (body) => {
      if (body.error !== 'Invalid email or password.') {
        return `Expected generic login error, got: ${JSON.stringify(body)}`;
      }
    }
  );

  // TEST 7: Login with Correct Credentials (should return JWT cookie)
  const loginRes = await assertResponse(
    'Login successfully with valid credentials',
    `${BASE_URL}/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'Password123!'
      })
    },
    200,
    (body, res) => {
      const cookieHeader = res.headers.get('set-cookie');
      if (!cookieHeader || !cookieHeader.includes('auth_token=')) {
        return 'auth_token cookie was not set in response headers';
      }
      if (!cookieHeader.includes('HttpOnly')) {
        return 'auth_token cookie is missing HttpOnly flag';
      }
      if (!cookieHeader.includes('SameSite=Strict')) {
        return 'auth_token cookie is missing SameSite=Strict flag';
      }
      savedCookie = cookieHeader.split(';')[0]; // Extract "auth_token=..."
    }
  );

  // TEST 8: Access Protected Route Without Token
  await assertResponse(
    'Deny access to protected "/me" route without token',
    `${BASE_URL}/me`,
    { method: 'GET' },
    401,
    (body) => {
      if (body.error !== 'Access denied. Please log in.') {
        return `Expected Access Denied error message, got: ${JSON.stringify(body)}`;
      }
    }
  );

  // TEST 9: Access Protected Route With Token
  await assertResponse(
    'Allow access to protected "/me" route with valid JWT cookie',
    `${BASE_URL}/me`,
    {
      method: 'GET',
      headers: { 'Cookie': savedCookie }
    },
    200,
    (body) => {
      if (!body.user || body.user.username !== 'testuser' || body.user.email !== 'testuser@example.com') {
        return `Expected user payload matching "testuser", got: ${JSON.stringify(body)}`;
      }
    }
  );

  // TEST 10: Logout Invalidate Session
  let clearedCookie = '';
  await assertResponse(
    'Logout and verify token cookie is cleared',
    `${BASE_URL}/logout`,
    {
      method: 'POST',
      headers: { 'Cookie': savedCookie }
    },
    200,
    (body, res) => {
      const cookieHeader = res.headers.get('set-cookie');
      if (!cookieHeader || !cookieHeader.includes('auth_token=;')) {
        return 'auth_token cookie was not cleared on logout';
      }
      clearedCookie = cookieHeader.split(';')[0];
    }
  );

  // TEST 11: Access Protected Route After Logout (using cleared cookie)
  await assertResponse(
    'Deny access to protected "/me" route after session logout',
    `${BASE_URL}/me`,
    {
      method: 'GET',
      headers: { 'Cookie': clearedCookie }
    },
    401
  );

  console.log('\n===================================================');
  console.log('                  TEST SUMMARY                     ');
  console.log(`  Passed: ${passedTests} / 11`);
  console.log(`  Failed: ${failedTests}`);
  console.log('===================================================\n');

  // Clean up database
  try {
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
      console.log('Cleaned up test database file.');
    }
  } catch (err) {
    console.error('Error deleting test database:', err.message);
  }

  // Gracefully exit test process
  process.exit(failedTests > 0 ? 1 : 0);
}

// Allow server setup to complete before calling endpoints
setTimeout(runTests, 1000);
