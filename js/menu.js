/* ===== Menu & Food Order Module ===== */

const MENU_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Beverages', 'Snacks'];

const ORDER_TRANSITIONS = {
  pending:   ['preparing', 'cancelled'],
  preparing: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

// ── Validation ──
function validateMenuItemForm(data) {
  const errors = {};
  if (!data.name || data.name.trim().length < 1 || data.name.trim().length > 100)
    errors.name = 'Name must be 1–100 characters.';
  if (!MENU_CATEGORIES.includes(data.category))
    errors.category = 'Please select a valid category.';
  const price = parseFloat(data.price);
  if (isNaN(price) || price <= 0 || price > 9999.99)
    errors.price = 'Price must be greater than $0 and at most $9999.99.';
  if (!data.description || data.description.trim().length < 1 || data.description.trim().length > 500)
    errors.description = 'Description must be 1–500 characters.';
  return { valid: Object.keys(errors).length === 0, errors };
}

function validateFoodOrderForm(data) {
  const errors = {};
  if (!data.guestName || data.guestName.trim().length < 1 || data.guestName.trim().length > 100)
    errors.guestName = 'Please enter your name (1–100 characters).';
  if (!data.roomNumber || !/^\d{1,4}$/.test(data.roomNumber.trim()))
    errors.roomNumber = 'Please enter a valid room number (1–4 digits).';
  if (!data.items || data.items.length === 0)
    errors.items = 'Please select at least one menu item.';
  return { valid: Object.keys(errors).length === 0, errors };
}

function calculateOrderTotal(items) {
  const raw = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return Math.round(raw * 100) / 100;
}

function canTransitionOrder(current, next) {
  return (ORDER_TRANSITIONS[current] || []).includes(next);
}

// ── Image helper ──
// Reads a File object and returns a Promise<base64 dataURL>
function readImageAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

// ── HTML Builders ──
function renderMenuItemCard(item, adminMode) {
  const availClass = item.status === 'available' ? 'available' : 'unavailable';
  const toggleLabel = item.status === 'available' ? 'Mark Unavailable' : 'Mark Available';
  const imgHtml = item.image
    ? `<div class="menu-item-img" style="background-image:url('${item.image}')"></div>`
    : `<div class="menu-item-img menu-item-img-placeholder">🍽️</div>`;
  const adminControls = adminMode ? `
    <div class="menu-item-actions">
      <button class="btn btn-secondary btn-icon" onclick="window.toggleMenuItemAvailability('${item.id}')">${toggleLabel}</button>
      <button class="btn btn-warning btn-icon" onclick="window.editMenuItem('${item.id}')">Edit</button>
      <button class="btn btn-danger btn-icon" onclick="window.deleteMenuItem('${item.id}')">Delete</button>
    </div>` : '';
  return `
    <div class="menu-item-card ${availClass}">
      ${imgHtml}
      <div class="menu-item-body">
        <div class="menu-item-header">
          <h4>${item.name}</h4>
          <span class="menu-item-price">${formatCurrency(item.price)}</span>
        </div>
        <p class="menu-item-desc">${item.description}</p>
        ${adminMode ? `<span class="status-pill ${item.status}">${item.status}</span>` : ''}
        ${adminControls}
      </div>
    </div>`;
}

// ── Guest Menu Rendering ──
function renderGuestMenu() {
  const container = document.getElementById('guestMenuDisplay');
  if (!container) return;

  let items;
  try {
    items = Storage.getMenuItems();
  } catch (e) {
    container.innerHTML = '<p class="empty-state">Unable to load the menu at this time.</p>';
    return;
  }

  const available = items.filter(i => i.status === 'available');
  if (available.length === 0) {
    container.innerHTML = '<p class="empty-state">Our menu is temporarily unavailable. Please check back soon.</p>';
    return;
  }

  let html = '';
  MENU_CATEGORIES.forEach(cat => {
    const catItems = available.filter(i => i.category === cat);
    if (catItems.length === 0) return;
    html += `<div class="menu-category-group">
      <h3 class="menu-category-title">${cat}</h3>
      <div class="menu-items-grid">
        ${catItems.map(i => renderMenuItemCard(i, false)).join('')}
      </div>
    </div>`;
  });
  container.innerHTML = html;

  // Populate order form item list
  renderFoodOrderItemList(available);
}

function renderFoodOrderItemList(availableItems) {
  const list = document.getElementById('orderItemsList');
  if (!list) return;
  list.innerHTML = availableItems.map(item => `
    <div class="order-item-row" data-id="${item.id}" data-price="${item.price}" data-name="${item.name}">
      <span class="order-item-name">${item.name} <span class="text-muted">(${formatCurrency(item.price)})</span></span>
      <div class="qty-control">
        <button type="button" class="btn btn-secondary btn-icon qty-btn" data-action="dec" data-id="${item.id}">−</button>
        <input type="number" class="qty-input" id="qty-${item.id}" value="0" min="0" max="99" readonly>
        <button type="button" class="btn btn-secondary btn-icon qty-btn" data-action="inc" data-id="${item.id}">+</button>
      </div>
    </div>`).join('');
  updateOrderTotal();
}

function updateOrderTotal() {
  const totalEl = document.getElementById('orderTotalDisplay');
  if (!totalEl) return;
  const items = getSelectedOrderItems();
  const total = calculateOrderTotal(items);
  totalEl.textContent = items.length > 0 ? `Total: ${formatCurrency(total)}` : '';
}

function getSelectedOrderItems() {
  const rows = document.querySelectorAll('.order-item-row');
  const items = [];
  rows.forEach(row => {
    const qty = parseInt(row.querySelector('.qty-input').value, 10);
    if (qty > 0) {
      items.push({
        menuItemId: row.dataset.id,
        name: row.dataset.name,
        price: parseFloat(row.dataset.price),
        qty
      });
    }
  });
  return items;
}

// ── Admin Menu Rendering ──
function renderAdminMenu() {
  renderAdminMenuItems();
  renderAdminFoodOrders();
  renderMenuBadge();
}

function renderAdminMenuItems() {
  const container = document.getElementById('adminMenuItemsContainer');
  if (!container) return;
  const items = Storage.getMenuItems();
  if (items.length === 0) {
    container.innerHTML = '<p class="empty-state">No menu items yet. Add one above.</p>';
    return;
  }
  let html = '';
  MENU_CATEGORIES.forEach(cat => {
    const catItems = items.filter(i => i.category === cat);
    if (catItems.length === 0) return;
    html += `<div class="menu-category-group">
      <h3 class="menu-category-title">${cat}</h3>
      <div class="menu-items-grid">
        ${catItems.map(i => renderMenuItemCard(i, true)).join('')}
      </div>
    </div>`;
  });
  container.innerHTML = html || '<p class="empty-state">No menu items yet.</p>';
}

function renderAdminFoodOrders() {
  const activeContainer = document.getElementById('adminActiveOrders');
  const completedContainer = document.getElementById('adminCompletedOrders');
  if (!activeContainer || !completedContainer) return;

  const orders = Storage.getFoodOrders().slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const active = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const completed = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  activeContainer.innerHTML = active.length
    ? active.map(o => renderOrderRow(o)).join('')
    : '<p class="empty-state">No active orders.</p>';

  completedContainer.innerHTML = completed.length
    ? completed.map(o => renderOrderRow(o)).join('')
    : '<p class="text-muted" style="padding:1rem">No completed orders yet.</p>';
}

function renderOrderRow(order) {
  const itemsSummary = order.items.map(i => `${i.name} ×${i.qty}`).join(', ');
  const nextActions = getOrderActions(order.status);
  return `
    <div class="order-row">
      <div class="order-row-info">
        <strong>${order.id}</strong>
        <span class="text-muted">${order.guestName} · Room ${order.roomNumber}</span>
        <span class="text-muted">${itemsSummary}</span>
        <span><strong>${formatCurrency(order.total)}</strong></span>
        <span class="status-pill ${order.status}">${order.status}</span>
        <span class="text-muted">${new Date(order.createdAt).toLocaleString()}</span>
      </div>
      <div class="order-row-actions">
        ${nextActions.map(a => `<button class="btn btn-sm ${a.cls}" onclick="window.updateOrderStatus('${order.id}','${a.status}')">${a.label}</button>`).join('')}
      </div>
    </div>`;
}

function getOrderActions(status) {
  const map = {
    pending:   [{ status: 'preparing', label: 'Start Preparing', cls: 'btn-info' }, { status: 'cancelled', label: 'Cancel', cls: 'btn-danger' }],
    preparing: [{ status: 'delivered', label: 'Mark Delivered', cls: 'btn-success' }, { status: 'cancelled', label: 'Cancel', cls: 'btn-danger' }],
    delivered: [],
    cancelled: []
  };
  return map[status] || [];
}

// ── Badge ──
function renderMenuBadge() {
  const badge = document.getElementById('menuBadge');
  if (!badge) return;
  const count = Storage.getFoodOrders().filter(o => o.status === 'pending').length;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline';
  } else {
    badge.style.display = 'none';
  }
}

