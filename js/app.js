/* ===== Grand Horizon Hotel Management System ===== */

let appData = null;

// ── Init ──
function initApp() {
  appData = Storage.init(getDefaultData());
  syncRoomStatuses();
  bindEvents();
  setMinDates();
  renderAll();
  startLiveUpdates();
}

function syncRoomStatuses() {
  const today = todayStr();
  appData = Storage.update((data) => {
    data.rooms.forEach((room) => {
      const activeBooking = data.bookings.find(
        (b) =>
          b.roomId === room.id &&
          b.status !== 'cancelled' &&
          b.status !== 'checked-out' &&
          b.checkIn <= today &&
          b.checkOut > today
      );
      const upcomingBooking = data.bookings.find(
        (b) =>
          b.roomId === room.id &&
          b.status === 'confirmed' &&
          b.checkIn > today
      );

      if (room.status === 'maintenance') return;

      if (activeBooking) {
        room.status = activeBooking.status === 'checked-in' ? 'occupied' : 'reserved';
      } else if (upcomingBooking) {
        room.status = 'reserved';
      } else {
        room.status = 'available';
      }
    });
    return data;
  });
}

function startLiveUpdates() {
  setInterval(() => {
    syncRoomStatuses();
    updateLiveSections();
  }, 5000);
}

function updateLiveSections() {
  updateHeroStats();
  renderAvailabilityList();
  if (document.getElementById('adminView').classList.contains('active')) {
    renderDashboard();
    renderAdminRooms();
  }
}

// ── Events ──
function bindEvents() {
  document.getElementById('navToggle').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });

  document.querySelectorAll('[data-view]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(el.dataset.view);
      document.getElementById('navLinks').classList.remove('open');
    });
  });

  document.querySelectorAll('[data-tab]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(el.dataset.tab);
    });
  });

  document.getElementById('bookingForm').addEventListener('submit', handleBooking);
  document.getElementById('lookupForm').addEventListener('submit', handleLookup);

  ['checkIn', 'checkOut', 'roomType'].forEach((id) => {
    document.getElementById(id).addEventListener('change', updateBookingSummary);
  });

  document.getElementById('quickCheckInForm').addEventListener('submit', handleQuickCheckIn);
  document.getElementById('quickCheckOutForm').addEventListener('submit', handleQuickCheckOut);

  document.getElementById('roomFilterType').addEventListener('change', renderAdminRooms);
  document.getElementById('roomFilterStatus').addEventListener('change', renderAdminRooms);
  document.getElementById('bookingSearch').addEventListener('input', renderBookingsTable);
  document.getElementById('addRoomBtn').addEventListener('click', showAddRoomModal);

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
}

function setMinDates() {
  const today = todayStr();
  document.getElementById('checkIn').min = today;
  document.getElementById('checkOut').min = today;

  document.getElementById('checkIn').addEventListener('change', () => {
    const checkIn = document.getElementById('checkIn').value;
    document.getElementById('checkOut').min = checkIn || today;
    updateBookingSummary();
  });
}

// ── View Switching ──
function switchView(view) {
  document.getElementById('guestView').classList.toggle('active', view === 'guest');
  document.getElementById('adminView').classList.toggle('active', view === 'admin');
  window.scrollTo(0, 0);
  if (view === 'admin') renderAll();
}

function switchTab(tab) {
  document.querySelectorAll('.sidebar-nav a').forEach((a) => {
    a.classList.toggle('active', a.dataset.tab === tab);
  });
  document.querySelectorAll('.admin-tab').forEach((t) => {
    t.classList.toggle('active', t.id === `tab-${tab}`);
  });
}

// ── Render All ──
function renderAll() {
  updateHeroStats();
  renderRoomTypes();
  populateRoomTypeSelect();
  renderAvailabilityList();
  updateBookingSummary();
  renderDashboard();
  renderAdminRooms();
  renderBookingsTable();
  renderCheckInOut();
  renderGuests();
}

