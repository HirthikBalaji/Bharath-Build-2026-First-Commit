import { PrismaClient } from '@prisma/client';
import { MockOperatorService } from '../mock-operator/operator.service';
import { MockPaymentService } from './payment.service';
import { TicketQRService } from './qr.service';

const prisma = new PrismaClient();

export class ResaleWorkflowService {
  /**
   * List a ticket for resale at face value (Rule: resale_price <= original_price)
   */
  static async listTicketForResale(ticketId: string, sellerId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { bus: { include: { operator: true } }, resaleListings: true }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.userId !== sellerId) {
      throw new Error('Unauthorized: You do not own this ticket');
    }

    if (ticket.status !== 'CONFIRMED') {
      throw new Error(`Ticket is not eligible for resale. Current status: ${ticket.status}`);
    }

    // Check departure cutoff (e.g. minimum 60 mins before departure)
    const now = new Date();
    const departure = new Date(ticket.bus.departureTime);
    const diffMinutes = (departure.getTime() - now.getTime()) / (1000 * 60);

    const minWindow = ticket.bus.operator?.minimumResaleWindowMinutes || 60;
    if (diffMinutes < minWindow) {
      throw new Error(`Too late: Ticket cannot be listed because departure is in less than ${minWindow} minutes`);
    }

    // Check if an active listing already exists (Rule: One active listing per ticket)
    const existingListing = await prisma.resaleListing.findFirst({
      where: {
        ticketId: ticket.id,
        status: { in: ['LISTED', 'RESERVED', 'PURCHASED'] }
      }
    });

    if (existingListing) {
      throw new Error('This ticket already has an active resale listing');
    }

    // Strictly enforce Face-Value rule (resale_price = original_ticket_price)
    const originalPrice = ticket.fare;
    const resalePrice = originalPrice; // Guaranteed face value
    const platformFee = 0.0; // 0 for transparent face value

    const listingNumber = `RL-${Math.floor(10000 + Math.random() * 90000)}`;

