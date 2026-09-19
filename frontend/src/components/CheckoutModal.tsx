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
  FileText,
  Clock,
  Sparkles,
  HelpCircle
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
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card'>('UPI');

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-7 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Protocol Resale Checkout
            </span>
            <span className="text-xs font-mono text-slate-400">Escrow Protected</span>
          </div>
          <h2 className="text-2xl font-black">
            Reserve Seat {seat.seatNumber} — {bus.operator}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {bus.routeFrom} → {bus.routeTo} • {bus.travelDate} at {new Date(bus.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-bold block">Purchase Reservation Error</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Face Value Rule Callout Banner (Section 6 & 10) */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs text-emerald-950">
              <div className="flex items-center gap-1.5 font-black text-emerald-900 text-sm">
                <span>Strict Face-Value Price Guarantee</span>
                <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono text-[10px]">VERIFIED</span>
              </div>
              <p className="mt-1 text-emerald-800 leading-relaxed">
                By platform policy, this resale price (<span className="font-bold">₹{seat.originalFare}</span>) matches the original booking receipt. Sellers are prohibited from markup or scalping.
              </p>
            </div>
          </div>

          {/* Passenger Identity Inputs (Section 6 & 19) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-emerald-600" />
                <span>Passenger Information (For Boarding Pass Reissue)</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold">Required by Carrier Manifest</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Full Passenger Name (As on Govt ID)
                </label>
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  required
                  min={5}
                  max={120}
                  value={passengerAge}
                  onChange={(e) => setPassengerAge(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Gender
                </label>
                <select
                  value={passengerGender}
                  onChange={(e) => setPassengerGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Mobile Number (SMS / WhatsApp Updates)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Government ID & Privacy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Government ID Type
                </label>
                <select
                  value={govIdType}
                  onChange={(e) => setGovIdType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ID Number (Masked on public records)
                </label>
                <input
                  type="text"
                  required
                  value={govIdNumber}
                  onChange={(e) => setGovIdNumber(e.target.value)}
                  placeholder="e.g. 9876 5432 4821"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Privacy shield: Sellers never see your Government ID or phone number.
            </p>
          </div>

          {/* Clear Price Breakdown (Section 6) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Transparent Fare Breakdown
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Original Ticket Fare (Seat {seat.seatNumber})</span>
                <span className="font-bold text-slate-900">₹{seat.originalFare}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SeatRelay Platform Fee</span>
                <span className="font-bold text-emerald-600">₹0 (Zero Markup)</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                <span>Total Payable Amount</span>
                <span className="text-emerald-700 text-base">₹{seat.resalePrice}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-2">
              Select Mock Payment Gateway
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3.5 rounded-2xl border text-left text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  paymentMethod === 'UPI'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400/30'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-base shadow-sm">
                  ⚡
                </div>
                <div>
                  <div className="text-slate-900 font-black">Instant UPI</div>
                  <div className="text-[10px] text-slate-500 font-normal">GPay / PhonePe / Paytm</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Card')}
                className={`p-3.5 rounded-2xl border text-left text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  paymentMethod === 'Card'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400/30'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-900 font-black">Credit / Debit Card</div>
                  <div className="text-[10px] text-slate-500 font-normal">Visa / MasterCard / RuPay</div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Mock Payment & Reserving Seat...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Confirm Purchase & Pay ₹{seat.resalePrice}</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2 font-mono">
              Funds held in escrow • Released only after SwiftBus operator approves ticket reissue
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
