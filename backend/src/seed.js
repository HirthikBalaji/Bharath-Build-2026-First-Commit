const { DatabaseService } = require('./db');
const QRCode = require('qrcode');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

async function seedData() {
  console.log('🌱 Seeding SeatRelay demo data into SQLite...');

  // 1. Users: Rahul Sharma (Seller), Priya Kumar (Buyer), SwiftBus Operations (Operator)
  const rahulId = 'usr_rahul_sharma_1';
  const priyaId = 'usr_priya_kumar_2';
  const operatorUserId = 'usr_swiftbus_ops_3';
  const now = new Date().toISOString();

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
  // Primary Bus: Bangalore -> Chennai, 19 Sep 2026, 10:30 PM (SOLD OUT with U12 belonging to Rahul)
  const bus1Id = 'bus_bangalore_chennai_1030pm';
  const bus2Id = 'bus_bangalore_chennai_0900pm';
  const bus3Id = 'bus_bangalore_chennai_1115pm';

  DatabaseService.run(`
    INSERT OR REPLACE INTO buses (id, operatorId, busNumber, busType, routeFrom, routeTo, departureTime, arrivalTime, travelDate, baseFare, createdAt)
    VALUES 
      (?, ?, 'KA-01-F-8899', 'AC Sleeper (2+1) Multi-Axle', 'Bangalore', 'Chennai', '2026-09-19T22:30:00.000Z', '2026-09-20T06:30:00.000Z', '2026-09-19', 850.0, ?),
      (?, ?, 'KA-01-F-9911', 'Volvo AC Semi-Sleeper (2+2)', 'Bangalore', 'Chennai', '2026-09-19T21:00:00.000Z', '2026-09-20T05:00:00.000Z', '2026-09-19', 750.0, ?),
      (?, ?, 'KA-01-F-3344', 'Scania High-Deck AC Sleeper', 'Bangalore', 'Chennai', '2026-09-19T23:15:00.000Z', '2026-09-20T07:00:00.000Z', '2026-09-19', 950.0, ?)
  `, [
    bus1Id, operatorId, now,
    bus2Id, operatorId, now,
    bus3Id, operatorId, now
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

  // Seats for Bus 2 & Bus 3 (few available seats)
  for (let i = 1; i <= 6; i++) {
    DatabaseService.run(`
      INSERT OR REPLACE INTO seats (id, busId, seatNumber, seatType, status)
      VALUES (?, ?, ?, 'SEATER', ?)
    `, [`seat_b2_S${i}`, bus2Id, `S${i}`, i <= 4 ? 'BOOKED' : 'AVAILABLE']);
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
    VALUES (?, ?, 'Booking Confirmed: Bangalore → Chennai', 'Your ticket SB-92831 for SwiftBus on 19 Sep 2026, 10:30 PM (Seat U12) is confirmed.', 'SUCCESS', 0, ?)
  `, [uuidv4(), rahulId, now]);

  console.log('✅ Demo Seed Complete:');
  console.log(`- Rahul Sharma: Ticket SB-92831 (Bangalore → Chennai, Seat U12, ₹850)`);
  console.log(`- Priya Kumar: Registered Buyer`);
  console.log(`- SwiftBus: AC Sleeper Bus 10:30 PM (Currently SOLD OUT)`);
}

module.exports = { seedData };

if (require.main === module) {
  seedData().catch(console.error);
}
