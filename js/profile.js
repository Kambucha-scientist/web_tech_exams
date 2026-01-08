
let orders = [];
let filteredOrders = [];
let currentPage = 1;
const ORDERS_PER_PAGE = 5;
let selectedOrderId = null;


async function initProfile() {
    try {
        showLoading();
        await loadOrders();
        renderOrdersTable();
        renderOrdersPagination();
        setupEventListeners();
        hideLoading();
        
    } catch (error) {
        console.error("Ошибка инициализации:", error);
        showNotification("Не удалось загрузить данные: " + error.message, "danger");
    }
}

async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders?api_key=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        orders = await response.json();
        filteredOrders = [...orders]; 
        console.log("Загружено заявок:", orders.length);
    } catch (error) {
        console.error("Ошибка загрузки заявок:", error);
        throw error;
    }
}

// 
function showLoading() {
    const tbody = document.getElementById('orders-table-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Загрузка...</span>
                    </div>
                    <p class="mt-2">Загрузка заявок...</p>
                </td>
            </tr>
        `;
    }
    
    
    const pagination = document.getElementById('orders-pagination-container');
    if (pagination) {
        pagination.classList.add('d-none');
    }
}


function hideLoading() {
    
}


function renderOrdersTable() {
    const tbody = document.getElementById('orders-table-body');
    const noOrdersMsg = document.getElementById('no-orders-message');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (filteredOrders.length === 0) {
        if (noOrdersMsg) noOrdersMsg.classList.remove('d-none');
        return;
    }
    
    if (noOrdersMsg) noOrdersMsg.classList.add('d-none');
    
   
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE;
    const pageOrders = filteredOrders.slice(startIndex, endIndex);
    
    pageOrders.forEach((order, index) => {
        const rowNumber = startIndex + index + 1;
        const row = createOrderRow(order, rowNumber);
        tbody.appendChild(row);
    });
}


function createOrderRow(order, number) {
    const tr = document.createElement('tr');
    
 
    let orderType = "Курс";
    let orderName = `Курс #${order.course_id || '?'}`;
    
    if (order.tutor_id && !order.course_id) {
        orderType = "Репетитор";
        orderName = `Репетитор #${order.tutor_id}`;
    }
    
    let formattedDate = "Не указана";
    if (order.date_start) {
        try {
            formattedDate = new Date(order.date_start).toLocaleDateString('ru-RU');
        } catch (e) {
            formattedDate = order.date_start;
        }
    }
    
    let formattedPrice = "0 ₽";
    if (order.price) {
        formattedPrice = `${order.price.toLocaleString()} ₽`;
    }
    
    tr.innerHTML = `
        <td class="fw-bold">${number}</td>
        <td>
            <span class="badge ${orderType === 'Курс' ? 'bg-info' : 'bg-warning'}">
                ${orderType}
            </span>
        </td>
        <td>${orderName}</td>
        <td>${formattedDate}</td>
        <td class="fw-bold text-success">${formattedPrice}</td>
        <td>
            <div class="d-flex flex-wrap gap-1">
                <button class="btn btn-sm btn-info view-order-btn" 
                        data-order-id="${order.id}">
                    Подробнее
                </button>
                <button class="btn btn-sm btn-warning edit-order-btn" 
                        data-order-id="${order.id}">
                    Изменить
                </button>
                <button class="btn btn-sm btn-danger delete-order-btn" 
                        data-order-id="${order.id}">
                    Удалить
                </button>
            </div>
        </td>
    `;
    
    return tr;
}

function renderOrdersPagination() {
    const pagination = document.getElementById('orders-pagination');
    const container = document.getElementById('orders-pagination-container');
    
    if (!pagination || !container) return;
    
    pagination.innerHTML = '';
    
    const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
    if (totalPages <= 1) {
        container.classList.add('d-none');
        return;
    }
    
    container.classList.remove('d-none');
    
    const prevButton = createPaginationButton(
        'Назад',
        currentPage === 1,
        () => {
            if (currentPage > 1) {
                currentPage--;
                updateOrdersView();
            }
        }
    );
    pagination.appendChild(prevButton);
    
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = createPaginationButton(
            i,
            i === currentPage,
            () => {
                currentPage = i;
                updateOrdersView();
            },
            i === currentPage
        );
        pagination.appendChild(pageButton);
    }
    
    const nextButton = createPaginationButton(
        'Вперед',
        currentPage === totalPages,
        () => {
            if (currentPage < totalPages) {
                currentPage++;
                updateOrdersView();
            }
        }
    );
    pagination.appendChild(nextButton);
}

