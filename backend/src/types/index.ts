export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'seller' | 'buyer' | 'operator' | 'admin';
  createdAt: string;
}

export interface Operator {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  supportsResale: boolean;
  supportsPassengerReissue: boolean;
  minimumResaleWindowMinutes: number;
  maximumResalePrice: string;
}

export interface Bus {
  id: string;
  operatorId: string;
  operator?: Operator;
  busNumber: string;
  busType: string;
  routeFrom: string;
  routeTo: string;
  departureTime: string;
  arrivalTime: string;
  travelDate: string;
  baseFare: number;
  seats?: Seat[];
}

export interface Seat {
  id: string;
  busId: string;
  seatNumber: string;
  seatType: string;
  status: 'AVAILABLE' | 'BOOKED' | 'HELD';
}

export type TicketStatus = 
  | 'CONFIRMED'
  | 'LISTED_FOR_RESALE'
  | 'SOLD'
  | 'REISSUED'
  | 'INVALIDATED'
  | 'CANCELLED';

export interface Ticket {
  id: string;
  ticketNumber: string;
  userId: string;
  user?: User;
  busId: string;
  bus?: Bus;
  seatId: string;
  seat?: Seat;
  passengerName: string;
  passengerAge: number;
  passengerGender: string;
  passengerPhone?: string | null;
  govIdType?: string | null;
  govIdNumber?: string | null;
  fare: number;
  status: TicketStatus;
  qrCode?: string | null;
  issuedAt: string;
  updatedAt: string;
  resaleListings?: ResaleListing[];
}

export type ListingStatus = 
  | 'LISTED'
  | 'RESERVED'
  | 'PURCHASED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ResaleListing {
  id: string;
  listingNumber: string;
  ticketId: string;
  ticket?: Ticket;
  sellerId: string;
  seller?: User;
  originalPrice: number;
  resalePrice: number;
  platformFee: number;
  status: ListingStatus;
  createdAt: string;
  expiresAt?: string | null;
}

export type TransactionStatus =
  | 'LISTED'
  | 'PURCHASED'
  | 'PAYMENT_CONFIRMED'
  | 'REISSUE_PENDING'
  | 'OPERATOR_APPROVED'
  | 'TICKET_REISSUED'
  | 'ORIGINAL_TICKET_INVALIDATED'
  | 'SELLER_REFUND_INITIATED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED';

export interface ResaleTransaction {
  id: string;
  transactionNumber: string;
  listingId: string;
  listing?: ResaleListing;
  buyerId: string;
  buyer?: User;
  newTicketId?: string | null;
  newTicket?: Ticket | null;
  buyerPassengerName: string;
  buyerPassengerAge: number;
  buyerPassengerGender: string;
  buyerPhone: string;
  buyerGovIdType: string;
  buyerGovIdNumber: string; // masked in responses
  status: TransactionStatus;
  sellerRefundAmount: number;
  platformFee: number;
  createdAt: string;
  completedAt?: string | null;
  payments?: Payment[];
  refunds?: Refund[];
}

export interface Payment {
  id: string;
  transactionId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentMethod: string;
  referenceId: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  transactionId: string;
  sellerId: string;
  amount: number;
  status: 'INITIATED' | 'COMPLETED' | 'FAILED';
  referenceId: string;
  createdAt: string;
  completedAt?: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED';
  isRead: boolean;
  createdAt: string;
}
