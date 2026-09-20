// payments.js - Gestión inicial del módulo de pagos

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('paymentsTableBody');
  const paymentsCount = document.getElementById('paymentsCount');
  const searchInput = document.getElementById('searchPayment');
  const getAuthHeaders = () => {
    const token = localStorage.getItem('onder_token') || sessionStorage.getItem('onder_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const filterMethod = document.getElementById('filterMethod');
  const btnClearFilters = document.getElementById('btnClearFilters');
  const btnAddPayment = document.getElementById('btnAddPayment');

  const modal = document.getElementById('paymentModal');
  const modalTitle = document.getElementById('modalTitle');
  const paymentForm = document.getElementById('paymentForm');
  const paymentId = document.getElementById('paymentId');
  const paymentClient = document.getElementById('client_id');
  const paymentMethod = document.getElementById('payment_method_id');
  const amountInput = document.getElementById('amount');
  const paymentDate = document.getElementById('payment_date');
  const statusSelect = document.getElementById('status');
  const closeModal = document.getElementById('closeModal');
  const cancelModal = document.getElementById('cancelModal');

  const deleteModal = document.getElementById('deleteModal');
  const deletePaymentClientName = document.getElementById('deletePaymentClientName');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelDelete = document.getElementById('cancelDelete');
  const confirmDelete = document.getElementById('confirmDelete');

  let allPayments = [];
  let allClients = [];
  let allMethods = [];
  let currentDeleteId = null;

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
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: 12px;
      background: var(--panel-dark);
      color: var(--text);
      box-shadow: var(--card-shadow);
      display: none;
      z-index: 1000;
      max-width: 400px;
      border-left: 4px solid var(--accent-blue);
    `;
    document.body.appendChild(toast);
    return toast;
  }

  function openModal(payment = null) {
    modal.style.display = 'flex';
    modal.classList.add('is-open');

    if (payment) {
      modalTitle.textContent = 'Editar Pago';
      paymentId.value = payment.id;
      paymentClient.value = payment.client_id || '';
      paymentMethod.value = payment.payment_method_id || '';
      amountInput.value = payment.amount ?? '';
      paymentDate.value = payment.payment_date ? String(payment.payment_date).split('T')[0] : '';
      statusSelect.value = payment.status || 'pagado';
    } else {
      modalTitle.textContent = 'Nuevo Pago';
      paymentId.value = '';
      paymentForm.reset();
      statusSelect.value = 'pagado';
    }
  }

  function closeModalHandler() {
    modal.style.display = 'none';
    modal.classList.remove('is-open');
    paymentForm.reset();
    paymentId.value = '';
  }

  function openDeleteModal(payment) {
    currentDeleteId = payment.id;
    deletePaymentClientName.textContent = payment.client_name || 'este cliente';
    deleteModal.style.display = 'flex';
    deleteModal.classList.add('is-open');
  }

  function closeDeleteModalHandler() {
    deleteModal.style.display = 'none';
    deleteModal.classList.remove('is-open');
    currentDeleteId = null;
  }

  function renderClientOptions() {
    if (!paymentClient) return;
    paymentClient.innerHTML = ['<option value="">Selecciona un cliente</option>']
      .concat(allClients.map((client) => `<option value="${client.id}">${client.full_name || 'Sin nombre'}</option>`))
      .join('');
  }

  function renderMethodOptions() {
    if (!paymentMethod) return;
    paymentMethod.innerHTML = ['<option value="">Selecciona un método</option>']
      .concat(allMethods.map((method) => `<option value="${method.id}">${method.name || 'Sin nombre'}</option>`))
      .join('');

    if (filterMethod) {
      filterMethod.innerHTML = ['<option value="">Todos los métodos</option>']
        .concat(allMethods.map((method) => `<option value="${method.id}">${method.name || 'Sin nombre'}</option>`))
        .join('');
    }
  }

  function renderPayments(payments) {
    if (!tbody) return;

    if (paymentsCount) {
      paymentsCount.textContent = payments.length;
    }

    if (!payments.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="padding:40px;text-align:center;color:var(--muted);">
            <i class="fa-solid fa-credit-card" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
            No hay pagos registrados todavía
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = payments.map((payment) => `
      <tr>
        <td><strong>${payment.client_name || 'Cliente'}</strong></td>
        <td>${formatMoney(payment.amount)}</td>
        <td>${payment.payment_method_name || 'Sin método'}</td>
        <td>${formatDate(payment.payment_date)}</td>
        <td><span class="pill ${payment.status === 'pagado' ? 'active' : ''}">${payment.status || 'pagado'}</span></td>
        <td style="text-align:center;">
          <button class="btn-edit" data-id="${payment.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-delete" data-id="${payment.id}" data-name="${payment.client_name || 'Cliente'}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.btn-edit').forEach((btn) => {
      btn.addEventListener('click', () => editPayment(btn.dataset.id));
    });

    document.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        const payment = allPayments.find((item) => item.id === btn.dataset.id);
        if (payment) {
          openDeleteModal(payment);
        }
      });
    });
  }

  async function loadReferenceData() {
    const [clientsResponse, methodsResponse] = await Promise.all([
      fetch('/api/clients'),
      fetch('/api/payment-methods')
    ]);

    if (!clientsResponse.ok) throw new Error('No se pudieron cargar los clientes');
    if (!methodsResponse.ok) throw new Error('No se pudieron cargar los métodos de pago');

    allClients = await clientsResponse.json();
    allMethods = await methodsResponse.json();
    renderClientOptions();
    renderMethodOptions();
  }

  async function fetchPayments() {
    try {
      const params = new URLSearchParams();
      if (searchInput?.value.trim()) params.set('search', searchInput.value.trim());
      if (filterMethod?.value) params.set('paymentMethod', filterMethod.value);

      const response = await fetch(`/api/payments${params.toString() ? `?${params.toString()}` : ''}`);
      if (!response.ok) throw new Error('Error al cargar pagos');

      allPayments = await response.json();
      renderPayments(allPayments);
    } catch (error) {
      console.error('Error:', error);
      showToast(error.message, 'error');
      allPayments = [];
      renderPayments([]);
    }
  }

  async function savePayment(payload) {
    const isEditing = Boolean(paymentId.value);
    const url = isEditing ? `/api/payments/${paymentId.value}` : '/api/payments';
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
      let errorMessage = 'Error al guardar el pago';
      try {
        errorMessage = JSON.parse(responseText).error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return JSON.parse(responseText);
  }

  async function editPayment(id) {
    const payment = allPayments.find((item) => item.id === id);
    if (!payment) {
      showToast('Pago no encontrado', 'error');
      return;
    }

    openModal(payment);
  }

  async function deletePayment(id) {
    const response = await fetch(`/api/payments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = 'Error al eliminar el pago';
      try {
        errorMessage = JSON.parse(responseText).error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return responseText;
  }

  btnAddPayment?.addEventListener('click', () => openModal());
  closeModal?.addEventListener('click', closeModalHandler);
  cancelModal?.addEventListener('click', closeModalHandler);
  closeDeleteModal?.addEventListener('click', closeDeleteModalHandler);
  cancelDelete?.addEventListener('click', closeDeleteModalHandler);

  confirmDelete?.addEventListener('click', async () => {
    if (!currentDeleteId) return;
    try {
      await deletePayment(currentDeleteId);
      showToast('Pago eliminado exitosamente', 'success');
      closeDeleteModalHandler();
      await fetchPayments();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  paymentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const payload = {
        client_id: paymentClient.value,
        payment_method_id: paymentMethod.value,
        amount: amountInput.value,
        payment_date: paymentDate.value || undefined,
        status: statusSelect.value
      };

      await savePayment(payload);
      showToast(paymentId.value ? 'Pago actualizado exitosamente' : 'Pago creado exitosamente', 'success');
      closeModalHandler();
      await fetchPayments();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  searchInput?.addEventListener('input', () => fetchPayments());
  filterMethod?.addEventListener('change', () => fetchPayments());
  btnClearFilters?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (filterMethod) filterMethod.value = '';
    fetchPayments();
  });

  loadReferenceData()
    .then(() => fetchPayments())
    .catch((error) => {
      console.error(error);
      showToast(error.message, 'error');
      renderPayments([]);
    });
});