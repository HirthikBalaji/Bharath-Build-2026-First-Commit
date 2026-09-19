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
  FileText 
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
  const [rejectReason, setRejectReason] = useState('Identity mismatch or operator blackout window');

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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
              Mock Operator GDS Integration
            </span>
            <span className="text-xs text-slate-500 font-mono">SWIFT-GDS-v2.4</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            SwiftBus Express — Operator Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Passenger Reissuance Desk & Resale Manifest Re-alignment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Operator Capability Spec (Section 25) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl mb-8 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-emerald-400 font-mono font-bold uppercase tracking-wider mb-1">
              Operator Integration Specification
            </div>
            <h3 className="text-base font-bold">Authorized Ticket Transfer Layer</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Real bus GDS systems (RedBus, AbhiBus, private APIs) require authorized seat reassignment rather than raw ticket transfers. This dashboard simulates the operator's clearance gateway.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[10px]">SUPPORTS_RESALE</span>
              <span className="text-emerald-400 font-bold">TRUE</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[10px]">MAX_RESALE_PRICE</span>
              <span className="text-emerald-400 font-bold">FACE_VALUE</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[10px]">MIN_WINDOW</span>
              <span className="text-amber-400 font-bold">60 MINS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Reissue Requests Queue */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>Pending Reissue Requests ({pendingRequests.length})</span>
          </h3>
          <span className="text-xs text-slate-500">Requires manual operator verification</span>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm font-medium text-slate-600">Loading operator queues...</p>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-800">Queue is Clear</p>
            <p className="text-xs text-slate-500 mt-1">No pending ticket reissue requests at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((r) => (
              <div
                key={r.transactionId}
                className="bg-white rounded-3xl p-6 border border-amber-300 ring-1 ring-amber-400/30 shadow-md shadow-amber-500/5 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded">
                      Request #{r.transactionNumber}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      Reissue Seat {r.seat.seatNumber} ({r.seat.seatType}) — {r.bus.operatorName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {r.bus.routeFrom} → {r.bus.routeTo} • Date: {r.bus.travelDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Approval Required
                    </span>
                  </div>
                </div>

                {/* Comparison Card: Original vs New Passenger (Section 7) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  {/* Original Passenger Card */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Original Ticket Holder (To Invalidate)
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Passenger:</span>
                        <span className="font-bold text-slate-800">{r.originalPassenger.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ticket ID:</span>
                        <span className="font-mono font-semibold text-slate-700">{r.originalPassenger.ticketNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Seat:</span>
                        <span className="font-semibold text-slate-800">{r.seat.seatNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Fare:</span>
                        <span className="font-semibold text-slate-800">₹{r.fare}</span>
                      </div>
                    </div>
                  </div>

                  {/* New Passenger Card */}
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-2">
                      New Verified Passenger (To Reissue)
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Passenger:</span>
                        <span className="font-bold text-slate-900">{r.newPassenger.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Age / Gender:</span>
                        <span className="font-semibold text-slate-800">{r.newPassenger.age} yrs • {r.newPassenger.gender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Phone:</span>
                        <span className="font-mono font-semibold text-slate-800">{r.newPassenger.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Government ID:</span>
                        <span className="font-mono font-bold text-slate-900">{r.newPassenger.govIdType} ({r.newPassenger.govIdNumber})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operator Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Clicking approve immediately invalidates {r.originalPassenger.ticketNumber}, reissues to {r.newPassenger.name}, and initiates ₹{r.sellerRefundAmount} refund.
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRejectModalTx(r)}
                      disabled={processingId === r.transactionId}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(r.transactionId)}
                      disabled={processingId === r.transactionId}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {processingId === r.transactionId ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
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
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Processed Reissues & Historical Manifest ({pastRequests.length})
        </h3>

        {pastRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-500 text-xs">
            No completed reissues recorded yet.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Transaction</th>
                    <th className="py-3.5 px-4">Seat / Route</th>
                    <th className="py-3.5 px-4">Original Pax</th>
                    <th className="py-3.5 px-4">Reissued Pax</th>
                    <th className="py-3.5 px-4">New Ticket ID</th>
                    <th className="py-3.5 px-4">Refund Status</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastRequests.map((r) => (
                    <tr key={r.transactionId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        #{r.transactionNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">Seat {r.seat.seatNumber}</span>
                        <div className="text-slate-500 text-[11px]">{r.bus.routeFrom} → {r.bus.routeTo}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 font-medium">{r.originalPassenger.name}</span>
                        <div className="text-rose-600 text-[10px] font-mono line-through">
                          {r.originalPassenger.ticketNumber} (INVALID)
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-900 font-bold">{r.newPassenger.name}</span>
                        <div className="text-slate-500 text-[10px]">{r.newPassenger.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {r.newTicket ? r.newTicket.ticketNumber : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-800">₹{r.sellerRefundAmount}</span>
                        <div className="text-[10px] text-emerald-600 font-semibold">COMPLETED</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {r.status === 'COMPLETED' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            COMPLETED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Reject Reissue Request #{rejectModalTx.transactionNumber}?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Rejecting this request will immediately refund the buyer and restore the original seller listing.
            </p>

            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Rejection Reason
            </label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModalTx(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
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
