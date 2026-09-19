import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ShieldCheck, Lock, Scale } from 'lucide-react';
import { Wordmark } from './Logo';

type Tab = 'home' | 'search' | 'tickets' | 'operator' | 'transactions';

interface FooterProps {
  onNavigate: (tab: Tab) => void;
  onJump: (id: string) => void;
  onOpenAwsModal: () => void;
  isOperator: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onJump, onOpenAwsModal, isOperator }) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const wordY = useTransform(scrollYProgress, [0, 1], ['38%', '0%']);

  const cols: Array<{ title: string; links: Array<{ label: string; onClick: () => void }> }> = [
    {
      title: 'Travel',
      links: [
        { label: 'Find a seat', onClick: () => onNavigate('search') },
        { label: 'My journeys', onClick: () => onNavigate('tickets') },
        { label: 'Release a seat', onClick: () => onNavigate('tickets') },
      ],
    },
    {
      title: 'How it works',
      links: [
        { label: 'The relay, stop by stop', onClick: () => onJump('relay') },
        { label: 'Cancel or relay', onClick: () => onJump('money') },
        { label: 'Questions', onClick: () => onJump('faq') },
      ],
    },
    {
      title: 'Operators',
      links: [
        ...(isOperator ? [{ label: 'Dispatch console', onClick: () => onNavigate('operator') }] : []),
        { label: 'Resale ledger', onClick: () => onNavigate('transactions') },
        { label: 'Reference architecture', onClick: onOpenAwsModal },
      ],
    },
  ];

  return (
    <footer ref={ref} className="relative mt-24 overflow-hidden bg-coach text-coachink">
      <div className="mx-auto max-w-[1320px] px-5 pb-10 pt-20 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Wordmark size={36} tone="light" />
            <p className="mt-6 text-[1.0625rem] leading-relaxed text-coachink/80">
              Operator-authorised seat transfer for intercity coaches. The fare stays exact, the name on the ticket stays true.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                { icon: <Scale />, label: 'Face value only' },
                { icon: <Lock />, label: 'ID masked from sellers' },
                { icon: <ShieldCheck />, label: 'DPDP Act 2023 aware' },
              ].map((b) => (
                <span key={b.label} className="inline-flex h-8 items-center gap-2 rounded-full border border-coachink/20 px-3 text-[0.8125rem] font-medium text-coachink/85">
                  {React.cloneElement(b.icon, { className: 'h-3.5 w-3.5', strokeWidth: 1.75 })}
                  {b.label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.title}>
                <p className="kicker text-marigold">{c.title}</p>
                <ul className="mt-5 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <button
                        onClick={l.onClick}
                        className="group relative text-left text-[0.9375rem] text-coachink/80 transition-colors hover:text-coachink"
                      >
                        {l.label}
                        <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-marigold transition-transform duration-300 ease-out group-hover:scale-x-100" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-coachink/15 pt-6 text-[0.8125rem] text-coachink/65 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} SeatRelay. Built for First Commit, Bharat Builds Tour (WeMakeDevs × AWS).</p>
          <p>Demo data throughout. The operator system is simulated.</p>
        </div>
      </div>

      <div className="pointer-events-none select-none overflow-hidden" aria-hidden>
        <motion.p
          style={{ y: wordY, fontStretch: '112%' }}
          className="-mb-[0.2em] whitespace-nowrap text-center text-[15.5vw] font-black leading-[0.8] tracking-[-0.045em] text-coachink/[0.07]"
        >
          SeatRelay
        </motion.p>
      </div>
    </footer>
  );
};