function createPaginationButton(text, disabled, onClick, active = false) {
    const li = document.createElement('li');
    li.className = 'page-item';
    
    if (disabled) li.classList.add('disabled');
    if (active) li.classList.add('active');
    
    const element = document.createElement(disabled || active ? 'span' : 'a');
    element.className = 'page-link';
    element.textContent = text;
    
    if (!disabled && !active) {
        element.href = '#';
        element.addEventListener('click', (e) => {
            e.preventDefault();
            onClick();
        });
    }
    
    li.appendChild(element);
    return li;
}

function updateOrdersView() {
    renderOrdersTable();
    renderOrdersPagination();
}

function setupEventListeners() {
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('view-order-btn')) {
            const orderId = e.target.getAttribute('data-order-id');
            await showOrderDetails(orderId);
        }
        
        if (e.target.classList.contains('edit-order-btn')) {
            const orderId = e.target.getAttribute('data-order-id');
            await showEditForm(orderId);
        }
        
        if (e.target.classList.contains('delete-order-btn')) {
            const orderId = e.target.getAttribute('data-order-id');
            confirmDelete(orderId);
        }
    });
    
    const saveButton = document.getElementById('save-order-changes');
    if (saveButton) {
        saveButton.addEventListener('click', saveChanges);
    }
    
    const confirmButton = document.getElementById('confirm-delete');
    if (confirmButton) {
        confirmButton.addEventListener('click', executeDelete);
    }
}

async function showOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}?api_key=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        
        const order = await response.json();
        
        document.getElementById('order-details-id').textContent = order.id;
        
        const content = document.getElementById('order-details-content');
        content.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>ID заявки:</strong> ${order.id}
                </div>
                <div class="col-md-6">
                    <strong>Дата создания:</strong> ${new Date(order.created_at).toLocaleString('ru-RU')}
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Тип:</strong> ${order.course_id ? 'Курс' : 'Репетитор'}
                </div>
                <div class="col-md-6">
                    <strong>ID:</strong> ${order.course_id || order.tutor_id}
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Дата начала:</strong> ${order.date_start || 'Не указана'}
                </div>
                <div class="col-md-6">
                    <strong>Время:</strong> ${order.time_start || 'Не указано'}
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Продолжительность:</strong> ${order.duration || 0} часов
                </div>
                <div class="col-md-6">
                    <strong>Количество человек:</strong> ${order.persons || 1}
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-12">
                    <strong>Стоимость:</strong> 
                    <span class="fs-4 text-success fw-bold">
                        ${(order.price || 0).toLocaleString()} ₽
                    </span>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-12">
                    <strong>Дополнительные опции:</strong>
                    <ul class="mt-2">
                        ${order.early_registration ? '<li>Ранняя регистрация</li>' : ''}
                        ${order.group_enrollment ? '<li>Групповая запись</li>' : ''}
                        ${order.intensive_course ? '<li>Интенсивный курс</li>' : ''}
                        ${order.supplementary ? '<li>Дополнительные материалы</li>' : ''}
                        ${order.personalized ? '<li>Индивидуальные занятия</li>' : ''}
                        ${order.excursions ? '<li>Экскурсии</li>' : ''}
                        ${order.assessment ? '<li>Оценка уровня</li>' : ''}
                        ${order.interactive ? '<li>Интерактивная платформа</li>' : ''}
                    </ul>
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
        modal.show();
        
    } catch (error) {
        console.error("Ошибка загрузки деталей:", error);
        showNotification("Не удалось загрузить детали заявки", "danger");
    }
}

