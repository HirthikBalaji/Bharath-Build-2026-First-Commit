import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cx, EASE_OUT } from './ui';

export type RelayPhase = 'booked' | 'released' | 'claimed' | 'reissued';

/*
  Upper deck of a 2+1 sleeper coach seen from above, front to the right.
  Row A holds single berths, rows B and C the doubles across the aisle.
  Numbering follows the seeded coach: U1 to U12, rear to front.
*/
const ROWS = [
  { y: 52, seats: ['U1', 'U2', 'U3', 'U4'] },
  { y: 164, seats: ['U5', 'U6', 'U7', 'U8'] },
  { y: 232, seats: ['U9', 'U10', 'U11', 'U12'] },
];
const BERTH_W = 223;
const BERTH_H = 60;
const GAP = 16;
const X0 = 76;

interface DeckPlanProps {
  phase: RelayPhase;
  focusSeat?: string;
  nameFrom?: string;
  nameTo?: string;
  className?: string;
  /** Shows passenger initials on booked berths */
  showOthers?: boolean;
  title?: string;
}

const OTHER_NAMES: Record<string, string> = {
  U1: 'A. IYER', U2: 'M. KHAN', U3: 'S. RAO', U4: 'D. PATEL', U5: 'K. NAIR', U6: 'R. DAS',
  U7: 'T. JOSHI', U8: 'P. MENON', U9: 'L. REDDY', U10: 'V. SINGH', U11: 'N. BOSE',
};

