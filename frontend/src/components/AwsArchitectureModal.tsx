import React, { useState } from 'react';
import {
  X,
  Server,
  Database,
  GitBranch,
  Layers,
  Zap,
  ShieldCheck,
  Clock,
  Bell,
  HardDrive,
  Activity,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Users
} from 'lucide-react';

interface AwsArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AwsArchitectureModal: React.FC<AwsArchitectureModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'stateMachine' | 'moneyModel' | 'raceCondition'>('architecture');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 relative border-b border-slate-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AWS ARCHITECTURE & STATE MACHINE SPECIFICATION
            </span>
            <span className="text-xs font-mono text-slate-400">Bharat Builds 2026</span>
          </div>
          <h2 className="text-2xl font-black">
            SeatRelay Cloud & Resale Protocol Architecture
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Operator-authorized seat reissuance modeled with AWS Step Functions, atomic DynamoDB conditional writes, EventBridge TTL expiry, and strict face-value math.
          </p>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'architecture'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              ☁️ AWS Services (Ship It Track)
            </button>
            <button
              onClick={() => setActiveTab('stateMachine')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'stateMachine'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              ⚡ Step Functions State Machine
            </button>
            <button
              onClick={() => setActiveTab('moneyModel')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'moneyModel'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              💰 Zero-Markup Money Model
            </button>
            <button
              onClick={() => setActiveTab('raceCondition')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'raceCondition'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              🛡️ 1-Buyer Atomic Claim
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs leading-relaxed">
          {/* TAB 1: AWS Services Architecture */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner">
                <pre>{`React (Amplify Hosting) ── Cognito (3 Groups: seller, buyer, operator)
        │
   API Gateway (REST)
        │
     Lambdas ──────────► DynamoDB (Listings, OperatorTickets, Transfers)
        │                     ▲  (Conditional writes guarantee 1 winner)
        ├── start ──► Step Functions (Transfer Workflow: wait-for-task-token)
        │                     │
        │                     ├──► SNS Notifications (SMS / Email)
        │                     ▲
        └── operator approve/reject sends task token back
        
 EventBridge Scheduler ──(at cutoff: T-60m)──► expireListing Lambda
 S3 ◄── ticket uploads / generated QR boarding passes
 CloudWatch ◄── audit logs, metrics dashboard (money recovered)`}</pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-600" />
                    <span>AWS Amplify & Cognito</span>
                  </div>
                  <p className="text-slate-600">
                    Hosts the responsive React web application. Cognito partitions permissions into 3 dedicated RBAC user groups: <code>seller</code>, <code>buyer</code>, and <code>operator</code>.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-indigo-600" />
                    <span>AWS Step Functions (Centerpiece)</span>
                  </div>
                  <p className="text-slate-600">
                    Runs state machine with the <strong>Wait for Task Token</strong> pattern. Workflow pauses while awaiting operator authorization with automatic timeout rollback.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-teal-600" />
                    <span>Amazon DynamoDB</span>
                  </div>
                  <p className="text-slate-600">
                    Stores <code>Listings</code>, <code>OperatorTickets</code>, and <code>Transfers</code>. Conditional expressions (<code>status = LISTED</code>) guarantee race-safe claims.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>EventBridge Scheduler & SNS</span>
                  </div>
                  <p className="text-slate-600">
                    EventBridge schedules precise one-time triggers at departure cutoff (T-60 min) to lift holds. SNS sends multi-channel updates at each step.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: State Machine */}
          {activeTab === 'stateMachine' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Step Functions Transfer State Transitions</h4>
                <div className="bg-slate-950 text-emerald-300 p-4 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                  <pre>{`             withdraw
   LISTED ─────────────► WITHDRAWN
     │  ▲
claim│  │ payment window timeout (10m)
     ▼  │ or operator reject/timeout (before cutoff)
   CLAIMED ──pay──► PAYMENT_HELD ──► AWAITING_OPERATOR ──approve──► REISSUED ──► SELLER_REFUNDED ──► COMPLETE
     
   LISTED ── cutoff reached (T-60m) ──► EXPIRED
   AWAITING_OPERATOR ── reject/timeout after cutoff ──► buyer refunded ──► EXPIRED`}</pre>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Automated Failure Paths (Guaranteed Rollbacks):</h5>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-rose-600 min-w-[120px]">Payment Timeout:</span>
                    <span>If buyer claims but does not pay within 10 minutes, claim lock is released and seat goes back to <code>LISTED</code>.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-rose-600 min-w-[120px]">Operator Rejection:</span>
                    <span>Held buyer funds are instantly returned. If before cutoff, listing returns to <code>LISTED</code>; otherwise it expires cleanly.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-rose-600 min-w-[120px]">Departure Cutoff:</span>
                    <span>EventBridge triggers auto-expiry at T-60 min. Hold lifted. Seller falls back to standard operator policy.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: Money Model */}
          {activeTab === 'moneyModel' && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-950">
                <h4 className="font-bold text-sm text-emerald-900 mb-1">
                  Why SeatRelay Is Strictly Face-Value (Zero Scalping)
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Platform fees and operator fees are taken <strong>out of money the seller would otherwise have lost</strong> in the no-refund window, never on top of the buyer fare. The buyer pays exactly what was on the original ticket.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Stakeholder</th>
                      <th className="py-3 px-4">Standard Cancellation (Today)</th>
                      <th className="py-3 px-4 bg-emerald-100/60 text-emerald-900">With SeatRelay Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900">Buyer Pays</td>
                      <td className="py-3 px-4 text-slate-500">Seat unavailable (Sold out)</td>
                      <td className="py-3 px-4 font-black text-emerald-700 bg-emerald-50/50">₹850 (Exact Face Value)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900">Seller Recovers</td>
                      <td className="py-3 px-4 text-rose-600 font-bold">₹0 (100% loss in no-refund window)</td>
                      <td className="py-3 px-4 font-black text-emerald-700 bg-emerald-50/50">₹850 (100% of face-value fare)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900">Operator Keeps</td>
                      <td className="py-3 px-4 text-slate-500">Penalty fee, but seat runs empty or unauthorized</td>
                      <td className="py-3 px-4 font-bold text-slate-800 bg-emerald-50/50">Paid seat on manifest + Verified passenger ID</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900">Manifest Sync</td>
                      <td className="py-3 px-4 text-rose-600 font-semibold">Ghost passenger or illegal cash-swap</td>
                      <td className="py-3 px-4 font-bold text-emerald-700 bg-emerald-50/50">100% Accurate name & masked Govt ID</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Atomic Race-Condition Protection */}
          {activeTab === 'raceCondition' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>The One-Buyer Guarantee (DynamoDB Conditional Update)</span>
                </h4>
                <p className="text-slate-600">
                  When a seat goes viral on a sold-out route, multiple buyers may click "Buy" at the exact same millisecond. SeatRelay enforces atomic reservation locking:
                </p>
                <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                  <pre>{`UpdateItem Listings
  SET status = 'CLAIMED',
      buyerId = :buyer,
      claimExpiresAt = :timeout
  WHERE listingId = :id
  CONDITION status = 'LISTED'`}</pre>
                </div>
                <p className="text-slate-600">
                  If two buyers execute this at the identical instant, <strong>exactly one transaction succeeds</strong>. The second receives a clean <code>409 Conflict: "Seat already claimed"</code> message, preventing double-selling.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            Submission Track: WeMakeDevs x AWS Bharat Builds Tour 2026
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close Spec
          </button>
        </div>
      </div>
    </div>
  );
};
