import { showToast } from './toast.js';

// Elements
const pageLoader = document.getElementById('page-loader');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');

// 1. Session Redirect Guard
// If already authenticated, users on login/register should go straight to the dashboard.
async function checkAuthRedirect() {
  try {
    const response = await fetch('/api/auth/me');
    if (response.ok) {
      window.location.replace('dashboard.html');
      return;
    }
  } catch (error) {
    console.error('Session check error:', error);
  } finally {
    // Hide loader once authentication check resolves
    if (pageLoader) {
      pageLoader.style.opacity = '0';
      setTimeout(() => pageLoader.remove(), 400);
    }
  }
}

// 2. Real-time Password Strength Meter
function evaluatePasswordStrength(password) {
  let score = 0;
  if (!password) return { text: 'Empty', score: 0, color: 'transparent' };

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  let text = 'Weak';
  let color = 'var(--color-error)';
  if (score === 2) {
    text = 'Fair';
    color = 'var(--color-warning)';
  } else if (score === 3) {
    text = 'Good';
    color = '#f59e0b';
  } else if (score === 4) {
    text = 'Strong';
    color = 'var(--color-success)';
  }

  return { text, score, color };
}

function updatePasswordStrengthUI() {
  const password = passwordInput.value;
  const { text, score, color } = evaluatePasswordStrength(password);

  const strengthText = document.getElementById('strength-text');
  if (strengthText) strengthText.textContent = text;

  // Clear chunks
  for (let i = 1; i <= 4; i++) {
    const chunk = document.getElementById(`chunk-${i}`);
    if (chunk) {
      if (i <= score) {
        chunk.style.backgroundColor = color;
      } else {
        chunk.style.backgroundColor = 'transparent';
      }
    }
  }
}

// Attach event listener for password field if present (Registration page)
if (passwordInput && document.getElementById('strength-text')) {
  passwordInput.addEventListener('input', updatePasswordStrengthUI);
}

// 3. Login Submit Handler
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submit-btn');

    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    // Set UI loading state
    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Authenticating...';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.replace('dashboard.html');
        }, 1200);
      } else {
        showToast(data.error || 'Login failed. Please verify credentials.', 'error');
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Sign In';
      }
    } catch (err) {
      showToast('Network error. Check connection.', 'error');
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Sign In';
    }
  });
}

// 4. Registration Submit Handler
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const submitBtn = document.getElementById('submit-btn');

    if (!username || !email || !password || !confirmPassword) {
      showToast('Please fill out all fields.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    const { score } = evaluatePasswordStrength(password);
    if (score < 4) {
      showToast('Please create a stronger password (must meet all complexity requirements).', 'error');
      return;
    }

    // Set UI loading state
    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Registering...';

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Registration successful! Redirecting to login...', 'success');
        setTimeout(() => {
          window.location.replace('login.html');
        }, 1500);
      } else {
        showToast(data.error || 'Registration failed.', 'error');
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Create Account';
      }
    } catch (err) {
      showToast('Network error. Check connection.', 'error');
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Create Account';
    }
  });
}

// Run initializer
checkAuthRedirect();
