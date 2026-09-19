import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, QrCode } from 'lucide-react';
import { Ticket } from '../types';
import { inr } from '../lib/format';
import { BerthGlyph, Button, EASE_OUT, Modal } from './ui';

interface DemoProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRunning: boolean;
  steps: Array<{ step: number; title: string; detail: string; timestamp: string }>;
  newTicket: Ticket | null;
  onViewTicket: (ticket: Ticket) => void;
}

export const DemoProgressModal: React.FC<DemoProgressModalProps> = ({ isOpen, onClose, isRunning, steps, newTicket, onViewTicket }) => (
  <Modal open={isOpen} onClose={onClose} label="Live walkthrough" size="lg">
    <div className="bg-coach px-7 pb-7 pt-8 text-coachink sm:px-9">
      <p className="kicker opacity-75">Live walkthrough</p>
      <h2 className="display-md mt-3 pr-8 text-[1.875rem]">One berth, end to end.</h2>
      <p className="mt-2 max-w-lg text-coachink/75">Rahul releases, Priya claims, SwiftBus reissues, the refund goes out. Every step below is a real state change in the demo backend.</p>

      <div className="relative mt-7 h-7">
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-coachink/20" />
        <motion.div
          className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-marigold"
          initial={{ width: '0%' }}
          animate={{ width: isRunning ? ['0%', '88%'] : '100%' }}
          transition={isRunning ? { duration: 6, ease: 'easeOut' } : { duration: 0.6, ease: EASE_OUT }}
        />
        <motion.div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ left: '0%' }}
          animate={{ left: isRunning ? ['0%', '88%'] : '100%' }}
          transition={isRunning ? { duration: 6, ease: 'easeOut' } : { duration: 0.6, ease: EASE_OUT }}
        >
          <BerthGlyph className="h-5 w-9" state="relay" />
        </motion.div>
      </div>
    </div>

    <div className="max-h-[52vh] overflow-y-auto px-7 py-7 sm:px-9" data-lenis-prevent>
      <ol className="relative space-y-5 border-l border-line pl-7">
        <AnimatePresence>
          {steps.map((s, i) => (
            <motion.li
              key={`${s.step}-${i}`}
              initial={{ opacity: 0, x: -12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: EASE_OUT }}
              className="relative"
            >
              <motion.span
                className="absolute -left-[2.35rem] top-0.5 grid h-5 w-5 place-items-center rounded-full bg-coach text-coachink dark:bg-accent dark:text-[rgb(var(--bg))]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22, delay: i * 0.12 + 0.1 }}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </motion.span>
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-semibold text-ink">{s.title}</p>
                <span className="code flex-shrink-0 text-[0.6875rem] text-ink3">{new Date(s.timestamp).toLocaleTimeString('en-GB')}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink2">{s.detail}</p>
            </motion.li>
          ))}
        </AnimatePresence>
        {isRunning && (
          <li className="relative">
            <span className="absolute -left-[2.35rem] top-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-marigold bg-surface">
              <span className="h-2 w-2 animate-ping rounded-full bg-marigold" />
            </span>
            <p className="text-sm text-ink2">Running the next step…</p>
          </li>
        )}
      </ol>

      {!isRunning && newTicket && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: steps.length * 0.12 + 0.2, ease: EASE_OUT }}
          className="mt-8 rounded-2xl border border-coach/30 bg-coach/[0.05] p-5 dark:border-accent/30"
        >
          <p className="font-semibold text-ink">Transfer complete.</p>
          <p className="mt-1 text-sm text-ink2">
            {newTicket.passengerName} now holds ticket <span className="code text-ink">{newTicket.ticketNumber}</span> for berth {newTicket.seatNumber}. The seller's {inr(newTicket.fare)} refund has been released.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => onViewTicket(newTicket)}>
              <QrCode className="h-4 w-4" />
              View the new boarding pass
            </Button>
            <Button variant="quiet" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  </Modal>
);
