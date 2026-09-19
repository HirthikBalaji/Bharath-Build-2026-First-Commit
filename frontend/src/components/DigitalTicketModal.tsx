import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Printer, QrCode as QrCodeIcon, BadgeCheck } from 'lucide-react';
import { Ticket } from '../types';
import { cityCode, duration, formatDate, formatTime, inr, seatTypeLabel } from '../lib/format';
import { Button, Modal } from './ui';

interface DigitalTicketModalProps {
  ticket: Ticket;
  onClose: () => void;
}

export const DigitalTicketModal: React.FC<DigitalTicketModalProps> = ({ ticket, onClose }) => {
  const reissued = ticket.ticketNumber?.startsWith('SR-');
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [5, -5]), { stiffness: 180, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-6, 6]), { stiffness: 180, damping: 20 });
  const sheen = useTransform(px, [0, 1], ['-30%', '130%']);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <Modal open onClose={onClose} label="Boarding pass" size="sm" className="!border-0 !bg-transparent !shadow-none" hideClose>
      <div className="px-2 pb-2 pt-2 [perspective:1400px] sm:px-0">
        <motion.div
          ref={ref}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
          className="print-area relative overflow-hidden rounded-2xl bg-surface shadow-float"
        >
          {/* foil sheen */}
          <motion.div
            className="pointer-events-none absolute inset-y-0 z-20 w-1/3 -skew-x-12 opacity-40 mix-blend-soft-light"
            style={{ left: sheen, background: 'linear-gradient(90deg, transparent, rgb(255 255 255 / 0.9), transparent)' }}
          />

          <div className="bg-coach px-6 pb-5 pt-6 text-coachink">
            <div className="flex items-center justify-between">
              <p className="kicker opacity-80">Boarding pass</p>
              {reissued && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-marigold px-2.5 py-1 text-[0.6875rem] font-bold text-marigoldink">
                  <BadgeCheck className="h-3.5 w-3.5" /> Reissued by operator
                </span>
              )}
            </div>
            <p className="mt-2 text-lg font-semibold">{ticket.operatorName}</p>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="display text-[3rem] leading-none">{cityCode(ticket.routeFrom)}</p>
                <p className="mt-1 text-sm text-coachink/75">{ticket.routeFrom}</p>
              </div>
              <div className="mb-3 flex flex-1 flex-col items-center px-3 text-coachink/70">
                <span className="whitespace-nowrap text-xs">{duration(ticket.departureTime, ticket.arrivalTime)}</span>
                <span className="mt-1 h-px w-full bg-coachink/30" />
              </div>
              <div className="text-right">
                <p className="display text-[3rem] leading-none">{cityCode(ticket.routeTo)}</p>
                <p className="mt-1 text-sm text-coachink/75">{ticket.routeTo}</p>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-x-4 gap-y-5 px-6 py-6 text-sm">
            <div className="col-span-2">
              <dt className="text-xs text-ink3">Passenger</dt>
              <dd className="mt-0.5 text-lg font-semibold text-ink">{ticket.passengerName}</dd>
              <dd className="text-xs text-ink3">{ticket.passengerGender}, {ticket.passengerAge}</dd>
            </div>
            <div className="text-right">
              <dt className="text-xs text-ink3">Berth</dt>
              <dd className="code mt-0.5 text-[1.75rem] font-semibold leading-tight text-accent">{ticket.seatNumber}</dd>
              <dd className="text-xs text-ink3">{seatTypeLabel(ticket.seatType)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink3">Date</dt>
              <dd className="mt-0.5 font-semibold text-ink">{formatDate(ticket.travelDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink3">Departs</dt>
              <dd className="num mt-0.5 font-semibold text-ink">{formatTime(ticket.departureTime)}</dd>
            </div>
            <div className="text-right">
              <dt className="text-xs text-ink3">Fare</dt>
              <dd className="num mt-0.5 font-semibold text-ink">{inr(ticket.fare)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-ink3">Ticket</dt>
              <dd className="code mt-0.5 text-ink">{ticket.ticketNumber}</dd>
            </div>
            <div className="text-right">
              <dt className="text-xs text-ink3">Coach</dt>
              <dd className="code mt-0.5 whitespace-nowrap text-[0.6875rem] text-ink2">{ticket.busNumber}</dd>
            </div>
          </dl>

          {/* tear line */}
          <div className="relative h-6">
            <span className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-[rgb(6_12_10/0.55)]" />
            <span className="absolute -right-3 top-0 h-6 w-6 rounded-full bg-[rgb(6_12_10/0.55)]" />
            <span className="absolute inset-x-5 top-1/2 border-t-2 border-dashed border-line" />
          </div>

          <div className="flex items-center gap-5 px-6 pb-6 pt-3">
            <div className="rounded-xl bg-white p-2.5 shadow-lift">
              {ticket.qrCode ? (
                <img src={ticket.qrCode} alt={`Boarding QR code for ticket ${ticket.ticketNumber}`} className="h-32 w-32" />
              ) : (
                <div className="grid h-32 w-32 place-items-center text-slate-400">
                  <QrCodeIcon className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="text-sm">
              <p className="font-semibold text-ink">Show this at boarding</p>
              <p className="mt-1 leading-snug text-ink2">with the government ID in {ticket.passengerName.split(' ')[0]}'s name.</p>
              {reissued && <p className="mt-2 text-xs text-ink3">The previous ticket for this berth has been cancelled.</p>}
            </div>
          </div>
        </motion.div>

        <div className="mt-4 flex justify-center gap-2">
          <Button variant="inverse" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
