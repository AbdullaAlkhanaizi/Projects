// ===== util.js =====
globalThis.fetchJSON = async function (path, opts = {}) {
  const hasBody = opts.body && typeof opts.body === 'string';
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      'Accept': 'application/json',
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers || {})
    },
    method: opts.method || 'GET',
    body: opts.body || null
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const msg = text || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : null;
};

globalThis.escapeHTML = function (s = '') {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
};

globalThis.attachLimiter = function (el, max = 256, counterEl) {
  if (!el) return;
  el.setAttribute('maxlength', String(max));
  const update = () => {
    const used = el.value.length;
    if (counterEl) counterEl.textContent = `${used}/${max}`;
    if (used > max) el.value = el.value.slice(0, max);
  };
  el.addEventListener('input', update);
  update();
};

globalThis.showMessage = function (msg, type = 'info') {
  // Create notification container if it doesn't exist
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '10000';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    container.style.maxWidth = '350px';
    document.body.appendChild(container);
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = msg;

  // Enhanced styling based on type
  const styles = {
    info: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: 'ℹ️' },
    error: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '❌' },
    success: { background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '✅' },
    warning: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '⚠️' }
  };

  const style = styles[type] || styles.info;

  notification.style.cssText = `
    background: ${style.background};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    transform: translateX(100%);
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  `;

  // Add icon
  notification.innerHTML = `<span style="margin-right: 8px;">${style.icon}</span>${msg}`;

  // Add to container
  container.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);

  // Auto remove
  const duration = type === 'error' ? 4000 : 3000;
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, duration);

  // Click to dismiss
  notification.addEventListener('click', () => {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  });
};

// Router helper used across files
globalThis.navigate = function (hash) {
  if (location.hash === hash) globalThis.onRouteChange();
  else location.hash = hash;
};

// Global error handler for HTTP errors that should show error pages
globalThis.handleHttpError = function (error, context = '') {
  console.error(`HTTP Error ${error.status} in ${context}:`, error.message);

  // Only show error pages for certain errors and contexts
  const showErrorPageFor = [401, 403, 404, 429, 500, 503];
  const contextsThatShowErrorPages = ['navigation', 'page-load', 'critical'];

  if (showErrorPageFor.includes(error.status) && contextsThatShowErrorPages.includes(context)) {
    globalThis.renderErrorPage(error.status);
    return true; // Indicates error page was shown
  }

  return false; // Indicates error should be handled normally
};

// Test function for error pages (for development/testing)
globalThis.testErrorPage = function (errorCode) {
  globalThis.renderErrorPage(errorCode);
};
