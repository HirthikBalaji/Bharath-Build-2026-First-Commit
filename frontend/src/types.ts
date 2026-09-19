export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'seller' | 'buyer' | 'operator' | 'admin';
  createdAt?: string;
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

export interface Seat {
  id: string;
  busId: string;
  seatNumber: string;
  seatType: string;
  status: 'AVAILABLE' | 'BOOKED' | 'HELD';
}

export interface ResaleSeatSummary {
  listingId: string;
  listingNumber: string;
  ticketId: string;
  ticketNumber: string;
  seatNumber: string;
  seatType: string;
  originalFare: number;
  resalePrice: number;
  platformFee: number;
  totalPrice: number;
}

export interface Bus {
  id: string;
  operator: string;
  operatorCode?: string;
  busNumber: string;
  busType: string;
  routeFrom: string;
  routeTo: string;
  departureTime: string;
  arrivalTime: string;
  travelDate: string;
  baseFare: number;
  totalSeats: number;
  availableDirect: number;
  isSoldOut: boolean;
  resaleAvailableCount: number;
  resaleSeats: ResaleSeatSummary[];
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
  passengerName: string;
  passengerAge: number;
  passengerGender: string;
  fare: number;
  status: TicketStatus;
  qrCode?: string | null;
  issuedAt: string;
  routeFrom: string;
  routeTo: string;
  departureTime: string;
  arrivalTime: string;
  travelDate: string;
  busNumber: string;
  busType: string;
  operatorName: string;
  seatNumber: string;
  seatType: string;
  activeListing?: {
    id: string;
    listingNumber: string;
    status: string;
    originalPrice: number;
    resalePrice: number;
    platformFee: number;
    expectedRefund: number;
    createdAt: string;
    transactions?: any[];
  } | null;
}

export interface ResaleListing {
  id: string;
  listingNumber: string;
  seatNumber: string;
  seatType: string;
  busNumber: string;
  busType: string;
  operatorName: string;
  routeFrom: string;
  routeTo: string;
  travelDate: string;
  departureTime: string;
  originalPrice: number;
  resalePrice: number;
  platformFee: number;
  totalPrice: number;
  createdAt: string;
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

export interface ReissueRequestItem {
  transactionId: string;
  transactionNumber: string;
  status: TransactionStatus;
  createdAt: string;
  completedAt?: string | null;
  fare: number;
  resalePrice: number;
  platformFee: number;
  sellerRefundAmount: number;
  bus: {
    id: string;
    operatorName: string;
    busNumber: string;
    routeFrom: string;
    routeTo: string;
    travelDate: string;
    departureTime: string;
  };
  seat: {
    seatNumber: string;
    seatType: string;
  };
  originalPassenger: {
    name: string;
    ticketNumber: string;
    fare: number;
    sellerEmail: string;
    status: string;
  };
  newPassenger: {
    name: string;
    age: number;
    gender: string;
    phone: string;
    govIdType: string;
    govIdNumber: string;
    digilockerVerified?: boolean;
    digilockerTxnId?: string | null;
    buyerEmail: string;
  };
  newTicket?: {
    id: string;
    ticketNumber: string;
    status: string;
    qrCode?: string | null;
  } | null;
  refunds?: any[];
  cbdcEscrow?: CBDCEscrowContract | null;
}

export interface CBDCEscrowContract {
  id: string;
  contractAddress: string;
  transactionId: string;
  listingId: string;
  amount: number;
  buyerWalletAddress: string;
  sellerWalletAddress: string;
  operatorWalletAddress: string;
  programCondition: string;
  tokenIds: string;
  status: 'LOCKED' | 'SETTLED' | 'REFUNDED';
  escrowLockHash: string;
  settlementTxHash?: string | null;
  settledAt?: string | null;
  createdAt: string;
  routeFrom?: string;
  routeTo?: string;
  busNumber?: string;
  buyerPassengerName?: string;
}

export interface ResaleTransaction {
  id: string;
  transactionNumber: string;
  listingId: string;
  buyerId: string;
  buyerPassengerName: string;
  buyerPassengerAge: number;
  buyerPassengerGender: string;
  buyerPhone: string;
  buyerGovIdType: string;
  buyerGovIdNumber: string;
  status: TransactionStatus;
  sellerRefundAmount: number;
  platformFee: number;
  createdAt: string;
  completedAt?: string | null;
  listing?: any;
  buyer?: any;
  payments?: any[];
  refunds?: any[];
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
