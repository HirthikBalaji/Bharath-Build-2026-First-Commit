import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, QrCode, RefreshCw, Ticket as TicketIcon, Undo2, AlertCircle, Check } from 'lucide-react';
import { Ticket, User } from '../types';
import { cityCode, duration, formatDate, formatTime, inr, seatTypeLabel } from '../lib/format';
import { useToast } from '../lib/toast';
import { BerthGlyph, Button, cx, EASE_OUT, EmptyState, Modal, PageHeader, Pill } from './ui';

interface MyTicketsProps {
  currentUser: User;
  tickets: Ticket[];
  isLoading: boolean;
  onRefresh: () => void;
  onViewQR: (ticket: Ticket) => void;
}

const STAGES = ['Released', 'Claimed', 'Reissued', 'Refunded'];

const stageOf = (t: Ticket) => {
  const l = t.activeListing;
  if (t.status === 'INVALIDATED' || l?.status === 'COMPLETED') return 4;
  if (!l) return 0;
  if (l.status === 'PURCHASED') return 2;
  return 1;
};

/** The transfer that matters for this listing: the completed one if any, else the latest. */
const settledTx = (t: Ticket) => {
  const txs = t.activeListing?.transactions ?? [];
  return txs.find((x: any) => x.status === 'COMPLETED') ?? txs[txs.length - 1];
};

