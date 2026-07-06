/* ===== Services & Service Request Module ===== */

const REQUEST_TRANSITIONS = {
  pending:      ['in-progress', 'cancelled'],
  'in-progress': ['completed', 'cancelled'],
  completed:    [],
  cancelled:    []
};

// ── Helpers ──
function formatServicePrice(price) {
  return price === 0 ? 'Complimentary' : formatCurrency(price);
}

function canTransitionRequest(current, next) {
  return (REQUEST_TRANSITIONS[current] || []).includes(next);
}

// ── Validation ──
function validateServiceForm(data) {
  const errors = {};
  if (!data.name || data.name.trim().length < 1 || data.name.trim().length > 100)
    errors.name = 'Name must be 1–100 characters.';
  if (!data.description || data.description.trim().length < 1 || data.description.trim().length > 500)
    errors.description = 'Description must be 1–500 characters.';
  const price = parseFloat(data.price);
  if (isNaN(price) || price < 0 || price > 9999.99)
    errors.price = 'Price must be $0 or more (max $9999.99).';
  return { valid: Object.keys(errors).length === 0, errors };
}

function validateServiceRequestForm(data) {
  const errors = {};
  if (!data.guestName || data.guestName.trim().length < 1 || data.guestName.trim().length > 100)
    errors.guestName = 'Please enter your name (1–100 characters).';
  const roomNum = parseInt(data.roomNumber, 10);
  if (!data.roomNumber || isNaN(roomNum) || roomNum < 1 || roomNum > 9999)
    errors.roomNumber = 'Please enter a valid room number (1–9999).';
  if (!data.serviceId)
    errors.serviceId = 'Please select a service.';
  return { valid: Object.keys(errors).length === 0, errors };
}

// ── HTML Builders ──
function renderServiceCard(service, adminMode) {
  const priceDisplay = formatServicePrice(service.price);
  const statusBadge = adminMode
    ? `<span class="status-pill ${service.status === 'active' ? 'confirmed' : 'cancelled'}">${service.status}</span>`
    : '';
  const adminControls = adminMode ? `
    <div class="menu-item-actions">
      <button class="btn btn-secondary btn-icon" onclick="window.toggleServiceStatus('${service.id}')">
        ${service.status === 'active' ? 'Deactivate' : 'Activate'}
      </button>
      <button class="btn btn-warning btn-icon" onclick="window.editService('${service.id}')">Edit</button>
      <button class="btn btn-danger btn-icon" onclick="window.deleteService('${service.id}')">Delete</button>
    </div>` : '';
  return `
    <div class="service-card">
      <div class="service-card-body">
        <div class="menu-item-header">
          <h4>${service.name}</h4>
          <span class="menu-item-price ${service.price === 0 ? 'complimentary' : ''}">${priceDisplay}</span>
        </div>
        <p class="menu-item-desc">${service.description}</p>
        ${statusBadge}
        ${adminControls}
      </div>
    </div>`;
}

// ── Guest Services Rendering ──
function renderGuestServices() {
  const container = document.getElementById('guestServicesDisplay');
  if (!container) return;

  const services = Storage.getServices();
  const active = services.filter(s => s.status === 'active');

  if (active.length === 0) {
    container.innerHTML = '<p class="empty-state">No services are currently available. Please contact the front desk for assistance.</p>';
  } else {
    container.innerHTML = `<div class="service-cards-grid">${active.map(s => renderServiceCard(s, false)).join('')}</div>`;
  }

  // Populate service selector in request form
  const select = document.getElementById('serviceSelect');
  if (select) {
    select.innerHTML = '<option value="">— Select a service —</option>' +
      active.map(s => `<option value="${s.id}" data-name="${s.name}">${s.name} (${formatServicePrice(s.price)})</option>`).join('');
  }
}

// ── Admin Services Rendering ──
function renderAdminServices() {
  renderAdminServicesList();
  renderAdminServiceRequests();
  renderServicesBadge();
}

function renderAdminServicesList() {
  const container = document.getElementById('adminServicesContainer');
  if (!container) return;
  const services = Storage.getServices().slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (services.length === 0) {
    container.innerHTML = '<p class="empty-state">No services yet. Add one above.</p>';
    return;
  }
  container.innerHTML = `<div class="service-cards-grid">${services.map(s => renderServiceCard(s, true)).join('')}</div>`;
}

