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

function generateDefaultMenuItems() {
  const now = new Date().toISOString();
  return [
    { id: 'mi-seed-0001', name: 'Continental Breakfast Platter', category: 'Breakfast',
      price: 18.00, description: 'Assorted pastries, fresh fruit, yoghurt, and orange juice.',
      image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600&q=80',
      status: 'available', createdAt: now },
    { id: 'mi-seed-0002', name: 'Eggs Benedict', category: 'Breakfast',
      price: 22.00, description: 'Poached eggs on toasted English muffin with hollandaise sauce.',
      image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=600&q=80',
      status: 'available', createdAt: now },
    { id: 'mi-seed-0003', name: 'Grilled Chicken Caesar Salad', category: 'Lunch',
      price: 19.50, description: 'Romaine lettuce, grilled chicken, croutons, and Caesar dressing.',
      image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80',
      status: 'available', createdAt: now },
    { id: 'mi-seed-0004', name: 'Club Sandwich', category: 'Lunch',
      price: 17.00, description: 'Triple-decker with turkey, bacon, lettuce, tomato, and mayo.',
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80',
      status: 'available', createdAt: now },
    { id: 'mi-seed-0005', name: 'Grilled Atlantic Salmon', category: 'Dinner',
      price: 38.00, description: 'Pan-seared salmon fillet with seasonal vegetables and lemon butter.',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
      status: 'available', createdAt: now },
    { id: 'mi-seed-0006', name: 'Beef Tenderloin', category: 'Dinner',
      price: 55.00, description: '8oz tenderloin with truffle mashed potato and red wine reduction.',
      image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80',
      status: 'available', createdAt: now },
    { id: 'mi-seed-0007', name: 'Fresh Fruit Smoothie', category: 'Beverages',
      price: 9.00, description: 'Seasonal fruits blended with coconut water and honey.',
      image: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=600&q=80',
      status: 'available', createdAt: now },
    { id: 'mi-seed-0008', name: 'Artisan Coffee', category: 'Beverages',
      price: 7.50, description: 'Single-origin espresso, cappuccino, or flat white.',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
      status: 'available', createdAt: now },
    { id: 'mi-seed-0009', name: 'Cheese and Charcuterie Board', category: 'Snacks',
      price: 28.00, description: 'Selection of aged cheeses, cured meats, crackers, and fruit.',
      image: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=600&q=80',
      status: 'available', createdAt: now },
    { id: 'mi-seed-0010', name: 'Truffle Fries', category: 'Snacks',
      price: 12.00, description: 'Crispy hand-cut fries with truffle oil and parmesan.',
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80',
      status: 'available', createdAt: now }
  ];
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
    menuItems: generateDefaultMenuItems(),
    foodOrders: [],
    services: generateDefaultServices(),
    serviceRequests: [],
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

function generateDefaultServices() {
  const now = new Date().toISOString();
  return [
    {
      id: 'svc-seed-0001',
      name: 'Spa & Wellness',
      description: 'Full-body massage, facial, and access to steam room.',
      price: 120.00,
      status: 'active',
      createdAt: now
    },
    {
      id: 'svc-seed-0002',
      name: 'Laundry Service',
      description: 'Same-day dry cleaning and laundry pickup from your room.',
      price: 35.00,
      status: 'active',
      createdAt: now
    },
    {
      id: 'svc-seed-0003',
      name: 'Airport Transfer',
      description: 'Private car transfer to or from the airport at any hour.',
      price: 75.00,
      status: 'active',
      createdAt: now
    },
    {
      id: 'svc-seed-0004',
      name: 'Room Service',
      description: '24-hour in-room dining from our full menu.',
      price: 0,
      status: 'active',
      createdAt: now
    },
    {
      id: 'svc-seed-0005',
      name: 'Tour Package',
      description: 'Guided city tour with transport and complimentary lunch.',
      price: 95.00,
      status: 'active',
      createdAt: now
    }
  ];
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
