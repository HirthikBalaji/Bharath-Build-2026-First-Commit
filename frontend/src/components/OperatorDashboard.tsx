import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  AlertCircle, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  Clock, 
  FileText,
  BadgeCheck,
  Zap,
  Phone,
  Shield,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { ReissueRequestItem } from '../types';

interface OperatorDashboardProps {
  reissues: ReissueRequestItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onApprove: (transactionId: string) => Promise<void>;
  onReject: (transactionId: string, reason: string) => Promise<void>;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({
  reissues,
  isLoading,
  onRefresh,
  onApprove,
  onReject
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalTx, setRejectModalTx] = useState<ReissueRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Identity mismatch or carrier blackout window');

  const handleApprove = async (txId: string) => {
    setProcessingId(txId);
    try {
      await onApprove(txId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalTx) return;
    setProcessingId(rejectModalTx.transactionId);
    try {
      await onReject(rejectModalTx.transactionId, rejectReason);
      setRejectModalTx(null);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = reissues.filter((r) => r.status === 'REISSUE_PENDING');
  const pastRequests = reissues.filter((r) => r.status !== 'REISSUE_PENDING');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              Mock Operator GDS Dispatch Terminal
            </span>
            <span className="text-xs text-slate-400 font-mono">SWIFT-CARRIER-API-v2</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            SwiftBus Express — Operator Portal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorized passenger reissuance, seat reassignment, and passenger manifest sync
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Operator Capability Spec (Section 25) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="text-xs text-emerald-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span>Carrier API Capability Matrix</span>
            </div>
            <h3 className="text-lg font-black">Authorized Passenger Reissue Gateway</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real bus GDS systems (Bitla, RedBus, Mantis) require carrier-authorized seat reassignments before boarding passes can be regenerated. This dashboard acts as the simulated carrier endpoint.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono w-full lg:w-auto">
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-center">
              <span className="text-slate-400 block text-[10px] font-bold">SUPPORTS_RESALE</span>
              <span className="text-emerald-400 font-black text-sm">TRUE</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-center">
              <span className="text-slate-400 block text-[10px] font-bold">PRICE_CAP</span>
              <span className="text-emerald-400 font-black text-sm">FACE_VALUE</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-center">
              <span className="text-slate-400 block text-[10px] font-bold">MIN_WINDOW</span>
              <span className="text-amber-400 font-black text-sm">60 MINS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Reissue Requests Queue (Section 7) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>Pending Reissue Requests ({pendingRequests.length})</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Requires operator sign-off</span>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm font-bold text-slate-700">Loading carrier queue...</p>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-base font-black text-slate-900">Queue is Clear</p>
            <p className="text-xs text-slate-500 mt-1">
              No pending seat reissue requests right now. Purchase a resale ticket as Priya to simulate a pending request.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((r) => (
              <div
                key={r.transactionId}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-300 ring-2 ring-amber-400/20 shadow-lg shadow-amber-500/5 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-black px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                        Request #{r.transactionNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">Seat {r.seat.seatNumber} ({r.seat.seatType})</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900">
                      Transfer Authorization: {r.bus.operatorName} ({r.bus.busNumber})
                    </h4>
                    <p className="text-xs text-slate-500">
                      {r.bus.routeFrom} → {r.bus.routeTo} • Date: {r.bus.travelDate}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                      Clearance Pending
                    </span>
                  </div>
                </div>

                {/* Comparison Card: Original vs New Passenger (Section 7) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-5">
                  {/* Original Passenger Card */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Original Ticket Holder (To Invalidate)</span>
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-mono text-[10px]">CANCEL</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Passenger Name:</span>
                        <span className="font-bold text-slate-900">{r.originalPassenger.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Current Ticket ID:</span>
                        <span className="font-mono font-bold text-slate-700">{r.originalPassenger.ticketNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Assigned Seat:</span>
                        <span className="font-bold text-slate-900">{r.seat.seatNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Original Fare:</span>
                        <span className="font-bold text-slate-900">₹{r.fare}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between text-emerald-700 font-bold">
                        <span>Refund to Seller:</span>
                        <span>₹{r.sellerRefundAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* New Passenger Card */}
                  <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200">
                    <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>New Passenger (To Reissue & Board)</span>
                      <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono text-[10px]">VERIFIED BUYER</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-emerald-700 font-medium">Passenger Name:</span>
                        <span className="font-bold text-slate-900">{r.newPassenger.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700 font-medium">Age & Gender:</span>
                        <span className="font-bold text-slate-900">{r.newPassenger.age} yrs • {r.newPassenger.gender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700 font-medium">Contact Phone:</span>
                        <span className="font-mono font-bold text-slate-900">{r.newPassenger.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700 font-medium">Government ID:</span>
                        <span className="font-mono font-bold text-slate-900">{r.newPassenger.govIdType} ({r.newPassenger.govIdNumber})</span>
                      </div>
                      <div className="pt-2 border-t border-emerald-200 flex justify-between text-emerald-900 font-bold">
                        <span>Amount Paid:</span>
                        <span>₹{r.resalePrice} (Face Value)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operator Actions */}
                <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    Clicking approve immediately cancels <span className="font-mono font-bold">{r.originalPassenger.ticketNumber}</span>, reissues to <span className="font-bold">{r.newPassenger.name}</span>, and initiates ₹{r.sellerRefundAmount} refund.
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={() => setRejectModalTx(r)}
                      disabled={processingId === r.transactionId}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(r.transactionId)}
                      disabled={processingId === r.transactionId}
                      className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {processingId === r.transactionId ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Reissuing Ticket...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve Reissue</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed & Historical Reissues */}
      <div>
        <h3 className="text-xl font-black text-slate-900 mb-4">
          Processed Reissues & Historical Carrier Manifest ({pastRequests.length})
        </h3>

        {pastRequests.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
            No completed reissues recorded yet.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-4 px-4">Transaction</th>
                    <th className="py-4 px-4">Seat / Route</th>
                    <th className="py-4 px-4">Original Passenger</th>
                    <th className="py-4 px-4">New Verified Passenger</th>
                    <th className="py-4 px-4">New Ticket ID</th>
                    <th className="py-4 px-4">Seller Refund</th>
                    <th className="py-4 px-4">Manifest Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastRequests.map((r) => (
                    <tr key={r.transactionId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        #{r.transactionNumber}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-black text-slate-900">Seat {r.seat.seatNumber}</span>
                        <div className="text-slate-500 text-[11px]">{r.bus.routeFrom} → {r.bus.routeTo}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-800 font-semibold">{r.originalPassenger.name}</span>
                        <div className="text-rose-600 text-[10px] font-mono line-through">
                          {r.originalPassenger.ticketNumber} (INVALIDATED)
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-900 font-bold">{r.newPassenger.name}</span>
                        <div className="text-slate-500 text-[10px]">{r.newPassenger.govIdType} ({r.newPassenger.govIdNumber})</div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-emerald-700">
                        {r.newTicket ? r.newTicket.ticketNumber : '—'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-emerald-900">₹{r.sellerRefundAmount}</span>
                        <div className="text-[10px] text-emerald-600 font-bold">COMPLETED</div>
                      </td>
                      <td className="py-4 px-4">
                        {r.status === 'COMPLETED' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                            REISSUED ✓
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            {r.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalTx && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-2">
              Reject Reissue Request #{rejectModalTx.transactionNumber}?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Rejecting will refund buyer payment immediately and restore the seller listing.
            </p>

            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Carrier Rejection Reason
            </label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none mb-5"
            />

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setRejectModalTx(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/20"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
