// ===== app.js (entry) =====

// DOM roots
globalThis.app = document.getElementById('app');
globalThis.userLabel = document.getElementById('userLabel');

// Global state
globalThis.ALL_CATEGORIES = [];
globalThis.CURRENT_USER = null;
globalThis.FEED_CACHE = [];

// Debug helper
globalThis.debugCurrentUser = function () {
  console.log('=== DEBUG CURRENT USER ===');
  console.log('CURRENT_USER:', globalThis.CURRENT_USER);
  console.log('Session cookie exists:', document.cookie.includes('session='));
  console.log('WebSocket manager exists:', !!globalThis.wsManager);
  console.log('WebSocket connected:', globalThis.wsManager ? globalThis.wsManager.isConnected : 'N/A');
  console.log('initializeWebSocket exists:', !!globalThis.initializeWebSocket);
};

// Header controls
document.getElementById('titleHome')?.addEventListener('click', () => {
  globalThis.navigate('#/feed');
});

document.getElementById('btnLogin')?.addEventListener('click', () => globalThis.navigate('#/login'));
document.getElementById('btnLogout')?.addEventListener('click', async () => {
  try {
    await globalThis.fetchJSON('/api/logout', { method: 'POST' });
  } catch (e) {
    console.log('Logout API call failed:', e);
  }

  // Clear user data
  globalThis.CURRENT_USER = null;

  // Update UI
  const loginBtn = document.getElementById('btnLogin');
  const logoutBtn = document.getElementById('btnLogout');
  const userLabel = document.getElementById('userLabel');

  if (loginBtn) loginBtn.hidden = false;
  if (logoutBtn) logoutBtn.hidden = true;
  if (userLabel) userLabel.textContent = 'Guest';

  // Disconnect WebSocket and hide users panel
  if (globalThis.wsManager && globalThis.wsManager.isConnected) {
    globalThis.wsManager.disconnect();
  }
  if (globalThis.hideUsersPanel) {
    globalThis.hideUsersPanel();
  }

  globalThis.showMessage('Logged out successfully', 'success');
  globalThis.navigate('#/login');
});

// Router hooks
globalThis.addEventListener('hashchange', globalThis.onRouteChange);

// Start route - check authentication first
if (!location.hash) {
  // Check if user is already logged in before defaulting to login
  globalThis.hydrateUser().then(user => {
    if (user) {
      console.log('✅ User already logged in, redirecting to feed');
      location.hash = '#/feed';
    } else {
      console.log('❌ No user found, redirecting to login');
      location.hash = '#/login';
    }
    globalThis.onRouteChange();
  }).catch(() => {
    console.log('❌ Auth check failed, redirecting to login');
    location.hash = '#/login';
    globalThis.onRouteChange();
  });
} else {
  globalThis.onRouteChange();
}