// ── Hero Stats ──
function updateHeroStats() {
  const rooms = Storage.getRooms();
  const available = rooms.filter((r) => r.status === 'available').length;
  const occupied = rooms.filter((r) => r.status === 'occupied' || r.status === 'reserved').length;
  const occupancy = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;

  document.getElementById('statAvailable').textContent = available;
  document.getElementById('statOccupancy').textContent = occupancy + '%';
  document.getElementById('statTypes').textContent = Object.keys(ROOM_TYPES).length;
}

// ── Room Types (Guest) ──
function renderRoomTypes() {
  const grid = document.getElementById('roomTypesGrid');
  const rooms = Storage.getRooms();

  grid.innerHTML = Object.values(ROOM_TYPES)
    .map((type) => {
      const typeRooms = rooms.filter((r) => r.type === type.id);
      const avail = typeRooms.filter((r) => r.status === 'available').length;
      const badge =
        avail > 3
          ? `<span class="availability-badge available">${avail} available</span>`
          : avail > 0
          ? `<span class="availability-badge limited">${avail} left</span>`
          : `<span class="availability-badge full">Fully booked</span>`;

      return `
        <div class="room-type-card">
          <div class="room-type-img" style="background-image:url('${type.image}')"></div>
          <div class="room-type-body">
            <h3>${type.name}</h3>
            <div class="room-type-price">${formatCurrency(type.price)} <span style="font-size:0.8rem;color:var(--color-text-muted)">/ night</span></div>
            <div class="room-type-meta">
              <span>👤 Up to ${type.capacity}</span>
              <span>🛏 ${typeRooms.length} rooms</span>
            </div>
            <p class="room-type-desc">${type.description}</p>
            ${badge}
          </div>
        </div>`;
    })
    .join('');
}

function populateRoomTypeSelect() {
  const select = document.getElementById('roomType');
  const filterSelect = document.getElementById('roomFilterType');

  const options = Object.values(ROOM_TYPES)
    .map((t) => `<option value="${t.id}">${t.name} — ${formatCurrency(t.price)}/night</option>`)
    .join('');

  select.innerHTML = options;
  filterSelect.innerHTML =
    '<option value="all">All Types</option>' +
    Object.values(ROOM_TYPES)
      .map((t) => `<option value="${t.id}">${t.name}</option>`)
      .join('');
}

// ── Availability ──
function getAvailableRoomsForDates(typeId, checkIn, checkOut) {
  if (!checkIn || !checkOut) return [];

  const rooms = Storage.getRooms().filter((r) => r.type === typeId && r.status !== 'maintenance');
  const bookings = Storage.getBookings();

  return rooms.filter((room) => {
    const conflicts = bookings.some(
      (b) =>
        b.roomId === room.id &&
        b.status !== 'cancelled' &&
        b.status !== 'checked-out' &&
        isDateOverlap(checkIn, checkOut, b.checkIn, b.checkOut)
    );
    return !conflicts;
  });
}

function renderAvailabilityList() {
  const list = document.getElementById('availabilityList');
  const checkIn = document.getElementById('checkIn')?.value;
  const checkOut = document.getElementById('checkOut')?.value;

  list.innerHTML = Object.values(ROOM_TYPES)
    .map((type) => {
      let count;
      if (checkIn && checkOut && checkIn < checkOut) {
        count = getAvailableRoomsForDates(type.id, checkIn, checkOut).length;
      } else {
        count = Storage.getRooms().filter((r) => r.type === type.id && r.status === 'available').length;
      }
      const cls = count > 3 ? 'available' : count > 0 ? 'limited' : 'full';
      return `
        <div class="avail-item">
          <span>${type.name}</span>
          <span class="avail-count availability-badge ${cls}">${count} rooms</span>
        </div>`;
    })
    .join('');
}

