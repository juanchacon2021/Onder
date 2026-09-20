// inventory.js - Gestión completa de inventario con Supabase

document.addEventListener('DOMContentLoaded', function() {
    const tbody = document.getElementById('inventoryTableBody');
    const inventoryCount = document.getElementById('inventoryCount');
    const searchInput = document.getElementById('searchProduct');
    const getAuthHeaders = () => {
        const token = localStorage.getItem('onder_token') || sessionStorage.getItem('onder_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };
    const filterLowStock = document.getElementById('filterLowStock');
    const btnClearFilters = document.getElementById('btnClearFilters');
    const btnAddProduct = document.getElementById('btnAddProduct');
    
    // Modal de producto
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const productForm = document.getElementById('productForm');
    const productId = document.getElementById('productId');
    const closeModal = document.getElementById('closeModal');
    const cancelModal = document.getElementById('cancelModal');
    const saveProductBtn = document.getElementById('saveProduct');
    
    // Modal de movimiento
    const movementModal = document.getElementById('movementModal');
    const movementProductId = document.getElementById('movementProductId');
    const movementProductName = document.getElementById('movementProductName');
    const movementForm = document.getElementById('movementForm');
    const closeMovementModal = document.getElementById('closeMovementModal');
    const cancelMovement = document.getElementById('cancelMovement');
    
    // Modal de eliminación
    const deleteModal = document.getElementById('deleteModal');
    const deleteProductName = document.getElementById('deleteProductName');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    
    let currentDeleteId = null;
    let allProducts = [];

    // ===== FUNCIONES CRUD =====

    async function fetchProducts(search = '', lowStock = false) {
        try {
            let url = '/api/inventory';
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (lowStock) params.append('lowStock', 'true');
            if (params.toString()) url += '?' + params.toString();
            
            const response = await fetch(url, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error('Error al cargar productos');
            const data = await response.json();
            allProducts = data;
            renderProducts(data);
            return data;
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al cargar productos: ' + error.message, 'error');
            return [];
        }
    }

    function renderProducts(products) {
        if (!tbody) return;
        
        if (inventoryCount) {
            inventoryCount.textContent = products.length;
        }

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="padding:40px;text-align:center;color:var(--muted);">
                        <i class="fa-solid fa-boxes" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
                        No hay productos registrados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = products.map(product => {
            const stock = product.stock || 0;
            const minStock = product.minimum_stock || 0;
            let stockStatus = 'ok';
            let stockClass = 'ok';
            
            if (stock === 0) {
                stockStatus = 'Sin stock';
                stockClass = 'low';
            } else if (stock <= minStock) {
                stockStatus = 'Bajo stock';
                stockClass = 'warning';
            } else {
                stockStatus = 'OK';
                stockClass = 'ok';
            }

            return `
                <tr>
                    <td><strong>${product.name || 'Sin nombre'}</strong></td>
                    <td>${product.category || 'Sin categoría'}</td>
                    <td><span class="stock-badge ${stockClass}">${stock}</span></td>
                    <td>${minStock}</td>
                    <td>$${formatPrice(product.purchase_price)}</td>
                    <td>$${formatPrice(product.sale_price)}</td>
                    <td>${product.supplier || 'Sin proveedor'}</td>
                    <td>
                        <span class="pill ${stockClass === 'ok' ? 'active' : 'warning'}">
                            ${stockStatus}
                        </span>
                    </td>
                    <td style="text-align:center;white-space:nowrap;">
                        <button class="btn-movement" data-id="${product.id}" data-name="${product.name}" title="Movimiento">
                            <i class="fa-solid fa-arrows-rotate"></i>
                        </button>
                        <button class="btn-edit" data-id="${product.id}" title="Editar">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-delete" data-id="${product.id}" data-name="${product.name}" title="Eliminar">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => editProduct(btn.dataset.id));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
        });
        document.querySelectorAll('.btn-movement').forEach(btn => {
            btn.addEventListener('click', () => openMovementModal(btn.dataset.id, btn.dataset.name));
        });
    }

    function formatPrice(value) {
        if (!value && value !== 0) return '0.00';
        return Number(value).toFixed(2);
    }

    async function addProduct(data) {
        try {
            console.log('📤 Enviando producto:', data);
            
            const response = await fetch('/api/inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
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
                    errorMsg = responseText || 'Error al agregar producto';
                }
                throw new Error(errorMsg);
            }

            const newProduct = JSON.parse(responseText);
            showToast('Producto agregado exitosamente', 'success');
            await fetchProducts(searchInput.value, filterLowStock.checked);
            return newProduct;
        } catch (error) {
            console.error('❌ Error:', error);
            showToast('Error al agregar producto: ' + error.message, 'error');
            throw error;
        }
    }

    async function editProduct(id) {
        try {
            const product = allProducts.find(p => p.id === id);
            if (!product) {
                showToast('Producto no encontrado', 'error');
                return;
            }

            modalTitle.textContent = 'Editar Producto';
            productId.value = product.id;
            document.getElementById('name').value = product.name || '';
            document.getElementById('category').value = product.category || '';
            document.getElementById('stock').value = product.stock || 0;
            document.getElementById('minimum_stock').value = product.minimum_stock || 0;
            document.getElementById('purchase_price').value = product.purchase_price || '';
            document.getElementById('sale_price').value = product.sale_price || '';
            document.getElementById('supplier').value = product.supplier || '';
            document.getElementById('image_url').value = product.image_url || '';
            
            modal.style.display = 'flex';
            saveProductBtn.textContent = 'Actualizar';
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al cargar el producto', 'error');
        }
    }

    async function deleteProduct(id) {
        try {
            const response = await fetch(`/api/inventory/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            const responseText = await response.text();
            
            if (!response.ok) {
                let errorMsg;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMsg = errorData.error || 'Error desconocido';
                } catch {
                    errorMsg = responseText || 'Error al eliminar producto';
                }
                throw new Error(errorMsg);
            }
            
            showToast('Producto eliminado exitosamente', 'success');
            await fetchProducts(searchInput.value, filterLowStock.checked);
            closeDeleteModalHandler();
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al eliminar producto: ' + error.message, 'error');
        }
    }

    // ===== MOVIMIENTOS DE INVENTARIO =====

    async function registerMovement(data) {
        try {
            console.log('📤 Registrando movimiento:', data);
            
            const response = await fetch('/api/inventory/movements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
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
                    errorMsg = responseText || 'Error al registrar movimiento';
                }
                throw new Error(errorMsg);
            }

            showToast('Movimiento registrado exitosamente', 'success');
            await fetchProducts(searchInput.value, filterLowStock.checked);
            return true;
        } catch (error) {
            console.error('❌ Error:', error);
            showToast('Error al registrar movimiento: ' + error.message, 'error');
            throw error;
        }
    }

    function openMovementModal(id, name) {
        movementProductId.value = id;
        movementProductName.textContent = name;
        movementForm.reset();
        movementModal.style.display = 'flex';
    }

    function closeMovementModalHandler() {
        movementModal.style.display = 'none';
        movementForm.reset();
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
            background: rgba(15, 21, 24, 0.8);
            backdrop-filter: blur(16px) saturate(1.4);
            color: var(--text);
            border: 1px solid rgba(255,255,255,0.06);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            display: none;
            z-index: 1000;
            max-width: 400px;
        `;
        document.body.appendChild(toast);
        return toast;
    }

    // ===== MANEJADORES DE MODALES =====

    function openModal(productData = null) {
        modal.style.display = 'flex';
        if (productData) {
            modalTitle.textContent = 'Editar Producto';
            productId.value = productData.id;
            document.getElementById('name').value = productData.name || '';
            document.getElementById('category').value = productData.category || '';
            document.getElementById('stock').value = productData.stock || 0;
            document.getElementById('minimum_stock').value = productData.minimum_stock || 0;
            document.getElementById('purchase_price').value = productData.purchase_price || '';
            document.getElementById('sale_price').value = productData.sale_price || '';
            document.getElementById('supplier').value = productData.supplier || '';
            document.getElementById('image_url').value = productData.image_url || '';
            saveProductBtn.textContent = 'Actualizar';
        } else {
            modalTitle.textContent = 'Nuevo Producto';
            productId.value = '';
            productForm.reset();
            saveProductBtn.textContent = 'Guardar';
        }
    }

    function closeModalHandler() {
        modal.style.display = 'none';
        productForm.reset();
        productId.value = '';
    }

    function openDeleteModal(id, name) {
        currentDeleteId = id;
        deleteProductName.textContent = name;
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
            fetchProducts(this.value, filterLowStock.checked);
        }, 300);
    });

    filterLowStock.addEventListener('change', function() {
        fetchProducts(searchInput.value, this.checked);
    });

    btnClearFilters.addEventListener('click', function() {
        searchInput.value = '';
        filterLowStock.checked = false;
        fetchProducts('', false);
    });

    btnAddProduct.addEventListener('click', () => openModal());

    closeModal.addEventListener('click', closeModalHandler);
    cancelModal.addEventListener('click', closeModalHandler);
    closeMovementModal.addEventListener('click', closeMovementModalHandler);
    cancelMovement.addEventListener('click', closeMovementModalHandler);
    closeDeleteModal.addEventListener('click', closeDeleteModalHandler);
    cancelDelete.addEventListener('click', closeDeleteModalHandler);

    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModalHandler();
    });
    movementModal.addEventListener('click', function(e) {
        if (e.target === this) closeMovementModalHandler();
    });
    deleteModal.addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModalHandler();
    });

    confirmDelete.addEventListener('click', async function() {
        if (currentDeleteId) {
            await deleteProduct(currentDeleteId);
        }
    });

    // Submit producto
    productForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const data = {
            name: document.getElementById('name').value.trim(),
            category: document.getElementById('category').value.trim() || null,
            stock: parseInt(document.getElementById('stock').value) || 0,
            minimum_stock: parseInt(document.getElementById('minimum_stock').value) || 0,
            purchase_price: parseFloat(document.getElementById('purchase_price').value) || null,
            sale_price: parseFloat(document.getElementById('sale_price').value) || null,
            supplier: document.getElementById('supplier').value.trim() || null,
            image_url: document.getElementById('image_url').value.trim() || null
        };

        if (!data.name) {
            showToast('El nombre del producto es obligatorio', 'error');
            return;
        }

        const id = productId.value;
        
        try {
            if (id) {
                const response = await fetch(`/api/inventory/${id}`, {
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
                        errorMsg = responseText || 'Error al actualizar producto';
                    }
                    throw new Error(errorMsg);
                }
                
                showToast('Producto actualizado exitosamente', 'success');
            } else {
                await addProduct(data);
            }
            
            closeModalHandler();
            await fetchProducts(searchInput.value, filterLowStock.checked);
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al guardar producto: ' + error.message, 'error');
        }
    });

    // Submit movimiento
    movementForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const data = {
            inventory_id: movementProductId.value,
            type: document.getElementById('movement_type').value,
            quantity: parseInt(document.getElementById('movement_quantity').value) || 0,
            notes: document.getElementById('movement_notes').value.trim() || null
        };

        if (data.quantity <= 0) {
            showToast('La cantidad debe ser mayor a 0', 'error');
            return;
        }

        try {
            await registerMovement(data);
            closeMovementModalHandler();
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // ===== INICIALIZACIÓN =====
    fetchProducts();
});