// ── Window-Exposed CRUD ──
window.deleteMenuItem = function(id) {
  const orders = Storage.getFoodOrders();
  const activeOrders = orders.filter(o => (o.status === 'pending' || o.status === 'preparing') && o.items.some(i => i.menuItemId === id));
  if (activeOrders.length > 0) {
    showModal(`
      <h3>Warning</h3>
      <p>This item has <strong>${activeOrders.length}</strong> active order(s). Deleting it will not cancel those orders.</p>
      <div style="display:flex;gap:1rem;margin-top:1.5rem">
        <button class="btn btn-danger btn-block" onclick="window._confirmDeleteMenuItem('${id}')">Delete Anyway</button>
        <button class="btn btn-secondary btn-block" onclick="closeModal()">Cancel</button>
      </div>`);
    return;
  }
  window._confirmDeleteMenuItem(id);
};

window._confirmDeleteMenuItem = function(id) {
  Storage.update(data => { data.menuItems = data.menuItems.filter(i => i.id !== id); return data; });
  closeModal();
  renderAdminMenu();
  renderGuestMenu();
  showToast('Menu item deleted.', 'info');
};

window.editMenuItem = function(id) {
  const item = Storage.getMenuItems().find(i => i.id === id);
  if (!item) return;
  const catOptions = MENU_CATEGORIES.map(c => `<option value="${c}" ${c === item.category ? 'selected' : ''}>${c}</option>`).join('');
  const currentImg = item.image
    ? `<div style="margin-bottom:0.5rem"><img src="${item.image}" alt="Current" style="width:100%;height:140px;object-fit:cover;border-radius:var(--radius-sm)"></div>`
    : `<div class="menu-img-placeholder-small">No image set</div>`;
  showModal(`
    <h3>Edit Menu Item</h3>
    <form id="editMenuItemForm">
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="editItemName" value="${item.name}" maxlength="100">
        <span class="form-error" id="err-editItemName"></span>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select id="editItemCategory">${catOptions}</select>
      </div>
      <div class="form-group">
        <label>Price ($)</label>
        <input type="number" id="editItemPrice" value="${item.price}" step="0.01" min="0.01" max="9999.99">
        <span class="form-error" id="err-editItemPrice"></span>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="editItemDesc" rows="3" maxlength="500">${item.description}</textarea>
        <span class="form-error" id="err-editItemDesc"></span>
      </div>
      <div class="form-group">
        <label>Photo</label>
        ${currentImg}
        <label class="img-upload-label" for="editItemImage">
          <span>📷 Choose from gallery</span>
          <input type="file" id="editItemImage" accept="image/*" style="display:none">
        </label>
        <div id="editItemImagePreview" style="margin-top:0.5rem"></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Save Changes</button>
    </form>`);

  // Live preview when a file is chosen
  document.getElementById('editItemImage').addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;
    const dataUrl = await readImageAsDataURL(file);
    document.getElementById('editItemImagePreview').innerHTML =
      `<img src="${dataUrl}" alt="Preview" style="width:100%;height:140px;object-fit:cover;border-radius:var(--radius-sm)">`;
  });

  document.getElementById('editMenuItemForm').addEventListener('submit', async e => {
    e.preventDefault();
    const formData = {
      name: document.getElementById('editItemName').value,
      category: document.getElementById('editItemCategory').value,
      price: document.getElementById('editItemPrice').value,
      description: document.getElementById('editItemDesc').value
    };
    const { valid, errors } = validateMenuItemForm(formData);
    ['name', 'price', 'description'].forEach(f => {
      document.getElementById(`err-editItem${f.charAt(0).toUpperCase() + f.slice(1)}`).textContent = errors[f] || '';
    });
    if (!valid) return;

    // Read new image if one was selected
    let imageData = item.image || '';
    const fileInput = document.getElementById('editItemImage');
    if (fileInput.files[0]) {
      try { imageData = await readImageAsDataURL(fileInput.files[0]); } catch (_) {}
    }

    Storage.update(data => {
      const idx = data.menuItems.findIndex(i => i.id === id);
      if (idx !== -1) {
        data.menuItems[idx] = {
          ...data.menuItems[idx],
          name: formData.name.trim(),
          category: formData.category,
          price: parseFloat(formData.price),
          description: formData.description.trim(),
          image: imageData
        };
      }
      return data;
    });
    closeModal();
    renderAdminMenu();
    renderGuestMenu();
    showToast('Menu item updated.', 'success');
  });
};

