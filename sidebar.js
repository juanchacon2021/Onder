// sidebar.js - Inyecta el sidebar y maneja su funcionalidad
document.addEventListener('DOMContentLoaded', function() {
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

      // --- Cerrar sidebar en móvil al hacer clic en un enlace ---
      setupMobileBehavior();
    })
    .catch(error => console.warn('Error cargando sidebar:', error));

  // ===== FUNCIONES =====

  function highlightActiveModule() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const map = {
      'index.html': 'dashboard',
      'clients.html': 'clientes',
      'services.html': 'servicios',
      'inventory.html': 'inventario',
      'payments.html': 'pagos',
      'users.html': 'usuarios'
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
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        const badge = document.getElementById('clientsBadge');
        if (badge) badge.textContent = data.length || 0;
      })
      .catch(() => {});

    // Obtener contador de servicios
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        const badge = document.getElementById('servicesBadge');
        if (badge) badge.textContent = data.length || 0;
      })
      .catch(() => {});

    // Verificar inventario bajo
    fetch('/api/inventory?lowStock=true')
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
          window.location.href = 'login.html';
        }
      });
    }
  }

  function setupMobileBehavior() {
    // En móvil, cerrar sidebar al hacer clic en un enlace
    const navItems = document.querySelectorAll('.nav-item');
    const isMobile = window.innerWidth <= 720;
    
    if (isMobile) {
      navItems.forEach(item => {
        item.addEventListener('click', function() {
          // Pequeño delay para que el enlace se active
          setTimeout(() => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
              sidebar.style.width = '0';
              sidebar.style.padding = '0';
              sidebar.style.overflow = 'hidden';
            }
          }, 100);
        });
      });
    }

    // Re-evaluar en resize
    window.addEventListener('resize', function() {
      const sidebar = document.getElementById('sidebar');
      if (window.innerWidth > 720 && sidebar) {
        sidebar.style.width = '';
        sidebar.style.padding = '';
        sidebar.style.overflow = '';
      }
    });
  }

  // Actualizar badges cada 30 segundos
  setInterval(updateBadges, 30000);
});