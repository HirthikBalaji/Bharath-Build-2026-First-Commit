import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Bus as BusIcon, 
  User as UserIcon, 
  Smartphone, 
  FileText 
} from 'lucide-react';
import { Bus, ResaleSeatSummary, User } from '../types';

interface CheckoutModalProps {
  bus: Bus;
  seat: ResaleSeatSummary;
  currentUser: User;
  onClose: () => void;
  onSuccess: (newTicket: any) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  bus,
  seat,
  currentUser,
  onClose,
  onSuccess
}) => {
  const [passengerName, setPassengerName] = useState(currentUser.name || 'Priya Kumar');
  const [passengerAge, setPassengerAge] = useState(24);
  const [passengerGender, setPassengerGender] = useState('Female');
  const [phone, setPhone] = useState(currentUser.phone || '+91 98765 43210');
  const [govIdType, setGovIdType] = useState('Aadhaar Card');
  const [govIdNumber, setGovIdNumber] = useState('9876 5432 4821');
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/resale/${seat.listingId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: currentUser.id,
          passengerName,
          passengerAge,
          passengerGender,
          phone,
          govIdType,
          govIdNumber,
          paymentMethod
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete purchase');
      }

      onSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Face-Value Resale Checkout
            </span>
          </div>
          <h2 className="text-xl font-bold">
            Purchase Seat {seat.seatNumber} — {bus.operator}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {bus.routeFrom} → {bus.routeTo} • {bus.travelDate} at {new Date(bus.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Face Value Rule Callout */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900">
              <p className="font-bold">Strict Face-Value Guarantee</p>
              <p className="mt-0.5 text-emerald-800 leading-relaxed">
                This seat is sold at exactly the original booking price (₹{seat.originalFare}). Sellers cannot inflate prices. The bus operator will reissue the digital ticket directly in your name upon purchase confirmation.
              </p>
            </div>
          </div>

          {/* Passenger Identity Inputs */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <UserIcon className="w-4 h-4 text-emerald-600" />
              <span>Passenger Information (Required for Boarding & Reissue)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Full Name (as per Govt ID)
                </label>
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  required
                  min={5}
                  max={120}
                  value={passengerAge}
                  onChange={(e) => setPassengerAge(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Gender
                </label>
                <select
                  value={passengerGender}
                  onChange={(e) => setPassengerGender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Government ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Government ID Type
                </label>
                <select
                  value={govIdType}
                  onChange={(e) => setGovIdType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ID Number (masked on tickets)
                </label>
                <input
                  type="text"
                  required
                  value={govIdNumber}
                  onChange={(e) => setGovIdNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Price Breakdown
            </h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Original Ticket Fare</span>
                <span className="font-semibold text-slate-900">₹{seat.originalFare}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Fee</span>
                <span className="font-semibold text-emerald-600">₹0 (Zero Markup)</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                <span>Total Amount</span>
                <span>₹{seat.resalePrice}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Select Mock Payment Gateway
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 ${
                  paymentMethod === 'UPI'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>⚡</span>
                <span>Instant UPI (GPay / PhonePe)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Card/NetBanking')}
                className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 ${
                  paymentMethod === 'Card/NetBanking'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4 text-slate-500" />
                <span>Credit / Debit Card</span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-base shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Mock Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Confirm Purchase & Pay ₹{seat.resalePrice}</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-2">
              🔒 Funds held in escrow until operator approves seat reissue.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
