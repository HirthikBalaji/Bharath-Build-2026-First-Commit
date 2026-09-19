import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowRight, BellRing, CalendarClock, Cpu, Database, Globe, HardDrive, KeyRound, Server, Workflow } from 'lucide-react';
import { cx, EASE_OUT, Modal } from './ui';

interface AwsArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'architecture' | 'stateMachine' | 'moneyModel' | 'raceCondition' | 'cbdc';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'architecture', label: 'Services' },
  { id: 'stateMachine', label: 'State machine' },
  { id: 'moneyModel', label: 'Money model' },
  { id: 'raceCondition', label: 'One-buyer guarantee' },
  { id: 'cbdc', label: 'e-Rupee (CBDC) Escrow' },
];

const SERVICES = [
  { icon: Globe, name: 'Amplify Hosting', body: 'Hosts the React app.' },
  { icon: KeyRound, name: 'Cognito', body: 'Three groups: seller, buyer, operator.' },
  { icon: Server, name: 'API Gateway', body: 'REST endpoints for every action.' },
  { icon: Cpu, name: 'Lambda', body: 'Listing, claim, payment hold, approval.' },
  { icon: Workflow, name: 'Step Functions', body: 'The transfer workflow. Waits for the operator with a task token and rolls back on timeout.', lead: true },
  { icon: Database, name: 'DynamoDB', body: 'Listings, operator tickets, transfers. Conditional writes decide the one buyer.' },
  { icon: CalendarClock, name: 'EventBridge Scheduler', body: 'One schedule per listing that expires it at the cutoff.' },
  { icon: BellRing, name: 'SNS', body: 'Updates to seller, buyer and operator at each step.' },
  { icon: HardDrive, name: 'S3', body: 'Ticket uploads and generated boarding passes.' },
];

const HAPPY = ['LISTED', 'CLAIMED', 'PAYMENT_HELD', 'AWAITING_OPERATOR', 'REISSUED', 'SELLER_REFUNDED', 'COMPLETE'];

