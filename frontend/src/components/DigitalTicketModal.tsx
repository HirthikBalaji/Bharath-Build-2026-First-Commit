import React from 'react';
import { 
  CheckCircle2, 
  X, 
  Download, 
  Printer, 
  ShieldCheck, 
  Bus as BusIcon, 
  QrCode as QrCodeIcon,
  AlertCircle
} from 'lucide-react';
import { Ticket } from '../types';

interface DigitalTicketModalProps {
  ticket: Ticket;
  onClose: () => void;
}

export const DigitalTicketModal: React.FC<DigitalTicketModalProps> = ({ ticket, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              OPERATOR VERIFIED
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Digital Boarding Pass Ticket Body (Section 8) */}
        <div className="p-6 bg-slate-50 border-b border-dashed border-slate-300 relative">
          <div className="text-center mb-5">
            <h2 className="text-2xl font-black tracking-widest text-slate-900 uppercase">
              {ticket.operatorName}
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Official Digital Bus Ticket
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {/* Route & Date */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Route</span>
                <p className="text-base font-bold text-slate-900">{ticket.routeFrom} → {ticket.routeTo}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Travel Date</span>
                <p className="text-xs font-bold text-slate-800">{ticket.travelDate}</p>
                <p className="text-xs text-slate-500 font-medium">
                  {new Date(ticket.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Passenger & Seat */}
            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Passenger</span>
                <p className="text-sm font-bold text-slate-900">{ticket.passengerName}</p>
                <p className="text-[11px] text-slate-500">{ticket.passengerGender}, {ticket.passengerAge} yrs</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Seat</span>
                <p className="text-2xl font-black text-emerald-600">{ticket.seatNumber}</p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">{ticket.seatType}</p>
              </div>
            </div>

            {/* Ticket ID & Fare */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ticket ID</span>
                <p className="font-mono font-bold text-slate-800 text-sm">{ticket.ticketNumber}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Fare Paid</span>
                <p className="font-bold text-slate-900 text-sm">₹{ticket.fare}</p>
              </div>
            </div>

            {/* Invalidation Stamp if reissued */}
            {ticket.ticketNumber.startsWith('SR-') && (
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reissued Ticket (Original Ticket: INVALIDATED)</span>
                </span>
              </div>
            )}
          </div>

          {/* Cutout notches */}
          <div className="absolute -left-3.5 -bottom-3.5 w-7 h-7 rounded-full bg-slate-900/60"></div>
          <div className="absolute -right-3.5 -bottom-3.5 w-7 h-7 rounded-full bg-slate-900/60"></div>
        </div>

        {/* QR Code Section */}
        <div className="p-6 text-center bg-white">
          {ticket.qrCode ? (
            <div className="inline-block p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <img src={ticket.qrCode} alt="Boarding QR Code" className="w-48 h-48 mx-auto" />
            </div>
          ) : (
            <div className="w-48 h-48 mx-auto bg-slate-100 flex items-center justify-center rounded-2xl text-slate-400">
              <QrCodeIcon className="w-12 h-12" />
            </div>
          )}

          <p className="text-xs text-slate-500 font-mono mt-3">
            Present this QR code to the conductor during boarding.
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Reissued under operator authority • Identity verified with Government ID
          </p>

          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Boarding Pass</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
