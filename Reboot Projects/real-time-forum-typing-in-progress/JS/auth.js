// ===== auth.js =====
globalThis.hydrateUser = async function () {
    const loginBtn = document.getElementById('btnLogin');
    const logoutBtn = document.getElementById('btnLogout');
    const userLabel = document.getElementById('userLabel');

    try {
        const res = await fetch('/api/me', { credentials: 'same-origin' });
        if (!res.ok) throw new Error('unauth');
        const data = await res.json();
        globalThis.CURRENT_USER = data?.user || null;

        if (loginBtn) loginBtn.hidden = true;
        if (logoutBtn) logoutBtn.hidden = false;
        if (userLabel) userLabel.textContent = globalThis.CURRENT_USER?.nickname || 'User';

        // Initialize WebSocket for private messaging
        if (globalThis.CURRENT_USER && globalThis.initializeWebSocket) {
            console.log('🔌 Initializing WebSocket for user:', globalThis.CURRENT_USER);
            const ok = globalThis.initializeWebSocket();
            console.log(ok ? '✅ WebSocket initialization successful' : '❌ WebSocket initialization failed');
        } else {
            console.log('⚠️ WebSocket not initialized - CURRENT_USER:', !!globalThis.CURRENT_USER, 'initializeWebSocket:', !!globalThis.initializeWebSocket);
        }

        return globalThis.CURRENT_USER;
    } catch {
        globalThis.CURRENT_USER = null;
        if (loginBtn) loginBtn.hidden = false;
        if (logoutBtn) logoutBtn.hidden = true;
        if (userLabel) userLabel.textContent = 'Guest';
        return null;
    }
};
