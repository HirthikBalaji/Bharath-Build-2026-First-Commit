import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, CheckCircle2, Clock, RefreshCw, X } from 'lucide-react';
import { ReissueRequestItem } from '../types';
import { formatDate, formatTime, inr, maskId, timeAgo } from '../lib/format';
import { BerthGlyph, Button, CountUp, cx, EASE_OUT, EmptyState, Modal, PageHeader, Pill } from './ui';

interface OperatorDashboardProps {
  reissues: ReissueRequestItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onApprove: (transactionId: string) => Promise<void>;
  onReject: (transactionId: string, reason: string) => Promise<void>;
}

const REASONS = ['Name does not match the ID', "Inside the operator's cutoff", 'Coach cancelled or rescheduled'];

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ reissues, isLoading, onRefresh, onApprove, onReject }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalTx, setRejectModalTx] = useState<ReissueRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState(REASONS[0]);

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

  const pending = reissues.filter((r) => r.status === 'REISSUE_PENDING');
  const past = reissues.filter((r) => r.status !== 'REISSUE_PENDING');
  const completed = past.filter((r) => r.status === 'COMPLETED');
  const declined = past.filter((r) => r.status === 'REJECTED' || r.status === 'FAILED');
  const refunded = completed.reduce((n, r) => n + Number(r.sellerRefundAmount || 0), 0);

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 pb-12 pt-32 sm:px-8 sm:pt-36">
      <PageHeader
        kicker="Dispatch · SwiftBus Express"
        title="Reissue queue."
        lede="Check who comes off the manifest and who goes on. Approving cancels the old ticket, issues the new one and releases the seller's refund in one step."
        actions={
          <Button variant="ghost" onClick={onRefresh}>
            <RefreshCw className={cx('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh queue
          </Button>
        }
      />

      {/* Shift summary */}
      <div className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-4">
        {[
          { label: 'Waiting for you', value: pending.length, accent: pending.length > 0 },
          { label: 'Reissued', value: completed.length },
          { label: 'Refunds released', value: refunded, prefix: '₹' },
          { label: 'Declined', value: declined.length },
        ].map((s, i) => (
          <div key={s.label} className={cx('p-5 sm:p-6', i % 2 === 1 && 'border-l border-line', i >= 2 && 'border-t border-line md:border-t-0', i === 2 && 'md:border-l')}>
            <p className="text-sm text-ink3">{s.label}</p>
            <p className={cx('display-md mt-2 text-[2rem]', s.accent ? 'text-marigold' : 'text-ink')}>
              <CountUp value={s.value} prefix={s.prefix} />
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Pill tone="neutral">Price cap: face value</Pill>
        <Pill tone="neutral">Transfers close 60 min before departure</Pill>
        <Pill tone="neutral">Passenger reissue: supported</Pill>
        <span className="self-center pl-1 text-ink3">Simulated operator endpoint</span>
      </div>

      {/* Queue */}
      <section className="mt-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="display-md flex items-center gap-3 text-[1.625rem] text-ink">
            Waiting for approval
            <span className="num grid h-7 min-w-7 place-items-center rounded-full bg-marigold px-2 text-sm font-bold text-marigoldink">{pending.length}</span>
          </h2>
        </div>

        {isLoading && reissues.length === 0 ? (
          <div className="skeleton h-72 rounded-2xl" />
        ) : pending.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-10 w-10 text-accent" strokeWidth={1.25} />}
            title="Queue is clear"
            body="New transfer requests land here the moment a traveller claims a released berth."
          />
        ) : (
          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {pending.map((r) => {
                const busy = processingId === r.transactionId;
                return (
                  <motion.article
                    key={r.transactionId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.45, ease: EASE_OUT } }}
                    transition={{ duration: 0.5, ease: EASE_OUT }}
                    className="overflow-hidden rounded-2xl border border-marigold/60 bg-surface shadow-lift"
                  >
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="code text-sm font-semibold text-ink">#{r.transactionNumber}</span>
                        <span className="text-sm text-ink2">
                          {r.bus.routeFrom} to {r.bus.routeTo} · {formatDate(r.bus.travelDate)} · {formatTime(r.bus.departureTime)}
                        </span>
                        <span className="code text-xs text-ink3">{r.bus.busNumber}</span>
                      </div>
                      <Pill tone="marigold" dot>
                        <Clock className="h-3 w-3" /> Waiting {timeAgo(r.createdAt)}
                      </Pill>
                    </header>

                    <div className="grid items-stretch gap-4 p-6 md:grid-cols-[1fr_auto_1fr]">
                      <div className="rounded-xl border border-line p-5">
                        <p className="kicker text-danger">Off the manifest</p>
                        <p className="mt-4 text-xl font-semibold text-ink">{r.originalPassenger.name}</p>
                        <dl className="mt-4 space-y-2 text-sm">
                          <Row k="Ticket" v={<span className="code">{r.originalPassenger.ticketNumber}</span>} />
                          <Row k="Berth" v={<span className="code">{r.seat.seatNumber}</span>} />
                          <Row k="Fare paid" v={inr(r.fare)} />
                          <Row k="Refund on approval" v={<span className="font-semibold text-accent">{inr(r.sellerRefundAmount)}</span>} />
                        </dl>
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-ink3">
                          <BerthGlyph className="h-7 w-12" state="relay" />
                          <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
                          <span className="code text-xs">{r.seat.seatNumber}</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-coach/40 bg-coach/[0.04] p-5 dark:border-accent/40">
                        <p className="kicker text-accent">Onto the manifest</p>
                        <p className="mt-4 text-xl font-semibold text-ink">{r.newPassenger.name}</p>
                        <dl className="mt-4 space-y-2 text-sm">
                          <Row k="Age · gender" v={`${r.newPassenger.age} · ${r.newPassenger.gender}`} />
                          <Row k="Phone" v={<span className="code">{r.newPassenger.phone}</span>} />
                          <Row k={r.newPassenger.govIdType} v={<span className="code">{maskId(r.newPassenger.govIdNumber)}</span>} />
                          <Row k="Paid, held" v={<span className="font-semibold text-ink">{inr(r.resalePrice)}</span>} />
                        </dl>
                      </div>
                    </div>

                    <footer className="flex flex-col gap-4 border-t border-line bg-surface2/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="max-w-xl text-sm text-ink2">
                        Approving cancels <span className="code text-ink">{r.originalPassenger.ticketNumber}</span>, reissues berth {r.seat.seatNumber} to{' '}
                        <span className="font-semibold text-ink">{r.newPassenger.name}</span> and refunds {inr(r.sellerRefundAmount)}.
                      </p>
                      <div className="flex gap-2">
                        <Button variant="quiet" onClick={() => setRejectModalTx(r)} disabled={busy} className="text-danger hover:bg-danger/10 hover:text-danger">
                          <X className="h-4 w-4" />
                          Decline
                        </Button>
                        <Button onClick={() => handleApprove(r.transactionId)} loading={busy} magnetic>
                          {!busy && <Check className="h-4 w-4" />}
                          {busy ? 'Reissuing…' : 'Approve reissue'}
                        </Button>
                      </div>
                    </footer>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* History */}
      <section className="mt-16">
        <h2 className="display-md mb-5 text-[1.625rem] text-ink">Manifest history</h2>
        {past.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-linestrong px-6 py-10 text-center text-ink3">Processed transfers will be listed here.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="overflow-x-auto" data-lenis-prevent>
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-line bg-surface2/60 text-xs text-ink3">
                  <tr>
                    {['Transfer', 'Berth and route', 'Came off', 'Went on', 'New ticket', 'Seller refund', 'Outcome'].map((h) => (
                      <th key={h} className="px-5 py-3.5 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {past.map((r, i) => (
                    <motion.tr
                      key={r.transactionId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.04, 0.3) }}
                      className="transition-colors hover:bg-surface2/50"
                    >
                      <td className="code px-5 py-4 text-ink">#{r.transactionNumber}</td>
                      <td className="px-5 py-4">
                        <span className="code font-semibold text-ink">{r.seat.seatNumber}</span>
                        <span className="block text-xs text-ink3">{r.bus.routeFrom} to {r.bus.routeTo}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-ink2">{r.originalPassenger.name}</span>
                        <span className="code block text-xs text-ink3 line-through">{r.originalPassenger.ticketNumber}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-ink">{r.newPassenger.name}</span>
                        <span className="code block text-xs text-ink3">{maskId(r.newPassenger.govIdNumber)}</span>
                      </td>
                      <td className="code px-5 py-4 text-accent">{r.newTicket ? r.newTicket.ticketNumber : '·'}</td>
                      <td className="num px-5 py-4 font-semibold text-ink">{r.status === 'COMPLETED' ? inr(r.sellerRefundAmount) : '·'}</td>
                      <td className="px-5 py-4">
                        {r.status === 'COMPLETED' ? <Pill tone="coach">Reissued</Pill> : <Pill tone="danger">{r.status === 'REJECTED' ? 'Declined' : r.status.toLowerCase()}</Pill>}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <Modal open={!!rejectModalTx} onClose={() => setRejectModalTx(null)} label="Decline transfer" size="sm">
        {rejectModalTx && (
          <div className="p-7">
            <h2 className="display-md pr-8 text-[1.5rem] text-ink">Decline #{rejectModalTx.transactionNumber}?</h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink2">
              {rejectModalTx.newPassenger.name}'s payment is returned straight away and the berth goes back on sale for {rejectModalTx.originalPassenger.name}.
            </p>
            <p className="mt-6 text-sm font-medium text-ink2">Reason</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRejectReason(r)}
                  className={cx('rounded-full border px-3 py-1.5 text-[0.8125rem] transition-colors', rejectReason === r ? 'border-danger bg-danger/10 text-danger' : 'border-line text-ink2 hover:border-linestrong')}
                >
                  {r}
                </button>
              ))}
            </div>
            <input className="field mt-3" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} aria-label="Reason for declining" />
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="quiet" onClick={() => setRejectModalTx(null)}>
                Keep in queue
              </Button>
              <Button variant="danger" onClick={handleConfirmReject} loading={processingId === rejectModalTx.transactionId}>
                Decline transfer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const Row: React.FC<{ k: React.ReactNode; v: React.ReactNode }> = ({ k, v }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-ink3">{k}</dt>
    <dd className="text-right text-ink2">{v}</dd>
  </div>
);