function renderAdminServiceRequests() {
  const container = document.getElementById('adminServiceRequestsContainer');
  if (!container) return;

  const requests = Storage.getServiceRequests().slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (requests.length === 0) {
    container.innerHTML = '<p class="empty-state">No service requests yet.</p>';
    return;
  }

  container.innerHTML = requests.map(r => {
    const actions = getRequestActions(r.status);
    return `
      <div class="order-row">
        <div class="order-row-info">
          <strong>${r.id}</strong>
          <span class="text-muted">${r.guestName} · Room ${r.roomNumber}</span>
          <span><strong>${r.serviceName}</strong></span>
          <span class="text-muted">Instructions: ${r.instructions || 'None'}</span>
          <span class="status-pill ${r.status.replace('-', '')}">${r.status}</span>
          <span class="text-muted">${new Date(r.createdAt).toLocaleString()}</span>
        </div>
        <div class="order-row-actions">
          ${actions.map(a => `<button class="btn btn-sm ${a.cls}" onclick="window.updateRequestStatus('${r.id}','${a.status}')">${a.label}</button>`).join('')}
        </div>
      </div>`;
  }).join('');
}

function getRequestActions(status) {
  const map = {
    pending:      [{ status: 'in-progress', label: 'Start', cls: 'btn-info' }, { status: 'cancelled', label: 'Cancel', cls: 'btn-danger' }],
    'in-progress': [{ status: 'completed', label: 'Complete', cls: 'btn-success' }, { status: 'cancelled', label: 'Cancel', cls: 'btn-danger' }],
    completed:    [],
    cancelled:    []
  };
  return map[status] || [];
}

// ── Badge ──
function renderServicesBadge() {
  const badge = document.getElementById('servicesBadge');
  if (!badge) return;
  const count = Storage.getServiceRequests().filter(r => r.status === 'pending').length;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline';
  } else {
    badge.style.display = 'none';
  }
}

// ── Window-Exposed CRUD ──
window.deleteService = function(id) {
  const active = Storage.getServiceRequests().filter(r => (r.status === 'pending' || r.status === 'in-progress') && r.serviceId === id);
  if (active.length > 0) {
    showModal(`
      <h3>Warning</h3>
      <p>This service has <strong>${active.length}</strong> active request(s). Are you sure you want to delete it?</p>
      <div style="display:flex;gap:1rem;margin-top:1.5rem">
        <button class="btn btn-danger btn-block" onclick="window._confirmDeleteService('${id}')">Delete Anyway</button>
        <button class="btn btn-secondary btn-block" onclick="closeModal()">Cancel</button>
      </div>`);
    return;
  }
  window._confirmDeleteService(id);
};

window._confirmDeleteService = function(id) {
  Storage.update(data => { data.services = data.services.filter(s => s.id !== id); return data; });
  closeModal();
  renderAdminServices();
  renderGuestServices();
  showToast('Service deleted.', 'info');
};

window.editService = function(id) {
  const svc = Storage.getServices().find(s => s.id === id);
  if (!svc) return;
  showModal(`
    <h3>Edit Service</h3>
    <form id="editServiceForm">
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="editSvcName" value="${svc.name}" maxlength="100">
        <span class="form-error" id="err-editSvcName"></span>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="editSvcDesc" rows="3" maxlength="500">${svc.description}</textarea>
        <span class="form-error" id="err-editSvcDesc"></span>
      </div>
      <div class="form-group">
        <label>Price ($) — Enter 0 for Complimentary</label>
        <input type="number" id="editSvcPrice" value="${svc.price}" step="0.01" min="0" max="9999.99">
        <span class="form-error" id="err-editSvcPrice"></span>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Save Changes</button>
    </form>`);
  document.getElementById('editServiceForm').addEventListener('submit', e => {
    e.preventDefault();
    const formData = {
      name: document.getElementById('editSvcName').value,
      description: document.getElementById('editSvcDesc').value,
      price: document.getElementById('editSvcPrice').value
    };
    const { valid, errors } = validateServiceForm(formData);
    document.getElementById('err-editSvcName').textContent = errors.name || '';
    document.getElementById('err-editSvcDesc').textContent = errors.description || '';
    document.getElementById('err-editSvcPrice').textContent = errors.price || '';
    if (!valid) return;
    Storage.update(data => {
      const idx = data.services.findIndex(s => s.id === id);
      if (idx !== -1) {
        data.services[idx] = { ...data.services[idx], name: formData.name.trim(), description: formData.description.trim(), price: parseFloat(formData.price) };
      }
      return data;
    });
    closeModal();
    renderAdminServices();
    renderGuestServices();
    showToast('Service updated.', 'success');
  });
};