export const AwsArchitectureModal: React.FC<AwsArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<Tab>('architecture');

  return (
    <Modal open={isOpen} onClose={onClose} label="Reference architecture" size="xl">
      <div className="bg-[rgb(var(--ink))] px-7 pb-0 pt-8 text-[rgb(var(--bg))] dark:bg-surface2 dark:text-ink sm:px-10">
        <p className="kicker text-marigold">Reference architecture · AWS</p>
        <h2 className="display-md mt-3 max-w-2xl pr-8 text-[2rem]">How a seat changes hands, under the floor.</h2>
        <p className="mt-2 max-w-2xl text-[0.9375rem] opacity-70">
          The target AWS design for SeatRelay. The demo backend models the same states and rules.
        </p>
        <div className="mt-7 flex gap-1 overflow-x-auto" role="tablist" data-lenis-prevent>
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cx('relative whitespace-nowrap px-4 pb-4 pt-2 text-sm font-semibold transition-opacity', tab === t.id ? 'opacity-100' : 'opacity-55 hover:opacity-85')}
            >
              {t.label}
              {tab === t.id && <motion.span layoutId="aws-tab" className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-marigold" />}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[420px] px-7 py-8 sm:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          >
            {tab === 'architecture' && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SERVICES.map((s, i) => (
                  <motion.div
                    key={s.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                    className={cx('rounded-xl border p-4', s.lead ? 'border-marigold bg-marigold/10 sm:col-span-2 lg:col-span-1' : 'border-line')}
                  >
                    <s.icon className={cx('h-5 w-5', s.lead ? 'text-[rgb(150_96_0)] dark:text-marigold' : 'text-ink3')} strokeWidth={1.6} />
                    <p className="mt-3 font-semibold text-ink">{s.name}</p>
                    <p className="mt-1 text-sm leading-snug text-ink2">{s.body}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {tab === 'stateMachine' && (
              <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
                <div>
                  <p className="text-sm font-semibold text-ink">The happy path</p>
                  <ol className="mt-4 space-y-1.5">
                    {HAPPY.map((s, i) => (
                      <motion.li key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                        <span className={cx('code inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold', s === 'AWAITING_OPERATOR' ? 'bg-marigold text-marigoldink' : s === 'COMPLETE' ? 'bg-coach text-coachink' : 'bg-surface2 text-ink')}>
                          {s}
                        </span>
                        {i < HAPPY.length - 1 && <ArrowDown className="my-1 ml-4 h-3.5 w-3.5 text-ink3" />}
                      </motion.li>
                    ))}
                  </ol>
                  <p className="mt-4 text-sm text-ink3">AWAITING_OPERATOR pauses on a Step Functions task token until the operator approves or declines.</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Automatic rollbacks</p>
                  <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                    {[
                      ['Buyer does not pay in 10 minutes', 'Claim released, seat back to LISTED.'],
                      ['Operator declines or times out', "Buyer's payment returned. Back to LISTED before the cutoff, otherwise EXPIRED."],
                      ['Cutoff reached, 60 min before departure', 'EventBridge expires the listing. Seller keeps the normal cancellation terms.'],
                      ['Seller changes their mind', 'Withdraw while LISTED. Ticket unchanged.'],
                    ].map(([k, v]) => (
                      <li key={k} className="p-4">
                        <p className="font-semibold text-ink">{k}</p>
                        <p className="mt-1 flex items-start gap-2 text-sm text-ink2">
                          <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink3" />
                          {v}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {tab === 'moneyModel' && (
              <div>
                <p className="max-w-2xl text-[1.0625rem] leading-relaxed text-ink2">
                  Any fee comes out of money the seller would otherwise have lost, never on top of the buyer's fare. The buyer pays what is printed on the ticket.
                </p>
                <div className="mt-6 overflow-hidden rounded-xl border border-line">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface2/70 text-xs text-ink3">
                      <tr>
                        <th className="px-5 py-3 font-medium">Who</th>
                        <th className="px-5 py-3 font-medium">Cancelling today</th>
                        <th className="px-5 py-3 font-medium text-accent">With SeatRelay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {[
                        ['Buyer pays', 'No seat, the route is sold out', '₹850, the printed fare'],
                        ['Seller gets back', '₹0 inside the no-refund window', '₹850 once reissued (₹0 fee in this build)'],
                        ['Operator gets', 'The penalty, and a seat that may run empty or off the record', 'A paid seat and a verified passenger'],
                        ['Manifest', 'Can drift from who is on board', 'Real name, masked ID'],
                      ].map(([a, b, c]) => (
                        <tr key={a}>
                          <td className="px-5 py-4 font-semibold text-ink">{a}</td>
                          <td className="px-5 py-4 text-ink2">{b}</td>
                          <td className="px-5 py-4 font-medium text-ink">{c}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-ink3">Illustrative figures from the demo fare.</p>
              </div>
            )}

            {tab === 'raceCondition' && (
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <p className="text-[1.0625rem] leading-relaxed text-ink2">
                    When a berth appears on a sold-out route, two people can tap Claim in the same instant. The claim is one conditional write, so exactly one succeeds.
                  </p>
                  <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink2">
                    The other gets a clean <span className="code text-ink">409</span>, "someone just claimed this seat", and nobody is charged twice.
                  </p>
                </div>
                <pre className="code overflow-x-auto rounded-xl bg-[rgb(var(--ink))] p-5 text-[0.8125rem] leading-relaxed text-[rgb(var(--bg))] dark:bg-surface2 dark:text-ink" data-lenis-prevent>
{`UpdateItem  Listings
  Key       listingId = :id
  SET       status = 'CLAIMED',
            buyerId = :buyer,
            claimExpiresAt = :t
  CONDITION status = 'LISTED'`}
                </pre>
              </div>
            )}

            {tab === 'cbdc' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-ink">RBI Central Bank Digital Currency (e-Rupee) Programmable Settlement</h3>
                  <p className="mt-1 text-sm text-ink2 max-w-2xl leading-relaxed">
                    Commercial bank refunds take T+2 to T+5 days due to clearing-house batching. SeatRelay uses programmable e-Rupee smart contracts to guarantee instant T+0 settlement upon cryptographic operator signature.
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-line bg-surface">
                    <p className="text-xs text-ink3">1. Token Encumbrance</p>
                    <p className="font-semibold text-sm text-ink mt-1">LOCKED into Escrow</p>
                    <p className="text-xs text-ink2 mt-1">Buyer's e-Rupee tokens are locked with purpose-bound condition.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-line bg-surface">
                    <p className="text-xs text-ink3">2. Oracle / Operator Trigger</p>
                    <p className="font-semibold text-sm text-ink mt-1">Cryptographic Dispatch Sig</p>
                    <p className="text-xs text-ink2 mt-1">Operator signs the manifest reissue with Ed25519 auth code.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-line bg-surface">
                    <p className="text-xs text-ink3">3. Atomic Split Payout</p>
                    <p className="font-semibold text-sm text-accent mt-1">T+0 Real-Time Transfer</p>
                    <p className="text-xs text-ink2 mt-1">Funds land in seller's wallet in milliseconds. Zero bank delays.</p>
                  </div>
                </div>

                <pre className="code overflow-x-auto rounded-xl bg-[rgb(var(--ink))] p-5 text-[0.8125rem] leading-relaxed text-[rgb(var(--bg))] dark:bg-surface2 dark:text-ink" data-lenis-prevent>
{`// RBI e-Rupee Programmable Token Smart Contract
contract SeatRelayCBDCEscrow {
    address public buyerWallet;
    address public sellerWallet;
    address public operatorEscrow;
    uint256 public amount;
    
    function executeSettlement(bytes memory operatorSig) external {
        require(verifyOperatorSignature(operatorSig), "INVALID_REISSUE_AUTH");
        // Instant Atomic T+0 payout to original traveller
        eRupeeToken.transfer(sellerWallet, amount);
        emit ResaleSettled(sellerWallet, amount, block.timestamp);
    }
}`}
                </pre>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>
  );
};
