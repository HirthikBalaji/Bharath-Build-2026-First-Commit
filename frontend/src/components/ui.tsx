import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { lockScroll, unlockScroll } from '../lib/scroll';

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_INOUT = [0.65, 0, 0.35, 1] as const;

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');
export { cx };

/* ----------------------------------------------------------------------------
   Buttons
---------------------------------------------------------------------------- */
type Variant = 'primary' | 'accent' | 'ghost' | 'quiet' | 'danger' | 'inverse' | 'onMarigold' | 'onMarigoldGhost';
type Size = 'sm' | 'md' | 'lg';

const variantClass: Record<Variant, string> = {
  primary: 'bg-coach text-coachink hover:bg-coach2 shadow-lift',
  accent: 'bg-marigold text-marigoldink hover:brightness-105 shadow-lift',
  ghost: 'border border-linestrong text-ink hover:border-ink3 hover:bg-surface2/60',
  quiet: 'text-ink2 hover:text-ink hover:bg-surface2',
  danger: 'bg-danger text-white hover:brightness-110',
  inverse: 'bg-coachink text-coach hover:bg-white',
  onMarigold: 'bg-[rgb(28_19_3)] text-[rgb(255_236_200)] hover:bg-[rgb(52_37_9)] shadow-lift',
  onMarigoldGhost: 'border border-[rgb(28_19_3/0.35)] text-marigoldink hover:border-[rgb(28_19_3/0.7)] hover:bg-[rgb(28_19_3/0.06)]',
};
const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[0.8125rem] gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-[0.9375rem] gap-2 rounded-[10px]',
  lg: 'h-[3.25rem] px-6 text-base gap-2.5 rounded-xl',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  magnetic?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', magnetic, loading, className, children, disabled, ...rest }, ref) => {
    const reduce = useReducedMotion();
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const x = useSpring(mx, { stiffness: 260, damping: 18, mass: 0.4 });
    const y = useSpring(my, { stiffness: 260, damping: 18, mass: 0.4 });

    const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!magnetic || reduce) return;
      const r = e.currentTarget.getBoundingClientRect();
      mx.set((e.clientX - (r.left + r.width / 2)) * 0.22);
      my.set((e.clientY - (r.top + r.height / 2)) * 0.3);
    };
    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };

    return (
      <motion.button
        ref={ref}
        style={magnetic ? { x, y } : undefined}
        whileTap={{ scale: 0.97 }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        disabled={disabled || loading}
        className={cx(
          'relative inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-[background-color,border-color,color,filter,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-50',
          variantClass[variant],
          sizeClass[size],
          className
        )}
        {...(rest as any)}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
        )}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

/* ----------------------------------------------------------------------------
   Text that arrives word by word from behind a mask, and leaves the same way.
---------------------------------------------------------------------------- */
interface RevealProps {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  delay?: number;
  once?: boolean;
  stagger?: number;
  /** Words (by index) rendered with emphasis colour */
  accentWords?: number[];
  accentClass?: string;
}