function updateBookingSummary() {
  const summary = document.getElementById('bookingSummary');
  const typeId = document.getElementById('roomType').value;
  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  const type = getRoomTypeInfo(typeId);

  if (!type || !checkIn || !checkOut || checkIn >= checkOut) {
    summary.innerHTML = '<p class="text-muted">Select dates and room type to see pricing</p>';
    renderAvailabilityList();
    return;
  }

  const nights = daysBetween(checkIn, checkOut);
  const subtotal = type.price * nights;
  const tax = subtotal * 0.12;
  const total = subtotal + tax;
  const available = getAvailableRoomsForDates(typeId, checkIn, checkOut).length;

  summary.innerHTML = `
    <div class="price-line"><span>${type.name} × ${nights} night${nights > 1 ? 's' : ''}</span><span>${formatCurrency(subtotal)}</span></div>
    <div class="price-line"><span>Taxes & fees (12%)</span><span>${formatCurrency(tax)}</span></div>
    <div class="price-total"><span>Total</span><span>${formatCurrency(total)}</span></div>
    <p class="text-muted" style="margin-top:0.75rem">${available} room${available !== 1 ? 's' : ''} available for selected dates</p>`;

  renderAvailabilityList();
}

// ── Booking ──
function handleBooking(e) {
  e.preventDefault();

  const guestName = document.getElementById('guestName').value.trim();
  const guestEmail = document.getElementById('guestEmail').value.trim();
  const guestPhone = document.getElementById('guestPhone').value.trim();
  const roomType = document.getElementById('roomType').value;
  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  const guests = parseInt(document.getElementById('guests').value, 10);
  const type = getRoomTypeInfo(roomType);

  if (checkIn >= checkOut) {
    showToast('Check-out must be after check-in', 'error');
    return;
  }

  if (guests > type.capacity) {
    showToast(`This room type supports up to ${type.capacity} guests`, 'error');
    return;
  }

  const availableRooms = getAvailableRoomsForDates(roomType, checkIn, checkOut);
  if (!availableRooms.length) {
    showToast('No rooms available for selected dates', 'error');
    return;
  }

  const nights = daysBetween(checkIn, checkOut);
  const total = type.price * nights * 1.12;
  const room = availableRooms[0];
  const code = generateBookingCode();

  const booking = {
    id: 'bk-' + Date.now(),
    code,
    guestName,
    guestEmail,
    guestPhone,
    roomId: room.id,
    roomType,
    checkIn,
    checkOut,
    guests,
    total: Math.round(total * 100) / 100,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  appData = Storage.update((data) => {
    data.bookings.push(booking);
    const r = data.rooms.find((rm) => rm.id === room.id);
    if (r && r.status !== 'maintenance') r.status = 'reserved';
    upsertGuest(data, { name: guestName, email: guestEmail, phone: guestPhone });
    return data;
  });

  showToast(`Booking confirmed! Code: ${code}`, 'success');
  e.target.reset();
  setMinDates();
  renderAll();

  showModal(`
    <h3>Booking Confirmed ✓</h3>
    <p style="margin-bottom:1rem;color:var(--color-text-muted)">Your reservation is confirmed. Save your confirmation code.</p>
    <div class="booking-detail-row"><span>Confirmation</span><strong style="color:var(--color-gold)">${code}</strong></div>
    <div class="booking-detail-row"><span>Guest</span><span>${guestName}</span></div>
    <div class="booking-detail-row"><span>Room</span><span>${type.name} (#${room.number})</span></div>
    <div class="booking-detail-row"><span>Check-in</span><span>${formatDate(checkIn)}</span></div>
    <div class="booking-detail-row"><span>Check-out</span><span>${formatDate(checkOut)}</span></div>
    <div class="booking-detail-row"><span>Total</span><strong>${formatCurrency(booking.total)}</strong></div>
  `);
}

function upsertGuest(data, guest) {
  const existing = data.guests.find((g) => g.email === guest.email);
  if (existing) {
    existing.name = guest.name;
    existing.phone = guest.phone;
    existing.lastVisit = todayStr();
    existing.visits = (existing.visits || 1) + 1;
  } else {
    data.guests.push({
      id: 'guest-' + Date.now(),
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      visits: 1,
      lastVisit: todayStr()
    });
  }
}

// ── Lookup ──
function handleLookup(e) {
  e.preventDefault();
  const query = document.getElementById('lookupQuery').value.trim().toLowerCase();
  const result = document.getElementById('lookupResult');

  if (!query) {
    result.innerHTML = '';
    return;
  }

  const booking = Storage.getBookings().find(
    (b) => b.code.toLowerCase() === query || b.guestEmail.toLowerCase() === query
  );

  if (!booking) {
    result.innerHTML = '<p class="empty-state">No booking found. Please check your code or email.</p>';
    return;
  }

  const room = Storage.getRooms().find((r) => r.id === booking.roomId);
  const type = getRoomTypeInfo(booking.roomType);

  result.innerHTML = `
    <div class="booking-card-result">
      <h4>${booking.code}</h4>
      <div class="booking-detail-row"><span>Status</span><span class="status-pill ${booking.status}">${booking.status}</span></div>
      <div class="booking-detail-row"><span>Guest</span><span>${booking.guestName}</span></div>
      <div class="booking-detail-row"><span>Room</span><span>${type?.name || booking.roomType} ${room ? '#' + room.number : ''}</span></div>
      <div class="booking-detail-row"><span>Check-in</span><span>${formatDate(booking.checkIn)}</span></div>
      <div class="booking-detail-row"><span>Check-out</span><span>${formatDate(booking.checkOut)}</span></div>
      <div class="booking-detail-row"><span>Guests</span><span>${booking.guests}</span></div>
      <div class="booking-detail-row"><span>Total</span><strong>${formatCurrency(booking.total)}</strong></div>
    </div>`;
}

// ── Dashboard ──
function renderDashboard() {
  const rooms = Storage.getRooms();
  const bookings = Storage.getBookings();
  const today = todayStr();

  const available = rooms.filter((r) => r.status === 'available').length;
  const occupied = rooms.filter((r) => r.status === 'occupied').length;
  const reserved = rooms.filter((r) => r.status === 'reserved').length;
  const maintenance = rooms.filter((r) => r.status === 'maintenance').length;
  const occupancy = rooms.length ? Math.round(((occupied + reserved) / rooms.length) * 100) : 0;

  const todayCheckIns = bookings.filter((b) => b.checkIn === today && b.status === 'confirmed').length;
  const todayCheckOuts = bookings.filter((b) => b.checkOut === today && b.status === 'checked-in').length;
  const activeBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'checked-in').length;
  const revenue = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.total, 0);

  document.getElementById('metricsGrid').innerHTML = `
    <div class="metric-card"><div class="metric-label">Occupancy Rate</div><div class="metric-value">${occupancy}%</div><div class="metric-change">${occupied + reserved} of ${rooms.length} rooms</div></div>
    <div class="metric-card"><div class="metric-label">Available</div><div class="metric-value">${available}</div></div>
    <div class="metric-card"><div class="metric-label">Active Bookings</div><div class="metric-value">${activeBookings}</div></div>
    <div class="metric-card"><div class="metric-label">Total Revenue</div><div class="metric-value">${formatCurrency(revenue)}</div></div>
    <div class="metric-card"><div class="metric-label">Check-ins Today</div><div class="metric-value">${todayCheckIns}</div></div>
    <div class="metric-card"><div class="metric-label">Check-outs Today</div><div class="metric-value">${todayCheckOuts}</div></div>`;

  const activities = [];
  bookings
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .forEach((b) => {
      activities.push({
        text: `${b.guestName} — ${b.status}`,
        sub: `${b.code} · ${formatDate(b.checkIn)}`,
        color: b.status === 'checked-in' ? 'var(--color-success)' : 'var(--color-info)'
      });
    });

  document.getElementById('todayActivity').innerHTML = activities.length
    ? activities
        .map(
          (a) => `
        <div class="activity-item">
          <span class="activity-dot" style="background:${a.color}"></span>
          <div><strong>${a.text}</strong><br><span class="text-muted">${a.sub}</span></div>
        </div>`
        )
        .join('')
    : '<p class="empty-state">No recent activity</p>';

  const statuses = [
    { label: 'Available', count: available, color: 'var(--color-success)' },
    { label: 'Occupied', count: occupied, color: 'var(--color-danger)' },
    { label: 'Reserved', count: reserved, color: 'var(--color-info)' },
    { label: 'Maintenance', count: maintenance, color: 'var(--color-warning)' }
  ];

  document.getElementById('statusChart').innerHTML = statuses
    .map((s) => {
      const pct = rooms.length ? (s.count / rooms.length) * 100 : 0;
      return `
        <div class="status-bar-row">
          <span class="status-bar-label">${s.label}</span>
          <div class="status-bar-track"><div class="status-bar-fill" style="width:${pct}%;background:${s.color}"></div></div>
          <span class="status-bar-count">${s.count}</span>
        </div>`;
    })
    .join('');
}

