import React from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  X, 
  RefreshCw, 
  QrCode, 
  ShieldCheck, 
  IndianRupee 
} from 'lucide-react';
import { Ticket } from '../types';

interface DemoProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRunning: boolean;
  steps: Array<{ step: number; title: string; detail: string; timestamp: string }>;
  newTicket: Ticket | null;
  onViewTicket: (ticket: Ticket) => void;
}

export const DemoProgressModal: React.FC<DemoProgressModalProps> = ({
  isOpen,
  onClose,
  isRunning,
  steps,
  newTicket,
  onViewTicket
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              DEMO MODE EXECUTION
            </span>
          </div>
          <h2 className="text-xl font-bold">
            End-to-End Resale & Reissue Lifecycle
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Tracking live state changes across Seller, Marketplace, Buyer, Operator, and Escrow.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Status Tracker */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {steps.map((s, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md shadow-emerald-600/30">
                  ✓
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                    <span>{s.step}. {s.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(s.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{s.detail}</p>
                </div>
              </div>
            ))}

            {isRunning && (
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></div>
                </div>
                <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 text-xs flex items-center gap-2 text-emerald-800 font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Simulating next step in transaction pipeline...</span>
                </div>
              </div>
            )}
          </div>

          {/* Finished Banner with Action */}
          {!isRunning && newTicket && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Demo Run Succeeded! Ticket Successfully Reissued.</span>
              </div>
              <p className="text-xs text-emerald-800">
                Priya Kumar now holds digital ticket <span className="font-mono font-bold">{newTicket.ticketNumber}</span> for Seat U12. Rahul Sharma has received his ₹{newTicket.fare} refund.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onViewTicket(newTicket)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>View Priya's Reissued QR Ticket</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
