// clients.js - Gestión completa de clientes con Supabase

document.addEventListener('DOMContentLoaded', function() {
    const tbody = document.getElementById('clientsTableBody');
    const clientsCount = document.getElementById('clientsCount');
    const searchInput = document.getElementById('searchClient');
    const getAuthHeaders = () => {
        const token = localStorage.getItem('onder_token') || sessionStorage.getItem('onder_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };
    const btnClearSearch = document.getElementById('btnClearSearch');
    const btnAddClient = document.getElementById('btnAddClient');
    
    const modal = document.getElementById('clientModal');
    const modalTitle = document.getElementById('modalTitle');
    const clientForm = document.getElementById('clientForm');
    const clientId = document.getElementById('clientId');
    const phonePrefix = document.getElementById('phone_prefix');
    const phoneNumber = document.getElementById('phone_number');
    const closeModal = document.getElementById('closeModal');
    const cancelModal = document.getElementById('cancelModal');
    const saveClientBtn = document.getElementById('saveClient');
    
    const deleteModal = document.getElementById('deleteModal');
    const deleteClientName = document.getElementById('deleteClientName');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    const saveClientText = saveClientBtn ? saveClientBtn.querySelector('.save-text') : null;
    const whatsappModal = document.getElementById('whatsappModal');
    const whatsappForm = document.getElementById('whatsappForm');
    const whatsappPhone = document.getElementById('whatsappPhone');
    const whatsappMessage = document.getElementById('whatsappMessage');
    const whatsappClientId = document.getElementById('whatsappClientId');
    const closeWhatsappModal = document.getElementById('closeWhatsappModal');
    const cancelWhatsappModal = document.getElementById('cancelWhatsappModal');
    const sendWhatsappBtn = document.getElementById('sendWhatsappBtn');
    
    let currentDeleteId = null;
    let allClients = [];
    let isSavingClient = false;

    // ===== FUNCIONES CRUD =====

    async function fetchClients(search = '') {
        try {
            const url = search ? `/api/clients?search=${encodeURIComponent(search)}` : '/api/clients';
            const response = await fetch(url, { headers: getAuthHeaders() });
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
                    <button type="button" class="btn-whatsapp" data-whatsapp-id="${client.id}" title="Enviar WhatsApp">
                        <i class="fa-brands fa-whatsapp"></i>
                    </button>
                    <button type="button" class="btn-edit" data-id="${client.id}" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button" class="btn-delete" data-id="${client.id}" data-name="${client.full_name}" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.onclick = (event) => {
            const editButton = event.target.closest('.btn-edit');
            if (editButton) {
                editClient(editButton.dataset.id);
                return;
            }

            const deleteButton = event.target.closest('.btn-delete');
            if (deleteButton) {
                openDeleteModal(deleteButton.dataset.id, deleteButton.dataset.name);
                return;
            }

            const whatsappButton = event.target.closest('.btn-whatsapp');
            if (whatsappButton) {
                openWhatsAppModal(whatsappButton.dataset.whatsappId);
            }
        };
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
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
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

    function editClient(id) {
        try {
            const client = allClients.find(c => String(c.id) === String(id));
            if (!client) {
                showToast('Cliente no encontrado', 'error');
                return;
            }

            // openModal() ya rellena el formulario, pone el título correcto
            // y agrega la clase .is-open que hace visible el modal.
            openModal(client);
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al cargar el cliente', 'error');
        }
    }

    async function deleteClient(id) {
        try {
            const response = await fetch(`/api/clients/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
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

    // ===== UTILIDADES DE TELÉFONO (VENEZUELA) =====

    const VE_PREFIXES = ['0412', '0414', '0416', '0422', '0424', '0426'];
    const VE_COUNTRY_CODE = '58';

    // Convierte cualquier formato guardado a { prefix, number }
    function splitPhone(raw) {
        let digits = String(raw || '').replace(/\D/g, '');

        // Quita el código de país si viene en formato internacional (58...)
        if (digits.startsWith(VE_COUNTRY_CODE) && digits.length > 10) {
            digits = digits.slice(VE_COUNTRY_CODE.length);
        }
        // Normaliza a formato nacional con 0 inicial
        if (digits.length === 10 && !digits.startsWith('0')) {
            digits = '0' + digits;
        }

        const prefix = digits.slice(0, 4);
        return {
            prefix: VE_PREFIXES.includes(prefix) ? prefix : VE_PREFIXES[0],
            number: VE_PREFIXES.includes(prefix) ? digits.slice(4, 11) : digits.slice(-7)
        };
    }

    function composePhone(prefix, number) {
        return `${prefix} ${String(number).replace(/\D/g, '')}`.trim();
    }

    // 04121234567 -> 584121234567 (formato que exige wa.me)
    function toInternational(raw) {
        let digits = String(raw || '').replace(/\D/g, '');
        if (digits.startsWith(VE_COUNTRY_CODE) && digits.length >= 12) return digits;
        if (digits.startsWith('0')) digits = digits.slice(1);
        return VE_COUNTRY_CODE + digits;
    }

    function setPhoneFields(raw) {
        if (!phonePrefix || !phoneNumber) return;
        const { prefix, number } = splitPhone(raw);
        phonePrefix.value = prefix;
        phoneNumber.value = number;
    }

    phoneNumber?.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').slice(0, 7);
    });

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

    function addDaysToDate(dateString, days) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';
        date.setDate(date.getDate() + days);
        return date.toISOString().slice(0, 10);
    }

    function syncNextVisitFromLastVisit() {
        const lastVisit = document.getElementById('last_visit').value;
        const nextVisitInput = document.getElementById('next_visit');
        const currentValue = nextVisitInput.value;

        if (!lastVisit) {
            return;
        }

        if (!currentValue || currentValue === addDaysToDate(lastVisit, 15)) {
            nextVisitInput.value = addDaysToDate(lastVisit, 15);
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
            setPhoneFields(clientData.phone);
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
            setPhoneFields('');
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
        deleteClientName.textContent = name || 'este cliente';
        deleteModal.style.display = 'flex';
        deleteModal.classList.add('is-open');
    }

    function closeDeleteModalHandler() {
        deleteModal.classList.remove('is-open');
        deleteModal.style.display = 'none';
        currentDeleteId = null;
    }

    function openWhatsAppModal(clientIdValue) {
        const client = allClients.find(item => String(item.id) === String(clientIdValue));
        if (!client) return;

        whatsappClientId.value = client.id;
        whatsappPhone.value = client.phone || '';
        whatsappMessage.value = `Hola ${client.full_name || 'cliente'}, te recordamos que tu próxima cita está programada. Gracias por elegir Onder Barbershop.`;
        whatsappModal.style.display = 'flex';
        whatsappModal.classList.add('is-open');
    }

    function closeWhatsAppModalHandler() {
        whatsappModal.classList.remove('is-open');
        whatsappModal.style.display = 'none';
        whatsappForm.reset();
    }

    function sendWhatsAppMessage(event) {
        event.preventDefault();
        const phone = whatsappPhone.value.trim();
        const message = whatsappMessage.value.trim();

        if (!phone || !message) {
            showToast('Completa el número y el mensaje', 'error');
            return;
        }

        const destination = toInternational(phone);
        if (destination.length < 12) {
            showToast('El número no es válido. Usa el formato 0412 1234567', 'error');
            whatsappPhone.focus();
            return;
        }

        // window.open debe ejecutarse de forma síncrona dentro del handler,
        // de lo contrario el navegador lo bloquea como popup.
        const url = `https://wa.me/${destination}?text=${encodeURIComponent(message)}`;
        const opened = window.open(url, '_blank', 'noopener');

        if (!opened) {
            showToast('El navegador bloqueó la ventana. Permite popups para este sitio.', 'error');
            return;
        }

        showToast('Abriendo WhatsApp…', 'success');
        closeWhatsAppModalHandler();

        // Registro opcional en el backend: si falla, el mensaje igual se abrió.
        fetch('/api/notifications/whatsapp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ to: destination, message, clientId: whatsappClientId.value || null })
        }).catch((error) => console.warn('No se pudo registrar el envío:', error));
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

    document.getElementById('last_visit').addEventListener('change', syncNextVisitFromLastVisit);
    document.getElementById('next_visit').addEventListener('change', function() {
        if (!this.value && document.getElementById('last_visit').value) {
            this.value = addDaysToDate(document.getElementById('last_visit').value, 15);
        }
    });

    closeModal.addEventListener('click', closeModalHandler);
    cancelModal.addEventListener('click', closeModalHandler);
    closeDeleteModal.addEventListener('click', closeDeleteModalHandler);
    cancelDelete.addEventListener('click', closeDeleteModalHandler);
    closeWhatsappModal.addEventListener('click', closeWhatsAppModalHandler);
    cancelWhatsappModal.addEventListener('click', closeWhatsAppModalHandler);

    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModalHandler();
    });
    deleteModal.addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModalHandler();
    });
    whatsappModal.addEventListener('click', function(e) {
        if (e.target === this) closeWhatsAppModalHandler();
    });

    confirmDelete.addEventListener('click', async function() {
        if (currentDeleteId) {
            await deleteClient(currentDeleteId);
        }
    });

    whatsappForm.addEventListener('submit', sendWhatsAppMessage);

    clientForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (isSavingClient) {
            return;
        }
        
        const lastVisit = document.getElementById('last_visit').value;
        let nextVisit = document.getElementById('next_visit').value;

        if (lastVisit && !nextVisit) {
            nextVisit = addDaysToDate(lastVisit, 15);
            document.getElementById('next_visit').value = nextVisit;
        }

        const rawNumber = phoneNumber.value.replace(/\D/g, '');

        const data = {
            full_name: document.getElementById('full_name').value.trim(),
            phone: rawNumber ? composePhone(phonePrefix.value, rawNumber) : '',
            instagram: document.getElementById('instagram').value.trim() || null,
            favorite_style: document.getElementById('favorite_style').value.trim() || null,
            last_visit: lastVisit || null,
            next_visit: nextVisit || null,
        };

        if (!data.full_name) {
            showToast('El nombre es obligatorio', 'error');
            return;
        }
        if (!rawNumber) {
            showToast('El teléfono es obligatorio', 'error');
            phoneNumber.focus();
            return;
        }
        if (rawNumber.length !== 7) {
            showToast('El número debe tener 7 dígitos después del prefijo', 'error');
            phoneNumber.focus();
            return;
        }

        const id = clientId.value;
        
        try {
            isSavingClient = true;
            setSaveButtonLoading(true, id ? 'Actualizando' : 'Guardando');

            if (id) {
                const response = await fetch(`/api/clients/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                    },
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