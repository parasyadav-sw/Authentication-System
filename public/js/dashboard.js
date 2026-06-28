import { showToast } from './toast.js';

// Elements
const pageLoader = document.getElementById('page-loader');
const logoutBtn = document.getElementById('logout-btn');

// User profile elements
const avatarCircle = document.getElementById('avatar-circle');
const userDisplayName = document.getElementById('user-display-name');
const detailId = document.getElementById('detail-id');
const detailUsername = document.getElementById('detail-username');
const detailEmail = document.getElementById('detail-email');
const detailBrowser = document.getElementById('detail-browser');

// 1. Session verification & Profile data loading
async function verifyDashboardSession() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      throw new Error('Unauthorized');
    }

    const { user } = await response.json();
    populateUserData(user);
  } catch (error) {
    showToast('Unauthorized access. Redirecting to login...', 'error');
    setTimeout(() => {
      window.location.replace('login.html');
    }, 1200);
  }
}

// 2. Populate user profile in UI
function populateUserData(user) {
  if (avatarCircle) {
    avatarCircle.textContent = user.username.charAt(0).toUpperCase();
  }
  if (userDisplayName) {
    userDisplayName.textContent = user.username;
  }
  if (detailId) {
    detailId.textContent = user.id;
  }
  if (detailUsername) {
    detailUsername.textContent = user.username;
  }
  if (detailEmail) {
    detailEmail.textContent = user.email;
  }

  // Get simple browser name from agent string
  if (detailBrowser) {
    const ua = navigator.userAgent;
    let browserName = 'Unknown Browser';
    if (ua.includes('Firefox')) browserName = 'Mozilla Firefox';
    else if (ua.includes('SamsungBrowser')) browserName = 'Samsung Browser';
    else if (ua.includes('Opera') || ua.includes('OPR')) browserName = 'Opera';
    else if (ua.includes('Trident')) browserName = 'Internet Explorer';
    else if (ua.includes('Edge') || ua.includes('Edg')) browserName = 'Microsoft Edge';
    else if (ua.includes('Chrome')) browserName = 'Google Chrome';
    else if (ua.includes('Safari')) browserName = 'Apple Safari';
    detailBrowser.textContent = browserName;
  }

  // Hide loader with a smooth transition
  if (pageLoader) {
    pageLoader.style.opacity = '0';
    setTimeout(() => pageLoader.remove(), 400);
  }
}

// 3. Logout action
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    // Disable logout button to prevent multiple triggers
    logoutBtn.disabled = true;

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        showToast('Logged out successfully. Redirecting...', 'success');
        setTimeout(() => {
          window.location.replace('login.html');
        }, 1000);
      } else {
        showToast('Logout failed. Please try again.', 'error');
        logoutBtn.disabled = false;
      }
    } catch (err) {
      showToast('Network error during logout.', 'error');
      logoutBtn.disabled = false;
    }
  });
}

// Initialize
verifyDashboardSession();
