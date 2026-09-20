document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('visitsTableBody');
  const visitsCount = document.getElementById('visitsCount');
  const searchInput = document.getElementById('searchVisit');
  const statusFilter = document.getElementById('statusFilter');
  const dateFilter = document.getElementById('dateFilter');
  const btnClearFilters = document.getElementById('btnClearFilters');
  const btnAddVisit = document.getElementById('btnAddVisit');

  const modal = document.getElementById('visitModal');
  const modalTitle = document.getElementById('modalTitle');
  const visitForm = document.getElementById('visitForm');
  const visitId = document.getElementById('visitId');
  const clientId = document.getElementById('client_id');
  const serviceId = document.getElementById('service_id');
  const barberId = document.getElementById('barber_id');
  const paymentMethodId = document.getElementById('payment_method_id');
  const nextVisitDate = document.getElementById('next_visit_date');
  const amount = document.getElementById('amount');
  const notes = document.getElementById('notes');
  const status = document.getElementById('status');
  const closeModal = document.getElementById('closeModal');
  const cancelModal = document.getElementById('cancelModal');
  const saveVisitBtn = document.getElementById('saveVisit');

  const deleteModal = document.getElementById('deleteModal');
  const deleteVisitName = document.getElementById('deleteVisitName');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelDelete = document.getElementById('cancelDelete');
  const confirmDelete = document.getElementById('confirmDelete');

  let allVisits = [];
  let allClients = [];
  let allServices = [];
  let allPaymentMethods = [];
  let allBarbers = [];
  let currentDeleteId = null;

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

  function formatDate(value) {
    if (!value) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }

  function showToast(message, type = 'info') {
    const toast = document.getElementById('toast') || createToast();
    toast.textContent = message;
    toast.style.display = 'block';
    toast.className = `toast ${type}`;
    clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
  }

  function createToast() {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 12px; background: var(--panel-dark); color: var(--text); box-shadow: var(--card-shadow); display: none; z-index: 1000; max-width: 400px; border-left: 4px solid var(--accent-blue);
    `;
    document.body.appendChild(toast);
    return toast;
  }

  function renderClientOptions() {
    if (!clientId) return;
    clientId.innerHTML = ['<option value="">Selecciona un cliente</option>']
      .concat(allClients.map((client) => `<option value="${client.id}">${client.full_name || 'Sin nombre'}</option>`))
      .join('');
  }

  function renderServiceOptions() {
    if (!serviceId) return;
    serviceId.innerHTML = ['<option value="">Selecciona un servicio</option>']
      .concat(allServices.map((service) => `<option value="${service.id}">${service.name || 'Sin nombre'}</option>`))
      .join('');
  }

  function renderBarberOptions() {
    if (!barberId) return;
    barberId.innerHTML = ['<option value="">Selecciona un barbero</option>']
      .concat(allBarbers.map((user) => `<option value="${user.id}">${user.full_name || 'Sin nombre'}</option>`))
      .join('');
  }

  function renderPaymentMethodOptions() {
    if (!paymentMethodId) return;
    paymentMethodId.innerHTML = ['<option value="">Selecciona un método</option>']
      .concat(allPaymentMethods.map((method) => `<option value="${method.id}">${method.name || 'Sin nombre'}</option>`))
      .join('');
  }

  function renderVisits(visits) {
    if (!tbody) return;

    if (visitsCount) visitsCount.textContent = visits.length;

    if (!visits.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="padding:40px;text-align:center;color:var(--muted);">
            <i class="fa-solid fa-calendar-check" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
            No hay visitas registradas
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = visits.map((visit) => {
      const statusClass = visit.status === 'completado' ? 'active' : visit.status === 'cancelado' ? 'warning' : '';
      return `
        <tr>
          <td><strong>${visit.client_name || 'Cliente'}</strong></td>
          <td>${visit.service_name || 'Sin servicio'}</td>
          <td>${visit.barber_name || 'Sin barbero'}</td>
          <td>${formatDate(visit.next_visit_date)}</td>
          <td>${visit.payment_method_name || 'Sin método'}</td>
          <td><span class="pill ${statusClass}">${visit.status || 'programado'}</span></td>
          <td>${formatMoney(visit.amount)}</td>
          <td style="text-align:center;">
            <button class="btn-edit" data-id="${visit.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-delete" data-id="${visit.id}" data-name="${visit.client_name || 'cliente'}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.btn-edit').forEach((btn) => {
      btn.addEventListener('click', () => editVisit(btn.dataset.id));
    });

    document.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        const visit = allVisits.find((item) => item.id === btn.dataset.id);
        if (visit) openDeleteModal(visit);
      });
    });
  }

  async function fetchVisits() {
    try {
      const params = new URLSearchParams();
      if (searchInput?.value.trim()) params.set('search', searchInput.value.trim());
      if (statusFilter?.value) params.set('status', statusFilter.value);
      if (dateFilter?.value) params.set('date', dateFilter.value);

      const response = await fetch(`/api/visits${params.toString() ? `?${params.toString()}` : ''}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Error al cargar visitas');

      allVisits = await response.json();
      renderVisits(allVisits);
    } catch (error) {
      console.error('Error:', error);
      showToast(error.message, 'error');
      allVisits = [];
      renderVisits([]);
    }
  }

  async function loadReferenceData() {
    const [clientsResponse, servicesResponse, methodsResponse, usersResponse] = await Promise.all([
      fetch('/api/clients', { headers: getAuthHeaders() }),
      fetch('/api/services', { headers: getAuthHeaders() }),
      fetch('/api/payment-methods', { headers: getAuthHeaders() }),
      fetch('/api/users', { headers: getAuthHeaders() })
    ]);

    if (!clientsResponse.ok) throw new Error('No se pudieron cargar los clientes');
    if (!servicesResponse.ok) throw new Error('No se pudieron cargar los servicios');
    if (!methodsResponse.ok) throw new Error('No se pudieron cargar los métodos de pago');
    if (!usersResponse.ok) throw new Error('No se pudieron cargar los barberos');

    allClients = await clientsResponse.json();
    allServices = await servicesResponse.json();
    allPaymentMethods = await methodsResponse.json();
    allBarbers = await usersResponse.json();

    renderClientOptions();
    renderServiceOptions();
    renderBarberOptions();
    renderPaymentMethodOptions();
  }

  function openModal(visit = null) {
    modal.style.display = 'flex';
    modal.classList.add('is-open');

    if (visit) {
      modalTitle.textContent = 'Editar Visita';
      visitId.value = visit.id;
      clientId.value = visit.client_id || '';
      serviceId.value = visit.service_id || '';
      barberId.value = visit.barber_id || '';
      paymentMethodId.value = visit.payment_method_id || '';
      nextVisitDate.value = visit.next_visit_date ? String(visit.next_visit_date).slice(0, 10) : '';
      amount.value = visit.amount ?? '';
      notes.value = visit.notes || '';
      status.value = visit.status || 'programado';
    } else {
      modalTitle.textContent = 'Nueva Visita';
      visitId.value = '';
      visitForm.reset();
      status.value = 'programado';
    }
  }

  function closeModalHandler() {
    modal.style.display = 'none';
    modal.classList.remove('is-open');
    visitForm.reset();
    visitId.value = '';
  }

  function openDeleteModal(visit) {
    currentDeleteId = visit.id;
    deleteVisitName.textContent = visit.client_name || 'este cliente';
    deleteModal.style.display = 'flex';
    deleteModal.classList.add('is-open');
  }

  function closeDeleteModalHandler() {
    deleteModal.style.display = 'none';
    deleteModal.classList.remove('is-open');
    currentDeleteId = null;
  }

  async function saveVisit(payload) {
    const isEditing = Boolean(visitId.value);
    const url = isEditing ? `/api/visits/${visitId.value}` : '/api/visits';
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    if (!response.ok) {
      let errorMessage = 'Error al guardar la visita';
      try {
        errorMessage = JSON.parse(responseText).error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return JSON.parse(responseText);
  }

  async function deleteVisit(id) {
    const response = await fetch(`/api/visits/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = 'Error al eliminar la visita';
      try {
        errorMessage = JSON.parse(responseText).error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return responseText;
  }

  btnAddVisit?.addEventListener('click', () => openModal());
  closeModal?.addEventListener('click', closeModalHandler);
  cancelModal?.addEventListener('click', closeModalHandler);
  closeDeleteModal?.addEventListener('click', closeDeleteModalHandler);
  cancelDelete?.addEventListener('click', closeDeleteModalHandler);
  btnClearFilters?.addEventListener('click', () => {
    searchInput.value = '';
    statusFilter.value = '';
    dateFilter.value = '';
    fetchVisits();
  });

  searchInput?.addEventListener('input', () => fetchVisits());
  statusFilter?.addEventListener('change', () => fetchVisits());
  dateFilter?.addEventListener('change', () => fetchVisits());

  confirmDelete?.addEventListener('click', async () => {
    if (!currentDeleteId) return;
    try {
      await deleteVisit(currentDeleteId);
      showToast('Visita eliminada correctamente', 'success');
      await fetchVisits();
      closeDeleteModalHandler();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  visitForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const payload = {
        client_id: clientId.value,
        service_id: serviceId.value,
        barber_id: barberId.value || 'user-2',
        payment_method_id: paymentMethodId.value || 'payment-method-cash',
        next_visit_date: nextVisitDate.value,
        amount: amount.value,
        status: status.value,
        notes: notes.value || null
      };

      if (!payload.client_id) throw new Error('Debes seleccionar un cliente.');
      if (!payload.service_id) throw new Error('Debes seleccionar un servicio.');
      if (!payload.next_visit_date) throw new Error('Debes seleccionar una fecha de visita.');

      await saveVisit(payload);
      showToast('Visita guardada correctamente', 'success');
      closeModalHandler();
      await fetchVisits();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  async function init() {
    try {
      await loadReferenceData();
      await fetchVisits();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  init();
});