export const RevealText: React.FC<RevealProps> = ({
  text,
  as = 'h2',
  className,
  delay = 0,
  once = false,
  stagger = 0.055,
  accentWords = [],
  accentClass = 'text-accent',
}) => {
  const reduce = useReducedMotion();
  const Tag = motion[as as 'h2'];
  const lines = text.split('\n');
  let index = -1;

  return (
    <Tag
      className={className}
      initial={reduce ? false : 'hidden'}
      whileInView="shown"
      viewport={{ once, amount: 0.6, margin: '0px 0px -8% 0px' }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={text.replace(/\n/g, ' ')}
    >
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden>
          {line.split(' ').map((word, wi) => {
            index += 1;
            const i = index;
            return (
              <span key={wi} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  className={cx('inline-block will-change-transform', accentWords.includes(i) && accentClass)}
                  variants={{
                    hidden: { y: '108%', rotate: 3, opacity: 0 },
                    shown: { y: '0%', rotate: 0, opacity: 1, transition: { duration: 0.9, ease: EASE_OUT } },
                  }}
                >
                  {word}
                  {wi < line.split(' ').length - 1 ? ' ' : ''}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
};

/** Paragraph-level fade that de-blurs into place. */
export const Rise: React.FC<{ children: React.ReactNode; delay?: number; className?: string; once?: boolean; y?: number }> = ({
  children,
  delay = 0,
  className,
  once = true,
  y = 18,
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, amount: 0.3 }}
      transition={{ duration: 0.8, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
};

/* ----------------------------------------------------------------------------
   Modal shell
---------------------------------------------------------------------------- */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label: string;
  hideClose?: boolean;
  className?: string;
}

const modalWidth = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

export const Modal: React.FC<ModalProps> = ({ open, onClose, children, size = 'md', label, hideClose, className }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    lockScroll();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      unlockScroll();
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          aria-describedby={titleId}
        >
          <motion.div
            className="absolute inset-0 bg-[rgb(6_12_10/0.55)] backdrop-blur-[6px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            data-lenis-prevent
            className={cx(
              'relative max-h-[94vh] w-full overflow-y-auto overscroll-contain rounded-t-2xl border border-line bg-surface shadow-float sm:rounded-2xl',
              modalWidth[size],
              className
            )}
            initial={{ opacity: 0, y: 40, scale: 0.97, clipPath: 'inset(8% 4% 8% 4% round 16px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, clipPath: 'inset(0% 0% 0% 0% round 16px)' }}
            exit={{ opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.2, ease: EASE_INOUT } }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
          >
            <span id={titleId} className="sr-only">
              {label}
            </span>
            {!hideClose && (
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full text-current opacity-70 transition hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/* ----------------------------------------------------------------------------
   Status pill
---------------------------------------------------------------------------- */
type PillTone = 'coach' | 'marigold' | 'danger' | 'neutral' | 'success';
const pillTone: Record<PillTone, string> = {
  coach: 'bg-coach/10 text-accent ring-1 ring-inset ring-coach/20 dark:bg-accent/10 dark:ring-accent/25',
  success: 'bg-success/10 text-success ring-1 ring-inset ring-success/25',
  marigold: 'bg-marigold/15 text-[rgb(122_78_0)] ring-1 ring-inset ring-marigold/40 dark:text-marigold',
  danger: 'bg-danger/10 text-danger ring-1 ring-inset ring-danger/25',
  neutral: 'bg-surface2 text-ink2 ring-1 ring-inset ring-line',
};

export const Pill: React.FC<{ tone?: PillTone; children: React.ReactNode; dot?: boolean; className?: string }> = ({
  tone = 'neutral',
  children,
  dot,
  className,
}) => (
  <span
    className={cx(
      'inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[0.75rem] font-semibold',
      pillTone[tone],
      className
    )}
  >
    {dot && (
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
    )}
    {children}
  </span>
);

/* ----------------------------------------------------------------------------
   Segmented control with a sliding thumb
---------------------------------------------------------------------------- */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  id,
  className,
}: {
  value: T;
  onChange: (v: NoInfer<T>) => void;
  options: Array<{ value: NoInfer<T>; label: React.ReactNode }>;
  id: string;
  className?: string;
}) {
  return (
    <div role="tablist" className={cx('inline-flex rounded-xl border border-line bg-surface p-1', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative h-9 whitespace-nowrap rounded-lg px-3.5 text-[0.8125rem] font-semibold transition-colors',
              active ? 'text-coachink' : 'text-ink2 hover:text-ink'
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-coach"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Berth glyph: a sleeper berth seen from above, pillow at the head end.
---------------------------------------------------------------------------- */
export const BerthGlyph: React.FC<{ className?: string; state?: 'booked' | 'relay' | 'held' | 'open' }> = ({
  className = 'h-5 w-9',
  state = 'relay',
}) => {
  const fill =
    state === 'relay'
      ? 'rgb(var(--marigold))'
      : state === 'held'
      ? 'rgb(var(--coach))'
      : state === 'booked'
      ? 'rgb(var(--surface-2))'
      : 'transparent';
  const stroke = state === 'relay' ? 'rgb(var(--marigold))' : state === 'held' ? 'rgb(var(--coach))' : 'rgb(var(--line-strong))';
  const pillow = state === 'relay' ? 'rgb(var(--marigold-ink) / 0.35)' : state === 'held' ? 'rgb(var(--coach-ink) / 0.5)' : 'rgb(var(--line-strong))';
  return (
    <svg viewBox="0 0 36 20" className={className} aria-hidden>
      <rect x="1" y="1" width="34" height="18" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <rect x="26" y="4.5" width="6" height="11" rx="2" fill={pillow} />
    </svg>
  );
};

/* ----------------------------------------------------------------------------
   Empty and loading states
---------------------------------------------------------------------------- */
export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; body?: React.ReactNode; action?: React.ReactNode }> = ({
  icon,
  title,
  body,
  action,
}) => (
  <div className="flex flex-col items-center rounded-2xl border border-dashed border-linestrong px-6 py-16 text-center">
    {icon && <div className="mb-5 text-ink3">{icon}</div>}
    <p className="display-md text-xl text-ink">{title}</p>
    {body && <div className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-ink2">{body}</div>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export const PageHeader: React.FC<{
  kicker?: string;
  title: string;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ kicker, title, lede, actions }) => (
  <div className="flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
    <div className="max-w-2xl">
      {kicker && <p className="kicker mb-4 text-accent">{kicker}</p>}
      <RevealText as="h1" text={title} className="display text-[2.5rem] text-ink sm:text-[3.25rem]" once />
      {lede && (
        <Rise delay={0.2}>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink2">{lede}</p>
        </Rise>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

/** Count up to a value when scrolled into view. */
export const CountUp: React.FC<{ value: number; prefix?: string; className?: string; duration?: number }> = ({
  value,
  prefix = '',
  className,
  duration = 1.2,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(false);
  const current = useRef(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = (n: number) => `${prefix}${Math.round(n).toLocaleString('en-IN')}`;
    let raf = 0;
    const run = () => {
      if (reduce) {
        el.textContent = fmt(value);
        current.current = value;
        return;
      }
      const from = current.current;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / (duration * 1000));
        const v = from + (value - from) * (1 - Math.pow(1 - p, 4));
        el.textContent = fmt(v);
        current.current = v;
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    // After the first reveal, later changes animate from the current figure.
    if (shown.current) {
      run();
      return () => cancelAnimationFrame(raf);
    }
    el.textContent = fmt(current.current);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        shown.current = true;
        run();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, prefix, duration, reduce]);
  // Text is owned by the effect so React never fights the animation.
  return <span ref={ref} className={cx('num', className)} aria-label={`${prefix}${Math.round(value).toLocaleString('en-IN')}`} />;
};
