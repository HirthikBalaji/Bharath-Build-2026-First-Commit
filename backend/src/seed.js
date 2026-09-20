const { DatabaseService } = require('./db');
const QRCode = require('qrcode');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

/**
 * Demo coaches always leave tonight, so the resale window is never in the past.
 * Departures are wall-clock times at the boarding point (stored with a Z suffix).
 * If the earliest departure is already inside the operator's cutoff, roll to tomorrow.
 */
function serviceDay() {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const earliest = new Date(base.getTime());
  earliest.setUTCHours(20, 0, 0, 0);
  if (now.getTime() > earliest.getTime() - 90 * 60 * 1000) base.setUTCDate(base.getUTCDate() + 1);
  const day = base.toISOString().slice(0, 10);
  const at = (dayOffset, hhmm) => {
    const d = new Date(base.getTime());
    d.setUTCDate(d.getUTCDate() + dayOffset);
    const [h, m] = hhmm.split(':').map(Number);
    d.setUTCHours(h, m, 0, 0);
    return d.toISOString();
  };
  return { day, at };
}

async function seedData() {
  console.log('🌱 Seeding SeatRelay demo data into SQLite...');

  // 1. Users: Rahul Sharma (Seller), Priya Kumar (Buyer), SwiftBus Operations (Operator)
  const rahulId = 'usr_rahul_sharma_1';
  const priyaId = 'usr_priya_kumar_2';
  const operatorUserId = 'usr_swiftbus_ops_3';
  const now = new Date().toISOString();
  const { day, at } = serviceDay();
  const departureLabel = `${new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}, 10:30 PM`;

  // Secure password hashing with PBKDF2
  function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { hash, salt };
  }

  const rahulCreds = hashPassword('rahul@123');
  const priyaCreds = hashPassword('priya@123');
  const opsCreds = hashPassword('operator@123');

  DatabaseService.run(`
    INSERT OR REPLACE INTO users (id, name, email, phone, role, passwordHash, salt, createdAt)
    VALUES 
      (?, 'Rahul Sharma', 'rahul@example.com', '+91 98450 12345', 'seller', ?, ?, ?),
      (?, 'Priya Kumar', 'priya@example.com', '+91 98765 43210', 'buyer', ?, ?, ?),
      (?, 'SwiftBus Operations', 'ops@swiftbus.in', '+91 80 2345 6789', 'operator', ?, ?, ?)
  `, [
    rahulId, rahulCreds.hash, rahulCreds.salt, now,
    priyaId, priyaCreds.hash, priyaCreds.salt, now,
    operatorUserId, opsCreds.hash, opsCreds.salt, now
  ]);

  // 2. Operator
  const operatorId = 'op_swiftbus_1';
  DatabaseService.run(`
    INSERT OR REPLACE INTO operators (id, name, code, contactEmail, supportsResale, supportsPassengerReissue, minimumResaleWindowMinutes, maximumResalePrice, createdAt)
    VALUES (?, 'SwiftBus Express', 'SWIFT', 'support@swiftbus.in', 1, 1, 60, 'FACE_VALUE', ?)
  `, [operatorId, now]);

  // 3. Buses
  // Primary Bus: Bangalore -> Chennai, tonight at 10:30 PM (SOLD OUT with U12 belonging to Rahul)
  const bus1Id = 'bus_bangalore_chennai_1030pm';
  const bus2Id = 'bus_bangalore_chennai_0900pm';
  const bus3Id = 'bus_bangalore_chennai_1115pm';
  const bus4Id = 'bus_mumbai_pune_0800pm';
  const bus5Id = 'bus_delhi_jaipur_0930pm';

  DatabaseService.run(`
    INSERT OR REPLACE INTO buses (id, operatorId, busNumber, busType, routeFrom, routeTo, departureTime, arrivalTime, travelDate, baseFare, createdAt)
    VALUES 
      (?, ?, 'KA-01-F-8899', 'AC Sleeper (2+1) Multi-Axle', 'Bangalore', 'Chennai', ?, ?, ?, 850.0, ?),
      (?, ?, 'KA-01-F-9911', 'Volvo AC Semi-Sleeper (2+2)', 'Bangalore', 'Chennai', ?, ?, ?, 750.0, ?),
      (?, ?, 'KA-01-F-3344', 'Scania High-Deck AC Sleeper', 'Bangalore', 'Chennai', ?, ?, ?, 950.0, ?),
      (?, ?, 'MH-12-Q-4521', 'Mercedes Multi-Axle Sleeper', 'Mumbai', 'Pune', ?, ?, ?, 550.0, ?),
      (?, ?, 'DL-01-A-7788', 'Volvo B11R Luxury Coach', 'Delhi', 'Jaipur', ?, ?, ?, 650.0, ?)
  `, [
    bus1Id, operatorId, at(0, '22:30'), at(1, '06:30'), day, now,
    bus2Id, operatorId, at(0, '21:00'), at(1, '05:00'), day, now,
    bus3Id, operatorId, at(0, '23:15'), at(1, '07:00'), day, now,
    bus4Id, operatorId, at(0, '20:00'), at(0, '23:30'), day, now,
    bus5Id, operatorId, at(0, '21:30'), at(1, '03:30'), day, now
  ]);

  // 4. Seats for Bus 1
  const seatLabels = ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
  let seatU12Id = '';

  for (const label of seatLabels) {
    const seatId = `seat_b1_${label}`;
    const seatType = label.startsWith('U') ? 'UPPER_BERTH' : 'LOWER_BERTH';
    DatabaseService.run(`
      INSERT OR REPLACE INTO seats (id, busId, seatNumber, seatType, status)
      VALUES (?, ?, ?, ?, 'BOOKED')
    `, [seatId, bus1Id, label, seatType]);

    if (label === 'U12') {
      seatU12Id = seatId;
    } else {
      // Other booked seats
      const otherTicketNumber = `SB-${Math.floor(10000 + Math.random() * 80000)}`;
      DatabaseService.run(`
        INSERT OR REPLACE INTO tickets (id, ticketNumber, userId, busId, seatId, passengerName, passengerAge, passengerGender, fare, status, issuedAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, 30, 'Male', 850.0, 'CONFIRMED', ?, ?)
      `, [
        `tkt_${seatId}`,
        otherTicketNumber,
        operatorUserId,
        bus1Id,
        seatId,
        `Traveller ${label}`,
        now,
        now
      ]);
    }
  }

  // Seats for Bus 2, 3, 4, 5
  for (const bId of [bus2Id, bus3Id, bus4Id, bus5Id]) {
    for (let i = 1; i <= 6; i++) {
      DatabaseService.run(`
        INSERT OR REPLACE INTO seats (id, busId, seatNumber, seatType, status)
        VALUES (?, ?, ?, 'SEATER', ?)
      `, [`seat_${bId}_S${i}`, bId, `S${i}`, i <= 3 ? 'BOOKED' : 'AVAILABLE']);
    }
  }

  // 5. Generate verified QR code for Rahul's original ticket
  const qrPayload = JSON.stringify({
    app: 'SeatRelay',
    tId: 'SB-92831',
    op: 'SwiftBus Express',
    seat: 'U12',
    pax: 'Rahul Sharma',
    status: 'CONFIRMED',
    v: 1
  });

  const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 280,
    color: { dark: '#0f172a', light: '#ffffff' }
  });

  // Create Rahul's Ticket SB-92831
  const rahulTicketId = 'tkt_rahul_sb92831';
  DatabaseService.run(`
    INSERT OR REPLACE INTO tickets (
      id, ticketNumber, userId, busId, seatId, 
      passengerName, passengerAge, passengerGender, passengerPhone,
      govIdType, govIdNumber, fare, status, qrCode, issuedAt, updatedAt
    ) VALUES (
      ?, 'SB-92831', ?, ?, ?,
      'Rahul Sharma', 28, 'Male', '+91 98450 12345',
      'Aadhaar Card', '5412 8934 1122', 850.0, 'CONFIRMED', ?, ?, ?
    )
  `, [
    rahulTicketId, rahulId, bus1Id, seatU12Id, qrCodeUrl, now, now
  ]);

  // Initial welcome notification
  DatabaseService.run(`
    INSERT OR REPLACE INTO notifications (id, userId, title, message, type, isRead, createdAt)
    VALUES (?, ?, 'Booking Confirmed: Bangalore → Chennai', ?, 'SUCCESS', 0, ?)
  `, [uuidv4(), rahulId, `Your ticket SB-92831 for SwiftBus on ${departureLabel} (Seat U12) is confirmed.`, now]);

  console.log('✅ Demo Seed Complete:');
  console.log(`- Rahul Sharma: Ticket SB-92831 (Bangalore → Chennai, Seat U12, ₹850)`);
  console.log(`- Priya Kumar: Registered Buyer`);
  console.log(`- SwiftBus: AC Sleeper Bus 10:30 PM (Currently SOLD OUT)`);
}

module.exports = { seedData };

if (require.main === module) {
  seedData().catch(console.error);
}
