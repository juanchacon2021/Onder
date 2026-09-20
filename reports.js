document.addEventListener('DOMContentLoaded', async () => {
  const totalClients = document.getElementById('totalClients');
  const totalRevenue = document.getElementById('totalRevenue');
  const avgTicket = document.getElementById('avgTicket');
  const completedVisits = document.getElementById('completedVisits');
  const summaryRevenue = document.getElementById('summaryRevenue');
  const lowStockList = document.getElementById('lowStockList');
  const visitSummaryList = document.getElementById('visitSummaryList');
  const keyMetricsList = document.getElementById('keyMetricsList');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('onder_token') || sessionStorage.getItem('onder_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  function formatMoney(value) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  function renderList(listEl, items) {
    if (!listEl) return;
    if (!items.length) {
      listEl.innerHTML = '<li style="color:var(--muted);">No hay datos para mostrar.</li>';
      return;
    }

    listEl.innerHTML = items.map((item) => `
      <li style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
        <span>${item.label}</span>
        <strong>${item.value}</strong>
      </li>
    `).join('');
  }

  try {
    const [summaryResponse, inventoryResponse, visitsResponse] = await Promise.all([
      fetch('/api/reports/summary', { headers: getAuthHeaders() }),
      fetch('/api/inventory?lowStock=true', { headers: getAuthHeaders() }),
      fetch('/api/visits', { headers: getAuthHeaders() })
    ]);

    if (!summaryResponse.ok) throw new Error('No se pudo cargar el resumen');
    if (!inventoryResponse.ok) throw new Error('No se pudo cargar el inventario');
    if (!visitsResponse.ok) throw new Error('No se pudo cargar las visitas');

    const summary = await summaryResponse.json();
    const lowStock = await inventoryResponse.json();
    const visits = await visitsResponse.json();

    const total = summary.metrics || {};
    totalClients.textContent = total.totalClients ?? 0;
    totalRevenue.textContent = formatMoney(total.totalRevenue ?? 0);
    avgTicket.textContent = formatMoney(total.avgTicket ?? 0);
    completedVisits.textContent = total.completedVisits ?? 0;
    summaryRevenue.textContent = formatMoney(total.totalRevenue ?? 0);

    renderList(lowStockList, lowStock.slice(0, 5).map((item) => ({
      label: item.name || 'Producto',
      value: `${item.stock ?? 0}/${item.minimum_stock ?? 0}`
    })));

    const upcoming = visits.filter((visit) => (visit.status || 'programado') !== 'cancelado');
    renderList(visitSummaryList, [
      { label: 'Total de visitas', value: String(visits.length || 0) },
      { label: 'Próximas', value: String(upcoming.length || 0) },
      { label: 'Completadas', value: String(total.completedVisits ?? 0) }
    ]);

    renderList(keyMetricsList, [
      { label: 'Servicios registrados', value: String(total.totalServices ?? 0) },
      { label: 'Inventario bajo', value: String(total.lowStockCount ?? lowStock.length ?? 0) },
      { label: 'Clientes activos', value: String(total.totalClients ?? 0) },
      { label: 'Ticket promedio', value: formatMoney(total.avgTicket ?? 0) }
    ]);
  } catch (error) {
    console.error(error);
    const fallback = [
      { label: 'Total de clientes', value: '0' },
      { label: 'Visitas programadas', value: '0' },
      { label: 'Inventario bajo', value: '0' }
    ];

    if (totalClients) totalClients.textContent = '0';
    if (totalRevenue) totalRevenue.textContent = '$0.00';
    if (avgTicket) avgTicket.textContent = '$0.00';
    if (completedVisits) completedVisits.textContent = '0';
    if (summaryRevenue) summaryRevenue.textContent = '$0.00';
    renderList(lowStockList, fallback);
    renderList(visitSummaryList, fallback);
    renderList(keyMetricsList, fallback);
  }
});