export const DeckPlan: React.FC<DeckPlanProps> = ({
  phase,
  focusSeat = 'U12',
  nameFrom = 'RAHUL SHARMA',
  nameTo = 'PRIYA KUMAR',
  className,
  showOthers = true,
  title = 'Upper deck of a sleeper coach. Berth U12 changes hands.',
}) => {
  const lit = phase === 'released' || phase === 'claimed';
  return (
    <svg viewBox="0 0 1200 330" className={cx('h-auto w-full', className)} role="img" aria-label={title}>
      <defs>
        <radialGradient id="lamp" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--marigold))" stopOpacity="0.55" />
          <stop offset="60%" stopColor="rgb(var(--marigold))" stopOpacity="0.12" />
          <stop offset="100%" stopColor="rgb(var(--marigold))" stopOpacity="0" />
        </radialGradient>
        <clipPath id="deck-body">
          <rect x="40" y="28" width="1086" height="276" rx="38" />
        </clipPath>
      </defs>

      {/* wheels peeking out below the skirt */}
      {[150, 260, 910].map((x) => (
        <g key={x}>
          <rect x={x} y="20" width="70" height="12" rx="4" fill="rgb(var(--ink) / 0.8)" />
          <rect x={x} y="300" width="70" height="12" rx="4" fill="rgb(var(--ink) / 0.8)" />
        </g>
      ))}
      {/* mirrors */}
      <path d="M1112 40 q 26 -2 30 -22" stroke="rgb(var(--ink-3))" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M1112 292 q 26 2 30 22" stroke="rgb(var(--ink-3))" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="1134" y="6" width="14" height="22" rx="4" fill="rgb(var(--ink-3))" />
      <rect x="1134" y="304" width="14" height="22" rx="4" fill="rgb(var(--ink-3))" />

      {/* body */}
      <rect x="40" y="28" width="1086" height="276" rx="38" fill="rgb(var(--surface))" stroke="rgb(var(--line-strong))" strokeWidth="2" />
      <g clipPath="url(#deck-body)">
        {/* windscreen */}
        <path d="M1060 28 C 1100 60, 1100 272, 1060 304 L 1126 304 L 1126 28 Z" fill="rgb(var(--coach))" />
        <path d="M1068 44 C 1098 80, 1098 252, 1068 288" stroke="rgb(var(--coach-ink) / 0.35)" strokeWidth="2" fill="none" />
        {/* rear window band */}
        <rect x="40" y="28" width="16" height="276" fill="rgb(var(--surface-2))" />
      </g>

      {/* aisle */}
      <rect x="66" y="122" width="970" height="32" rx="8" fill="rgb(var(--surface-2))" />
      <line x1="84" y1="138" x2="1020" y2="138" stroke="rgb(var(--line-strong))" strokeWidth="2" strokeDasharray="10 12" />
      <text x="1030" y="170" className="code" fontSize="11" fill="rgb(var(--coach-ink))" transform="rotate(90 1030 170)" letterSpacing="3">
        FRONT
      </text>

      {ROWS.map((row) =>
        row.seats.map((seat, i) => {
          const x = X0 + i * (BERTH_W + GAP);
          const y = row.y;
          const isFocus = seat === focusSeat;
          return (
            <g key={seat}>
              {isFocus && (
                <motion.ellipse
                  cx={x + BERTH_W / 2}
                  cy={y + BERTH_H / 2}
                  rx={230}
                  ry={120}
                  fill="url(#lamp)"
                  initial={false}
                  animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.6 }}
                  transition={{ duration: 0.9, ease: EASE_OUT }}
                  style={{ transformOrigin: `${x + BERTH_W / 2}px ${y + BERTH_H / 2}px` }}
                />
              )}
              <rect
                x={x}
                y={y}
                width={BERTH_W}
                height={BERTH_H}
                rx="11"
                fill="rgb(var(--surface-2))"
                stroke="rgb(var(--line-strong))"
                strokeWidth="1.5"
              />
              <rect x={x + BERTH_W - 42} y={y + 10} width="28" height={BERTH_H - 20} rx="7" fill="rgb(var(--line-strong) / 0.7)" />

              {isFocus && (
                <>
                  <motion.rect
                    x={x}
                    y={y}
                    width={BERTH_W}
                    height={BERTH_H}
                    rx="11"
                    fill="rgb(var(--marigold))"
                    initial={false}
                    animate={{ opacity: lit ? 1 : 0 }}
                    transition={{ duration: 0.45 }}
                  />
                  <motion.rect
                    x={x}
                    y={y}
                    width={BERTH_W}
                    height={BERTH_H}
                    rx="11"
                    fill="rgb(var(--coach))"
                    initial={false}
                    animate={{ opacity: phase === 'reissued' ? 1 : 0 }}
                    transition={{ duration: 0.6 }}
                  />
                  <motion.rect
                    x={x - 7}
                    y={y - 7}
                    width={BERTH_W + 14}
                    height={BERTH_H + 14}
                    rx="16"
                    fill="none"
                    stroke="rgb(var(--coach))"
                    strokeWidth="2.5"
                    strokeDasharray="8 7"
                    className="animate-dash"
                    initial={false}
                    animate={{ opacity: phase === 'claimed' ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <rect
                    x={x + BERTH_W - 42}
                    y={y + 10}
                    width="28"
                    height={BERTH_H - 20}
                    rx="7"
                    fill={phase === 'reissued' ? 'rgb(var(--coach-ink) / 0.35)' : lit ? 'rgb(var(--marigold-ink) / 0.22)' : 'rgb(var(--line-strong) / 0.7)'}
                    style={{ transition: 'fill 400ms' }}
                  />
                </>
              )}

              <text
                x={x + 18}
                y={y + 25}
                className="code"
                fontSize="14"
                fontWeight="600"
                fill={isFocus && phase === 'reissued' ? 'rgb(var(--coach-ink))' : isFocus && lit ? 'rgb(var(--marigold-ink))' : 'rgb(var(--ink-3))'}
                style={{ transition: 'fill 400ms' }}
              >
                {seat}
              </text>

              {isFocus ? (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.text
                    key={phase === 'reissued' ? 'to' : 'from'}
                    x={x + 18}
                    y={y + 45}
                    className="code"
                    fontSize="11.5"
                    letterSpacing="0.5"
                    fill={phase === 'reissued' ? 'rgb(var(--coach-ink))' : lit ? 'rgb(var(--marigold-ink))' : 'rgb(var(--ink-2))'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                  >
                    {phase === 'reissued' ? nameTo : phase === 'booked' ? nameFrom : 'RELEASED'}
                  </motion.text>
                </AnimatePresence>
              ) : (
                showOthers && (
                  <text x={x + 18} y={y + 45} className="code" fontSize="11" fill="rgb(var(--ink-3) / 0.7)">
                    {OTHER_NAMES[seat]}
                  </text>
                )
              )}

              {isFocus && phase === 'reissued' && (
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.25 }}
                  style={{ transformOrigin: `${x + BERTH_W - 70}px ${y + BERTH_H / 2}px` }}
                >
                  <circle cx={x + BERTH_W - 70} cy={y + BERTH_H / 2} r="11" fill="rgb(var(--marigold))" />
                  <path
                    d={`M${x + BERTH_W - 75} ${y + BERTH_H / 2} l3.5 3.5 l6.5 -7`}
                    stroke="rgb(var(--marigold-ink))"
                    strokeWidth="2.4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.g>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
};

/* ----------------------------------------------------------------------------
   The manifest slip: the paper record of berth U12, rewritten by the operator.
---------------------------------------------------------------------------- */
const STEPS: Array<{ key: RelayPhase; label: string }> = [
  { key: 'booked', label: 'Booked' },
  { key: 'released', label: 'Released' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'reissued', label: 'Reissued' },
];

export const ManifestSlip: React.FC<{ phase: RelayPhase; className?: string }> = ({ phase, className }) => {
  const idx = STEPS.findIndex((s) => s.key === phase);
  const reissued = phase === 'reissued';
  return (
    <div className={cx('relative overflow-hidden rounded-2xl border border-line bg-surface shadow-float', className)}>
      <div className="flex items-center justify-between bg-coach px-5 py-3.5 text-coachink">
        <div>
          <p className="kicker opacity-80">Passenger manifest</p>
          <p className="mt-1 text-[0.9375rem] font-semibold">SwiftBus Express · KA-01-F-8899</p>
        </div>
        <div className="text-right">
          <p className="code whitespace-nowrap text-[0.6875rem] opacity-80">BLR → MAA</p>
          <p className="code mt-1 text-sm font-semibold">22:30</p>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-ink3">Berth</p>
            <p className="code mt-1 text-2xl font-semibold text-ink">U12</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-ink3">Fare</p>
            <p className="num mt-1 text-2xl font-bold text-ink">₹850</p>
          </div>
        </div>

        <div className="relative rounded-xl bg-surface2 px-4 py-3">
      {/* operator stamp */}
      <AnimatePresence>
        {reissued && (
          <motion.div
            className="pointer-events-none absolute right-3 top-2.5 rotate-[-8deg] bg-surface2 rounded-md border-2 border-accent px-2 py-1 text-accent"
            initial={{ opacity: 0, scale: 1.8 }}
            animate={{ opacity: 0.9, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 22, delay: 0.35 }}
          >
            <p className="kicker leading-none">Reissued</p>
            <p className="code mt-0.5 text-[0.5625rem] leading-none">SWIFTBUS OPS</p>
          </motion.div>
        )}
      </AnimatePresence>
          <p className="text-xs font-medium text-ink3">Name on the ticket</p>
          <div className="relative mt-1.5 h-7">
            <AnimatePresence mode="popLayout" initial={false}>
              {!reissued ? (
                <motion.p
                  key="from"
                  className="absolute inset-0 flex items-center text-lg font-semibold text-ink"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: phase === 'claimed' ? 0.55 : 1, y: 0 }}
                  exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
                  transition={{ duration: 0.45, ease: EASE_OUT }}
                >
                  <span className="relative">
                    Rahul Sharma
                    <motion.span
                      className="absolute left-0 top-1/2 h-[2px] w-full origin-left bg-danger"
                      initial={false}
                      animate={{ scaleX: phase === 'claimed' ? 1 : 0 }}
                      transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.3 }}
                    />
                  </span>
                </motion.p>
              ) : (
                <motion.p
                  key="to"
                  className="absolute inset-0 flex items-center gap-2 text-lg font-semibold text-accent"
                  initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: EASE_OUT }}
                >
                  Priya Kumar
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-ink3">
            <span className="code">{reissued ? 'SR-48213' : 'SB-92831'}</span>
            <span>{reissued ? 'ID verified by operator' : phase === 'claimed' ? 'Awaiting operator' : 'Original booking'}</span>
          </div>
        </div>

        <ol className="grid grid-cols-4 gap-1.5" aria-label="Transfer progress">
          {STEPS.map((s, i) => (
            <li key={s.key} className="space-y-1.5">
              <span className="block h-1 overflow-hidden rounded-full bg-surface2">
                <motion.span
                  className={cx('block h-full origin-left rounded-full', i === 1 || i === 2 ? 'bg-marigold' : 'bg-coach dark:bg-accent')}
                  initial={false}
                  animate={{ scaleX: i <= idx ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                />
              </span>
              <span className={cx('block text-[0.6875rem] font-semibold', i <= idx ? 'text-ink' : 'text-ink3')}>{s.label}</span>
            </li>
          ))}
        </ol>

        <AnimatePresence>
          {reissued && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between border-t border-dashed border-linestrong pt-3 text-sm">
                <span className="text-ink2">Returned to Rahul</span>
                <span className="num font-bold text-accent">₹850</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