    const [createdListing, updatedTicket] = await prisma.$transaction([
      prisma.resaleListing.create({
        data: {
          listingNumber,
          ticketId: ticket.id,
          sellerId,
          originalPrice,
          resalePrice,
          platformFee,
          status: 'LISTED',
          expiresAt: departure
        }
      }),
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: 'LISTED_FOR_RESALE' }
      })
    ]);

    // Notification for seller
    await prisma.notification.create({
      data: {
        userId: sellerId,
        title: 'Seat Listed for Resale',
        message: `Your seat ${ticket.seatId} for ${ticket.bus.routeFrom} → ${ticket.bus.routeTo} is now listed at face value ₹${resalePrice}. It remains valid until purchased and reissued.`,
        type: 'INFO'
      }
    });

    return { listing: createdListing, ticket: updatedTicket };
  }

  /**
   * Cancel an active resale listing (Rule: only while still in LISTED state)
   */
  static async cancelListing(listingId: string, sellerId: string) {
    const listing = await prisma.resaleListing.findUnique({
      where: { id: listingId },
      include: { ticket: true }
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.sellerId !== sellerId) {
      throw new Error('Unauthorized');
    }

    if (listing.status !== 'LISTED') {
      throw new Error(`Cannot cancel listing. Current status: ${listing.status}. Only unpurchased listings can be cancelled.`);
    }

    const [updatedListing, updatedTicket] = await prisma.$transaction([
      prisma.resaleListing.update({
        where: { id: listing.id },
        data: { status: 'CANCELLED' }
      }),
      prisma.ticket.update({
        where: { id: listing.ticketId },
        data: { status: 'CONFIRMED' }
      })
    ]);

    return { listing: updatedListing, ticket: updatedTicket };
  }

  /**
   * Purchase a resale listing (Atomic lock, mock payment, transition to REISSUE_PENDING)
   */
  static async purchaseResaleListing(params: {
    listingId: string;
    buyerId: string;
    passengerName: string;
    passengerAge: number;
    passengerGender: string;
    phone: string;
    govIdType: string;
    govIdNumber: string;
    paymentMethod?: string;
  }) {
    const { listingId, buyerId, passengerName, passengerAge, passengerGender, phone, govIdType, govIdNumber } = params;

    // Use atomic transaction to prevent race conditions (two buyers buying same seat)
    return await prisma.$transaction(async (tx) => {
      const listing = await tx.resaleListing.findUnique({
        where: { id: listingId },
        include: {
          ticket: {
            include: {
              bus: { include: { operator: true } },
              seat: true
            }
          },
          seller: true
        }
      });

      if (!listing) {
        throw new Error('Resale listing not found');
      }

      if (listing.status !== 'LISTED') {
        throw new Error('Sorry, this seat was just purchased by another traveller.');
      }

      if (listing.sellerId === buyerId) {
        throw new Error('You cannot purchase your own listed ticket');
      }

      // Mark listing as RESERVED / PURCHASED immediately
      await tx.resaleListing.update({
        where: { id: listing.id },
        data: { status: 'PURCHASED' }
      });

      // Process payment through mock gateway
      const paymentResult = await MockPaymentService.processPayment(
        listing.resalePrice,
        params.paymentMethod || 'UPI/Card'
      );

      const transactionNumber = `SR-${Math.floor(10000 + Math.random() * 90000)}`;

      const transaction = await tx.resaleTransaction.create({
        data: {
          transactionNumber,
          listingId: listing.id,
          buyerId,
          buyerPassengerName: passengerName,
          buyerPassengerAge: passengerAge,
          buyerPassengerGender: passengerGender,
          buyerPhone: phone,
          buyerGovIdType: govIdType,
          buyerGovIdNumber: govIdNumber,
          status: 'REISSUE_PENDING',
          sellerRefundAmount: listing.resalePrice - listing.platformFee,
          platformFee: listing.platformFee
        }
      });

      // Record payment record
      await tx.payment.create({
        data: {
          transactionId: transaction.id,
          amount: listing.resalePrice,
          status: 'COMPLETED',
          paymentMethod: params.paymentMethod || 'UPI/Card',
          referenceId: paymentResult.referenceId
        }
      });

      // Notify Operator of new pending reissue
      const operatorUsers = await tx.user.findMany({ where: { role: 'operator' } });
      for (const op of operatorUsers) {
        await tx.notification.create({
          data: {
            userId: op.id,
            title: 'New Reissue Request',
            message: `🔄 New ticket reissue request #${transactionNumber} requires approval for Seat ${listing.ticket.seat.seatNumber}.`,
            type: 'ACTION_REQUIRED'
          }
        });
      }

      return {
        transaction,
        paymentResult,
        bus: listing.ticket.bus,
        seat: listing.ticket.seat
      };
    });
  }

  /**
   * Operator Approval Workflow:
   * 1. Invalidate original seller ticket
   * 2. Reissue new ticket in buyer's name
   * 3. Generate QR code
   * 4. Initiate seller refund
   * 5. Notify both users
   */
  static async approveReissue(transactionId: string, operatorUserId: string) {
    const transaction = await prisma.resaleTransaction.findUnique({
      where: { id: transactionId },
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
        payments: true
      }
    });

    if (!transaction) {
      throw new Error('Resale transaction not found');
    }

    if (transaction.status !== 'REISSUE_PENDING') {
      throw new Error(`Transaction is not pending reissue. Current status: ${transaction.status}`);
    }

    const { listing } = transaction;
    const originalTicket = listing.ticket;
    const bus = originalTicket.bus;
    const seat = originalTicket.seat;

    // Call Mock Operator Reissue API (simulates real GDS communication)
    const operatorResponse = await MockOperatorService.requestReissue(
      bus.operator?.code || 'SWIFT',
      {
        original_ticket_id: originalTicket.ticketNumber,
        new_passenger: {
          name: transaction.buyerPassengerName,
          age: transaction.buyerPassengerAge,
          gender: transaction.buyerPassengerGender,
          phone: transaction.buyerPhone
        }
      }
    );

    if (!operatorResponse.success) {
      throw new Error('The operator could not reissue this ticket. Your payment has not been released to the seller.');
    }

    const newTicketNumber = operatorResponse.new_ticket_id;

    // Generate verified QR code containing new ticket data
    const qrDataUrl = await TicketQRService.generateQRCode({
      ticketId: newTicketNumber,
      operator: bus.operator?.name || 'SwiftBus',
      busNumber: bus.busNumber,
      route: `${bus.routeFrom} → ${bus.routeTo}`,
      date: bus.travelDate,
      seat: seat.seatNumber,
      passengerName: transaction.buyerPassengerName,
      status: 'CONFIRMED'
    });

    // Process seller refund through payment gateway
    const refundResult = await MockPaymentService.processRefund(
      transaction.sellerRefundAmount,
      listing.sellerId
    );

    // Atomic execution of ticket reissue & state transition
    const result = await prisma.$transaction(async (tx) => {
      // 1. Invalidate original seller ticket
      await tx.ticket.update({
        where: { id: originalTicket.id },
        data: {
          status: 'INVALIDATED'
        }
      });

      // 2. Create new valid ticket for buyer
      const newTicket = await tx.ticket.create({
        data: {
          ticketNumber: newTicketNumber,
          userId: transaction.buyerId,
          busId: bus.id,
          seatId: seat.id,
          passengerName: transaction.buyerPassengerName,
          passengerAge: transaction.buyerPassengerAge,
          passengerGender: transaction.buyerPassengerGender,
          passengerPhone: transaction.buyerPhone,
          govIdType: transaction.buyerGovIdType,
          govIdNumber: transaction.buyerGovIdNumber,
          fare: listing.resalePrice,
          status: 'CONFIRMED',
          qrCode: qrDataUrl,
          reissuedFromId: originalTicket.id
        }
      });

      // 3. Create Refund entry
      const refund = await tx.refund.create({
        data: {
          transactionId: transaction.id,
          sellerId: listing.sellerId,
          amount: transaction.sellerRefundAmount,
          status: 'COMPLETED',
          referenceId: refundResult.referenceId,
          completedAt: new Date()
        }
      });

      // 4. Update transaction status
      const updatedTx = await tx.resaleTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          newTicketId: newTicket.id,
          completedAt: new Date()
        }
      });

      // 5. Update listing to COMPLETED
      await tx.resaleListing.update({
        where: { id: listing.id },
        data: {
          status: 'COMPLETED'
        }
      });

      // 6. Notify Seller
      await tx.notification.create({
        data: {
          userId: listing.sellerId,
          title: 'Resale Completed & Refund Processed',
          message: `🎉 Your seat ${seat.seatNumber} has been resold. ₹${transaction.sellerRefundAmount} refund initiated and completed to your account (Ref: ${refundResult.referenceId}).`,
          type: 'SUCCESS'
        }
      });

      // 7. Notify Buyer
      await tx.notification.create({
        data: {
          userId: transaction.buyerId,
          title: 'Ticket Reissued Successfully',
          message: `🎟️ Your bus ticket has been reissued successfully. Seat ${seat.seatNumber} is confirmed! Digital QR ticket is ready.`,
          type: 'SUCCESS'
        }
      });

      return {
        transaction: updatedTx,
        newTicket,
        refund,
        operatorAuth: operatorResponse.operator_auth_code
      };
    });

    return result;
  }

  /**
   * Operator Rejection Workflow
   */
  static async rejectReissue(transactionId: string, reason: string) {
    const transaction = await prisma.resaleTransaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: { include: { ticket: true } },
        buyer: true
      }
    });

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'REISSUE_PENDING') {
      throw new Error(`Cannot reject. Status: ${transaction.status}`);
    }

    // Refund buyer immediately, revert listing & original ticket
    return await prisma.$transaction(async (tx) => {
      await tx.resaleTransaction.update({
        where: { id: transaction.id },
        data: { status: 'REJECTED' }
      });

      await tx.resaleListing.update({
        where: { id: transaction.listingId },
        data: { status: 'LISTED' }
      });

      await tx.ticket.update({
        where: { id: transaction.listing.ticketId },
        data: { status: 'CONFIRMED' }
      });

      // Notify Buyer
      await tx.notification.create({
        data: {
          userId: transaction.buyerId,
          title: 'Reissue Rejected by Operator',
          message: `The operator could not reissue this ticket: ${reason}. Your payment will be refunded immediately.`,
          type: 'WARNING'
        }
      });

      return { success: true };
    });
  }
}