async function showEditForm(orderId) {
    try {
        selectedOrderId = orderId;
        
       
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}?api_key=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        
        const order = await response.json();
        
        
        document.getElementById('order-edit-id').textContent = order.id;
        
        const form = document.getElementById('edit-order-form');
        form.innerHTML = `
            <div class="mb-3">
                <label class="form-label">Количество человек</label>
                <input type="number" class="form-control" id="edit-persons" 
                       min="1" max="20" value="${order.persons || 1}" required>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Дата начала</label>
                <input type="date" class="form-control" id="edit-date-start" 
                       value="${order.date_start || ''}" required>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Время начала</label>
                <input type="time" class="form-control" id="edit-time-start" 
                       value="${order.time_start || ''}" required>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Дополнительные опции:</label>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="edit-supplementary" 
                           ${order.supplementary ? 'checked' : ''}>
                    <label class="form-check-label">Дополнительные материалы</label>
                </div>
                
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="edit-personalized" 
                           ${order.personalized ? 'checked' : ''}>
                    <label class="form-check-label">Индивидуальные занятия</label>
                </div>
                
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="edit-excursions" 
                           ${order.excursions ? 'checked' : ''}>
                    <label class="form-check-label">Экскурсии</label>
                </div>
                
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="edit-assessment" 
                           ${order.assessment ? 'checked' : ''}>
                    <label class="form-check-label">Оценка уровня</label>
                </div>
                
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="edit-interactive" 
                           ${order.interactive ? 'checked' : ''}>
                    <label class="form-check-label">Интерактивная платформа</label>
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('orderEditModal'));
        modal.show();
        
    } catch (error) {
        console.error("Ошибка загрузки формы:", error);
        showNotification("Не удалось загрузить форму редактирования", "danger");
    }
}

async function saveChanges() {
    if (!selectedOrderId) return;
    
    try {
        const formData = {
            persons: parseInt(document.getElementById('edit-persons').value) || 1,
            date_start: document.getElementById('edit-date-start').value,
            time_start: document.getElementById('edit-time-start').value,
            supplementary: document.getElementById('edit-supplementary').checked,
            personalized: document.getElementById('edit-personalized').checked,
            excursions: document.getElementById('edit-excursions').checked,
            assessment: document.getElementById('edit-assessment').checked,
            interactive: document.getElementById('edit-interactive').checked
        };
        
        const response = await fetch(
            `${API_BASE_URL}/api/orders/${selectedOrderId}?api_key=${API_KEY}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            }
        );
        
        if (!response.ok) {
            throw new Error(`Ошибка сохранения: ${response.status}`);
        }
        
        showNotification("Изменения сохранены", "success");
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('orderEditModal'));
        modal.hide();
        
        await loadOrders();
        updateOrdersView();
        
    } catch (error) {
        console.error("Ошибка сохранения:", error);
        showNotification("Не удалось сохранить изменения", "danger");
    }
}

function confirmDelete(orderId) {
    selectedOrderId = orderId;
    document.getElementById('delete-order-id').textContent = orderId;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

async function executeDelete() {
    if (!selectedOrderId) return;
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/orders/${selectedOrderId}?api_key=${API_KEY}`,
            { method: 'DELETE' }
        );
        
        if (!response.ok) {
            throw new Error(`Ошибка удаления: ${response.status}`);
        }
        
        showNotification("Заявка удалена", "success");
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();
        
        await loadOrders();
        updateOrdersView();
        
    } catch (error) {
        console.error("Ошибка удаления:", error);
        showNotification("Не удалось удалить заявку", "danger");
    }
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfile);
} else {
    initProfile();
}