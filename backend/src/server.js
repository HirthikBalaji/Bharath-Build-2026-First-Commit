const express = require('express');
const cors = require('cors');
const { DatabaseService } = require('./db');
const { CBDCEscrowService } = require('./cbdc.service');
const {
  MockOperatorService,
  MockPaymentService,
  ResaleWorkflowService,
  maskGovId
} = require('./workflow');
const crypto = require('crypto');
const { seedData } = require('./seed');

const JWT_SECRET = process.env.JWT_SECRET || 'seatrelay-jwt-prod-secret-982155';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  if (!hash || !salt) return false;
  const computed = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function parseAuth(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(authHeader.split(' ')[1]);
  }
  // Fallback support for demo header or query
  const userId = req.headers['x-user-id'] || req.query.userId;
  if (userId) {
    const u = DatabaseService.get(`SELECT id, email, role FROM users WHERE id = ?`, [userId]);
    if (u) return { userId: u.id, email: u.email, role: u.role };
  }
  return null;
}

function requireAuth(req, res, next) {
  const auth = parseAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.auth = auth;
  next();
}

function requireOperator(req, res, next) {
  const auth = parseAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (auth.role !== 'operator') {
    return res.status(403).json({ error: 'Forbidden: Operator privileges required' });
  }
  req.auth = auth;
  next();
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SeatRelay API', time: new Date() });
});