window.toggleServiceStatus = function(id) {
  Storage.update(data => {
    const svc = data.services.find(s => s.id === id);
    if (svc) svc.status = svc.status === 'active' ? 'inactive' : 'active';
    return data;
  });
  renderAdminServices();
  renderGuestServices();
  showToast('Service status updated.', 'info');
};

window.updateRequestStatus = function(id, newStatus) {
  const req = Storage.getServiceRequests().find(r => r.id === id);
  if (!req) return;
  if (!canTransitionRequest(req.status, newStatus)) {
    showToast(`Cannot transition from "${req.status}" to "${newStatus}".`, 'error');
    return;
  }
  Storage.update(data => {
    const r = data.serviceRequests.find(x => x.id === id);
    if (r) r.status = newStatus;
    return data;
  });
  renderAdminServices();
  renderServicesBadge();
  if (document.getElementById('tab-dashboard').classList.contains('active')) renderDashboard();
  showToast(`Request ${newStatus}.`, 'success');
};

// ── Bind Events ──
function bindServicesEvents() {
  const addForm = document.getElementById('addServiceForm');
  if (addForm) {
    addForm.addEventListener('submit', e => {
      e.preventDefault();
      const formData = {
        name: document.getElementById('newSvcName').value,
        description: document.getElementById('newSvcDesc').value,
        price: document.getElementById('newSvcPrice').value
      };
      const { valid, errors } = validateServiceForm(formData);
      document.getElementById('err-newSvcName').textContent = errors.name || '';
      document.getElementById('err-newSvcDesc').textContent = errors.description || '';
      document.getElementById('err-newSvcPrice').textContent = errors.price || '';
      if (!valid) return;

      let newId = Storage.generateId('svc');
      const allSvcs = Storage.getServices();
      while (allSvcs.some(s => s.id === newId)) newId = Storage.generateId('svc');

      const newSvc = {
        id: newId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        status: 'active',
        createdAt: new Date().toISOString()
      };
      try {
        Storage.update(data => { data.services.push(newSvc); return data; });
        addForm.reset();
        renderAdminServices();
        renderGuestServices();
        showToast('Service added.', 'success');
      } catch (err) {
        showToast('Failed to save. Please try again.', 'error');
      }
    });
  }

  const reqForm = document.getElementById('serviceRequestForm');
  if (reqForm) {
    reqForm.addEventListener('submit', e => {
      e.preventDefault();
      const guestName = document.getElementById('reqGuestName').value;
      const roomNumber = document.getElementById('reqRoomNumber').value;
      const serviceId = document.getElementById('serviceSelect').value;
      const instructions = document.getElementById('reqInstructions')?.value || '';
      const bookingCode = document.getElementById('reqBookingCode')?.value || '';

      const { valid, errors } = validateServiceRequestForm({ guestName, roomNumber, serviceId });
      document.getElementById('err-reqGuestName').textContent = errors.guestName || '';
      document.getElementById('err-reqRoomNumber').textContent = errors.roomNumber || '';
      document.getElementById('err-serviceSelect').textContent = errors.serviceId || '';
      if (!valid) return;

      const svc = Storage.getServices().find(s => s.id === serviceId);

      let newId = Storage.generateId('sr');
      const allReqs = Storage.getServiceRequests();
      while (allReqs.some(r => r.id === newId)) newId = Storage.generateId('sr');

      const request = {
        id: newId,
        guestName: guestName.trim(),
        roomNumber: roomNumber.trim(),
        serviceId,
        serviceName: svc ? svc.name : serviceId,
        instructions: instructions.trim(),
        bookingCode: bookingCode.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      try {
        Storage.update(data => { data.serviceRequests.push(request); return data; });
        const confirmEl = document.getElementById('serviceRequestConfirmation');
        if (confirmEl) {
          confirmEl.innerHTML = `
            <div class="order-confirm-box">
              <p>✓ Request submitted! Your request ID is <strong>${newId}</strong>.</p>
              <p class="text-muted">Our team will be in touch shortly.</p>
            </div>`;
        }
        reqForm.reset();
        renderServicesBadge();
        showToast('Service request submitted!', 'success');
      } catch (err) {
        showToast('Failed to submit request. Please try again.', 'error');
      }
    });
  }
}
