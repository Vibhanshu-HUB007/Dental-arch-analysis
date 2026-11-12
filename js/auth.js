/**
 * auth.js — Client-side authentication using SHA-256 + sessionStorage
 *
 * Usage on protected pages (paste at top of <body> script):
 *   checkAuth();
 *
 * Usage on login page:
 *   initLoginPage();
 */

/**
 * Hash a string using SHA-256 via the Web Crypto API.
 * Returns a hex string.
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if the user is authenticated.
 * If not, redirect to login.html immediately.
 * Call this at the start of every protected page.
 */
function checkAuth() {
  const token = sessionStorage.getItem(SITE_CONFIG.SESSION_KEY);
  if (token !== SITE_CONFIG.SESSION_TOKEN) {
    // Redirect to login, preserving current page as redirect target
    const current = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace('login.html?redirect=' + current);
  }
}

/**
 * Log out: clear session and redirect to login.
 */
function logout() {
  sessionStorage.removeItem(SITE_CONFIG.SESSION_KEY);
  window.location.replace('login.html');
}

/**
 * Initialize the login page form handler.
 * Call this only on login.html.
 */
function initLoginPage() {
  // If already authenticated, skip login
  const token = sessionStorage.getItem(SITE_CONFIG.SESSION_KEY);
  if (token === SITE_CONFIG.SESSION_TOKEN) {
    window.location.replace('index.html');
    return;
  }

  const form = document.getElementById('login-form');
  const passwordInput = document.getElementById('password-input');
  const errorMsg = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-btn');

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errorMsg.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying…';

    const entered = passwordInput.value;
    if (!entered) {
      showError('Please enter a password.');
      return;
    }

    try {
      const hash = await hashPassword(entered);
      if (hash === SITE_CONFIG.PASSWORD_HASH) {
        sessionStorage.setItem(SITE_CONFIG.SESSION_KEY, SITE_CONFIG.SESSION_TOKEN);
        // Redirect to intended page or index
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        window.location.replace(redirect && redirect !== '/' ? decodeURIComponent(redirect) : 'index.html');
      } else {
        showError('Incorrect password. Please try again.');
      }
    } catch (err) {
      showError('An error occurred. Please try again.');
      console.error('Auth error:', err);
    }
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
    passwordInput.value = '';
    passwordInput.focus();
  }
}
