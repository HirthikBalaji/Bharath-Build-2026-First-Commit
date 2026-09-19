import React from 'react';
import { 
  ArrowRightLeft, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  Ticket as TicketIcon, 
  RefreshCw,
  Users,
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { User } from '../types';

interface HomePageProps {
  onSearchClick: () => void;
  onViewTicketsClick: () => void;
  onOperatorClick: () => void;
  onRunDemo: () => void;
  isDemoRunning: boolean;
  currentUser: User | null;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSearchClick,
  onViewTicketsClick,
  onOperatorClick,
  onRunDemo,
  isDemoRunning,
  currentUser
}) => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section (Section 15) */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 rounded-b-[40px] shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-transparent to-slate-950/80"></div>
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Next-Gen Face-Value Bus Ticket Resale Protocol</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Your seat doesn't have to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              go to waste.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
            Resell eligible bus seats at face value. Someone gets the seat. You recover your fare. Authorized operator reissuance guarantees boarding safety.
          </p>

          {/* Search box prompt preview */}
          <div className="pt-4 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div className="grid grid-cols-3 gap-4 flex-1 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[10px]">From</span>
                  <span className="text-white font-bold text-sm">Bangalore</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[10px]">To</span>
                  <span className="text-white font-bold text-sm">Chennai</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[10px]">Date</span>
                  <span className="text-white font-bold text-sm">19 Sep 2026</span>
                </div>
              </div>

              <button
                onClick={onSearchClick}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search Buses</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Button banner */}
          <div className="pt-2">
            <button
              onClick={onRunDemo}
              disabled={isDemoRunning}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
            >
              {isDemoRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Executing End-to-End Test Run...</span>
                </>
              ) : (
                <>
                  <span className="text-amber-400 font-bold">▶</span>
                  <span>Run Complete Demo Flow (Rahul → Priya → Operator → Refund)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 4-Step Process Flow (Section 15) */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">How SeatRelay Works</h2>
          <p className="text-xs text-slate-500 mt-1">
            Compliant, operator-sanctioned passenger ticket reissuance
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg border border-emerald-100">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">List your seat</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ticket stays valid for you until another traveller purchases it at exact face-value.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg border border-teal-100">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Another traveller buys it</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Traveller searching sold-out buses sees the released seat and purchases at original price.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg border border-indigo-100">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Operator reissues ticket</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Operator cancels original ticket, updates manifest, and issues verified QR ticket to new passenger.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg border border-amber-100">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">You get your refund</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Escrow releases 100% face-value refund directly back to your payment account.
            </p>
          </div>
        </div>
      </section>

      {/* Role Switcher Cards (Section 16) */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Experience By User Role</h2>
          <p className="text-xs text-slate-500 mt-1">
            Switch between demo profiles anytime via the top bar or below
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Seller Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-emerald-500 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Seller
                </span>
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Rahul Sharma</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Holds confirmed Ticket SB-92831 (Seat U12) on SwiftBus Bangalore → Chennai (₹850).
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 mb-6">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>View booked ticket SB-92831</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Release seat for resale at ₹850</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Track status & refund</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onViewTicketsClick}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Continue as Seller</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Buyer Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-emerald-500 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  Buyer
                </span>
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Priya Kumar</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Looking for sold-out seats on Bangalore → Chennai for 19 Sep 2026.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 mb-6">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Search sold-out bus routes</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Discover resale seat U12</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Purchase at face value & get QR pass</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onSearchClick}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Continue as Buyer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Operator Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-emerald-500 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Operator / Admin
                </span>
                <Building2 className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">SwiftBus Operations</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Mock GDS dispatch terminal for passenger validation & reissue clearance.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 mb-6">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verify passenger Government IDs</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>One-click Approve / Reject</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Generate valid QR boarding passes</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onOperatorClick}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Continue as Operator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
