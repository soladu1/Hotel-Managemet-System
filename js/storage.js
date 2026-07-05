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
    if (!this.load()) {
      this.save(defaultData);
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
  }
};
