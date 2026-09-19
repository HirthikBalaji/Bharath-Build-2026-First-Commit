import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CreditCard, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import { Bus, ResaleSeatSummary, User } from '../types';
import { cityCode, formatDate, formatTime, inr, seatTypeLabel } from '../lib/format';
import { BerthGlyph, Button, cx, EASE_OUT, Modal, Segmented } from './ui';

interface CheckoutModalProps {
  bus: Bus;
  seat: ResaleSeatSummary;
  currentUser: User;
  onClose: () => void;
  onSuccess: (purchase: any) => void;
}

const maskId = (v: string) => {
  const digits = v.replace(/\s/g, '');
  if (digits.length <= 4) return digits;
  return `${'•'.repeat(Math.max(0, digits.length - 4)).replace(/(.{4})/g, '$1 ').trim()} ${digits.slice(-4)}`;
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ bus, seat, currentUser, onClose, onSuccess }) => {
  const [passengerName, setPassengerName] = useState(currentUser.name || 'Priya Kumar');
  const [passengerAge, setPassengerAge] = useState(24);
  const [passengerGender, setPassengerGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [phone, setPhone] = useState(currentUser.phone || '+91 98765 43210');
  const [govIdType, setGovIdType] = useState('Aadhaar Card');
  const [govIdNumber, setGovIdNumber] = useState('9876 5432 4821');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card'>('UPI');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<any>(null);

  const total = seat.totalPrice ?? seat.resalePrice + (seat.platformFee || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch(`/api/resale/${seat.listingId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: currentUser.id,
          passengerName,
          passengerAge,
          passengerGender,
          phone,
          govIdType,
          govIdNumber,
          paymentMethod,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'We could not hold this seat.');
      setPurchase(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const finish = () => onSuccess(purchase);

  return (
    <Modal open onClose={purchase ? finish : onClose} size="xl" label={`Claim berth ${seat.seatNumber}`}>
      <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
        {/* The berth */}
        <aside className="relative overflow-hidden bg-coach p-7 text-coachink sm:p-9">
          <p className="kicker opacity-75">Relayed berth</p>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="display text-[2.75rem]">
                {cityCode(bus.routeFrom)} <span className="text-marigold">→</span> {cityCode(bus.routeTo)}
              </p>
              <p className="mt-2 text-sm text-coachink/75">
                {bus.routeFrom} to {bus.routeTo}
              </p>
            </div>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-coachink/15 pt-6 text-sm">
            <div>
              <dt className="text-coachink/65">Departs</dt>
              <dd className="num mt-1 text-lg font-semibold">{formatTime(bus.departureTime)}</dd>
            </div>
            <div>
              <dt className="text-coachink/65">Date</dt>
              <dd className="mt-1 text-lg font-semibold">{formatDate(bus.travelDate)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-coachink/65">Coach</dt>
              <dd className="mt-1 font-semibold">{bus.operator}</dd>
              <dd className="text-coachink/75">{bus.busType} · <span className="code text-xs">{bus.busNumber}</span></dd>
            </div>
          </dl>

          <div className="mt-8 flex items-center gap-4 rounded-xl bg-coachink/[0.08] p-4">
            <BerthGlyph className="h-9 w-16" state="relay" />
            <div>
              <p className="code text-xl font-semibold">{seat.seatNumber}</p>
              <p className="text-sm text-coachink/75">{seatTypeLabel(seat.seatType)}</p>
            </div>
          </div>

          <dl className="mt-8 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-coachink/70">Printed fare</dt>
              <dd className="num font-semibold">{inr(seat.originalFare)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-coachink/70">SeatRelay fee</dt>
              <dd className="num font-semibold">{inr(seat.platformFee)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-coachink/15 pt-3">
              <dt className="font-semibold">You pay</dt>
              <dd className="num text-2xl font-bold text-marigold">{inr(total)}</dd>
            </div>
          </dl>

          <ol className="mt-8 space-y-3 text-sm text-coachink/80">
            {['Your payment is held, not paid out', `${bus.operator} reissues ${seat.seatNumber} in your name`, 'Your boarding pass appears in My journeys'].map((t, i) => (
              <li key={t} className="flex gap-3">
                <span className="code grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border border-coachink/30 text-[0.625rem]">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </aside>

        {/* Form or confirmation */}
        <div className="relative p-7 sm:p-9">
          <AnimatePresence mode="wait" initial={false}>
            {!purchase ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="space-y-7"
              >
                <div className="pr-8">
                  <h2 className="display-md text-[1.75rem] text-ink">Who's travelling?</h2>
                  <p className="mt-1.5 text-[0.9375rem] text-ink2">The operator reissues the ticket in this name. It must match the ID shown at boarding.</p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger" role="alert">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Seat not held</p>
                          <p className="mt-0.5 opacity-90">{error}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <fieldset className="grid gap-4 sm:grid-cols-[1fr_110px]">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink2">Full name, as on your ID</span>
                    <input className="field" required value={passengerName} onChange={(e) => setPassengerName(e.target.value)} autoComplete="name" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink2">Age</span>
                    <input className="field num" type="number" required min={5} max={120} value={passengerAge} onChange={(e) => setPassengerAge(Number(e.target.value))} />
                  </label>
                  <div className="sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-medium text-ink2">Gender</span>
                    <Segmented
                      id="gender"
                      value={passengerGender}
                      onChange={setPassengerGender}
                      options={[
                        { value: 'Female', label: 'Female' },
                        { value: 'Male', label: 'Male' },
                        { value: 'Other', label: 'Other' },
                      ]}
                    />
                  </div>
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-medium text-ink2">Mobile number, for trip updates</span>
                    <input className="field" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                  </label>
                </fieldset>

                <fieldset className="space-y-4 border-t border-line pt-6">
                  <legend className="sr-only">Government ID</legend>
                  <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-ink2">Government ID</span>
                      <select className="field" value={govIdType} onChange={(e) => setGovIdType(e.target.value)}>
                        <option>Aadhaar Card</option>
                        <option>Driving License</option>
                        <option>Passport</option>
                        <option>Voter ID</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-ink2">ID number</span>
                      <input className="field code" required value={govIdNumber} onChange={(e) => setGovIdNumber(e.target.value)} placeholder="9876 5432 4821" />
                    </label>
                  </div>
                  <p className="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2.5 text-[0.8125rem] text-ink2">
                    <ShieldCheck className="h-4 w-4 flex-shrink-0 text-accent" />
                    Shown to the operator only. Everyone else sees <span className="code whitespace-nowrap text-ink">{maskId(govIdNumber)}</span>. The seller never sees it.
                  </p>
                </fieldset>

                <fieldset className="border-t border-line pt-6">
                  <legend className="mb-3 text-sm font-medium text-ink2">Pay with</legend>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'UPI' as const, title: 'UPI', note: 'Any UPI app', icon: <Smartphone className="h-5 w-5" strokeWidth={1.75} /> },
                      { id: 'Card' as const, title: 'Card', note: 'Debit or credit', icon: <CreditCard className="h-5 w-5" strokeWidth={1.75} /> },
                    ].map((m) => {
                      const on = paymentMethod === m.id;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id)}
                          aria-pressed={on}
                          className={cx(
                            'relative flex items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                            on ? 'border-coach bg-coach/5 dark:border-accent' : 'border-line hover:border-linestrong'
                          )}
                        >
                          <span className={cx('grid h-10 w-10 place-items-center rounded-lg transition-colors', on ? 'bg-coach text-coachink' : 'bg-surface2 text-ink2')}>{m.icon}</span>
                          <span>
                            <span className="block font-semibold text-ink">{m.title}</span>
                            <span className="block text-xs text-ink3">{m.note}</span>
                          </span>
                          <span className={cx('absolute right-4 top-4 h-4 w-4 rounded-full border-2 transition-colors', on ? 'border-coach bg-coach dark:border-accent dark:bg-accent' : 'border-linestrong')} />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-ink3">Demo payment. No money moves.</p>
                </fieldset>

                <div>
                  <Button type="submit" size="lg" className="w-full" loading={isProcessing}>
                    {!isProcessing && <Lock className="h-4 w-4" />}
                    {isProcessing ? 'Holding your seat…' : `Pay ${inr(total)} and hold the seat`}
                  </Button>
                  <p className="mt-3 text-center text-xs text-ink3">Held until {bus.operator} approves. Returned automatically if they decline.</p>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: EASE_OUT }}
                className="flex min-h-[520px] flex-col justify-center"
              >
                <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden>
                  <motion.circle cx="32" cy="32" r="29" fill="none" stroke="rgb(var(--accent))" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: EASE_OUT }} />
                  <motion.path d="M20 33l8 8 16-17" fill="none" stroke="rgb(var(--accent))" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.55, ease: EASE_OUT }} />
                </svg>
                <h2 className="display mt-8 text-[2.5rem] text-ink">Seat held.</h2>
                <p className="mt-3 max-w-md text-[1.0625rem] leading-relaxed text-ink2">
                  {bus.operator} will reissue berth <span className="code font-semibold text-ink">{seat.seatNumber}</span> in the name <span className="font-semibold text-ink">{passengerName}</span>. Your {inr(total)} stays on hold until then, and your boarding pass will appear in My journeys.
                </p>
                {purchase?.transactionNumber || purchase?.transaction?.transactionNumber ? (
                  <p className="code mt-5 text-sm text-ink3">Reference {purchase.transactionNumber ?? purchase.transaction.transactionNumber}</p>
                ) : null}
                <div className="mt-10">
                  <Button size="lg" onClick={finish}>
                    Done
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
};
