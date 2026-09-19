const { DatabaseService } = require('./db');
const QRCode = require('qrcode');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

function maskGovId(idNumber) {
  if (!idNumber) return '';
  const clean = idNumber.replace(/\s+/g, '');
  if (clean.length <= 4) return 'XXXX';
  const last4 = clean.slice(-4);
  return `XXXX XXXX ${last4}`;
}

class MockOperatorService {
  static async requestReissue(operatorCode, originalTicketId, newPassenger) {
    // Realistic GDS latency simulation
    await new Promise((resolve) => setTimeout(resolve, 300));

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const newTicketId = `SR-${randomSuffix}`;
    const authCode = `AUTH-OP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    return {
      success: true,
      new_ticket_id: newTicketId,
      original_ticket_status: 'INVALIDATED',
      new_ticket_status: 'CONFIRMED',
      operator_auth_code: authCode,
      reissued_at: new Date().toISOString()
    };
  }

  static getOperatorCapabilities(operatorCode) {
    return {
      operator_code: operatorCode || 'SWIFT',
      supports_resale: true,
      supports_passenger_reissue: true,
      minimum_resale_window_minutes: 60,
      maximum_resale_price: 'FACE_VALUE',
      reissue_fee_waived: true
    };
  }
}

class MockPaymentService {
  static async processPayment(amount, paymentMethod = 'UPI/Card') {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      success: true,
      paymentId: `pid_${Math.random().toString(36).substring(2, 11)}`,
      referenceId: `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      amount,
      paymentMethod,
      timestamp: new Date().toISOString()
    };
  }

  static async processRefund(amount, sellerId) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return {
      success: true,
      refundId: `rf_${Math.random().toString(36).substring(2, 11)}`,
      referenceId: `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      amount,
      status: 'COMPLETED',
      timestamp: new Date().toISOString()
    };
  }
}

class ResaleWorkflowService {
  /**
   * Rule: Face-value restriction (resale_price <= original_ticket_price)
   * Rule: One active listing per ticket
   * Rule: Original ticket remains valid until operator reissue
   */
  static async listTicketForResale(ticketId, sellerId) {
    const ticket = DatabaseService.get(`
      SELECT t.*, b.routeFrom, b.routeTo, b.departureTime, o.minimumResaleWindowMinutes
      FROM tickets t
      JOIN buses b ON t.busId = b.id
      JOIN operators o ON b.operatorId = o.id
      WHERE t.id = ?
    `, [ticketId]);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.userId !== sellerId) {
      throw new Error('Unauthorized: You do not own this ticket');
    }

    if (ticket.status !== 'CONFIRMED') {
      throw new Error(`Ticket is not eligible for resale. Current status: ${ticket.status}`);
    }

    const now = new Date();
    const departure = new Date(ticket.departureTime);
    const diffMinutes = (departure.getTime() - now.getTime()) / (1000 * 60);
    const minWindow = ticket.minimumResaleWindowMinutes || 60;

    if (diffMinutes < minWindow) {
      throw new Error(`Too late: Ticket cannot be listed because departure is in less than ${minWindow} minutes`);
    }

    // Check existing active listing
    const existing = DatabaseService.get(`
      SELECT * FROM resale_listings 
      WHERE ticketId = ? AND status IN ('LISTED', 'RESERVED', 'PURCHASED')
    `, [ticketId]);

    if (existing) {
      throw new Error('This ticket already has an active resale listing');
    }

    // Face-value enforcement (strictly equal to original ticket fare)
    const originalPrice = ticket.fare;
    const resalePrice = originalPrice;
    const platformFee = 0.0;
    const listingId = uuidv4();
    const listingNumber = `RL-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowIso = now.toISOString();

    DatabaseService.transaction([
      {
        sql: `INSERT INTO resale_listings (id, listingNumber, ticketId, sellerId, originalPrice, resalePrice, platformFee, status, createdAt, expiresAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'LISTED', ?, ?)`,
        params: [listingId, listingNumber, ticketId, sellerId, originalPrice, resalePrice, platformFee, nowIso, departure.toISOString()]
      },
      {
        sql: `UPDATE tickets SET status = 'LISTED_FOR_RESALE', updatedAt = ? WHERE id = ?`,
        params: [nowIso, ticketId]
      },
      {
        sql: `INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt)
              VALUES (?, ?, 'Seat Listed for Resale', ?, 'INFO', 0, ?)`,
        params: [
          uuidv4(),
          sellerId,
          `Your seat for ${ticket.routeFrom} → ${ticket.routeTo} is now listed at face value ₹${resalePrice}. It remains valid for you until purchased and reissued.`,
          nowIso
        ]
      }
    ]);

    return {
      listing: DatabaseService.get(`SELECT * FROM resale_listings WHERE id = ?`, [listingId]),
      ticket: DatabaseService.get(`SELECT * FROM tickets WHERE id = ?`, [ticketId])
    };
  }

  /**
   * Cancel resale listing (only while LISTED)
   */
  static async cancelListing(listingId, sellerId) {
    const listing = DatabaseService.get(`SELECT * FROM resale_listings WHERE id = ?`, [listingId]);
    if (!listing) throw new Error('Listing not found');
    if (listing.sellerId !== sellerId) throw new Error('Unauthorized');
    if (listing.status !== 'LISTED') {
      throw new Error(`Cannot cancel listing. Current status: ${listing.status}. Only unpurchased listings can be cancelled.`);
    }

    const nowIso = new Date().toISOString();
    DatabaseService.transaction([
      {
        sql: `UPDATE resale_listings SET status = 'CANCELLED' WHERE id = ?`,
        params: [listingId]
      },
      {
        sql: `UPDATE tickets SET status = 'CONFIRMED', updatedAt = ? WHERE id = ?`,
        params: [nowIso, listing.ticketId]
      }
    ]);

    return {
      listing: DatabaseService.get(`SELECT * FROM resale_listings WHERE id = ?`, [listingId]),
      ticket: DatabaseService.get(`SELECT * FROM tickets WHERE id = ?`, [listing.ticketId])
    };
  }

  /**
   * Atomic buyer purchase
   */
  static async purchaseResaleListing(params) {
    const {
      listingId,
      buyerId,
      passengerName,
      passengerAge,
      passengerGender,
      phone,
      govIdType,
      govIdNumber,
      paymentMethod
    } = params;

    const listing = DatabaseService.get(`
      SELECT l.*, t.seatId, t.busId, s.seatNumber, b.routeFrom, b.routeTo, b.travelDate, b.departureTime, o.name as operatorName
      FROM resale_listings l
      JOIN tickets t ON l.ticketId = t.id
      JOIN seats s ON t.seatId = s.id
      JOIN buses b ON t.busId = b.id
      JOIN operators o ON b.operatorId = o.id
      WHERE l.id = ?
    `, [listingId]);

    if (!listing) throw new Error('Resale listing not found');
    if (listing.status !== 'LISTED') {
      throw new Error('Sorry, this seat was just purchased by another traveller.');
    }
    if (listing.sellerId === buyerId) {
      throw new Error('You cannot purchase your own listed ticket');
    }

    // Process mock payment
    const paymentResult = await MockPaymentService.processPayment(listing.resalePrice, paymentMethod || 'UPI');
    const transactionId = uuidv4();
    const transactionNumber = `SR-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowIso = new Date().toISOString();
    const sellerRefundAmount = listing.resalePrice - listing.platformFee;

    // Atomic database update
    DatabaseService.transaction([
      {
        sql: `UPDATE resale_listings SET status = 'PURCHASED' WHERE id = ? AND status = 'LISTED'`,
        params: [listingId]
      },
      {
        sql: `INSERT INTO resale_transactions (
                id, transactionNumber, listingId, buyerId,
                buyerPassengerName, buyerPassengerAge, buyerPassengerGender,
                buyerPhone, buyerGovIdType, buyerGovIdNumber,
                status, sellerRefundAmount, platformFee, createdAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REISSUE_PENDING', ?, ?, ?)`,
        params: [
          transactionId, transactionNumber, listingId, buyerId,
          passengerName, passengerAge, passengerGender,
          phone, govIdType, govIdNumber,
          sellerRefundAmount, listing.platformFee, nowIso
        ]
      },
      {
        sql: `INSERT INTO payments (id, transactionId, amount, status, paymentMethod, referenceId, createdAt)
              VALUES (?, ?, ?, 'COMPLETED', ?, ?, ?)`,
        params: [uuidv4(), transactionId, listing.resalePrice, paymentMethod || 'UPI', paymentResult.referenceId, nowIso]
      }
    ]);

    // Send notification to operators
    const operators = DatabaseService.query(`SELECT id FROM users WHERE role = 'operator'`);
    for (const op of operators) {
      DatabaseService.run(`
        INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt)
        VALUES (?, ?, 'New Reissue Request', ?, 'ACTION_REQUIRED', 0, ?)
      `, [
        uuidv4(),
        op.id,
        `🔄 New ticket reissue request #${transactionNumber} requires approval for Seat ${listing.seatNumber}.`,
        nowIso
      ]);
    }

    return {
      transaction: DatabaseService.get(`SELECT * FROM resale_transactions WHERE id = ?`, [transactionId]),
      paymentResult,
      listing
    };
  }

  /**
   * Operator Approval Workflow
   */
  static async approveReissue(transactionId, operatorUserId) {
    const tx = DatabaseService.get(`
      SELECT tx.*, l.ticketId, l.sellerId, l.originalPrice, l.resalePrice,
             t.ticketNumber as origTicketNumber, t.passengerName as origPaxName,
             s.id as seatId, s.seatNumber, s.seatType,
             b.id as busId, b.busNumber, b.busType, b.routeFrom, b.routeTo, b.travelDate, b.departureTime,
             o.name as operatorName, o.code as operatorCode,
             uSeller.email as sellerEmail, uBuyer.email as buyerEmail
      FROM resale_transactions tx
      JOIN resale_listings l ON tx.listingId = l.id
      JOIN tickets t ON l.ticketId = t.id
      JOIN seats s ON t.seatId = s.id
      JOIN buses b ON t.busId = b.id
      JOIN operators o ON b.operatorId = o.id
      JOIN users uSeller ON l.sellerId = uSeller.id
      JOIN users uBuyer ON tx.buyerId = uBuyer.id
      WHERE tx.id = ?
    `, [transactionId]);

    if (!tx) throw new Error('Resale transaction not found');
    if (tx.status !== 'REISSUE_PENDING') {
      throw new Error(`Transaction is not pending reissue. Current status: ${tx.status}`);
    }

    // Call Mock Operator Service
    const opResp = await MockOperatorService.requestReissue(tx.operatorCode, tx.origTicketNumber, {
      name: tx.buyerPassengerName,
      age: tx.buyerPassengerAge,
      gender: tx.buyerPassengerGender,
      phone: tx.buyerPhone
    });

    if (!opResp.success) {
      throw new Error('The operator could not reissue this ticket. Your payment has not been released to the seller.');
    }

    const newTicketNumber = opResp.new_ticket_id;

    // Generate verified QR code containing new ticket data
    const qrPayload = JSON.stringify({
      app: 'SeatRelay',
      tId: newTicketNumber,
      op: tx.operatorName,
      bus: tx.busNumber,
      route: `${tx.routeFrom} → ${tx.routeTo}`,
      date: tx.travelDate,
      seat: tx.seatNumber,
      pax: tx.buyerPassengerName,
      status: 'CONFIRMED',
      origInvalidated: tx.origTicketNumber,
      v: 1
    });

    const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: { dark: '#0f172a', light: '#ffffff' }
    });

    // Process seller refund
    const refundResult = await MockPaymentService.processRefund(tx.sellerRefundAmount, tx.sellerId);

    const newTicketId = uuidv4();
    const refundId = uuidv4();
    const nowIso = new Date().toISOString();

    // Perform atomic state updates
    DatabaseService.transaction([
      // 1. Invalidate original seller ticket
      {
        sql: `UPDATE tickets SET status = 'INVALIDATED', updatedAt = ? WHERE id = ?`,
        params: [nowIso, tx.ticketId]
      },
      // 2. Reissue new valid ticket for buyer
      {
        sql: `INSERT INTO tickets (
                id, ticketNumber, userId, busId, seatId,
                passengerName, passengerAge, passengerGender, passengerPhone,
                govIdType, govIdNumber, fare, status, qrCode,
                reissuedFromId, issuedAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?, ?)`,
        params: [
          newTicketId, newTicketNumber, tx.buyerId, tx.busId, tx.seatId,
          tx.buyerPassengerName, tx.buyerPassengerAge, tx.buyerPassengerGender, tx.buyerPhone,
          tx.buyerGovIdType, tx.buyerGovIdNumber, tx.resalePrice, qrCodeUrl,
          tx.ticketId, nowIso, nowIso
        ]
      },
      // 3. Record Refund
      {
        sql: `INSERT INTO refunds (id, transactionId, sellerId, amount, status, referenceId, createdAt, completedAt)
              VALUES (?, ?, ?, ?, 'COMPLETED', ?, ?, ?)`,
        params: [refundId, tx.id, tx.sellerId, tx.sellerRefundAmount, refundResult.referenceId, nowIso, nowIso]
      },
      // 4. Update transaction status to COMPLETED
      {
        sql: `UPDATE resale_transactions SET status = 'COMPLETED', newTicketId = ?, completedAt = ? WHERE id = ?`,
        params: [newTicketId, nowIso, tx.id]
      },
      // 5. Update listing to COMPLETED
      {
        sql: `UPDATE resale_listings SET status = 'COMPLETED' WHERE id = ?`,
        params: [tx.listingId]
      },
      // 6. Notify Seller
      {
        sql: `INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt)
              VALUES (?, ?, 'Resale Completed & Refund Initiated', ?, 'SUCCESS', 0, ?)`,
        params: [
          uuidv4(),
          tx.sellerId,
          `🎉 Your seat ${tx.seatNumber} has been resold. ₹${tx.sellerRefundAmount} refund initiated and completed to your account (Ref: ${refundResult.referenceId}).`,
          nowIso
        ]
      },
      // 7. Notify Buyer
      {
        sql: `INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt)
              VALUES (?, ?, 'Ticket Reissued Successfully', ?, 'SUCCESS', 0, ?)`,
        params: [
          uuidv4(),
          tx.buyerId,
          `🎟️ Your bus ticket has been reissued successfully. Seat ${tx.seatNumber} is confirmed. Digital QR ticket is ready.`,
          nowIso
        ]
      }
    ]);

    return {
      success: true,
      transaction: DatabaseService.get(`SELECT * FROM resale_transactions WHERE id = ?`, [tx.id]),
      newTicket: DatabaseService.get(`SELECT * FROM tickets WHERE id = ?`, [newTicketId]),
      refund: DatabaseService.get(`SELECT * FROM refunds WHERE id = ?`, [refundId]),
      operatorAuth: opResp.operator_auth_code
    };
  }

  /**
   * Operator Rejection Workflow
   */
  static async rejectReissue(transactionId, reason = 'Operator rejected request') {
    const tx = DatabaseService.get(`SELECT * FROM resale_transactions WHERE id = ?`, [transactionId]);
    if (!tx) throw new Error('Transaction not found');
    if (tx.status !== 'REISSUE_PENDING') {
      throw new Error(`Cannot reject. Status: ${tx.status}`);
    }

    const listing = DatabaseService.get(`SELECT * FROM resale_listings WHERE id = ?`, [tx.listingId]);
    const nowIso = new Date().toISOString();

    DatabaseService.transaction([
      {
        sql: `UPDATE resale_transactions SET status = 'REJECTED' WHERE id = ?`,
        params: [transactionId]
      },
      {
        sql: `UPDATE resale_listings SET status = 'LISTED' WHERE id = ?`,
        params: [tx.listingId]
      },
      {
        sql: `UPDATE tickets SET status = 'CONFIRMED', updatedAt = ? WHERE id = ?`,
        params: [nowIso, listing.ticketId]
      },
      {
        sql: `INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt)
              VALUES (?, ?, 'Reissue Rejected by Operator', ?, 'WARNING', 0, ?)`,
        params: [
          uuidv4(),
          tx.buyerId,
          `The operator could not reissue this ticket: ${reason}. Your payment will be refunded immediately.`,
          nowIso
        ]
      }
    ]);

    return { success: true };
  }
}

module.exports = {
  MockOperatorService,
  MockPaymentService,
  ResaleWorkflowService,
  maskGovId
};