// ── Admin Rooms ──
function renderAdminRooms() {
  const typeFilter = document.getElementById('roomFilterType').value;
  const statusFilter = document.getElementById('roomFilterStatus').value;
  let rooms = Storage.getRooms();

  if (typeFilter !== 'all') rooms = rooms.filter((r) => r.type === typeFilter);
  if (statusFilter !== 'all') rooms = rooms.filter((r) => r.status === statusFilter);

  const grid = document.getElementById('adminRoomsGrid');

  grid.innerHTML = rooms.length
    ? rooms
        .map((room) => {
          const type = getRoomTypeInfo(room.type);
          return `
          <div class="room-card ${room.status}">
            <div class="room-number">${room.number}</div>
            <div class="room-type-label">${type?.name || room.type}</div>
            <span class="room-status-badge ${room.status}">${room.status}</span>
            <div class="room-actions">
              ${room.status === 'maintenance'
                ? `<button class="btn btn-success btn-icon" onclick="setRoomStatus('${room.id}','available')">Fix</button>`
                : `<button class="btn btn-warning btn-icon" onclick="setRoomStatus('${room.id}','maintenance')">Maint.</button>`}
            </div>
          </div>`;
        })
        .join('')
    : '<p class="empty-state">No rooms match filters</p>';
}