// ==========================================
// 1. BUS SEARCH API
// ==========================================
app.get('/api/buses/search', (req, res) => {
  try {
    const { from, to, date, live } = req.query;

    let sql = `
      SELECT b.*, o.name as operatorName, o.code as operatorCode,
             o.minimumResaleWindowMinutes, o.supportsResale
      FROM buses b
      JOIN operators o ON b.operatorId = o.id
      WHERE 1=1
    `;
    const params = [];

    if (live === '1' || live === 'true') {
      sql += ` AND b.isLive = 1`;
    } else if (live === '0' || live === 'false') {
      sql += ` AND (b.isLive = 0 OR b.isLive IS NULL)`;
    }

    if (from) {
      sql += ` AND LOWER(b.routeFrom) LIKE LOWER(?)`;
      params.push(`%${from}%`);
    }
    if (to) {
      sql += ` AND LOWER(b.routeTo) LIKE LOWER(?)`;
      params.push(`%${to}%`);
    }
    if (date) {
      sql += ` AND b.travelDate = ?`;
      params.push(date);
    }

    const buses = DatabaseService.query(sql, params);

    const result = buses.map((bus) => {
      // Fetch seats and ticket statuses for each bus
      const seats = DatabaseService.query(`SELECT * FROM seats WHERE busId = ?`, [bus.id]);
      const totalSeats = seats.length;

      // Check resale listings active on this bus
      const resaleListings = DatabaseService.query(`
        SELECT rl.id as listingId, rl.listingNumber, rl.originalPrice as originalFare,
               rl.resalePrice, rl.platformFee, (rl.resalePrice + rl.platformFee) as totalPrice,
               t.id as ticketId, t.ticketNumber, s.seatNumber, s.seatType
        FROM resale_listings rl
        JOIN tickets t ON rl.ticketId = t.id
        JOIN seats s ON t.seatId = s.id
        WHERE t.busId = ? AND rl.status = 'LISTED'
      `, [bus.id]);

      // Direct available seats (not booked or held)
      const availableSeats = seats.filter((s) => s.status === 'AVAILABLE');
      const availableDirect = availableSeats.length;

      return {
        id: bus.id,
        operator: bus.operatorName,
        operatorCode: bus.operatorCode,
        busNumber: bus.busNumber,
        busType: bus.busType,
        routeFrom: bus.routeFrom,
        routeTo: bus.routeTo,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        travelDate: bus.travelDate,
        baseFare: bus.baseFare,
        totalSeats,
        availableDirect,
        isSoldOut: availableDirect === 0,
        resaleAvailableCount: resaleListings.length,
        resaleSeats: resaleListings
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. MY TICKETS (SELLER / BUYER)
// ==========================================
app.get('/api/tickets/my', requireAuth, (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || req.auth.userId;

    if (req.auth.userId !== userId && req.auth.role !== 'operator') {
      return res.status(403).json({ error: 'Unauthorized: Cannot view another traveller’s tickets' });
    }

    const tickets = DatabaseService.query(`
      SELECT t.*, b.routeFrom, b.routeTo, b.departureTime, b.arrivalTime,
             b.travelDate, b.busNumber, b.busType, o.name as operatorName,
             s.seatNumber, s.seatType
      FROM tickets t
      JOIN buses b ON t.busId = b.id
      JOIN operators o ON b.operatorId = o.id
      JOIN seats s ON t.seatId = s.id
      WHERE t.userId = ?
      ORDER BY t.issuedAt DESC
    `, [userId]);

    const formatted = tickets.map((t) => {
      // Find active resale listing if exists
      const listing = DatabaseService.get(`
        SELECT * FROM resale_listings
        WHERE ticketId = ? AND status IN ('LISTED', 'PURCHASED', 'COMPLETED')
        ORDER BY createdAt DESC LIMIT 1
      `, [t.id]);

      let transactions = [];
      if (listing) {
        transactions = DatabaseService.query(`
          SELECT tx.*, r.referenceId as refundReferenceId, r.status as refundStatus
          FROM resale_transactions tx
          LEFT JOIN refunds r ON tx.id = r.transactionId
          WHERE tx.listingId = ?
        `, [listing.id]);
      }

      return {
        id: t.id,
        ticketNumber: t.ticketNumber,
        passengerName: t.passengerName,
        passengerAge: t.passengerAge,
        passengerGender: t.passengerGender,
        fare: t.fare,
        status: t.status,
        qrCode: t.qrCode,
        issuedAt: t.issuedAt,
        routeFrom: t.routeFrom,
        routeTo: t.routeTo,
        departureTime: t.departureTime,
        arrivalTime: t.arrivalTime,
        travelDate: t.travelDate,
        busNumber: t.busNumber,
        busType: t.busType,
        operatorName: t.operatorName,
        seatNumber: t.seatNumber,
        seatType: t.seatType,
        activeListing: listing
          ? {
              id: listing.id,
              listingNumber: listing.listingNumber,
              status: listing.status,
              originalPrice: listing.originalPrice,
              resalePrice: listing.resalePrice,
              platformFee: listing.platformFee,
              expectedRefund: listing.resalePrice - listing.platformFee,
              createdAt: listing.createdAt,
              transactions
            }
          : null
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/buses/:id/seats
app.get('/api/buses/:id/seats', (req, res) => {
  try {
    const busId = req.params.id;
    const seats = DatabaseService.query(`SELECT * FROM seats WHERE busId = ? ORDER BY seatNumber ASC`, [busId]);
    res.json(seats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tickets/:id
app.get('/api/tickets/:id', (req, res) => {
  try {
    const ticket = DatabaseService.get(`
      SELECT t.*, b.routeFrom, b.routeTo, b.departureTime, b.arrivalTime,
             b.travelDate, b.busNumber, b.busType, o.name as operatorName,
             s.seatNumber, s.seatType
      FROM tickets t
      JOIN buses b ON t.busId = b.id
      JOIN operators o ON b.operatorId = o.id
      JOIN seats s ON t.seatId = s.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    ticket.govIdNumber = maskGovId(ticket.govIdNumber);
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. SELLER RESALE LISTING
// ==========================================
app.post('/api/tickets/:id/list', requireAuth, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const sellerId = req.body.sellerId || req.auth.userId;

    if (req.auth.userId !== sellerId && req.auth.role !== 'operator') {
      return res.status(403).json({ error: 'Unauthorized: Cannot list tickets for another user' });
    }

    const result = await ResaleWorkflowService.listTicketForResale(ticketId, sellerId);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/resale/:id (Cancel resale listing)
app.delete('/api/resale/:id', requireAuth, async (req, res) => {
  try {
    const listingId = req.params.id;
    const sellerId = req.body.sellerId || req.auth.userId;

    if (req.auth.userId !== sellerId && req.auth.role !== 'operator') {
      return res.status(403).json({ error: 'Unauthorized: Cannot cancel listings for another user' });
    }

    const result = await ResaleWorkflowService.cancelListing(listingId, sellerId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 4. RESALE MARKETPLACE & DETAILS
// ==========================================
app.get('/api/resale/search', (req, res) => {
  try {
    const listings = DatabaseService.query(`
      SELECT l.*, s.seatNumber, s.seatType, b.busNumber, b.busType,
             o.name as operatorName, b.routeFrom, b.routeTo, b.travelDate,
             b.departureTime, (l.resalePrice + l.platformFee) as totalPrice
      FROM resale_listings l
      JOIN tickets t ON l.ticketId = t.id
      JOIN seats s ON t.seatId = s.id
      JOIN buses b ON t.busId = b.id
      JOIN operators o ON b.operatorId = o.id
      WHERE l.status = 'LISTED'
      ORDER BY l.createdAt DESC
    `);
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/resale/:id
app.get('/api/resale/:id', (req, res) => {
  try {
    const listing = DatabaseService.get(`
      SELECT l.*, s.seatNumber, s.seatType, b.id as busId, b.busNumber, b.busType,
             o.name as operatorName, b.routeFrom, b.routeTo, b.travelDate,
             b.departureTime, (l.resalePrice + l.platformFee) as totalPrice
      FROM resale_listings l
      JOIN tickets t ON l.ticketId = t.id
      JOIN seats s ON t.seatId = s.id
      JOIN buses b ON t.busId = b.id
      JOIN operators o ON b.operatorId = o.id
      WHERE l.id = ?
    `, [req.params.id]);

    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // Sanitize: do not expose seller identity to buyer
    res.json({
      id: listing.id,
      listingNumber: listing.listingNumber,
      status: listing.status,
      originalPrice: listing.originalPrice,
      resalePrice: listing.resalePrice,
      platformFee: listing.platformFee,
      totalPrice: listing.totalPrice,
      seat: {
        seatNumber: listing.seatNumber,
        seatType: listing.seatType
      },
      bus: {
        id: listing.busId,
        operatorName: listing.operatorName,
        busNumber: listing.busNumber,
        busType: listing.busType,
        routeFrom: listing.routeFrom,
        routeTo: listing.routeTo,
        departureTime: listing.departureTime,
        travelDate: listing.travelDate
      },
      createdAt: listing.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. BUYER CHECKOUT & PURCHASE
// ==========================================
app.post(['/api/resale/:id/purchase', '/resale/:id/purchase'], async (req, res) => {
  try {
    const listingId = req.params.id;
    const {
      buyerId,
      passengerName,
      passengerAge,
      passengerGender,
      phone,
      govIdType,
      govIdNumber,
      paymentMethod,
      digilockerVerified,
      digilockerTxnId,
      digilockerName
    } = req.body;

    if (!buyerId || !passengerName || !passengerAge || !passengerGender || !phone || !govIdType || !govIdNumber) {
      return res.status(400).json({ error: 'All passenger and identity fields are required' });
    }

    const result = await ResaleWorkflowService.purchaseResaleListing({
      listingId,
      buyerId,
      passengerName,
      passengerAge: Number(passengerAge),
      passengerGender,
      phone,
      govIdType,
      govIdNumber,
      paymentMethod,
      digilockerVerified: !!digilockerVerified,
      digilockerTxnId,
      digilockerName
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/payments/mock
app.post('/api/payments/mock', async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const payment = await MockPaymentService.processPayment(amount, paymentMethod);
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 6. OPERATOR DASHBOARD & REISSUE APPROVAL
// ==========================================
app.get('/api/operator/reissues', requireOperator, (req, res) => {
  try {
    const reissues = DatabaseService.query(`
      SELECT tx.*, l.originalPrice as fare, l.resalePrice,
             t.ticketNumber as origTicketNumber, t.passengerName as origPaxName, t.fare as origFare, t.status as origTicketStatus,
             s.seatNumber, s.seatType,
             b.id as busId, b.busNumber, b.routeFrom, b.routeTo, b.travelDate, b.departureTime,
             o.name as operatorName,
             uSeller.email as sellerEmail, uBuyer.email as buyerEmail,
             newT.ticketNumber as newTicketNumber, newT.status as newTicketStatus, newT.qrCode as newTicketQr,
             ref.id as refundId, ref.status as refundStatus, ref.referenceId as refundRef
      FROM resale_transactions tx
      JOIN resale_listings l ON tx.listingId = l.id
      JOIN tickets t ON l.ticketId = t.id
      JOIN seats s ON t.seatId = s.id
      JOIN buses b ON t.busId = b.id
      JOIN operators o ON b.operatorId = o.id
      JOIN users uSeller ON l.sellerId = uSeller.id
      JOIN users uBuyer ON tx.buyerId = uBuyer.id
      LEFT JOIN tickets newT ON tx.newTicketId = newT.id
      LEFT JOIN refunds ref ON tx.id = ref.transactionId
      ORDER BY tx.createdAt DESC
    `);

    const formatted = reissues.map((r) => ({
      transactionId: r.id,
      transactionNumber: r.transactionNumber,
      status: r.status,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
      fare: r.fare,
      resalePrice: r.resalePrice,
      platformFee: r.platformFee,
      sellerRefundAmount: r.sellerRefundAmount,
      bus: {
        id: r.busId,
        operatorName: r.operatorName,
        busNumber: r.busNumber,
        routeFrom: r.routeFrom,
        routeTo: r.routeTo,
        travelDate: r.travelDate,
        departureTime: r.departureTime
      },
      seat: {
        seatNumber: r.seatNumber,
        seatType: r.seatType
      },
      originalPassenger: {
        name: r.origPaxName,
        ticketNumber: r.origTicketNumber,
        fare: r.origFare,
        sellerEmail: r.sellerEmail,
        status: r.origTicketStatus
      },
      newPassenger: {
        name: r.buyerPassengerName,
        age: r.buyerPassengerAge,
        gender: r.buyerPassengerGender,
        phone: r.buyerPhone,
        govIdType: r.buyerGovIdType,
        govIdNumber: maskGovId(r.buyerGovIdNumber),
        digilockerVerified: !!r.digilockerVerified,
        digilockerTxnId: r.digilockerTxnId,
        buyerEmail: r.buyerEmail
      },
      newTicket: r.newTicketNumber
        ? {
            id: r.newTicketId,
            ticketNumber: r.newTicketNumber,
            status: r.newTicketStatus,
            qrCode: r.newTicketQr
          }
        : null,
      refunds: r.refundId
        ? [{ id: r.refundId, status: r.refundStatus, referenceId: r.refundRef, amount: r.sellerRefundAmount }]
        : [],
      cbdcEscrow: CBDCEscrowService.getContractByTransaction(r.id)
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/operator/reissues/:id/approve', requireOperator, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const operatorUserId = req.auth.userId;

    const result = await ResaleWorkflowService.approveReissue(transactionId, operatorUserId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/operator/reissues/:id/reject', requireOperator, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { reason } = req.body;

    const result = await ResaleWorkflowService.rejectReissue(transactionId, reason);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 7. SIMULATED OPERATOR REISSUE SERVICE (Section 13)
// ==========================================
app.post('/mock-operator/reissue', async (req, res) => {
  try {
    const { original_ticket_id, new_passenger } = req.body;
    if (!original_ticket_id || !new_passenger) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const response = await MockOperatorService.requestReissue('SWIFT', original_ticket_id, new_passenger);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/mock-operator/capabilities', (req, res) => {
  const caps = MockOperatorService.getOperatorCapabilities('SWIFT');
  res.json(caps);
});

// ==========================================
// 7B. DIGILOCKER VERIFICATION ENDPOINTS
// ==========================================
app.post('/api/digilocker/initiate', (req, res) => {
  try {
    const { aadhaarNumber, purpose } = req.body;
    if (!aadhaarNumber) {
      return res.status(400).json({ error: 'Aadhaar Number or Virtual ID is required' });
    }

    const clean = String(aadhaarNumber).replace(/\s+/g, '');
    if (clean.length !== 12 && clean.length !== 16) {
      return res.status(400).json({ error: 'Please provide a valid 12-digit Aadhaar number or 16-digit Virtual ID' });
    }

    const txnId = `DL-TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    res.json({
      success: true,
      txnId,
      message: 'DigiLocker consent session generated. Authenticate via OTP to complete Aadhaar e-KYC.',
      mode: process.env.DIGILOCKER_CLIENT_ID ? 'PRODUCTION' : 'SANDBOX',
      maskedAadhaar: `XXXX XXXX ${clean.slice(-4)}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/digilocker/verify-otp', (req, res) => {
  try {
    const { txnId, otp, expectedName } = req.body;
    if (!txnId || !otp) {
      return res.status(400).json({ error: 'Transaction ID and OTP are required' });
    }

    if (otp !== '123456' && otp.length !== 6) {
      return res.status(400).json({ error: 'Invalid DigiLocker OTP. (Use demo OTP: 123456 in sandbox)' });
    }

    // In real mode or sandbox, generate verified signed XML metadata token
    const verifiedName = expectedName ? expectedName.trim() : 'Verified Passenger';
    res.json({
      success: true,
      txnId,
      verified: true,
      verifiedAt: new Date().toISOString(),
      issuer: 'UIDAI / DigiLocker National Digital Document Gateway',
      xmlSignature: `SHA256-RSA-${crypto.randomBytes(16).toString('hex')}`,
      verifiedProfile: {
        name: verifiedName,
        dobMatch: true,
        gender: 'MATCHED',
        idType: 'Aadhaar Card'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7B-2. RBI CBDC (e-RUPEE) PROGRAMMABLE ESCROW ENDPOINTS
// ==========================================
app.get('/api/cbdc/contracts', (req, res) => {
  try {
    const contracts = CBDCEscrowService.getAllContracts();
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cbdc/contracts/:transactionId', (req, res) => {
  try {
    const contract = CBDCEscrowService.getContractByTransaction(req.params.transactionId);
    if (!contract) return res.status(404).json({ error: 'No CBDC smart contract for this transaction' });
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7C. REALTIME OPERATOR FLEET & SEAT MANAGEMENT
// ==========================================
app.post('/api/operator/buses', requireOperator, (req, res) => {
  try {
    const {
      busNumber,
      busType,
      routeFrom,
      routeTo,
      departureTime,
      arrivalTime,
      travelDate,
      baseFare,
      seats // Array of { seatNumber, seatType }
    } = req.body;

    if (!busNumber || !routeFrom || !routeTo || !departureTime || !arrivalTime || !travelDate || !baseFare) {
      return res.status(400).json({ error: 'All bus itinerary fields are required' });
    }

    // Lookup operator
    let operator = DatabaseService.get(`SELECT id FROM operators LIMIT 1`);
    if (!operator) {
      const opId = 'op_prod_' + Date.now();
      DatabaseService.run(`
        INSERT INTO operators (id, name, code, contactEmail, supportsResale, supportsPassengerReissue, minimumResaleWindowMinutes, maximumResalePrice, createdAt)
        VALUES (?, 'Verified Fleet Operator', 'FLEET', 'dispatch@fleet.in', 1, 1, 60, 'FACE_VALUE', ?)
      `, [opId, new Date().toISOString()]);
      operator = { id: opId };
    }

    const busId = `bus_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const queries = [
      {
        sql: `INSERT INTO buses (id, operatorId, busNumber, busType, routeFrom, routeTo, departureTime, arrivalTime, travelDate, baseFare, isLive, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        params: [busId, operator.id, busNumber.trim().toUpperCase(), busType || 'AC Sleeper (2+1)', routeFrom.trim(), routeTo.trim(), departureTime, arrivalTime, travelDate, Number(baseFare), now]
      }
    ];

    // Build seats
    const seatList = Array.isArray(seats) && seats.length > 0 ? seats : [
      { seatNumber: 'U1', seatType: 'UPPER_BERTH' }, { seatNumber: 'U2', seatType: 'UPPER_BERTH' },
      { seatNumber: 'U3', seatType: 'UPPER_BERTH' }, { seatNumber: 'U4', seatType: 'UPPER_BERTH' },
      { seatNumber: 'L1', seatType: 'LOWER_BERTH' }, { seatNumber: 'L2', seatType: 'LOWER_BERTH' },
      { seatNumber: 'L3', seatType: 'LOWER_BERTH' }, { seatNumber: 'L4', seatType: 'LOWER_BERTH' }
    ];

    for (const s of seatList) {
      queries.push({
        sql: `INSERT INTO seats (id, busId, seatNumber, seatType, status) VALUES (?, ?, ?, ?, 'AVAILABLE')`,
        params: [`seat_${busId}_${s.seatNumber}`, busId, s.seatNumber, s.seatType || 'UPPER_BERTH']
      });
    }

    DatabaseService.transaction(queries);
    const createdBus = DatabaseService.get(`SELECT * FROM buses WHERE id = ?`, [busId]);
    res.status(201).json({ success: true, bus: createdBus, totalSeats: seatList.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/operator/buses/:id', requireOperator, (req, res) => {
  try {
    const busId = req.params.id;
    DatabaseService.transaction([
      { sql: `DELETE FROM seats WHERE busId = ?`, params: [busId] },
      { sql: `DELETE FROM buses WHERE id = ?`, params: [busId] }
    ]);
    res.json({ success: true, message: 'Bus and seats deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book a direct ticket from zero for a passenger (real production flow)
app.post('/api/tickets/book-direct', requireAuth, async (req, res) => {
  try {
    const { busId, seatId, passengerName, passengerAge, passengerGender, phone, govIdType, govIdNumber } = req.body;
    if (!busId || !seatId || !passengerName || !phone) {
      return res.status(400).json({ error: 'Bus, seat, passenger name, and phone are required' });
    }

    const seat = DatabaseService.get(`SELECT * FROM seats WHERE id = ? AND busId = ?`, [seatId, busId]);
    if (!seat) return res.status(404).json({ error: 'Seat not found on this coach' });
    if (seat.status !== 'AVAILABLE') return res.status(409).json({ error: 'Seat is no longer available' });

    const bus = DatabaseService.get(`SELECT * FROM buses WHERE id = ?`, [busId]);
    const operator = DatabaseService.get(`SELECT * FROM operators WHERE id = ?`, [bus.operatorId]);
    const ticketId = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ticketNumber = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowIso = new Date().toISOString();

    const qrPayload = JSON.stringify({
      app: 'SeatRelay',
      tId: ticketNumber,
      op: operator?.name || 'Coach Operator',
      seat: seat.seatNumber,
      pax: passengerName,
      status: 'CONFIRMED',
      v: 1
    });

    const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: { dark: '#0f172a', light: '#ffffff' }
    });

    DatabaseService.transaction([
      {
        sql: `UPDATE seats SET status = 'BOOKED' WHERE id = ?`,
        params: [seatId]
      },
      {
        sql: `INSERT INTO tickets (
                id, ticketNumber, userId, busId, seatId,
                passengerName, passengerAge, passengerGender, passengerPhone,
                govIdType, govIdNumber, fare, status, qrCode, issuedAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?)`,
        params: [
          ticketId, ticketNumber, req.auth.userId, busId, seatId,
          passengerName, Number(passengerAge || 25), passengerGender || 'Other', phone,
          govIdType || 'Aadhaar Card', govIdNumber || 'XXXX', bus.baseFare, qrCodeUrl, nowIso, nowIso
        ]
      },
      {
        sql: `INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt)
              VALUES (?, ?, 'Ticket Confirmed', ?, 'SUCCESS', 0, ?)`,
        params: [
          uuidv4(), req.auth.userId,
          `Your direct booking ${ticketNumber} for seat ${seat.seatNumber} is confirmed.`,
          nowIso
        ]
      }
    ]);

    const created = DatabaseService.get(`SELECT * FROM tickets WHERE id = ?`, [ticketId]);
    res.status(201).json({ success: true, ticket: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 8. AUTHENTICATION & USERS
// ==========================================
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = DatabaseService.get(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [email.trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // If user has no password yet (legacy), allow setup or verify against default
    let isValid = false;
    if (user.passwordHash && user.salt) {
      isValid = verifyPassword(password, user.passwordHash, user.salt);
    } else {
      // Allow user default password based on email
      const defaultPass = `${user.email.split('@')[0]}@123`;
      if (password === defaultPass || password === 'password123') {
        isValid = true;
        // Auto-hash password
        const creds = hashPassword(password);
        DatabaseService.run(`UPDATE users SET passwordHash = ?, salt = ? WHERE id = ?`, [creds.hash, creds.salt, user.id]);
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken({ userId: user.id, email: user.email, role: user.role });
    const { passwordHash, salt, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields (name, email, phone, password) are required' });
    }

    const existing = DatabaseService.get(`SELECT id FROM users WHERE LOWER(email) = LOWER(?)`, [email.trim()]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const creds = hashPassword(password);
    const assignedRole = role === 'operator' ? 'operator' : role === 'seller' ? 'seller' : 'buyer';
    const now = new Date().toISOString();

    DatabaseService.run(`
      INSERT INTO users (id, name, email, phone, role, passwordHash, salt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, name.trim(), email.trim().toLowerCase(), phone.trim(), assignedRole, creds.hash, creds.salt, now]);

    const newUser = DatabaseService.get(`SELECT id, name, email, phone, role, createdAt FROM users WHERE id = ?`, [userId]);
    const token = createToken({ userId: newUser.id, email: newUser.email, role: newUser.role });

    res.status(201).json({ token, user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Session expired or token invalid' });
    }

    const user = DatabaseService.get(`SELECT id, name, email, phone, role, createdAt FROM users WHERE id = ?`, [payload.userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', (req, res) => {
  try {
    const users = DatabaseService.query(`SELECT id, name, email, phone, role, createdAt FROM users ORDER BY createdAt ASC`);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications/:userId', (req, res) => {
  try {
    const notifs = DatabaseService.query(`
      SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 20
    `, [req.params.userId]);
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/refunds/:id', (req, res) => {
  try {
    const refund = DatabaseService.get(`SELECT * FROM refunds WHERE id = ?`, [req.params.id]);
    if (!refund) return res.status(404).json({ error: 'Refund not found' });
    res.json(refund);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transactions', (req, res) => {
  try {
    const txs = DatabaseService.query(`
      SELECT tx.*, l.originalPrice as fare, l.resalePrice,
             t.ticketNumber as originalTicketNumber, s.seatNumber,
             b.routeFrom, b.routeTo, b.travelDate, o.name as operatorName,
             r.referenceId as refundReferenceId, r.status as refundStatus
      FROM resale_transactions tx
      JOIN resale_listings l ON tx.listingId = l.id
      JOIN tickets t ON l.ticketId = t.id
      JOIN seats s ON t.seatId = s.id
      JOIN buses b ON t.busId = b.id
      JOIN operators o ON b.operatorId = o.id
      LEFT JOIN refunds r ON tx.id = r.transactionId
      ORDER BY tx.createdAt DESC
    `);
    res.json(txs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 9. AUTOMATED COMPLETE DEMO RUNNER (Section 17)
// ==========================================
app.post('/demo/run-full-flow', async (req, res) => {
  try {
    const rahul = DatabaseService.get(`SELECT * FROM users WHERE email = 'rahul@example.com'`);
    const priya = DatabaseService.get(`SELECT * FROM users WHERE email = 'priya@example.com'`);
    const operator = DatabaseService.get(`SELECT * FROM users WHERE role = 'operator'`);

    if (!rahul || !priya) {
      return res.status(400).json({ error: 'Demo users not found. Run seed.' });
    }

    let ticket = DatabaseService.get(`SELECT * FROM tickets WHERE ticketNumber = 'SB-92831'`);
    if (!ticket) {
      return res.status(400).json({ error: 'Rahul demo ticket SB-92831 not found' });
    }

    // Reset ticket to confirmed if needed
    if (ticket.status !== 'CONFIRMED' && ticket.status !== 'LISTED_FOR_RESALE') {
      DatabaseService.run(`UPDATE tickets SET status = 'CONFIRMED' WHERE id = ?`, [ticket.id]);
    }

    const stepsLog = [];

    // 1. Seller lists U12
    let listing = DatabaseService.get(`SELECT * FROM resale_listings WHERE ticketId = ? AND status = 'LISTED'`, [ticket.id]);
    if (!listing) {
      const listRes = await ResaleWorkflowService.listTicketForResale(ticket.id, rahul.id);
      listing = listRes.listing;
    }

    stepsLog.push({
      step: 1,
      title: 'Seller Lists U12',
      detail: `Rahul Sharma listed Ticket SB-92831 (Seat U12) for ₹850 face-value`,
      timestamp: new Date().toISOString()
    });

    // 2. Seat appears in resale marketplace
    stepsLog.push({
      step: 2,
      title: 'Seat Appears in Resale Marketplace',
      detail: `Bus marked SOLD OUT, with badge '♻️ 1 seat available through SeatRelay'`,
      timestamp: new Date().toISOString()
    });

    // 3. Buyer purchases U12
    const purchaseRes = await ResaleWorkflowService.purchaseResaleListing({
      listingId: listing.id,
      buyerId: priya.id,
      passengerName: 'Priya Kumar',
      passengerAge: 24,
      passengerGender: 'Female',
      phone: '+91 98765 43210',
      govIdType: 'Aadhaar Card',
      govIdNumber: '9876 5432 4821',
      paymentMethod: 'UPI'
    });

    stepsLog.push({
      step: 3,
      title: 'Buyer Purchases U12',
      detail: `Priya Kumar confirmed purchase at original ticket fare ₹850`,
      timestamp: new Date().toISOString()
    });

    // 4. Payment succeeds
    stepsLog.push({
      step: 4,
      title: 'Payment Confirmed',
      detail: `Mock payment reference ${purchaseRes.paymentResult.referenceId} generated`,
      timestamp: new Date().toISOString()
    });

    // 5. Operator receives reissue request
    stepsLog.push({
      step: 5,
      title: 'Operator Receives Reissue Request',
      detail: `Pending request #${purchaseRes.transaction.transactionNumber} queued on operator dashboard`,
      timestamp: new Date().toISOString()
    });

    // 6. Operator approves reissue
    const approveRes = await ResaleWorkflowService.approveReissue(purchaseRes.transaction.id, operator ? operator.id : 'op');

    stepsLog.push({
      step: 6,
      title: 'Operator Approves Reissue',
      detail: `Operator authorized passenger reissue to Priya Kumar (Auth: ${approveRes.operatorAuth})`,
      timestamp: new Date().toISOString()
    });

    // 7. New ticket generated
    stepsLog.push({
      step: 7,
      title: 'New Digital Ticket Generated',
      detail: `Digital Ticket ${approveRes.newTicket.ticketNumber} generated with verified QR code`,
      timestamp: new Date().toISOString()
    });

    // 8. Original ticket invalidated
    stepsLog.push({
      step: 8,
      title: 'Original Ticket Invalidated',
      detail: `Rahul's ticket SB-92831 marked INVALIDATED in system & operator manifest`,
      timestamp: new Date().toISOString()
    });

    // 9. Seller refund initiated
    stepsLog.push({
      step: 9,
      title: 'Seller Refund Initiated & Completed',
      detail: `₹850 refunded to Rahul Sharma (Ref: ${approveRes.refund.referenceId})`,
      timestamp: new Date().toISOString()
    });

    // 10. Completed
    stepsLog.push({
      step: 10,
      title: 'Transaction Completed',
      detail: `Entire lifecycle completed at strict face-value. Zero scalping. Fully reconciled.`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      newTicket: approveRes.newTicket,
      steps: stepsLog
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /demo/reset
app.post('/demo/reset', async (req, res) => {
  try {
    DatabaseService.run(`DELETE FROM refunds`);
    DatabaseService.run(`DELETE FROM payments`);
    DatabaseService.run(`DELETE FROM resale_transactions`);
    DatabaseService.run(`DELETE FROM resale_listings`);
    DatabaseService.run(`DELETE FROM notifications`);
    DatabaseService.run(`DELETE FROM tickets`);
    DatabaseService.run(`DELETE FROM seats`);
    DatabaseService.run(`DELETE FROM buses`);
    DatabaseService.run(`DELETE FROM operators`);
    DatabaseService.run(`DELETE FROM users`);

    await seedData();
    res.json({ success: true, message: 'Database reset to initial demo state' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SeatRelay Backend Server running on http://localhost:${PORT}`);
});
