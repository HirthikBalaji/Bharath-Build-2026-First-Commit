import React from 'react';
import { 
  ArrowRight, 
  RotateCcw, 
  Ticket, 
  Search, 
  Building2, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Sparkles
} from 'lucide-react';
import { User, Ticket as TicketType, ReissueRequestItem } from '../types';

interface InteractiveDemoBarProps {
  currentUser: User | null;
  users: User[];
  onSelectUser: (user: User) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRunDemo: () => void;
  onResetDemo: () => void;
  isDemoRunning: boolean;
  tickets: TicketType[];
  reissues: ReissueRequestItem[];
}

export const InteractiveDemoBar: React.FC<InteractiveDemoBarProps> = ({
  currentUser,
  users,
  onSelectUser,
  activeTab,
  setActiveTab,
  onRunDemo,
  onResetDemo,
  isDemoRunning,
  tickets,
  reissues
}) => {
  // Determine current lifecycle step for smart guided hint
  const rahulTicket = tickets.find((t) => t.ticketNumber === 'SB-92831' || t.seatNumber === 'U12');
  const pendingReissue = reissues.find((r) => r.status === 'REISSUE_PENDING');
  const completedReissue = reissues.find((r) => r.status === 'COMPLETED');

  let currentPhase = 1;
  let phaseTitle = 'Step 1: Seller lists Seat U12';
  let phaseDesc = 'Log in as Rahul and click "Release Seat for Resale" in My Tickets.';
  let recommendedRole = 'seller';
  let targetTab = 'tickets';

  if (rahulTicket?.status === 'LISTED_FOR_RESALE' && !pendingReissue && !completedReissue) {
    currentPhase = 2;
    phaseTitle = 'Step 2: Buyer purchases Seat U12';
    phaseDesc = 'Switch to Priya, search Bangalore → Chennai, and buy Seat U12 at face value.';
    recommendedRole = 'buyer';
    targetTab = 'search';
  } else if (pendingReissue) {
    currentPhase = 3;
    phaseTitle = 'Step 3: Operator approves Reissue';
    phaseDesc = `Reissue Request #${pendingReissue.transactionNumber} is awaiting SwiftBus authorization.`;
    recommendedRole = 'operator';
    targetTab = 'operator';
  } else if (completedReissue || rahulTicket?.status === 'INVALIDATED') {
    currentPhase = 4;
    phaseTitle = 'Step 4: Lifecycle Completed!';
    phaseDesc = 'Ticket reissued with QR code to Priya, original invalidated, ₹850 refunded to Rahul.';
    recommendedRole = 'buyer';
    targetTab = 'tickets';
  }

  const handleQuickSwitch = (roleName: string, tab: string) => {
    const targetUser = users.find((u) => u.role === roleName);
    if (targetUser) onSelectUser(targetUser);
    setActiveTab(tab);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/60 shadow-lg px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Hackathon Demo Stage Indicator */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>HACKATHON LIVE DEMO</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <span className="font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 font-mono">
              Phase {currentPhase}/4
            </span>
            <span className="font-semibold text-white">{phaseTitle}</span>
            <span className="text-slate-400 hidden lg:inline">— {phaseDesc}</span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Guided Jump Button */}
          <button
            onClick={() => handleQuickSwitch(recommendedRole, targetTab)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Jump to Step {currentPhase}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Automated Run */}
          <button
            onClick={onRunDemo}
            disabled={isDemoRunning}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{isDemoRunning ? 'Running Demo...' : 'Auto-Run (1-Click)'}</span>
          </button>

          {/* Reset Demo DB */}
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Reset database back to clean initial state"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