export const MyTickets: React.FC<MyTicketsProps> = ({ currentUser, tickets, isLoading, onRefresh, onViewQR }) => {
  const { notify } = useToast();
  const [releaseTicket, setReleaseTicket] = useState<Ticket | null>(null);
  const [withdrawTicket, setWithdrawTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('seatrelay_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (currentUser?.id) headers['x-user-id'] = currentUser.id;
    return headers;
  };

  const handleListTicket = async (ticket: Ticket) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/list`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sellerId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'We could not release this seat.');
      setReleaseTicket(null);
      notify({ tone: 'success', title: `Berth ${ticket.seatNumber} released`, body: 'Travellers on this route can now claim it at the printed fare.' });
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelListing = async (ticket: Ticket) => {
    const listingId = ticket.activeListing?.id;
    if (!listingId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/resale/${listingId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sellerId: currentUser.id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'We could not withdraw this listing.');
      }
      setWithdrawTicket(null);
      notify({ tone: 'info', title: 'Listing withdrawn', body: `Berth ${ticket.seatNumber} is yours again. Board as usual.` });
      onRefresh();
    } catch (err: any) {
      notify({ tone: 'error', title: 'Could not withdraw', body: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const first = currentUser.name.split(' ')[0];

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 pb-12 pt-32 sm:px-8 sm:pt-36">
      <PageHeader
        kicker="My journeys"
        title={`Your journeys, ${first}.`}
        lede="Tickets in your name, and any seat you've released. Refunds land here the moment the operator reissues."
        actions={
          <Button variant="ghost" onClick={onRefresh}>
            <RefreshCw className={cx('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <div className="mt-10">
        {isLoading && tickets.length === 0 ? (
          <div className="space-y-5">
            {[0, 1].map((i) => (
              <div key={i} className="skeleton h-56 rounded-2xl" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={<TicketIcon className="h-10 w-10" strokeWidth={1.25} />}
            title="No journeys yet"
            body="Tickets booked in your name show up here. If you just claimed a relayed seat, it appears once the operator reissues it."
          />
        ) : (
          <div className="space-y-6">
            {tickets.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: Math.min(i * 0.08, 0.4), ease: EASE_OUT }}
              >
                <JourneyCard
                  ticket={t}
                  onRelease={() => {
                    setActionError(null);
                    setReleaseTicket(t);
                  }}
                  onWithdraw={() => setWithdrawTicket(t)}
                  onViewQR={() => onViewQR(t)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Release confirmation */}
      <Modal open={!!releaseTicket} onClose={() => !isSubmitting && setReleaseTicket(null)} label="Release this seat" size="md">
        {releaseTicket && (
          <div className="p-7 sm:p-9">
            <BerthGlyph className="h-9 w-16" state="relay" />
            <h2 className="display-md mt-6 pr-8 text-[1.875rem] text-ink">Release berth {releaseTicket.seatNumber}?</h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink2">
              It goes on sale at the printed fare to travellers on {releaseTicket.routeFrom} to {releaseTicket.routeTo}. Your ticket stays valid for you until someone buys it.
            </p>

            {actionError && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {actionError}
              </div>
            )}

            <div className="mt-7 space-y-4 rounded-xl border border-line p-5">
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-ink">Cancel with the operator now</p>
                  <p className="num text-xl font-bold text-danger">₹0</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-surface2" />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-ink">Release on SeatRelay</p>
                  <p className="num text-xl font-bold text-accent">{inr(releaseTicket.fare)}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface2">
                  <motion.div className="h-full origin-left rounded-full bg-coach dark:bg-accent" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.3, ease: EASE_OUT }} />
                </div>
                <p className="mt-2 text-xs text-ink3">Paid back once the operator reissues the seat. SeatRelay fee ₹0.</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="quiet" onClick={() => setReleaseTicket(null)} disabled={isSubmitting}>
                Keep my seat
              </Button>
              <Button onClick={() => handleListTicket(releaseTicket)} loading={isSubmitting}>
                Release for {inr(releaseTicket.fare)}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Withdraw confirmation */}
      <Modal open={!!withdrawTicket} onClose={() => !isSubmitting && setWithdrawTicket(null)} label="Withdraw listing" size="sm">
        {withdrawTicket && (
          <div className="p-7">
            <h2 className="display-md pr-8 text-[1.5rem] text-ink">Take berth {withdrawTicket.seatNumber} off sale?</h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink2">Nobody will be able to claim it. Your ticket stays exactly as it was.</p>
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="quiet" onClick={() => setWithdrawTicket(null)} disabled={isSubmitting}>
                Keep it listed
              </Button>
              <Button variant="danger" onClick={() => handleCancelListing(withdrawTicket)} loading={isSubmitting}>
                Withdraw listing
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const JourneyCard: React.FC<{ ticket: Ticket; onRelease: () => void; onWithdraw: () => void; onViewQR: () => void }> = ({
  ticket: t,
  onRelease,
  onWithdraw,
  onViewQR,
}) => {
  const invalid = t.status === 'INVALIDATED';
  const listingOpen = t.activeListing?.status === 'LISTED' || t.activeListing?.status === 'PURCHASED';
  const listed = !invalid && (t.status === 'LISTED_FOR_RESALE' || listingOpen);
  const confirmed = t.status === 'CONFIRMED' && !listed;
  const reissuedToMe = t.ticketNumber?.startsWith('SR-');
  const stage = stageOf(t);
  const tx = settledTx(t);
  const refund = tx?.sellerRefundAmount ?? t.activeListing?.expectedRefund ?? t.fare;

  const status = invalid ? (
    <Pill tone="neutral">Transferred</Pill>
  ) : listed ? (
    <Pill tone="marigold" dot>
      {stage === 2 ? 'Claimed, awaiting operator' : 'Released, waiting for a buyer'}
    </Pill>
  ) : confirmed ? (
    <Pill tone="coach">{reissuedToMe ? 'Reissued to you' : 'Confirmed'}</Pill>
  ) : (
    <Pill tone="neutral">{t.status.replace(/_/g, ' ').toLowerCase()}</Pill>
  );

  return (
    <article className={cx('overflow-hidden rounded-2xl border bg-surface transition-shadow hover:shadow-lift', listed ? 'border-marigold/60' : 'border-line', invalid && 'bg-surface/70')}>
      <div className="grid lg:grid-cols-[1fr_auto_220px]">
        {/* main */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="font-semibold text-ink">{t.operatorName}</p>
              <span className="code text-xs text-ink3">{t.busNumber}</span>
            </div>
            {status}
          </div>

          <div className="mt-6 flex items-center gap-5">
            <div>
              <p className={cx('display text-[2.5rem] sm:text-[3rem]', invalid ? 'text-ink3' : 'text-ink')}>{cityCode(t.routeFrom)}</p>
              <p className="text-sm text-ink3">{t.routeFrom}</p>
            </div>
            <div className="flex flex-1 flex-col items-center">
              <span className="num text-sm font-semibold text-ink2">{formatTime(t.departureTime)} → {formatTime(t.arrivalTime)}</span>
              <span className="relative my-2 h-px w-full bg-linestrong">
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-2">
                  <BerthGlyph className="h-4 w-7" state={invalid ? 'booked' : listed ? 'relay' : 'held'} />
                </span>
              </span>
              <span className="text-xs text-ink3">{duration(t.departureTime, t.arrivalTime)} · {formatDate(t.travelDate)}</span>
            </div>
            <div className="text-right">
              <p className={cx('display text-[2.5rem] sm:text-[3rem]', invalid ? 'text-ink3' : 'text-ink')}>{cityCode(t.routeTo)}</p>
              <p className="text-sm text-ink3">{t.routeTo}</p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-ink3">Passenger</dt>
              <dd className={cx('mt-0.5 font-semibold', invalid ? 'text-ink3 line-through decoration-danger/60' : 'text-ink')}>{t.passengerName}</dd>
            </div>
            <div>
              <dt className="text-ink3">Age · gender</dt>
              <dd className="mt-0.5 text-ink2">{t.passengerAge} · {t.passengerGender}</dd>
            </div>
            <div>
              <dt className="text-ink3">Ticket</dt>
              <dd className="code mt-0.5 text-ink2">{t.ticketNumber}</dd>
            </div>
            <div>
              <dt className="text-ink3">Coach</dt>
              <dd className="mt-0.5 truncate text-ink2" title={t.busType}>{t.busType}</dd>
            </div>
          </dl>

          {(listed || invalid) && (
            <div className="mt-6 rounded-xl bg-surface2 p-4">
              <ol className="grid grid-cols-4 gap-2">
                {STAGES.map((s, i) => {
                  const done = i < stage;
                  return (
                    <li key={s}>
                      <span className="block h-1.5 overflow-hidden rounded-full bg-linestrong/50">
                        <motion.span
                          className={cx('block h-full origin-left rounded-full', i < 2 ? 'bg-marigold' : 'bg-coach dark:bg-accent')}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: done ? 1 : 0 }}
                          transition={{ duration: 0.6, delay: 0.2 + i * 0.12, ease: EASE_OUT }}
                        />
                      </span>
                      <span className={cx('mt-2 flex items-center gap-1 text-xs font-semibold', done ? 'text-ink' : 'text-ink3')}>
                        {done && <Check className="h-3 w-3" strokeWidth={3} />}
                        {s}
                      </span>
                    </li>
                  );
                })}
              </ol>
              {invalid ? (
                <p className="mt-4 text-sm text-ink2">
                  Reissued to the new passenger and cancelled for boarding.{' '}
                  <span className="font-semibold text-accent">{inr(refund)} refunded</span>
                  {tx?.refundReferenceId && <span className="code ml-1 text-xs text-ink3">· {tx.refundReferenceId}</span>}
                </p>
              ) : (
                <p className="mt-4 text-sm text-ink2">
                  You'll get <span className="font-semibold text-ink">{inr(refund)}</span> back the moment the operator reissues the seat.
                  {t.activeListing?.listingNumber && <span className="code ml-1 text-xs text-ink3">· {t.activeListing.listingNumber}</span>}
                </p>
              )}
            </div>
          )}
        </div>

        {/* perforation */}
        <div className="relative hidden w-6 lg:block">
          <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 border-l-2 border-dashed border-line" />
          <span className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-bg" />
          <span className="absolute -bottom-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-bg" />
        </div>

        {/* stub */}
        <div className="flex flex-col justify-between gap-6 border-t border-dashed border-line bg-surface2/60 p-6 lg:border-t-0">
          <div className="flex items-end justify-between lg:block">
            <div>
              <p className="text-xs text-ink3">Berth</p>
              <p className="code text-[2rem] font-semibold leading-tight text-ink">{t.seatNumber}</p>
              <p className="text-xs text-ink3">{seatTypeLabel(t.seatType)}</p>
            </div>
            <div className="text-right lg:mt-4 lg:text-left">
              <p className="text-xs text-ink3">Fare</p>
              <p className="num text-xl font-bold text-ink">{inr(t.fare)}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {t.qrCode && !invalid && (
              <Button variant={confirmed ? 'primary' : 'ghost'} size="sm" onClick={onViewQR} className="w-full">
                <QrCode className="h-4 w-4" />
                Boarding pass
              </Button>
            )}
            {confirmed && (
              <Button variant="accent" size="sm" onClick={onRelease} className="w-full">
                Release this seat
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {listed && t.activeListing?.status === 'LISTED' && (
              <Button variant="quiet" size="sm" onClick={onWithdraw} className="w-full">
                <Undo2 className="h-4 w-4" />
                Withdraw listing
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
