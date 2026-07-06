const Storage = {
  KEY: 'grand_horizon_hotel',

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  init(defaultData) {
    let data = this.load();
    if (!data) {
      this.save(defaultData);
      data = defaultData;
    } else {
      let dirty = false;
      if (!data.menuItems)       { data.menuItems = defaultData.menuItems; dirty = true; }
      if (!data.foodOrders)      { data.foodOrders = []; dirty = true; }
      if (!data.services)        { data.services = defaultData.services; dirty = true; }
      if (!data.serviceRequests) { data.serviceRequests = []; dirty = true; }
      if (dirty) this.save(data);
    }
    return this.load();
  },

  getRooms() {
    return this.load()?.rooms ?? [];
  },

  getBookings() {
    return this.load()?.bookings ?? [];
  },

  getGuests() {
    return this.load()?.guests ?? [];
  },

  update(updater) {
    const data = this.load();
    const updated = typeof updater === 'function' ? updater(data) : { ...data, ...updater };
    this.save(updated);
    return updated;
  },

  getMenuItems() {
    return this.load()?.menuItems ?? [];
  },

  getFoodOrders() {
    return this.load()?.foodOrders ?? [];
  },

  getServices() {
    return this.load()?.services ?? [];
  },

  getServiceRequests() {
    return this.load()?.serviceRequests ?? [];
  },

  generateId(prefix) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${prefix}-${Date.now()}-${suffix}`;
  },
};
