import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ArrowRightLeft, 
  IndianRupee, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { ResaleTransaction } from '../types';

interface TransactionLedgerProps {
  transactions: ResaleTransaction[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  isLoading,
  onRefresh
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Resale Protocol Public Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of face-value ticket releases, operator reassignment, and refund distributions
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-600">Loading ledger records...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-800">No Resale Transactions Yet</p>
          <p className="text-xs text-slate-500 mt-1">
            List a ticket as Rahul or click "Run Complete Demo" to generate records.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Transaction ID</th>
                  <th className="py-3.5 px-4">Date / Time</th>
                  <th className="py-3.5 px-4">Route & Operator</th>
                  <th className="py-3.5 px-4">Passenger Details</th>
                  <th className="py-3.5 px-4">Fare Breakdown</th>
                  <th className="py-3.5 px-4">Seller Refund</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      #{tx.transactionNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{tx.routeFrom} → {tx.routeTo}</div>
                      <div className="text-slate-500 text-[11px]">{tx.operatorName} • Seat {tx.seatNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{tx.buyerPassengerName}</div>
                      <div className="text-slate-500 text-[11px]">{tx.buyerGovIdType} ({tx.buyerGovIdNumber})</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">₹{tx.resalePrice}</div>
                      <div className="text-emerald-600 text-[10px] font-semibold">Fee: ₹{tx.platformFee}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-emerald-800">₹{tx.sellerRefundAmount}</div>
                      <div className="text-slate-400 text-[10px] font-mono">
                        {tx.refundReferenceId || 'Pending'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {tx.status === 'COMPLETED' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>COMPLETED</span>
                        </span>
                      ) : tx.status === 'REISSUE_PENDING' ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>REISSUE_PENDING</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {tx.status}
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
  );
};
