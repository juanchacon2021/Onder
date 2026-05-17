const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('onder_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function checkAuth() {
  if (!localStorage.getItem('onder_token') && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  const $upcomingList = document.getElementById('upcomingList');
  const $inventoryList = document.getElementById('inventoryList');
  const $activityList = document.getElementById('activityList');
  const $salesFigure = document.getElementById('salesFigure');
  const $toast = document.getElementById('toast');

  function initials(name) {
    if (!name) return '??';
    return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  }

  async function fetchData(endpoint) {
    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        headers: getAuthHeaders()
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('onder_token');
        window.location.href = 'login.html';
        return null;
      }
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return null;
    }
  }

  async function renderUpcoming() {
    if (!$upcomingList) return;
    const visits = await fetchData('visits');
    if (!visits) return;

    const upcoming = (visits || []).filter(v => v.next_visit_date && new Date(v.next_visit_date) > new Date()).slice(0, 5);

    $upcomingList.innerHTML = '';
    if (upcoming.length === 0) {
      $upcomingList.innerHTML = '<li>No hay visitas programadas</li>';
      return;
    }

    upcoming.forEach((u) => {
      const li = document.createElement('li');
      const clientName = u.clients?.full_name || 'Desconocido';
      const date = new Date(u.next_visit_date).toLocaleDateString();
      li.innerHTML = `<span class="avatar-sm">${initials(clientName)}</span><div class="meta"><strong>${clientName}</strong><small>${date}</small></div><span class="pill warning">Próximamente</span>`;
      $upcomingList.appendChild(li);
    });
  }

  async function renderInventory() {
    if (!$inventoryList) return;
    const inventory = await fetchData('inventory');
    if (!inventory) return;

    const lowStock = (inventory || []).filter(it => it.stock <= it.minimum_stock);

    $inventoryList.innerHTML = '';
    if (lowStock.length === 0) {
      $inventoryList.innerHTML = '<li>Todo el stock está correcto</li>';
      return;
    }

    lowStock.forEach(it => {
      const max = it.minimum_stock * 2 || 10;
      const percent = Math.max(6, Math.round((it.stock / max) * 100));
      const li = document.createElement('li');
      li.innerHTML = `<div class="item">${it.name} <small>Stock: ${it.stock}</small></div><div class="bar"><div style="width:${percent}%"></div></div>`;
      $inventoryList.appendChild(li);
    });
  }

  async function renderActivity() {
    if (!$activityList) return;
    const visits = await fetchData('visits');
    if (!visits) return;

    const activity = (visits || []).slice(0, 5).map(v => ({
      title: 'Visita registrada',
      meta: `${v.clients?.full_name || 'Cliente'} • ${new Date(v.visit_date).toLocaleTimeString()}`,
      type: 'blue'
    }));

    $activityList.innerHTML = '';
    activity.forEach(a => {
      const li = document.createElement('li');
      let icon = '<i class="fas fa-calendar-check"></i>';
      li.innerHTML = `<span class="icon ${a.type}">${icon}</span><div><strong>${a.title}</strong><small>${a.meta}</small></div>`;
      $activityList.appendChild(li);
    });
  }

  async function updateSales() {
    if (!$salesFigure) return;
    const visits = await fetchData('visits');
    if (!visits) return;

    const today = new Date().toISOString().split('T')[0];
    const todaySales = (visits || [])
      .filter(v => v.visit_date && v.visit_date.startsWith(today))
      .reduce((sum, v) => sum + parseFloat(v.amount || 0), 0);

    $salesFigure.firstChild.nodeValue = `$${todaySales.toFixed(2)} `;
  }

  function showToast(text) {
    if (!$toast) return;
    $toast.hidden = false;
    $toast.innerHTML = `<p>${text}</p>`;
    setTimeout(() => { $toast.hidden = true; }, 4000);
  }

  // Initial render
  renderUpcoming();
  renderInventory();
  renderActivity();
  updateSales();

  // Polling for updates
  setInterval(() => {
    renderUpcoming();
    renderInventory();
    renderActivity();
    updateSales();
  }, 60000);
});