function setRoomStatus(roomId, status) {
  appData = Storage.update((data) => {
    const room = data.rooms.find((r) => r.id === roomId);
    if (room) room.status = status;
    return data;
  });
  syncRoomStatuses();
  renderAdminRooms();
  updateHeroStats();
  showToast(`Room status updated to ${status}`, 'info');
}

function showAddRoomModal() {
  const typeOptions = Object.values(ROOM_TYPES)
    .map((t) => `<option value="${t.id}">${t.name}</option>`)
    .join('');

  showModal(`
    <h3>Add New Room</h3>
    <form id="addRoomForm">
      <div class="form-group">
        <label>Room Number</label>
        <input type="text" id="newRoomNumber" required placeholder="e.g. 105">
      </div>
      <div class="form-group">
        <label>Room Type</label>
        <select id="newRoomType" required>${typeOptions}</select>
      </div>
      <div class="form-group">
        <label>Floor</label>
        <input type="number" id="newRoomFloor" required min="1" max="20" value="1">
      </div>
      <button type="submit" class="btn btn-primary btn-block">Add Room</button>
    </form>
  `);

  document.getElementById('addRoomForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const number = document.getElementById('newRoomNumber').value.trim();
    const type = document.getElementById('newRoomType').value;
    const floor = parseInt(document.getElementById('newRoomFloor').value, 10);

    if (Storage.getRooms().some((r) => r.number === number)) {
      showToast('Room number already exists', 'error');
      return;
    }

    appData = Storage.update((data) => {
      data.rooms.push({
        id: 'room-' + Date.now(),
        number,
        type,
        status: 'available',
        floor
      });
      return data;
    });

    closeModal();
    renderAll();
    showToast(`Room ${number} added`, 'success');
  });
}

