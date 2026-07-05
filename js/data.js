const ROOM_TYPES = {
  standard: {
    id: 'standard',
    name: 'Standard Room',
    price: 129,
    capacity: 2,
    description: 'Comfortable room with city view, queen bed, and modern amenities.',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80'
  },
  deluxe: {
    id: 'deluxe',
    name: 'Deluxe Suite',
    price: 219,
    capacity: 3,
    description: 'Spacious suite with king bed, lounge area, and premium toiletries.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80'
  },
  executive: {
    id: 'executive',
    name: 'Executive Suite',
    price: 349,
    capacity: 4,
    description: 'Luxury suite with panoramic views, jacuzzi, and butler service.',
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80'
  },
  penthouse: {
    id: 'penthouse',
    name: 'Penthouse',
    price: 599,
    capacity: 4,
    description: 'Ultimate luxury with private terrace, dining room, and concierge.',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80'
  }
};

function generateDefaultRooms() {
  const rooms = [];
  const config = [
    { type: 'standard', count: 8, floor: 1 },
    { type: 'deluxe', count: 6, floor: 2 },
    { type: 'executive', count: 4, floor: 3 },
    { type: 'penthouse', count: 2, floor: 4 }
  ];

  let id = 1;
  config.forEach(({ type, count, floor }) => {
    for (let i = 0; i < count; i++) {
      rooms.push({
        id: `room-${id}`,
        number: `${floor}${String(i + 1).padStart(2, '0')}`,
        type,
        status: 'available',
        floor
      });
      id++;
    }
  });
  return rooms;
}

function getDefaultData() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 3);

  const fmt = (d) => d.toISOString().split('T')[0];

  return {
    rooms: generateDefaultRooms(),
    bookings: [
      {
        id: 'bk-1',
        code: 'GH-A1B2C3',
        guestName: 'Sarah Mitchell',
        guestEmail: 'sarah@email.com',
        guestPhone: '+1 555 123 4567',
        roomId: 'room-3',
        roomType: 'standard',
        checkIn: fmt(today),
        checkOut: fmt(dayAfter),
        guests: 2,
        total: 387,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      },
      {
        id: 'bk-2',
        code: 'GH-D4E5F6',
        guestName: 'James Chen',
        guestEmail: 'james@email.com',
        guestPhone: '+1 555 987 6543',
        roomId: 'room-10',
        roomType: 'deluxe',
        checkIn: fmt(tomorrow),
        checkOut: fmt(dayAfter),
        guests: 2,
        total: 438,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      }
    ],
    guests: []
  };
}

function generateBookingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GH-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function daysBetween(start, end) {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function isDateOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

function getRoomTypeInfo(typeId) {
  return ROOM_TYPES[typeId] || null;
}
