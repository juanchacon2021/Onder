// sidebar.js - Inyecta el sidebar y maneja su funcionalidad
document.addEventListener('DOMContentLoaded', function() {
  const getAuthHeaders = () => {
    const token = localStorage.getItem('onder_token') || sessionStorage.getItem('onder_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Cargar el sidebar
  fetch('sidebar.html')
    .then(response => response.text())
    .then(html => {
      // Insertar el sidebar al inicio del body
      document.body.insertAdjacentHTML('afterbegin', html);

      // --- Resaltar módulo activo ---
      highlightActiveModule();

      // --- Actualizar contadores ---
      updateBadges();

      // --- Logout ---
      setupLogout();

      // --- Toggle mobile ---
      setupSidebarToggle();
      handleViewportState();

      // --- Notificaciones globales ---
      createNotificationButton();
      setupMobileTopbarBrand();
      repositionMobileHeaderControls();
      loadNotifications();

      // --- Cerrar sidebar en móvil al hacer clic en un enlace ---
      setupMobileBehavior();
    })
    .catch(error => console.warn('Error cargando sidebar:', error));

  // ===== FUNCIONES =====

  function handleViewportState() {
    const toggleButton = document.querySelector('.sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const isMobile = window.innerWidth <= 720;

    if (toggleButton) {
      toggleButton.style.display = isMobile ? 'flex' : 'none';
    }

    if (!isMobile && sidebar) {
      sidebar.classList.remove('is-open');
      document.body.classList.remove('sidebar-open');
    }

    if (isMobile && sidebar && !sidebar.classList.contains('is-open')) {
      toggleSidebar(false);
    }
  }

  function toggleSidebar(forceOpen) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !sidebar.classList.contains('is-open');
    sidebar.classList.toggle('is-open', shouldOpen);
    document.body.classList.toggle('sidebar-open', shouldOpen);
  }

  function setupSidebarToggle() {
    const isMobile = window.innerWidth <= 720;
    if (!isMobile) return;

    let toggleButton = document.querySelector('.sidebar-toggle');
    if (!toggleButton) {
      toggleButton = document.createElement('button');
      toggleButton.type = 'button';
      toggleButton.className = 'sidebar-toggle';
      toggleButton.setAttribute('aria-label', 'Abrir menú');
      toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
      document.body.insertBefore(toggleButton, document.body.firstChild);
    }

    toggleButton.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const isOpen = sidebar && sidebar.classList.contains('is-open');
      toggleSidebar(!isOpen);
      toggleButton.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
    });

    document.body.classList.remove('sidebar-open');
    toggleSidebar(false);
  }

  window.addEventListener('resize', function() {
    handleViewportState();
    setupMobileTopbarBrand();
    const isMobile = window.innerWidth <= 720;
    const toggleButton = document.querySelector('.sidebar-toggle');

    if (isMobile) {
      setupSidebarToggle();
    } else if (toggleButton) {
      toggleButton.style.display = 'none';
    }
  });

  function highlightActiveModule() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const map = {
      'index.html': 'dashboard',
      'clients.html': 'clientes',
      'services.html': 'servicios',
      'inventory.html': 'inventario',
      'payments.html': 'pagos',
      'visits.html': 'visitas',
      'users.html': 'usuarios',
      'reports.html': 'reportes'
    };
    const expectedModule = map[currentPage] || 'dashboard';

    const items = document.querySelectorAll('.nav-item');
    items.forEach(el => {
      el.classList.remove('active');
      if (el.getAttribute('data-module') === expectedModule) {
        el.classList.add('active');
      }
    });
  }

  function updateBadges() {
    // Obtener contador de clientes
    fetch('/api/clients', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        const badge = document.getElementById('clientsBadge');
        if (badge) badge.textContent = data.length || 0;
      })
      .catch(() => {});

    // Obtener contador de servicios
    fetch('/api/services', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        const badge = document.getElementById('servicesBadge');
        if (badge) badge.textContent = data.length || 0;
      })
      .catch(() => {});

    // Verificar inventario bajo
    fetch('/api/inventory?lowStock=true', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        const dot = document.getElementById('inventoryDot');
        if (dot) {
          dot.style.opacity = data.length > 0 ? '1' : '0';
        }
      })
      .catch(() => {});
  }

  function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
          localStorage.removeItem('onder_token');
          localStorage.removeItem('onder_user');
          sessionStorage.removeItem('onder_token');
          sessionStorage.removeItem('onder_user');
          window.location.href = 'login.html';
        }
      });
    }
  }

  function createNotificationButton() {
    const topbar = document.querySelector('.topbar');
    const targetActions = document.querySelector('.topbar .actions');
    let button = document.querySelector('.notification-fab, .topbar-notification');

    if (button && button.closest('.actions')) {
      button.remove();
      button = null;
    }

    if (!button && topbar) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'topbar-notification';
      button.setAttribute('aria-label', 'Notificaciones');
      button.innerHTML = '<i class="fa-regular fa-bell"></i><span class="notification-counter">0</span>';
      topbar.appendChild(button);
    }

    if (!button && targetActions) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'topbar-notification';
      button.setAttribute('aria-label', 'Notificaciones');
      button.innerHTML = '<i class="fa-regular fa-bell"></i><span class="notification-counter">0</span>';
      topbar.appendChild(button);
    }

    if (!button) {
      button = document.querySelector('.notification-fab');
    }

    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'notification-fab';
      button.setAttribute('aria-label', 'Notificaciones');
      button.innerHTML = '<i class="fa-regular fa-bell"></i><span class="notification-counter">0</span>';
      document.body.appendChild(button);
    }

    button.addEventListener('click', () => {
      const panel = document.getElementById('notificationPanel');
      if (panel) {
        const isOpen = panel.classList.contains('is-open');
        panel.classList.toggle('is-open', !isOpen);
        button.classList.toggle('is-active', !isOpen);
      }
    });

    return button;
  }

  const NOTIFICATION_ICONS = {
    stock: 'fa-solid fa-boxes-stacked',
    visit: 'fa-regular fa-calendar-check',
    payment: 'fa-solid fa-money-bill-wave'
  };

  function isPending(item) {
    return item.is_sent === false || item.sent === false;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function renderNotificationPanel(items) {
    let panel = document.getElementById('notificationPanel');
    if (!panel) {
      panel = document.createElement('aside');
      panel.id = 'notificationPanel';
      panel.className = 'notification-panel';
      document.body.appendChild(panel);
    }

    const list = Array.isArray(items) ? items : [];
    const pending = list.filter(isPending);
    const visible = pending.length ? pending.slice(0, 8) : list.slice(0, 8);

    const header = `
      <div class="notification-header">
        <h3>Notificaciones</h3>
        <button type="button" class="notification-close" aria-label="Cerrar notificaciones"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `;

    if (!visible.length) {
      panel.innerHTML = `
        ${header}
        <div class="notification-empty">
          <i class="fa-solid fa-circle-check"></i>
          <p>No tienes notificaciones pendientes.</p>
        </div>
      `;
    } else {
      panel.innerHTML = `
        ${header}
        <div class="notification-list">
          ${visible.map((item) => {
            const pendingItem = isPending(item);
            const icon = NOTIFICATION_ICONS[item.type] || (pendingItem ? 'fa-regular fa-bell' : 'fa-solid fa-check');
            const severity = item.severity ? ` sev-${escapeHtml(item.severity)}` : '';
            const body = item.message
              ? escapeHtml(item.message)
              : (pendingItem ? 'Pendiente' : 'Enviada');

            return `
              <div class="notification-item ${pendingItem ? 'pending' : ''}${severity}">
                <div class="notification-icon"><i class="${icon}"></i></div>
                <div class="notification-copy">
                  <strong>${escapeHtml(item.title || 'Notificación')}</strong>
                  <small>${body}</small>
                  ${item.link ? `<a class="notification-link" href="${escapeHtml(item.link)}">Ver detalle</a>` : ''}
                </div>
                ${pendingItem ? `<button type="button" class="notification-mark-read" data-id="${escapeHtml(item.id)}" aria-label="Marcar como leída"><i class="fa-solid fa-check"></i></button>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    panel.querySelector('.notification-close')?.addEventListener('click', () => {
      panel.classList.remove('is-open');
      document.querySelectorAll('.notification-fab, .topbar-notification').forEach((el) => {
        el.classList.remove('is-active');
      });
    });

    panel.querySelectorAll('.notification-mark-read').forEach((button) => {
      button.addEventListener('click', async (event) => {
        const id = event.currentTarget.dataset.id;
        if (!id) return;
        try {
          const response = await fetch(`/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
          });
          if (response.ok) {
            loadNotifications();
          }
        } catch (_error) {
          console.warn('No se pudo marcar la notificación como leída');
        }
      });
    });
  }

  async function loadNotifications() {
    const button = document.querySelector('.notification-fab, .topbar-notification');
    const counter = button?.querySelector('.notification-counter');

    try {
      const response = await fetch('/api/notifications', { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error('No autorizado');
      }
      const notifications = await response.json();
      const pending = notifications.filter(isPending);
      if (counter) {
        counter.textContent = String(pending.length || 0);
      }
      renderNotificationPanel(notifications);
    } catch (_error) {
      if (counter) {
        counter.textContent = '0';
      }
      renderNotificationPanel([]);
    }
  }

  function repositionMobileHeaderControls() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    const notif = topbar.querySelector('.topbar-notification, .notification-fab');
    if (!notif) return;

    const actions = topbar.querySelector('.actions');
    if (actions && actions.contains(notif)) {
      actions.removeChild(notif);
    }

    const mobileBrand = topbar.querySelector('.mobile-brand');
    if (window.innerWidth <= 720) {
      if (notif.parentElement !== topbar) {
        topbar.insertBefore(notif, mobileBrand ? mobileBrand.nextSibling : topbar.firstChild);
      }
    }
  }

  function setupMobileTopbarBrand() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    let brand = topbar.querySelector('.mobile-brand');
    if (!brand) {
      brand = document.createElement('div');
      brand.className = 'mobile-brand';
      brand.innerHTML = '<img src="Logo 1.png" alt="Onder"><span>Onder</span>';
      topbar.insertBefore(brand, topbar.firstChild);
    }

    const isMobile = window.innerWidth <= 720;
    const titleWrap = topbar.querySelector(':scope > div:not(.mobile-brand)');

    topbar.classList.toggle('mobile-topbar', isMobile);
    brand.style.display = isMobile ? 'flex' : 'none';

    if (titleWrap) {
      titleWrap.style.display = isMobile ? 'none' : '';
    }

    repositionMobileHeaderControls();
  }

  function setupMobileBehavior() {
    const navItems = document.querySelectorAll('.nav-item');
    const isMobile = window.innerWidth <= 720;

    if (isMobile) {
      navItems.forEach(item => {
        item.addEventListener('click', function() {
          setTimeout(() => {
            toggleSidebar(false);
          }, 100);
        });
      });
    }
  }

  // Actualizar badges y notificaciones cada 30 segundos
  setInterval(() => {
    updateBadges();
    loadNotifications();
  }, 30000);
});