import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ResaleWorkflowService } from '../services/resale.service';
import { MockOperatorService } from '../mock-operator/operator.service';
import { PrivacyHelper } from '../utils/privacy';

const router = Router();
const prisma = new PrismaClient();

// ==========================================
// 1. BUS SEARCH API
// ==========================================
// GET /api/buses/search?from=Bangalore&to=Chennai&date=2026-09-19
router.get('/buses/search', async (req: Request, res: Response) => {
  try {
    const { from, to, date } = req.query;

    const whereClause: any = {};
    if (from) whereClause.routeFrom = { contains: String(from) };
    if (to) whereClause.routeTo = { contains: String(to) };
    if (date) whereClause.travelDate = String(date);

    const buses = await prisma.bus.findMany({
      where: whereClause,
      include: {
        operator: true,
        seats: {
          include: {
            tickets: {
              where: {
                status: { in: ['CONFIRMED', 'LISTED_FOR_RESALE'] }
              },
              include: {
                resaleListings: {
                  where: { status: 'LISTED' }
                }
              }
            }
          }
        }
      }
    });

    // Format response with standard availability vs resale availability
    const formattedBuses = buses.map((bus) => {
      const totalSeats = bus.seats.length;
      let availableDirect = 0;
      const resaleSeats: any[] = [];

      for (const seat of bus.seats) {
        const activeTickets = seat.tickets;
        if (activeTickets.length === 0) {
          availableDirect++;
        } else {
          for (const t of activeTickets) {
            if (t.status === 'LISTED_FOR_RESALE' && t.resaleListings && t.resaleListings.length > 0) {
              const activeListing = t.resaleListings[0];
              resaleSeats.push({
                listingId: activeListing.id,
                listingNumber: activeListing.listingNumber,
                ticketId: t.id,
                ticketNumber: t.ticketNumber,
                seatNumber: seat.seatNumber,
                seatType: seat.seatType,
                originalFare: activeListing.originalPrice,
                resalePrice: activeListing.resalePrice,
                platformFee: activeListing.platformFee,
                totalPrice: activeListing.resalePrice + activeListing.platformFee
              });
            }
          }
        }
      }

      return {
        id: bus.id,
        operator: bus.operator.name,
        operatorCode: bus.operator.code,
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
        resaleAvailableCount: resaleSeats.length,
        resaleSeats
      };
    });

    res.json(formattedBuses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. MY TICKETS (SELLER / BUYER)
// ==========================================
// GET /api/tickets/my?userId=xxx
router.get('/tickets/my', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const tickets = await prisma.ticket.findMany({
      where: { userId },
      include: {
        bus: { include: { operator: true } },
        seat: true,
        resaleListings: {
          orderBy: { createdAt: 'desc' },
          include: {
            transactions: {
              include: { refunds: true, payments: true }
            }
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });

    const sanitized = tickets.map((t) => {
      const activeListing = t.resaleListings.find(
        (l) => l.status === 'LISTED' || l.status === 'PURCHASED' || l.status === 'COMPLETED'
      );

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
        routeFrom: t.bus.routeFrom,
        routeTo: t.bus.routeTo,
        departureTime: t.bus.departureTime,
        arrivalTime: t.bus.arrivalTime,
        travelDate: t.bus.travelDate,
        busNumber: t.bus.busNumber,
        busType: t.bus.busType,
        operatorName: t.bus.operator.name,
        seatNumber: t.seat.seatNumber,
        seatType: t.seat.seatType,
        activeListing: activeListing
          ? {
              id: activeListing.id,
              listingNumber: activeListing.listingNumber,
              status: activeListing.status,
              originalPrice: activeListing.originalPrice,
              resalePrice: activeListing.resalePrice,
              platformFee: activeListing.platformFee,
              expectedRefund: activeListing.resalePrice - activeListing.platformFee,
              createdAt: activeListing.createdAt,
              transactions: activeListing.transactions.map((tx) => ({
                id: tx.id,
                transactionNumber: tx.transactionNumber,
                status: tx.status,
                sellerRefundAmount: tx.sellerRefundAmount,
                refunds: tx.refunds
              }))
            }
          : null
      };
    });

    res.json(sanitized);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tickets/:id
router.get('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        bus: { include: { operator: true } },
        seat: true
      }
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    res.json({
      ...ticket,
      govIdNumber: PrivacyHelper.maskGovId(ticket.govIdNumber)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. SELLER RESALE LISTING
// ==========================================
// POST /api/tickets/:id/list
router.post('/tickets/:id/list', async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.id;
    const { sellerId } = req.body;

    if (!sellerId) {
      return res.status(400).json({ error: 'sellerId is required' });
    }

    const result = await ResaleWorkflowService.listTicketForResale(ticketId, sellerId);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/resale/:id (Cancel resale listing)
router.delete('/resale/:id', async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id;
    const { sellerId } = req.body;

    if (!sellerId) {
      return res.status(400).json({ error: 'sellerId is required' });
    }

    const result = await ResaleWorkflowService.cancelListing(listingId, sellerId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 4. RESALE MARKETPLACE & DETAILS
// ==========================================
// GET /api/resale/search
router.get('/resale/search', async (req: Request, res: Response) => {
  try {
    const listings = await prisma.resaleListing.findMany({
      where: { status: 'LISTED' },
      include: {
        ticket: {
          include: {
            bus: { include: { operator: true } },
            seat: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = listings.map((l) => ({
      id: l.id,
      listingNumber: l.listingNumber,
      seatNumber: l.ticket.seat.seatNumber,
      seatType: l.ticket.seat.seatType,
      busNumber: l.ticket.bus.busNumber,
      busType: l.ticket.bus.busType,
      operatorName: l.ticket.bus.operator.name,
      routeFrom: l.ticket.bus.routeFrom,
      routeTo: l.ticket.bus.routeTo,
      travelDate: l.ticket.bus.travelDate,
      departureTime: l.ticket.bus.departureTime,
      originalPrice: l.originalPrice,
      resalePrice: l.resalePrice,
      platformFee: l.platformFee,
      totalPrice: l.resalePrice + l.platformFee,
      createdAt: l.createdAt
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/resale/:id
router.get('/resale/:id', async (req: Request, res: Response) => {
  try {
    const listing = await prisma.resaleListing.findUnique({
      where: { id: req.params.id },
      include: {
        ticket: {
          include: {
            bus: { include: { operator: true } },
            seat: true
          }
        }
      }
    });

    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // Security: Mask seller details completely from buyer
    res.json({
      id: listing.id,
      listingNumber: listing.listingNumber,
      status: listing.status,
      originalPrice: listing.originalPrice,
      resalePrice: listing.resalePrice,
      platformFee: listing.platformFee,
      totalPrice: listing.resalePrice + listing.platformFee,
      seat: {
        seatNumber: listing.ticket.seat.seatNumber,
        seatType: listing.ticket.seat.seatType
      },
      bus: {
        id: listing.ticket.bus.id,
        operatorName: listing.ticket.bus.operator.name,
        busNumber: listing.ticket.bus.busNumber,
        busType: listing.ticket.bus.busType,
        routeFrom: listing.ticket.bus.routeFrom,
        routeTo: listing.ticket.bus.routeTo,
        departureTime: listing.ticket.bus.departureTime,
        travelDate: listing.ticket.bus.travelDate
      },
      createdAt: listing.createdAt
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. BUYER CHECKOUT & PURCHASE
// ==========================================
// POST /api/resale/:id/purchase
router.post('/api/resale/:id/purchase', async (req: Request, res: Response) => {
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
      paymentMethod
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
      paymentMethod
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Compatibility route matching `/api/resale/:id/purchase` on subrouter
router.post('/resale/:id/purchase', async (req: Request, res: Response) => {
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
      paymentMethod
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
      paymentMethod
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 6. OPERATOR DASHBOARD & REISSUE APPROVAL
// ==========================================
// GET /api/operator/reissues
router.get('/operator/reissues', async (req: Request, res: Response) => {
  try {
    const reissues = await prisma.resaleTransaction.findMany({
      include: {
        listing: {
          include: {
            ticket: {
              include: {
                bus: { include: { operator: true } },
                seat: true,
                user: true
              }
            },
            seller: true
          }
        },
        buyer: true,
        newTicket: true,
        payments: true,
        refunds: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = reissues.map((r) => {
      const origTicket = r.listing.ticket;
      return {
        transactionId: r.id,
        transactionNumber: r.transactionNumber,
        status: r.status,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
        fare: r.listing.originalPrice,
        resalePrice: r.listing.resalePrice,
        platformFee: r.platformFee,
        sellerRefundAmount: r.sellerRefundAmount,
        bus: {
          id: origTicket.bus.id,
          operatorName: origTicket.bus.operator.name,
          busNumber: origTicket.bus.busNumber,
          routeFrom: origTicket.bus.routeFrom,
          routeTo: origTicket.bus.routeTo,
          travelDate: origTicket.bus.travelDate,
          departureTime: origTicket.bus.departureTime
        },
        seat: {
          seatNumber: origTicket.seat.seatNumber,
          seatType: origTicket.seat.seatType
        },
        originalPassenger: {
          name: origTicket.passengerName,
          ticketNumber: origTicket.ticketNumber,
          fare: origTicket.fare,
          sellerEmail: r.listing.seller.email,
          status: origTicket.status
        },
        newPassenger: {
          name: r.buyerPassengerName,
          age: r.buyerPassengerAge,
          gender: r.buyerPassengerGender,
          phone: r.buyerPhone,
          govIdType: r.buyerGovIdType,
          govIdNumber: PrivacyHelper.maskGovId(r.buyerGovIdNumber),
          buyerEmail: r.buyer.email
        },
        newTicket: r.newTicket
          ? {
              id: r.newTicket.id,
              ticketNumber: r.newTicket.ticketNumber,
              status: r.newTicket.status,
              qrCode: r.newTicket.qrCode
            }
          : null,
        refunds: r.refunds
      };
    });

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/operator/reissues/:id/approve
router.post('/operator/reissues/:id/approve', async (req: Request, res: Response) => {
  try {
    const transactionId = req.params.id;
    const { operatorUserId } = req.body;

    const result = await ResaleWorkflowService.approveReissue(
      transactionId,
      operatorUserId || 'operator'
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/operator/reissues/:id/reject
router.post('/operator/reissues/:id/reject', async (req: Request, res: Response) => {
  try {
    const transactionId = req.params.id;
    const { reason } = req.body;

    const result = await ResaleWorkflowService.rejectReissue(
      transactionId,
      reason || 'Rejected by operator'
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 7. SIMULATED OPERATOR REISSUE SERVICE (Section 13)
// ==========================================
// POST /mock-operator/reissue
router.post('/mock-operator/reissue', async (req: Request, res: Response) => {
  try {
    const { original_ticket_id, new_passenger } = req.body;
    if (!original_ticket_id || !new_passenger) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const response = await MockOperatorService.requestReissue('SWIFT', {
      original_ticket_id,
      new_passenger
    });

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Operator capabilities (Section 25)
router.get('/mock-operator/capabilities', (req: Request, res: Response) => {
  const caps = MockOperatorService.getOperatorCapabilities('SWIFT');
  res.json(caps);
});

// ==========================================
// 8. USERS / NOTIFICATIONS / TRANSACTIONS / REFUNDS
// ==========================================
// GET /api/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/:userId
router.get('/notifications/:userId', async (req: Request, res: Response) => {
  try {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(notifs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/refunds/:id
router.get('/refunds/:id', async (req: Request, res: Response) => {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id: req.params.id },
      include: { transaction: true }
    });
    if (!refund) return res.status(404).json({ error: 'Refund not found' });
    res.json(refund);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const txs = await prisma.resaleTransaction.findMany({
      include: {
        listing: {
          include: {
            ticket: {
              include: { bus: true, seat: true }
            }
          }
        },
        buyer: true,
        payments: true,
        refunds: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(txs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 9. AUTOMATED DEMO EXECUTION (Section 17)
// ==========================================
router.post('/demo/run-full-flow', async (req: Request, res: Response) => {
  try {
    // 1. Fetch Rahul (Seller) & Priya (Buyer)
    const rahul = await prisma.user.findFirst({ where: { email: 'rahul@example.com' } });
    const priya = await prisma.user.findFirst({ where: { email: 'priya@example.com' } });
    const operatorUser = await prisma.user.findFirst({ where: { role: 'operator' } });

    if (!rahul || !priya) {
      return res.status(400).json({ error: 'Demo users not found. Please seed the database first.' });
    }

    // 2. Find Rahul's confirmed ticket SB-92831
    let ticket = await prisma.ticket.findFirst({
      where: {
        userId: rahul.id,
        ticketNumber: 'SB-92831'
      }
    });

    if (!ticket) {
      return res.status(400).json({ error: 'Demo ticket SB-92831 not found' });
    }

    const stepsLog: Array<{ step: number; title: string; detail: string; timestamp: string }> = [];

    // Step 1: Check ticket status, list for resale if confirmed
    if (ticket.status !== 'LISTED_FOR_RESALE' && ticket.status !== 'CONFIRMED') {
      // Reset ticket for demo replay
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: 'CONFIRMED' }
      });
      ticket.status = 'CONFIRMED';
    }

    // List ticket
    let listing;
    const existingListing = await prisma.resaleListing.findFirst({
      where: { ticketId: ticket.id, status: 'LISTED' }
    });

    if (existingListing) {
      listing = existingListing;
    } else {
      const listRes = await ResaleWorkflowService.listTicketForResale(ticket.id, rahul.id);
      listing = listRes.listing;
    }

    stepsLog.push({
      step: 1,
      title: 'Seller Lists U12',
      detail: `Rahul listed Ticket SB-92831 (Seat U12) for ₹850 face-value`,
      timestamp: new Date().toISOString()
    });

    stepsLog.push({
      step: 2,
      title: 'Seat Appears in Resale Marketplace',
      detail: `Seat U12 is live on Bangalore → Chennai with 'Sold Out' status replaced by '♻️ 1 seat available'`,
      timestamp: new Date().toISOString()
    });

    // Step 3 & 4: Buyer purchases U12
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
      detail: `Priya purchased Seat U12 for ₹850 with passenger identity details`,
      timestamp: new Date().toISOString()
    });

    stepsLog.push({
      step: 4,
      title: 'Payment Succeeded',
      detail: `Mock payment reference ${purchaseRes.paymentResult.referenceId} generated`,
      timestamp: new Date().toISOString()
    });

    stepsLog.push({
      step: 5,
      title: 'Operator Receives Reissue Request',
      detail: `Operator notified of Request #${purchaseRes.transaction.transactionNumber}`,
      timestamp: new Date().toISOString()
    });

    // Step 6: Operator approves reissue
    const approveRes = await ResaleWorkflowService.approveReissue(
      purchaseRes.transaction.id,
      operatorUser?.id || 'operator'
    );

    stepsLog.push({
      step: 6,
      title: 'Operator Approves Reissue',
      detail: `Operator verified identity and authorized passenger transfer`,
      timestamp: new Date().toISOString()
    });

    stepsLog.push({
      step: 7,
      title: 'New Ticket Generated',
      detail: `Digital Ticket ${approveRes.newTicket.ticketNumber} created for Priya Kumar with verified QR code`,
      timestamp: new Date().toISOString()
    });

    stepsLog.push({
      step: 8,
      title: 'Original Ticket Invalidated',
      detail: `Ticket SB-92831 marked INVALIDATED in system and operator manifest`,
      timestamp: new Date().toISOString()
    });

    stepsLog.push({
      step: 9,
      title: 'Seller Refund Initiated & Completed',
      detail: `₹850 refunded to Rahul Sharma (Ref: ${approveRes.refund.referenceId})`,
      timestamp: new Date().toISOString()
    });

    stepsLog.push({
      step: 10,
      title: 'Transaction Completed',
      detail: `Full lifecycle closed. Zero unearned markups. Original passenger fully refunded.`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Demo flow executed successfully from start to finish',
      newTicket: approveRes.newTicket,
      steps: stepsLog
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /demo/reset (Reset database to pristine seed state)
router.post('/demo/reset', async (req: Request, res: Response) => {
  try {
    // Delete transactions, listings, tickets, recreating seed
    await prisma.refund.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.resaleTransaction.deleteMany();
    await prisma.resaleListing.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.seat.deleteMany();
    await prisma.bus.deleteMany();
    await prisma.operator.deleteMany();
    await prisma.user.deleteMany();

    // Call seed logic
    const { seedData } = await import('../seed');
    await seedData();

    res.json({ success: true, message: 'Database reset to initial demo state' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