// ── Bookings Table ──
function renderBookingsTable() {
  const search = document.getElementById('bookingSearch').value.toLowerCase();
  let bookings = Storage.getBookings();

  if (search) {
    bookings = bookings.filter(
      (b) =>
        b.code.toLowerCase().includes(search) ||
        b.guestName.toLowerCase().includes(search) ||
        b.guestEmail.toLowerCase().includes(search)
    );
  }

  bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const tbody = document.getElementById('bookingsTableBody');
  tbody.innerHTML = bookings.length
    ? bookings
        .map((b) => {
          const room = Storage.getRooms().find((r) => r.id === b.roomId);
          return `
          <tr>
            <td><strong>${b.code}</strong></td>
            <td>${b.guestName}<br><span class="text-muted">${b.guestEmail}</span></td>
            <td>${room ? '#' + room.number : '—'}</td>
            <td>${formatDate(b.checkIn)}</td>
            <td>${formatDate(b.checkOut)}</td>
            <td><span class="status-pill ${b.status}">${b.status}</span></td>
            <td>${formatCurrency(b.total)}</td>
            <td class="table-actions">
              ${b.status === 'confirmed' ? `<button class="btn btn-success btn-icon" onclick="checkInBooking('${b.id}')">In</button>` : ''}
              ${b.status === 'checked-in' ? `<button class="btn btn-warning btn-icon" onclick="checkOutBooking('${b.id}')">Out</button>` : ''}
              ${b.status !== 'cancelled' && b.status !== 'checked-out' ? `<button class="btn btn-danger btn-icon" onclick="cancelBooking('${b.id}')">✕</button>` : ''}
            </td>
          </tr>`;
        })
        .join('')
    : '<tr><td colspan="8" class="empty-state">No bookings found</td></tr>';
}

function checkInBooking(bookingId) {
  const today = todayStr();
  appData = Storage.update((data) => {
    const booking = data.bookings.find((b) => b.id === bookingId);
    if (!booking) return data;
    booking.status = 'checked-in';
    const room = data.rooms.find((r) => r.id === booking.roomId);
    if (room) room.status = 'occupied';
    return data;
  });
  renderAll();
  showToast('Guest checked in successfully', 'success');
}

function checkOutBooking(bookingId) {
  appData = Storage.update((data) => {
    const booking = data.bookings.find((b) => b.id === bookingId);
    if (!booking) return data;
    booking.status = 'checked-out';
    const room = data.rooms.find((r) => r.id === booking.roomId);
    if (room && room.status !== 'maintenance') room.status = 'available';
    return data;
  });
  syncRoomStatuses();
  renderAll();
  showToast('Guest checked out. Room is now available.', 'success');
}

function cancelBooking(bookingId) {
  if (!confirm('Cancel this booking?')) return;

  appData = Storage.update((data) => {
    const booking = data.bookings.find((b) => b.id === bookingId);
    if (!booking) return data;
    booking.status = 'cancelled';
    return data;
  });
  syncRoomStatuses();
  renderAll();
  showToast('Booking cancelled', 'info');
}

// ── Quick Check-in/out ──
function handleQuickCheckIn(e) {
  e.preventDefault();
  const code = document.getElementById('checkInCode').value.trim().toUpperCase();
  const booking = Storage.getBookings().find((b) => b.code === code);

  if (!booking) {
    showToast('Booking not found', 'error');
    return;
  }
  if (booking.status !== 'confirmed') {
    showToast(`Cannot check in — status is ${booking.status}`, 'error');
    return;
  }

  checkInBooking(booking.id);
  document.getElementById('checkInCode').value = '';
}

