import React, { useState } from 'react';
import { 
  Ticket as TicketIcon, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Clock, 
  MapPin, 
  IndianRupee, 
  ShieldCheck, 
  Calendar,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Ticket, User } from '../types';

interface MyTicketsProps {
  currentUser: User;
  tickets: Ticket[];
  isLoading: boolean;
  onRefresh: () => void;
  onViewQR: (ticket: Ticket) => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({
  currentUser,
  tickets,
  isLoading,
  onRefresh,
  onViewQR
}) => {
  const [listingModalTicket, setListingModalTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleListTicket = async (ticket: Ticket) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list seat');

      setListingModalTicket(null);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to cancel this resale listing?')) return;
    try {
      const res = await fetch(`/api/resale/${listingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: currentUser.id })
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Failed to cancel listing');
      } else {
        onRefresh();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            My Bookings & Resales
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.email})
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-600">Loading your tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <TicketIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Tickets Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            You don't have any booked tickets on this profile yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {tickets.map((ticket) => {
            const isConfirmed = ticket.status === 'CONFIRMED';
            const isListed = ticket.status === 'LISTED_FOR_RESALE';
            const isInvalidated = ticket.status === 'INVALIDATED';
            const activeListing = ticket.activeListing;
            const isResaleCompleted = activeListing && activeListing.status === 'COMPLETED';

            return (
              <div
                key={ticket.id}
                className={`bg-white rounded-3xl p-6 border transition-all ${
                  isInvalidated
                    ? 'border-slate-200 bg-slate-50/70 opacity-80'
                    : isListed
                    ? 'border-amber-300 ring-1 ring-amber-400/30 shadow-md shadow-amber-500/5'
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  {/* Operator & Ticket Number */}
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                      SB
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{ticket.operatorName}</h3>
                        <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          #{ticket.ticketNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{ticket.busType} • {ticket.busNumber}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isConfirmed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Confirmed Booking</span>
                      </span>
                    )}
                    {isListed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Listed for Resale</span>
                      </span>
                    )}
                    {isInvalidated && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Ticket Invalidated (Reissued)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Journey & Passenger Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-5">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Route & Date
                    </span>
                    <p className="text-base font-bold text-slate-900">
                      {ticket.routeFrom} → {ticket.routeTo}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {ticket.travelDate} at {new Date(ticket.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Passenger & Seat
                    </span>
                    <p className="text-base font-bold text-slate-900">
                      Seat {ticket.seatNumber} <span className="text-xs text-slate-500 font-normal">({ticket.seatType})</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {ticket.passengerName} ({ticket.passengerGender}, {ticket.passengerAge} yrs)
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Original Fare
                    </span>
                    <p className="text-2xl font-bold text-slate-900">
                      ₹{ticket.fare}
                    </p>
                  </div>
                </div>

                {/* Resale Info Panel if listed or completed */}
                {activeListing && (
                  <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                        <span>Resale Listing #{activeListing.listingNumber}</span>
                      </span>
                      <span className="font-semibold text-slate-600">
                        Status: <span className="uppercase text-emerald-700 font-bold">{activeListing.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-slate-600">
                      <div>Original Fare: <span className="font-bold text-slate-900">₹{activeListing.originalPrice}</span></div>
                      <div>Resold For: <span className="font-bold text-slate-900">₹{activeListing.resalePrice}</span></div>
                      <div>Platform Fee: <span className="font-bold text-emerald-600">₹{activeListing.platformFee}</span></div>
                      <div>Expected Refund: <span className="font-bold text-emerald-700">₹{activeListing.expectedRefund}</span></div>
                    </div>

                    {/* Refund Tracking */}
                    {activeListing.transactions && activeListing.transactions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        {activeListing.transactions.map((tx: any) => (
                          <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                            <div>
                              <span className="font-bold text-emerald-900">Resale Completed ✓</span>
                              <span className="text-slate-500 ml-2">Transaction #{tx.transactionNumber}</span>
                            </div>
                            <div className="font-medium text-emerald-800">
                              Refund: <span className="font-bold text-emerald-900">₹{tx.sellerRefundAmount}</span> • Status: <span className="font-bold text-emerald-700">COMPLETED</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {ticket.qrCode && !isInvalidated && (
                      <button
                        onClick={() => onViewQR(ticket)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>View Digital Boarding Ticket</span>
                      </button>
                    )}
                    {isInvalidated && (
                      <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Original ticket invalidated upon reissue. Not valid for boarding.</span>
                      </span>
                    )}
                  </div>

                  <div>
                    {isConfirmed && (
                      <button
                        onClick={() => setListingModalTicket(ticket)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Release Seat for Resale</span>
                      </button>
                    )}

                    {isListed && activeListing && (
                      <button
                        onClick={() => handleCancelListing(activeListing.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel Resale Listing</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Release Seat Confirmation Modal (Section 4 Seller Flow) */}
      {listingModalTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Release this seat for resale?
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                List your ticket on SeatRelay's face-value exchange so other travellers can book it.
              </p>

              {actionError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Route:</span>
                  <span className="font-bold text-slate-800">{listingModalTicket.routeFrom} → {listingModalTicket.routeTo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Departure:</span>
                  <span className="font-bold text-slate-800">{listingModalTicket.travelDate}, {new Date(listingModalTicket.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Seat:</span>
                  <span className="font-bold text-slate-800">{listingModalTicket.seatNumber} ({listingModalTicket.seatType})</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between">
                  <span className="text-slate-500">Original Fare:</span>
                  <span className="font-bold text-slate-900">₹{listingModalTicket.fare}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Platform Fee:</span>
                  <span className="font-bold text-emerald-600">₹0</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold">
                  <span className="text-slate-900">Expected Refund:</span>
                  <span className="text-emerald-700">₹{listingModalTicket.fare}</span>
                </div>
              </div>

              {/* Explanation Quote from spec */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 mb-6 leading-relaxed">
                <p className="font-bold mb-1">Important Protection Terms:</p>
                <p>
                  "Your ticket will remain valid for you until another traveller purchases it. Once the operator reissues the seat to the buyer, your original ticket will be cancelled and your refund will be initiated."
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setListingModalTicket(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleListTicket(listingModalTicket)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Listing...</span>
                  ) : (
                    <span>List for ₹{listingModalTicket.fare}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
