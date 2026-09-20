// login.js - Flujo dedicado para autenticación

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const loginSubmit = document.getElementById('loginSubmit');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const rememberSession = document.getElementById('rememberSession');

  function requestJson(url, options = {}) {
    return fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    }).then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo completar el inicio de sesión.');
      }
      return payload;
    });
  }

  function setLoading(loading) {
    if (!loginSubmit) return;
    loginSubmit.disabled = loading;
    loginSubmit.classList.toggle('submit-loading', loading);
  }

  function showError(message) {
    if (!loginError) return;
    loginError.hidden = false;
    loginError.textContent = message;
  }

  function clearError() {
    if (!loginError) return;
    loginError.hidden = true;
    loginError.textContent = '';
  }

  togglePassword?.addEventListener('click', () => {
    if (!passwordInput) return;
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePassword.innerHTML = isPassword
      ? '<i class="fa-solid fa-eye-slash"></i>'
      : '<i class="fa-solid fa-eye"></i>';
  });

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const email = document.getElementById('email')?.value.trim();
    const password = passwordInput?.value || '';

    if (!email || !password) {
      showError('Escribe tu correo y contraseña para continuar.');
      return;
    }

    try {
      setLoading(true);
      const response = await requestJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      const storage = rememberSession?.checked ? localStorage : sessionStorage;
      storage.setItem('onder_token', response.token);
      storage.setItem('onder_user', JSON.stringify(response.user));

      window.location.href = 'index.html';
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  });
});