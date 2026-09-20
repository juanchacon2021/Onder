document.addEventListener('DOMContentLoaded', () => {
  const $upcomingList = document.getElementById('upcomingList');
  const $inventoryList = document.getElementById('inventoryList');
  const $activityList = document.getElementById('activityList');
  const $salesFigure = document.getElementById('salesFigure');
  const $toast = document.getElementById('toast');
  const $notificationsList = document.getElementById('notificationsList');
  const $clientsTableBody = document.getElementById('clientsTableBody');
  const $inventoryTableBody = document.getElementById('inventoryTableBody');
  const $servicesTableBody = document.getElementById('servicesTableBody');
  const $paymentsTableBody = document.getElementById('paymentsTableBody');
  const $usersTableBody = document.getElementById('usersTableBody');
  const $clientsCount = document.getElementById('clientsCount');
  const $inventoryCount = document.getElementById('inventoryCount');
  const $servicesCount = document.getElementById('servicesCount');
  const $paymentsCount = document.getElementById('paymentsCount');
  const $usersCount = document.getElementById('usersCount');
  const $metrics = {
    clientsToday: document.getElementById('metricClientsToday'),
    upcomingVisits: document.getElementById('metricUpcomingVisits'),
    dailyRevenue: document.getElementById('metricDailyRevenue'),
    servicesDone: document.getElementById('metricServicesDone')
  };
  const $loginForm = document.getElementById('loginForm');
  const $loginError = document.getElementById('loginError');

  const fallbackDashboard = {
    businessName: 'Onder Barbershop',
    currency: 'USD',
    metrics: {
      clientsToday: 18,
      upcomingVisits: 24,
      dailyRevenue: 245,
      servicesDone: 32
    },
    upcomingVisits: [
      { clientName: 'Juan Pérez', date: new Date().toISOString(), initials: 'JP' },
      { clientName: 'Carlos Rodríguez', date: new Date().toISOString(), initials: 'CR' }
    ],
    lowStockItems: [
      { name: 'Gel Fijador', stock: 3, minimumStock: 5, percent: 60 },
      { name: 'Cera Mate', stock: 2, minimumStock: 4, percent: 50 }
    ],
    recentActivity: [
      { title: 'Nuevo cliente registrado', meta: 'Luis Martínez • 10:30 AM', type: 'green' },
      { title: 'Visita registrada', meta: 'Carlos Rodríguez • 10:15 AM', type: 'blue' },
      { title: 'Pago recibido', meta: '$15.00 • Efectivo • 09:45 AM', type: 'orange' }
    ]
  };

  function initials(name = '') {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  function formatMoney(value, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  function formatShortDate(value) {
    if (!value) {
      return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }

  function formatLongDate(value) {
    if (!value) {
      return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(value));
  }

  function setTableRows(tableBody, rows, emptyMessage) {
    if (!tableBody) {
      return;
    }

    tableBody.innerHTML = '';

    if (!rows.length) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="10" style="padding:18px;color:var(--muted)">${emptyMessage}</td>`;
      tableBody.appendChild(emptyRow);
      return;
    }

    rows.forEach((row) => tableBody.appendChild(row));
  }

  function showToast(text) {
    if (!$toast) return;

    $toast.hidden = false;
    $toast.innerHTML = `<p>${text}</p>`;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      $toast.hidden = true;
    }, 4000);
  }

  function getAuthHeaders(extra = {}) {
    const token = localStorage.getItem('onder_token') || sessionStorage.getItem('onder_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra
    };
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      headers: getAuthHeaders(options.headers || {}),
      ...options
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'No se pudo completar la solicitud.');
    }

    return payload;
  }

  function renderUpcoming(upcomingVisits) {
    if (!$upcomingList) return;

    $upcomingList.innerHTML = '';
    upcomingVisits.forEach((visit) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="avatar-sm">${visit.initials || initials(visit.clientName)}</span>
        <div class="meta">
          <strong>${visit.clientName}</strong>
          <small>${formatShortDate(visit.date)}</small>
        </div>
        <span class="pill warning">${visit.status || 'Programado'}</span>
      `;
      $upcomingList.appendChild(li);
    });
  }

  function renderInventory(inventoryItems) {
    if (!$inventoryList) return;

    $inventoryList.innerHTML = '';
    inventoryItems.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="item">${item.name} <small>Stock: ${item.stock}</small></div>
        <div class="bar"><div style="width:${item.percent}%"></div></div>
      `;
      $inventoryList.appendChild(li);
    });
  }

  function renderActivity(activity) {
    if (!$activityList) return;

    $activityList.innerHTML = '';
    activity.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="icon ${item.type}"><i class="fa-solid fa-circle"></i></span>
        <div>
          <strong>${item.title}</strong>
          <small>${item.meta}</small>
        </div>
      `;
      $activityList.appendChild(li);
    });
  }

  function renderClients(clients) {
    if (!$clientsTableBody) return;

    if ($clientsCount) {
      $clientsCount.textContent = clients.length;
    }

    const rows = clients.map((client) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)"><strong>${client.full_name}</strong><div style="color:var(--muted);font-size:12px">${client.email || 'Sin correo'}</div></td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${client.phone || 'Sin teléfono'}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${client.instagram || 'Sin Instagram'}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${client.favorite_style || 'Sin dato'}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${formatLongDate(client.last_visit)}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${formatLongDate(client.next_visit)}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)"><span class="pill ${client.is_active === false ? 'warning' : ''}">${client.is_active === false ? 'Inactivo' : 'Activo'}</span></td>
      `;
      return row;
    });

    setTableRows($clientsTableBody, rows, 'No hay clientes cargados todavía.');
  }

  function renderInventoryTable(items) {
    if (!$inventoryTableBody) return;

    if ($inventoryCount) {
      $inventoryCount.textContent = items.length;
    }

    const rows = items.map((item) => {
      const lowStock = Number(item.stock) <= Number(item.minimum_stock);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)"><strong>${item.name}</strong><div style="color:var(--muted);font-size:12px">${item.category || 'Sin categoría'}</div></td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${item.stock}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${item.minimum_stock ?? 0}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${item.supplier || 'Sin proveedor'}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)"><span class="pill ${lowStock ? 'warning' : ''}">${lowStock ? 'Bajo stock' : 'OK'}</span></td>
      `;
      return row;
    });

    setTableRows($inventoryTableBody, rows, 'No hay productos registrados todavía.');
  }

  function renderServicesTable(services) {
    if (!$servicesTableBody) return;

    if ($servicesCount) {
      $servicesCount.textContent = services.length;
    }

    const rows = services.map((service) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)"><strong>${service.name}</strong></td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04);color:var(--muted)">${service.description || 'Sin descripción'}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${formatMoney(service.price)}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${service.duration_minutes || '—'} min</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)"><span class="pill ${service.is_active === false ? 'warning' : ''}">${service.is_active === false ? 'Inactivo' : 'Activo'}</span></td>
      `;
      return row;
    });

    setTableRows($servicesTableBody, rows, 'No hay servicios registrados todavía.');
  }

  function renderPaymentsTable(payments) {
    if (!$paymentsTableBody) return;

    if ($paymentsCount) {
      $paymentsCount.textContent = payments.length;
    }

    const rows = payments.map((payment) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)"><strong>${payment.client_name || 'Cliente'}</strong></td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${formatMoney(payment.amount)}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${payment.payment_method_name || 'Sin método'}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${formatShortDate(payment.payment_date)}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)"><span class="pill">${payment.status || 'pagado'}</span></td>
      `;
      return row;
    });

    setTableRows($paymentsTableBody, rows, 'No hay pagos registrados todavía.');
  }

  function renderUsersTable(users) {
    if (!$usersTableBody) return;

    if ($usersCount) {
      $usersCount.textContent = users.length;
    }

    const rows = users.map((user) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)"><strong>${user.full_name}</strong><div style="color:var(--muted);font-size:12px">${user.email}</div></td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${user.role_name || 'Sin rol'}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${user.is_active === false ? 'Inactivo' : 'Activo'}</td>
        <td style="padding:14px 10px;border-bottom:1px solid rgba(255,255,255,0.04)">${formatLongDate(user.created_at)}</td>
      `;
      return row;
    });

    setTableRows($usersTableBody, rows, 'No hay usuarios registrados todavía.');
  }

  function renderMetrics(metrics, currency) {
    if ($metrics.clientsToday) {
      $metrics.clientsToday.textContent = metrics.clientsToday;
    }
    if ($metrics.upcomingVisits) {
      $metrics.upcomingVisits.textContent = metrics.upcomingVisits;
    }
    if ($metrics.dailyRevenue) {
      $metrics.dailyRevenue.textContent = formatMoney(metrics.dailyRevenue, currency);
    }
    if ($metrics.servicesDone) {
      $metrics.servicesDone.textContent = metrics.servicesDone;
    }
    if ($salesFigure) {
      $salesFigure.childNodes[0].nodeValue = `${formatMoney(metrics.dailyRevenue, currency)} `;
    }
  }

  function buildReminderItems(clients) {
    if (!Array.isArray(clients)) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return clients
      .map((client) => {
        if (!client.next_visit) {
          return null;
        }

        const visitDate = new Date(client.next_visit);
        if (Number.isNaN(visitDate.getTime())) {
          return null;
        }

        const diffDays = Math.round((visitDate - today) / 86400000);
        if (diffDays <= -1) {
          return {
            title: `${client.full_name || 'Cliente'} debe un corte`,
            meta: `Fecha: ${formatLongDate(client.next_visit)} • atrasado`,
            type: 'danger',
            icon: 'fa-solid fa-triangle-exclamation'
          };
        }

        if (diffDays <= 7) {
          return {
            title: `${client.full_name || 'Cliente'} está próximo a cortarse`,
            meta: `Falta ${diffDays} día${diffDays === 1 ? '' : 's'} para su cita`,
            type: 'warning',
            icon: 'fa-regular fa-bell'
          };
        }

        return null;
      })
      .filter(Boolean)
      .slice(0, 4);
  }

  function renderNotifications(notifications) {
    if (!$notificationsList) return;

    if (!Array.isArray(notifications) || !notifications.length) {
      $notificationsList.innerHTML = `
        <li>
          <div class="rem-icon"><i class="fa-solid fa-circle-check"></i></div>
          <div>
            <strong>No hay notificaciones pendientes</strong>
            <small>Todo está al día</small>
          </div>
        </li>
      `;
      return;
    }

    const pending = notifications.filter((item) => item.is_sent === false || item.sent === false);
    const items = (pending.length ? pending : notifications).slice(0, 3);

    $notificationsList.innerHTML = items.map((item) => {
      const icon = item.is_sent === false ? 'fa-regular fa-bell' : 'fa-solid fa-check';
      const state = item.is_sent === false ? 'Pendiente' : 'Enviada';
      return `
        <li>
          <div class="rem-icon"><i class="${icon}"></i></div>
          <div>
            <strong>${item.title || 'Notificación'}</strong>
            <small>${state} • ${formatLongDate(item.created_at)}</small>
          </div>
        </li>
      `;
    }).join('');
  }

  function renderReminderAlerts(reminders) {
    if (!$notificationsList) return;

    if (!Array.isArray(reminders) || !reminders.length) {
      $notificationsList.innerHTML = `
        <li>
          <div class="rem-icon"><i class="fa-solid fa-circle-check"></i></div>
          <div>
            <strong>No hay recordatorios activos</strong>
            <small>Todos los clientes están al día</small>
          </div>
        </li>
      `;
      return;
    }

    $notificationsList.innerHTML = reminders.map((item) => `
      <li>
        <div class="rem-icon ${item.type === 'danger' ? 'danger' : 'warning'}"><i class="${item.icon}"></i></div>
        <div>
          <strong>${item.title}</strong>
          <small>${item.meta}</small>
        </div>
      </li>
    `).join('');
  }

  async function loadNotifications() {
    if (!$notificationsList) return;

    try {
      const notifications = await requestJson('/api/notifications');
      renderNotifications(notifications);
    } catch (error) {
      $notificationsList.innerHTML = `
        <li>
          <div class="rem-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <div>
            <strong>No se pudieron cargar las notificaciones</strong>
            <small>${error.message}</small>
          </div>
        </li>
      `;
    }
  }

  async function loadDashboard() {
    if (!$upcomingList && !$inventoryList && !$activityList) {
      return;
    }

    try {
      const [dashboard, clients] = await Promise.all([
        requestJson('/api/dashboard/summary'),
        requestJson('/api/clients')
      ]);

      renderMetrics(dashboard.metrics, dashboard.currency);
      renderUpcoming(dashboard.upcomingVisits);
      renderInventory(dashboard.lowStockItems);
      renderActivity(dashboard.recentActivity);
      renderReminderAlerts(buildReminderItems(clients));

      const reminderCount = buildReminderItems(clients).length;
      if (reminderCount > 0) {
        showToast(`Tienes ${reminderCount} recordatorios de clientes.`);
      }
    } catch (_error) {
      renderMetrics(fallbackDashboard.metrics, fallbackDashboard.currency);
      renderUpcoming(fallbackDashboard.upcomingVisits);
      renderInventory(fallbackDashboard.lowStockItems);
      renderActivity(fallbackDashboard.recentActivity);
      renderReminderAlerts([
        { title: 'Juan Pérez debe un corte', meta: 'Está atrasado', type: 'danger', icon: 'fa-solid fa-triangle-exclamation' },
        { title: 'Carlos Rodríguez está próximo a cortarse', meta: 'Falta 2 días', type: 'warning', icon: 'fa-regular fa-bell' }
      ]);
      showToast('Ejecutando con datos de respaldo hasta que el backend responda.');
    }
  }

  async function loadClientsPage() {
    if (!$clientsTableBody) {
      return;
    }

    try {
      const clients = await requestJson('/api/clients');
      renderClients(clients);
    } catch (error) {
      showToast(error.message);
      renderClients([]);
    }
  }

  async function loadInventoryPage() {
    if (!$inventoryTableBody) {
      return;
    }

    try {
      const inventory = await requestJson('/api/inventory');
      renderInventoryTable(inventory);
    } catch (error) {
      showToast(error.message);
      renderInventoryTable([]);
    }
  }

  async function loadServicesPage() {
    if (!$servicesTableBody) {
      return;
    }

    try {
      const services = await requestJson('/api/services');
      renderServicesTable(services);
    } catch (error) {
      showToast(error.message);
      renderServicesTable([]);
    }
  }

  async function loadPaymentsPage() {
    if (!$paymentsTableBody) {
      return;
    }

    try {
      const payments = await requestJson('/api/payments');
      renderPaymentsTable(payments);
    } catch (error) {
      showToast(error.message);
      renderPaymentsTable([]);
    }
  }

  async function loadUsersPage() {
    if (!$usersTableBody) {
      return;
    }

    try {
      const users = await requestJson('/api/users');
      renderUsersTable(users);
    } catch (error) {
      showToast(error.message);
      renderUsersTable([]);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (!$loginForm) return;

    if ($loginError) {
      $loginError.hidden = true;
      $loginError.textContent = '';
    }

    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value || '';

    try {
      const response = await requestJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('onder_token', response.token);
      localStorage.setItem('onder_user', JSON.stringify(response.user));
      window.location.href = 'index.html';
    } catch (error) {
      if ($loginError) {
        $loginError.hidden = false;
        $loginError.textContent = error.message;
      }
    }
  }

  if ($loginForm) {
    $loginForm.addEventListener('submit', handleLogin);
  }

  loadDashboard();
  loadNotifications();
  loadClientsPage();
  loadInventoryPage();
  loadServicesPage();
  loadPaymentsPage();
  loadUsersPage();
});