window.toggleMenuItemAvailability = function(id) {
  Storage.update(data => {
    const item = data.menuItems.find(i => i.id === id);
    if (item) item.status = item.status === 'available' ? 'unavailable' : 'available';
    return data;
  });
  renderAdminMenu();
  renderGuestMenu();
  showToast('Item availability updated.', 'info');
};

window.updateOrderStatus = function(id, newStatus) {
  const order = Storage.getFoodOrders().find(o => o.id === id);
  if (!order) return;
  if (!canTransitionOrder(order.status, newStatus)) {
    showToast(`Cannot transition from "${order.status}" to "${newStatus}".`, 'error');
    return;
  }
  Storage.update(data => {
    const o = data.foodOrders.find(x => x.id === id);
    if (o) o.status = newStatus;
    return data;
  });
  renderAdminMenu();
  renderMenuBadge();
  if (document.getElementById('tab-dashboard').classList.contains('active')) renderDashboard();
  showToast(`Order ${newStatus}.`, 'success');
};

// ── Add Item Form ──
function bindMenuEvents() {
  const addForm = document.getElementById('addMenuItemForm');
  if (addForm) {
    // Live image preview for add form
    const imgInput = document.getElementById('newItemImage');
    if (imgInput) {
      imgInput.addEventListener('change', async function() {
        const file = this.files[0];
        if (!file) return;
        const dataUrl = await readImageAsDataURL(file);
        document.getElementById('newItemImagePreview').innerHTML =
          `<img src="${dataUrl}" alt="Preview" style="width:100%;height:150px;object-fit:cover;border-radius:var(--radius-sm);margin-top:0.5rem">`;
      });
    }

    addForm.addEventListener('submit', async e => {
      e.preventDefault();
      const formData = {
        name: document.getElementById('newItemName').value,
        category: document.getElementById('newItemCategory').value,
        price: document.getElementById('newItemPrice').value,
        description: document.getElementById('newItemDesc').value
      };
      const { valid, errors } = validateMenuItemForm(formData);
      document.getElementById('err-newItemName').textContent = errors.name || '';
      document.getElementById('err-newItemPrice').textContent = errors.price || '';
      document.getElementById('err-newItemDesc').textContent = errors.description || '';
      if (!valid) return;

      // Read image if provided
      let imageData = '';
      const fileInput = document.getElementById('newItemImage');
      if (fileInput && fileInput.files[0]) {
        try { imageData = await readImageAsDataURL(fileInput.files[0]); } catch (_) {}
      }

      let newId = Storage.generateId('mi');
      const allItems = Storage.getMenuItems();
      while (allItems.some(i => i.id === newId)) newId = Storage.generateId('mi');

      const newItem = {
        id: newId,
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description.trim(),
        image: imageData,
        status: 'available',
        createdAt: new Date().toISOString()
      };
      try {
        Storage.update(data => { data.menuItems.push(newItem); return data; });
        addForm.reset();
        document.getElementById('newItemImagePreview').innerHTML = '';
        renderAdminMenu();
        renderGuestMenu();
        showToast('Menu item added.', 'success');
      } catch (err) {
        showToast('Failed to save. Please try again.', 'error');
      }
    });
  }

  // Food order form
  const orderForm = document.getElementById('foodOrderForm');
  if (orderForm) {
    // Quantity buttons
    document.addEventListener('click', e => {
      const btn = e.target.closest('.qty-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      const input = document.getElementById(`qty-${id}`);
      if (!input) return;
      let val = parseInt(input.value, 10);
      if (btn.dataset.action === 'inc') val = Math.min(99, val + 1);
      if (btn.dataset.action === 'dec') val = Math.max(0, val - 1);
      input.value = val;
      updateOrderTotal();
    });

    orderForm.addEventListener('submit', e => {
      e.preventDefault();
      const guestName = document.getElementById('orderGuestName').value;
      const roomNumber = document.getElementById('orderRoomNumber').value;
      const bookingCode = document.getElementById('orderBookingCode')?.value || '';
      const items = getSelectedOrderItems();

      const { valid, errors } = validateFoodOrderForm({ guestName, roomNumber, items });
      document.getElementById('err-orderGuestName').textContent = errors.guestName || '';
      document.getElementById('err-orderRoomNumber').textContent = errors.roomNumber || '';
      document.getElementById('err-orderItems').textContent = errors.items || '';
      if (!valid) return;

      let newId = Storage.generateId('fo');
      const allOrders = Storage.getFoodOrders();
      while (allOrders.some(o => o.id === newId)) newId = Storage.generateId('fo');

      const order = {
        id: newId,
        guestName: guestName.trim(),
        roomNumber: roomNumber.trim(),
        items,
        total: calculateOrderTotal(items),
        status: 'pending',
        bookingCode: bookingCode.trim(),
        createdAt: new Date().toISOString()
      };

      try {
        Storage.update(data => { data.foodOrders.push(order); return data; });
        // Show confirmation
        document.getElementById('orderConfirmation').innerHTML = `
          <div class="order-confirm-box">
            <p>✓ Order placed! Your order ID is <strong>${newId}</strong>.</p>
            <p class="text-muted">Estimated delivery: 30–45 minutes.</p>
          </div>`;
        // Reset form
        orderForm.reset();
        document.querySelectorAll('.qty-input').forEach(inp => inp.value = 0);
        updateOrderTotal();
        renderMenuBadge();
        showToast('Food order placed successfully!', 'success');
      } catch (err) {
        showToast('Failed to place order. Please try again.', 'error');
      }
    });
  }
}
