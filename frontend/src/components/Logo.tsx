import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/** The SeatRelay mark: a coach seen head-on carrying the relay arrows. */
export const Logo: React.FC<LogoProps> = ({ className = '', size = 36 }) => (
  <span
    className={`relative inline-flex flex-shrink-0 items-center justify-center rounded-[28%] bg-coach ${className}`}
    style={{ width: size, height: size }}
    aria-hidden
  >
    <svg viewBox="0 0 100 100" fill="none" className="h-[78%] w-[78%]">
      <rect x="22" y="14" width="56" height="68" rx="13" fill="rgb(var(--coach-ink))" />
      <path d="M29 23c0-3.3 2.7-6 6-6h30c3.3 0 6 2.7 6 6v16H29V23z" fill="rgb(var(--coach))" />
      <circle cx="50" cy="56" r="14" fill="rgb(var(--marigold))" />
      <path d="M43 53h14m0 0-3.5-3.5M57 53l-3.5 3.5" stroke="rgb(var(--marigold-ink))" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M57 60H43m0 0 3.5-3.5M43 60l3.5 3.5" stroke="rgb(var(--marigold-ink))" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="33" cy="74" r="3.2" fill="rgb(var(--coach))" />
      <circle cx="67" cy="74" r="3.2" fill="rgb(var(--coach))" />
      <rect x="27" y="81" width="8" height="7" rx="2" fill="rgb(var(--coach-ink))" />
      <rect x="65" y="81" width="8" height="7" rx="2" fill="rgb(var(--coach-ink))" />
    </svg>
  </span>
);

export const Wordmark: React.FC<{ className?: string; size?: number; tone?: 'ink' | 'light' }> = ({
  className = '',
  size = 34,
  tone = 'ink',
}) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <Logo size={size} className={tone === 'light' ? 'ring-1 ring-inset ring-coachink/25' : ''} />
    <span
      className={`text-[1.2rem] font-extrabold tracking-[-0.02em] ${tone === 'light' ? 'text-coachink' : 'text-ink'}`}
      style={{ fontStretch: '118%' }}
    >
      SeatRelay
    </span>
  </span>
);
