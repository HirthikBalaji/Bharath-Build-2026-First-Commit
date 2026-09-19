import React from 'react';
import { 
  Bus as BusIcon, 
  Ticket, 
  ArrowRightLeft, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  ArrowRight, 
  Zap, 
  Search, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  Award,
  DollarSign,
  Layers,
  FileCheck
} from 'lucide-react';
import { User } from '../types';

interface HomePageProps {
  onSearchClick: () => void;
  onViewTicketsClick: () => void;
  onOperatorClick: () => void;
  onRunDemo: () => void;
  isDemoRunning: boolean;
  currentUser: User | null;
  onSelectRole: (role: string, tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSearchClick,
  onViewTicketsClick,
  onOperatorClick,
  onRunDemo,
  isDemoRunning,
  currentUser,
  onSelectRole
}) => {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 rounded-b-[48px] shadow-2xl border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/50 via-slate-900 to-indigo-950/60"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-inner">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-mono uppercase tracking-wider font-bold">Protocol Specification v1.0 • Face-Value Guaranteed</span>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1]">
              Your seat doesn't have to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
                go to waste.
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Resell eligible bus seats at face value. Someone gets the seat. You recover your fare. Authorized operator reissuance guarantees boarding safety.
            </p>
          </div>

          {/* Search Box Prompt (Section 15) */}
          <div className="max-w-3xl mx-auto pt-2">
            <div className="bg-slate-800/80 backdrop-blur-xl p-3 sm:p-4 rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="grid grid-cols-3 gap-3 flex-1 w-full text-left px-3">
                <div className="border-r border-slate-700/70 pr-2">
                  <span className="text-slate-400 block uppercase font-mono text-[10px] font-bold">From</span>
                  <span className="text-white font-bold text-sm sm:text-base">Bangalore</span>
                </div>
                <div className="border-r border-slate-700/70 pr-2">
                  <span className="text-slate-400 block uppercase font-mono text-[10px] font-bold">To</span>
                  <span className="text-white font-bold text-sm sm:text-base">Chennai</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[10px] font-bold">Date</span>
                  <span className="text-white font-bold text-sm sm:text-base">19 Sep 2026</span>
                </div>
              </div>

              <button
                onClick={onSearchClick}
                className="w-full sm:w-auto px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[3]" />
                <span>Search Buses</span>
              </button>
            </div>
          </div>

          {/* Quick Demo CTA */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onRunDemo}
              disabled={isDemoRunning}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-700/30 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current text-amber-300" />
              <span>{isDemoRunning ? 'Simulating Complete Workflow...' : '▶ Run Complete Demo (1-Click)'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4-Step Explanation (Section 15 & Core Problem) */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-2">
            The Resale Layer Protocol
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">How SeatRelay Works</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl mx-auto">
            Not an informal ticket-transfer. An authorized operator reissuance gateway with atomic escrow protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group hover:border-emerald-500 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 font-black text-lg border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">List your seat</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ticket stays valid for you until another traveller purchases it. Resale price is strictly bound to original face value.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-emerald-700">
              ✓ Zero markups allowed
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group hover:border-emerald-500 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 font-black text-lg border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-all">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Another traveller buys it</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Travellers searching sold-out routes see the released seat with the <span className="font-bold text-emerald-700">♻️ SeatRelay</span> badge and reserve it.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-teal-700">
              ✓ Atomic reservation lock
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group hover:border-emerald-500 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 font-black text-lg border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Operator reissues ticket</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Operator cancels original ticket, updates the boarding manifest, and issues a verified QR boarding pass with buyer's identity.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-indigo-700">
              ✓ Original invalidated
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group hover:border-emerald-500 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 font-black text-lg border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-all">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">You get your refund</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upon verified reissue, payment escrow releases 100% face-value refund directly back to your original payment method.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-amber-700">
              ✓ Instant refund reference
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Role Switcher Matrix (Section 16) */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 mb-2">
            Multi-Persona Demo Environment
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Select a Role to Experience the Protocol</h2>
          <p className="text-sm text-slate-500 mt-1">
            Toggle directly into any user's perspective with pre-seeded demo state.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Seller Profile Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Seller Role
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                  RS
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900">Rahul Sharma</h3>
              <p className="text-xs font-mono text-slate-400">rahul@example.com</p>

              <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">SwiftBus Express</div>
                <div>Bangalore → Chennai • 19 Sep 2026, 10:30 PM</div>
                <div className="text-emerald-700 font-bold">Ticket: SB-92831 • Seat: U12 (₹850)</div>
              </div>

              <ul className="text-xs text-slate-600 space-y-2 mt-5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Release seat for resale at exact fare ₹850</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Ticket remains valid until buyer purchases</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Receive ₹850 refund upon operator reissue</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectRole('seller', 'tickets')}
              className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.02]"
            >
              <span>Continue as Rahul (Seller)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Buyer Profile Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Buyer Role
                </span>
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black">
                  PK
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900">Priya Kumar</h3>
              <p className="text-xs font-mono text-slate-400">priya@example.com</p>

              <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Looking for Sold-Out Seat</div>
                <div>Bangalore → Chennai • 19 Sep 2026</div>
                <div className="text-teal-700 font-bold">Wants Seat U12 at Original ₹850 Fare</div>
              </div>

              <ul className="text-xs text-slate-600 space-y-2 mt-5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>See "Sold Out" bus route with resale badge</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Purchase with full passenger identity info</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Receive valid digital QR ticket in own name</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectRole('buyer', 'search')}
              className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 hover:scale-[1.02]"
            >
              <span>Continue as Priya (Buyer)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Operator Profile Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Operator Portal
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black">
                  SB
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900">SwiftBus Operations</h3>
              <p className="text-xs font-mono text-slate-400">ops@swiftbus.in</p>

              <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Simulated Operator GDS Terminal</div>
                <div>Authorized Passenger Reissuance</div>
                <div className="text-amber-800 font-bold">1-Click Approve / Reject Reissue</div>
              </div>

              <ul className="text-xs text-slate-600 space-y-2 mt-5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Compare old passenger vs new passenger identity</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Invalidate old ticket & trigger seller refund</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Issue authorized digital boarding QR code</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectRole('operator', 'operator')}
              className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.02]"
            >
              <span>Continue as Operator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Value Comparison Banner */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white border border-slate-700 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-mono text-emerald-400 uppercase font-bold">Why Real Operators Partner With Us</span>
            <h3 className="text-2xl font-black">Eliminating Scalping While Eliminating No-Shows</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unauthorised passenger transfers lead to security violations during boarding. SeatRelay guarantees verified identity reissuance, zero fare inflation, and instant reconciliation on the bus manifest.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center text-xs w-full md:w-auto">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div className="text-2xl font-black text-emerald-400">100%</div>
              <div className="text-slate-400 font-semibold mt-0.5">Face-Value Price Cap</div>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div className="text-2xl font-black text-emerald-400">0 ms</div>
              <div className="text-slate-400 font-semibold mt-0.5">Manifest Sync Gap</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