function handleQuickCheckOut(e) {
  e.preventDefault();
  const query = document.getElementById('checkOutCode').value.trim();
  let booking = Storage.getBookings().find((b) => b.code.toUpperCase() === query.toUpperCase());

  if (!booking) {
    const room = Storage.getRooms().find((r) => r.number === query);
    if (room) {
      booking = Storage.getBookings().find((b) => b.roomId === room.id && b.status === 'checked-in');
    }
  }

  if (!booking) {
    showToast('No active booking found', 'error');
    return;
  }
  if (booking.status !== 'checked-in') {
    showToast(`Cannot check out — status is ${booking.status}`, 'error');
    return;
  }

  checkOutBooking(booking.id);
  document.getElementById('checkOutCode').value = '';
}

function renderCheckInOut() {
  const today = todayStr();
  const bookings = Storage.getBookings();

  const arriving = bookings.filter((b) => b.checkIn === today && b.status === 'confirmed');
  const departing = bookings.filter((b) => b.checkOut === today && b.status === 'checked-in');

  document.getElementById('arrivingToday').innerHTML = arriving.length
    ? arriving
        .map((b) => {
          const room = Storage.getRooms().find((r) => r.id === b.roomId);
          return `
          <div class="pending-item">
            <div class="pending-item-info"><strong>${b.guestName}</strong><span class="text-muted">${b.code} · Room ${room?.number || '—'}</span></div>
            <button class="btn btn-success btn-sm" onclick="document.getElementById('checkInCode').value='${b.code}';checkInBooking('${b.id}')">Check In</button>
          </div>`;
        })
        .join('')
    : '<p class="text-muted">No arrivals today</p>';

  document.getElementById('departingToday').innerHTML = departing.length
    ? departing
        .map((b) => {
          const room = Storage.getRooms().find((r) => r.id === b.roomId);
          return `
          <div class="pending-item">
            <div class="pending-item-info"><strong>${b.guestName}</strong><span class="text-muted">Room ${room?.number || '—'}</span></div>
            <button class="btn btn-warning btn-sm" onclick="checkOutBooking('${b.id}')">Check Out</button>
          </div>`;
        })
        .join('')
    : '<p class="text-muted">No departures today</p>';
}

// ── Guests ──
function renderGuests() {
  const guests = Storage.getGuests();
  const grid = document.getElementById('guestsGrid');

  if (!guests.length) {
    const fromBookings = {};
    Storage.getBookings().forEach((b) => {
      if (!fromBookings[b.guestEmail]) {
        fromBookings[b.guestEmail] = { name: b.guestName, email: b.guestEmail, phone: b.guestPhone, visits: 0 };
      }
      fromBookings[b.guestEmail].visits++;
    });
    const derived = Object.values(fromBookings);

    grid.innerHTML = derived.length
      ? derived
          .map(
            (g) => `
          <div class="guest-card">
            <h4>${g.name}</h4>
            <div class="guest-email">${g.email}</div>
            <div class="guest-meta">${g.phone} · ${g.visits} booking${g.visits > 1 ? 's' : ''}</div>
          </div>`
          )
          .join('')
      : '<p class="empty-state">No guests yet</p>';
    return;
  }

  grid.innerHTML = guests
    .map(
      (g) => `
    <div class="guest-card">
      <h4>${g.name}</h4>
      <div class="guest-email">${g.email}</div>
      <div class="guest-meta">${g.phone} · ${g.visits || 1} visit${(g.visits || 1) > 1 ? 's' : ''} · Last: ${g.lastVisit ? formatDate(g.lastVisit) : '—'}</div>
    </div>`
    )
    .join('');
}

// ── UI Helpers ──
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

// Expose functions for inline onclick handlers
window.setRoomStatus = setRoomStatus;
window.checkInBooking = checkInBooking;
window.checkOutBooking = checkOutBooking;
window.cancelBooking = cancelBooking;

// Boot
document.addEventListener('DOMContentLoaded', initApp);
