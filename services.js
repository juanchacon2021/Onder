// services.js - Gestión completa de servicios con Supabase

document.addEventListener('DOMContentLoaded', function() {
    const tbody = document.getElementById('servicesTableBody');
    const servicesCount = document.getElementById('servicesCount');
    const searchInput = document.getElementById('searchService');
    const btnClearSearch = document.getElementById('btnClearSearch');
    const btnAddService = document.getElementById('btnAddService');
    
    const modal = document.getElementById('serviceModal');
    const modalTitle = document.getElementById('modalTitle');
    const serviceForm = document.getElementById('serviceForm');
    const serviceId = document.getElementById('serviceId');
    const closeModal = document.getElementById('closeModal');
    const cancelModal = document.getElementById('cancelModal');
    const saveServiceBtn = document.getElementById('saveService');
    
    const deleteModal = document.getElementById('deleteModal');
    const deleteServiceName = document.getElementById('deleteServiceName');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    
    let currentDeleteId = null;
    let allServices = [];

    // ===== FUNCIONES CRUD =====

    async function fetchServices(search = '') {
        try {
            const url = search ? `/api/services?search=${encodeURIComponent(search)}` : '/api/services';
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al cargar servicios');
            const data = await response.json();
            allServices = data;
            renderServices(data);
            return data;
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al cargar servicios: ' + error.message, 'error');
            return [];
        }
    }

    function renderServices(services) {
        if (!tbody) return;
        
        if (servicesCount) {
            servicesCount.textContent = services.length;
        }

        if (services.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding:40px;text-align:center;color:var(--muted);">
                        <i class="fa-solid fa-cut" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
                        No hay servicios registrados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = services.map(service => `
            <tr>
                <td><strong>${service.name || 'Sin nombre'}</strong></td>
                <td style="color:var(--muted);">${service.description || 'Sin descripción'}</td>
                <td>$${formatPrice(service.price)}</td>
                <td>${service.duration_minutes || '—'} min</td>
                <td>
                    <span class="pill ${service.is_active !== false ? 'active' : 'warning'}">
                        ${service.is_active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td style="text-align:center;">
                    <button class="btn-edit" data-id="${service.id}" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-delete" data-id="${service.id}" data-name="${service.name}" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => editService(btn.dataset.id));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
        });
    }

    function formatPrice(value) {
        if (!value && value !== 0) return '0.00';
        return Number(value).toFixed(2);
    }

    async function addService(data) {
        try {
            console.log('📤 Enviando servicio:', data);
            
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const responseText = await response.text();
            console.log('📥 Respuesta:', responseText);

            if (!response.ok) {
                let errorMsg;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMsg = errorData.error || 'Error desconocido';
                } catch {
                    errorMsg = responseText || 'Error al agregar servicio';
                }
                throw new Error(errorMsg);
            }

            const newService = JSON.parse(responseText);
            showToast('Servicio agregado exitosamente', 'success');
            await fetchServices(searchInput.value);
            return newService;
        } catch (error) {
            console.error('❌ Error:', error);
            showToast('Error al agregar servicio: ' + error.message, 'error');
            throw error;
        }
    }

    async function editService(id) {
        try {
            const service = allServices.find(s => s.id === id);
            if (!service) {
                showToast('Servicio no encontrado', 'error');
                return;
            }

            modalTitle.textContent = 'Editar Servicio';
            serviceId.value = service.id;
            document.getElementById('name').value = service.name || '';
            document.getElementById('description').value = service.description || '';
            document.getElementById('price').value = service.price || '';
            document.getElementById('duration_minutes').value = service.duration_minutes || '';
            document.getElementById('is_active').value = service.is_active !== false ? 'true' : 'false';
            
            modal.style.display = 'flex';
            saveServiceBtn.textContent = 'Actualizar';
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al cargar el servicio', 'error');
        }
    }

    async function deleteService(id) {
        try {
            const response = await fetch(`/api/services/${id}`, {
                method: 'DELETE'
            });
            
            const responseText = await response.text();
            
            if (!response.ok) {
                let errorMsg;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMsg = errorData.error || 'Error desconocido';
                } catch {
                    errorMsg = responseText || 'Error al eliminar servicio';
                }
                throw new Error(errorMsg);
            }
            
            showToast('Servicio eliminado exitosamente', 'success');
            await fetchServices(searchInput.value);
            closeDeleteModalHandler();
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al eliminar servicio: ' + error.message, 'error');
        }
    }

    // ===== FUNCIONES DE UTILIDAD =====

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

    function openModal(serviceData = null) {
        modal.style.display = 'flex';
        if (serviceData) {
            modalTitle.textContent = 'Editar Servicio';
            serviceId.value = serviceData.id;
            document.getElementById('name').value = serviceData.name || '';
            document.getElementById('description').value = serviceData.description || '';
            document.getElementById('price').value = serviceData.price || '';
            document.getElementById('duration_minutes').value = serviceData.duration_minutes || '';
            document.getElementById('is_active').value = serviceData.is_active !== false ? 'true' : 'false';
            saveServiceBtn.textContent = 'Actualizar';
        } else {
            modalTitle.textContent = 'Nuevo Servicio';
            serviceId.value = '';
            serviceForm.reset();
            document.getElementById('is_active').value = 'true';
            saveServiceBtn.textContent = 'Guardar';
        }
    }

    function closeModalHandler() {
        modal.style.display = 'none';
        serviceForm.reset();
        serviceId.value = '';
    }

    function openDeleteModal(id, name) {
        currentDeleteId = id;
        deleteServiceName.textContent = name;
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
            fetchServices(this.value);
        }, 300);
    });

    btnClearSearch.addEventListener('click', function() {
        searchInput.value = '';
        fetchServices('');
    });

    btnAddService.addEventListener('click', () => openModal());

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
            await deleteService(currentDeleteId);
        }
    });

    serviceForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const data = {
            name: document.getElementById('name').value.trim(),
            description: document.getElementById('description').value.trim() || null,
            price: parseFloat(document.getElementById('price').value) || 0,
            duration_minutes: parseInt(document.getElementById('duration_minutes').value) || null,
            is_active: document.getElementById('is_active').value === 'true'
        };

        if (!data.name) {
            showToast('El nombre del servicio es obligatorio', 'error');
            return;
        }
        if (data.price <= 0) {
            showToast('El precio debe ser mayor a 0', 'error');
            return;
        }

        const id = serviceId.value;
        
        try {
            if (id) {
                const response = await fetch(`/api/services/${id}`, {
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
                        errorMsg = responseText || 'Error al actualizar servicio';
                    }
                    throw new Error(errorMsg);
                }
                
                showToast('Servicio actualizado exitosamente', 'success');
            } else {
                await addService(data);
            }
            
            closeModalHandler();
            await fetchServices(searchInput.value);
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al guardar servicio: ' + error.message, 'error');
        }
    });

    // ===== INICIALIZACIÓN =====
    fetchServices();
});