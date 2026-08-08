// clients.js - Gestión completa de clientes con Supabase

document.addEventListener('DOMContentLoaded', function() {
    const tbody = document.getElementById('clientsTableBody');
    const clientsCount = document.getElementById('clientsCount');
    const searchInput = document.getElementById('searchClient');
    const btnClearSearch = document.getElementById('btnClearSearch');
    const btnAddClient = document.getElementById('btnAddClient');
    
    const modal = document.getElementById('clientModal');
    const modalTitle = document.getElementById('modalTitle');
    const clientForm = document.getElementById('clientForm');
    const clientId = document.getElementById('clientId');
    const closeModal = document.getElementById('closeModal');
    const cancelModal = document.getElementById('cancelModal');
    const saveClientBtn = document.getElementById('saveClient');
    
    const deleteModal = document.getElementById('deleteModal');
    const deleteClientName = document.getElementById('deleteClientName');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    const saveClientText = saveClientBtn ? saveClientBtn.querySelector('.save-text') : null;
    
    let currentDeleteId = null;
    let allClients = [];
    let isSavingClient = false;

    // ===== FUNCIONES CRUD =====

    async function fetchClients(search = '') {
        try {
            const url = search ? `/api/clients?search=${encodeURIComponent(search)}` : '/api/clients';
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al cargar clientes');
            const data = await response.json();
            allClients = data;
            renderClients(data);
            return data;
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al cargar clientes: ' + error.message, 'error');
            return [];
        }
    }

    function renderClients(clients) {
        if (!tbody) return;
        
        if (clientsCount) {
            clientsCount.textContent = clients.length;
        }

        if (clients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="padding:40px;text-align:center;color:var(--muted);">
                        <i class="fa-solid fa-users" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
                        No hay clientes registrados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = clients.map((client, index) => `
            <tr class="client-row" style="animation-delay:${Math.min(index * 40, 240)}ms">
                <td>
                    <strong>${client.full_name || 'Sin nombre'}</strong>
                </td>
                <td>${client.phone || 'Sin teléfono'}</td>
                <td>${client.instagram || 'Sin Instagram'}</td>
                <td>${client.favorite_style || 'Sin dato'}</td>
                <td>${formatDate(client.last_visit)}</td>
                <td>${formatDate(client.next_visit)}</td>
                <td style="text-align:center;">
                    <button class="btn-edit" data-id="${client.id}" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-delete" data-id="${client.id}" data-name="${client.full_name}" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => editClient(btn.dataset.id));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
        });
    }

    function setSaveButtonLoading(loading, label = 'Guardar') {
        if (!saveClientBtn) return;

        saveClientBtn.disabled = loading;
        saveClientBtn.classList.toggle('is-loading', loading);
        saveClientBtn.setAttribute('aria-busy', loading ? 'true' : 'false');

        if (saveClientText) {
            saveClientText.textContent = loading ? label : (saveClientBtn.dataset.defaultLabel || label);
        }

        if (!saveClientBtn.dataset.defaultLabel) {
            saveClientBtn.dataset.defaultLabel = 'Guardar';
        }
    }

    async function addClient(data) {
        try {
            console.log('📤 Enviando datos:', data);
            
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const responseText = await response.text();
            console.log('📥 Respuesta del servidor:', responseText);

            if (!response.ok) {
                let errorMsg;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMsg = errorData.error || 'Error desconocido';
                } catch {
                    errorMsg = responseText || 'Error al agregar cliente';
                }
                throw new Error(errorMsg);
            }

            const newClient = JSON.parse(responseText);
            showToast('Cliente agregado exitosamente', 'success');
            return newClient;
        } catch (error) {
            console.error('❌ Error en addClient:', error);
            showToast('Error al agregar cliente: ' + error.message, 'error');
            throw error;
        }
    }

    async function editClient(id) {
        try {
            const client = allClients.find(c => c.id === id);
            if (!client) {
                showToast('Cliente no encontrado', 'error');
                return;
            }

            modalTitle.textContent = 'Editar Cliente';
            clientId.value = client.id;
            document.getElementById('full_name').value = client.full_name || '';
            document.getElementById('phone').value = client.phone || '';
            document.getElementById('instagram').value = client.instagram || '';
            document.getElementById('favorite_style').value = client.favorite_style || '';
            document.getElementById('last_visit').value = client.last_visit ? client.last_visit.split('T')[0] : '';
            document.getElementById('next_visit').value = client.next_visit ? client.next_visit.split('T')[0] : '';
            modal.style.display = 'flex';
            saveClientBtn.textContent = 'Actualizar';
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al cargar el cliente', 'error');
        }
    }

    async function deleteClient(id) {
        try {
            const response = await fetch(`/api/clients/${id}`, {
                method: 'DELETE'
            });
            
            const responseText = await response.text();
            console.log('📥 Respuesta DELETE:', responseText);
            
            if (!response.ok) {
                let errorMsg;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMsg = errorData.error || 'Error desconocido';
                } catch {
                    errorMsg = responseText || 'Error al eliminar cliente';
                }
                throw new Error(errorMsg);
            }
            
            showToast('Cliente eliminado exitosamente', 'success');
            await fetchClients(searchInput.value);
            closeDeleteModalHandler();
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al eliminar cliente: ' + error.message, 'error');
        }
    }

    // ===== FUNCIONES DE UTILIDAD =====

    function formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return 'Sin fecha';
        }
    }

    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast') || createToast();
        toast.textContent = message;
        toast.style.display = 'block';
        toast.className = 'toast ' + type;
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

    // ===== MANEJADORES DE MODALES =====

    function openModal(clientData = null) {
        modal.style.display = 'flex';
        modal.classList.add('is-open');
        if (clientData) {
            modalTitle.textContent = 'Editar Cliente';
            clientId.value = clientData.id;
            document.getElementById('full_name').value = clientData.full_name || '';
            document.getElementById('phone').value = clientData.phone || '';
            document.getElementById('instagram').value = clientData.instagram || '';
            document.getElementById('favorite_style').value = clientData.favorite_style || '';
            document.getElementById('last_visit').value = clientData.last_visit ? clientData.last_visit.split('T')[0] : '';
            document.getElementById('next_visit').value = clientData.next_visit ? clientData.next_visit.split('T')[0] : '';
            saveClientBtn.dataset.defaultLabel = 'Actualizar';
            setSaveButtonLoading(false, 'Actualizar');
        } else {
            modalTitle.textContent = 'Nuevo Cliente';
            clientId.value = '';
            clientForm.reset();
            saveClientBtn.dataset.defaultLabel = 'Guardar';
            setSaveButtonLoading(false, 'Guardar');
        }
    }

    function closeModalHandler() {
        modal.classList.remove('is-open');
        modal.style.display = 'none';
        clientForm.reset();
        clientId.value = '';
        setSaveButtonLoading(false, 'Guardar');
    }

    function openDeleteModal(id, name) {
        currentDeleteId = id;
        deleteClientName.textContent = name;
        deleteModal.style.display = 'flex';
    }

    function closeDeleteModalHandler() {
        deleteModal.style.display = 'none';
        currentDeleteId = null;
    }

    // ===== EVENT LISTENERS =====

    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            fetchClients(this.value);
        }, 300);
    });

    btnClearSearch.addEventListener('click', function() {
        searchInput.value = '';
        fetchClients('');
    });

    btnAddClient.addEventListener('click', () => openModal());

    closeModal.addEventListener('click', closeModalHandler);
    cancelModal.addEventListener('click', closeModalHandler);
    closeDeleteModal.addEventListener('click', closeDeleteModalHandler);
    cancelDelete.addEventListener('click', closeDeleteModalHandler);

    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModalHandler();
    });
    deleteModal.addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModalHandler();
    });

    confirmDelete.addEventListener('click', async function() {
        if (currentDeleteId) {
            await deleteClient(currentDeleteId);
        }
    });

    clientForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (isSavingClient) {
            return;
        }
        
        const lastVisit = document.getElementById('last_visit').value;
        const nextVisit = document.getElementById('next_visit').value;
        
        const data = {
            full_name: document.getElementById('full_name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            instagram: document.getElementById('instagram').value.trim() || null,
            favorite_style: document.getElementById('favorite_style').value.trim() || null,
            last_visit: lastVisit || null,
            next_visit: nextVisit || null,
        };

        if (!data.full_name) {
            showToast('El nombre es obligatorio', 'error');
            return;
        }
        if (!data.phone) {
            showToast('El teléfono es obligatorio', 'error');
            return;
        }

        const id = clientId.value;
        
        try {
            isSavingClient = true;
            setSaveButtonLoading(true, id ? 'Actualizando' : 'Guardando');

            if (id) {
                const response = await fetch(`/api/clients/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const responseText = await response.text();
                if (!response.ok) {
                    let errorMsg;
                    try {
                        const errorData = JSON.parse(responseText);
                        errorMsg = errorData.error || 'Error desconocido';
                    } catch {
                        errorMsg = responseText || 'Error al actualizar cliente';
                    }
                    throw new Error(errorMsg);
                }
                
                showToast('Cliente actualizado exitosamente', 'success');
            } else {
                await addClient(data);
            }
            
            closeModalHandler();
            await fetchClients(searchInput.value);
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al guardar cliente: ' + error.message, 'error');
        } finally {
            isSavingClient = false;
            setSaveButtonLoading(false);
        }
    });

    // ===== INICIALIZACIÓN =====
    fetchClients();
});