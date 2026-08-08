// users.js - Gestión inicial del módulo de usuarios

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('usersTableBody');
  const usersCount = document.getElementById('usersCount');
  const searchInput = document.getElementById('searchUser');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const btnAddUser = document.getElementById('btnAddUser');

  const modal = document.getElementById('userModal');
  const modalTitle = document.getElementById('modalTitle');
  const userForm = document.getElementById('userForm');
  const userId = document.getElementById('userId');
  const fullName = document.getElementById('full_name');
  const email = document.getElementById('email');
  const phone = document.getElementById('phone');
  const roleId = document.getElementById('role_id');
  const password = document.getElementById('password');
  const isActive = document.getElementById('is_active');
  const closeModal = document.getElementById('closeModal');
  const cancelModal = document.getElementById('cancelModal');

  const deleteModal = document.getElementById('deleteModal');
  const deleteUserName = document.getElementById('deleteUserName');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelDelete = document.getElementById('cancelDelete');
  const confirmDelete = document.getElementById('confirmDelete');

  let allUsers = [];
  let allRoles = [];
  let currentDeleteId = null;

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

  function renderRoleOptions() {
    if (!roleId) return;
    roleId.innerHTML = ['<option value="">Selecciona un rol</option>']
      .concat(allRoles.map((role) => `<option value="${role.id}">${role.name || 'Sin nombre'}</option>`))
      .join('');
  }

  function openModal(user = null) {
    modal.style.display = 'flex';
    modal.classList.add('is-open');

    if (user) {
      modalTitle.textContent = 'Editar Usuario';
      userId.value = user.id;
      fullName.value = user.full_name || '';
      email.value = user.email || '';
      phone.value = user.phone || '';
      roleId.value = user.role_id || '';
      password.value = '';
      isActive.value = user.is_active === false ? 'false' : 'true';
    } else {
      modalTitle.textContent = 'Nuevo Usuario';
      userId.value = '';
      userForm.reset();
      isActive.value = 'true';
    }
  }

  function closeModalHandler() {
    modal.style.display = 'none';
    modal.classList.remove('is-open');
    userForm.reset();
    userId.value = '';
  }

  function openDeleteModal(user) {
    currentDeleteId = user.id;
    deleteUserName.textContent = user.full_name || 'este usuario';
    deleteModal.style.display = 'flex';
    deleteModal.classList.add('is-open');
  }

  function closeDeleteModalHandler() {
    deleteModal.style.display = 'none';
    deleteModal.classList.remove('is-open');
    currentDeleteId = null;
  }

  function renderUsers(users) {
    if (!tbody) return;

    if (usersCount) {
      usersCount.textContent = users.length;
    }

    if (!users.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="padding:40px;text-align:center;color:var(--muted);">
            <i class="fa-solid fa-users-gear" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
            No hay usuarios registrados todavía
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = users.map((user) => `
      <tr>
        <td><strong>${user.full_name || 'Sin nombre'}</strong></td>
        <td>${user.email || 'Sin email'}</td>
        <td><span class="pill ${user.role_name === 'Administrador' ? 'active' : ''}">${user.role_name || 'Sin rol'}</span></td>
        <td><span class="pill ${user.is_active === false ? '' : 'active'}">${user.is_active === false ? 'Inactivo' : 'Activo'}</span></td>
        <td>${formatDate(user.created_at)}</td>
        <td style="text-align:center;">
          <button class="btn-edit" data-id="${user.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-delete" data-id="${user.id}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.btn-edit').forEach((btn) => {
      btn.addEventListener('click', () => editUser(btn.dataset.id));
    });

    document.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        const user = allUsers.find((item) => item.id === btn.dataset.id);
        if (user) {
          openDeleteModal(user);
        }
      });
    });
  }

  async function loadReferenceData() {
    const response = await fetch('/api/roles');
    if (!response.ok) throw new Error('No se pudieron cargar los roles');
    allRoles = await response.json();
    renderRoleOptions();
  }

  async function fetchUsers() {
    try {
      const params = new URLSearchParams();
      if (searchInput?.value.trim()) params.set('search', searchInput.value.trim());
      const response = await fetch(`/api/users${params.toString() ? `?${params.toString()}` : ''}`);
      if (!response.ok) throw new Error('Error al cargar usuarios');
      allUsers = await response.json();
      renderUsers(allUsers);
    } catch (error) {
      console.error('Error:', error);
      showToast(error.message, 'error');
      allUsers = [];
      renderUsers([]);
    }
  }

  async function saveUser(payload) {
    const isEditing = Boolean(userId.value);
    const url = isEditing ? `/api/users/${userId.value}` : '/api/users';
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    if (!response.ok) {
      let errorMessage = 'Error al guardar el usuario';
      try {
        errorMessage = JSON.parse(responseText).error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return JSON.parse(responseText);
  }

  async function editUser(id) {
    try {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error('No se pudo cargar el usuario');
      const user = await response.json();
      openModal(user);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function deleteUser(id) {
    const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = 'Error al eliminar el usuario';
      try {
        errorMessage = JSON.parse(responseText).error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return responseText;
  }

  btnAddUser?.addEventListener('click', () => openModal());
  closeModal?.addEventListener('click', closeModalHandler);
  cancelModal?.addEventListener('click', closeModalHandler);
  closeDeleteModal?.addEventListener('click', closeDeleteModalHandler);
  cancelDelete?.addEventListener('click', closeDeleteModalHandler);

  confirmDelete?.addEventListener('click', async () => {
    if (!currentDeleteId) return;
    try {
      await deleteUser(currentDeleteId);
      showToast('Usuario eliminado exitosamente', 'success');
      closeDeleteModalHandler();
      await fetchUsers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  userForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const payload = {
        full_name: fullName.value,
        email: email.value,
        phone: phone.value,
        role_id: roleId.value,
        is_active: isActive.value === 'true'
      };

      if (password.value) {
        payload.password = password.value;
      }

      await saveUser(payload);
      showToast(userId.value ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente', 'success');
      closeModalHandler();
      await fetchUsers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  searchInput?.addEventListener('input', () => fetchUsers());
  btnClearSearch?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    fetchUsers();
  });

  loadReferenceData()
    .then(() => fetchUsers())
    .catch((error) => {
      console.error(error);
      showToast(error.message, 'error');
      renderUsers([]);
    });
});