import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  Search,
  Check,
  ShieldCheck,
  Lock,
  Plus,
  Globe,
  KeyRound,
  Workflow,
  Cpu,
  Database,
  CalendarClock,
  BellRing,
  HardDrive,
  Server,
  ArrowUpRight,
  Building2,
} from 'lucide-react';
import { User } from '../types';
import { DeckPlan, ManifestSlip, RelayPhase } from './DeckPlan';
import { HeroScene } from './HeroScene';
import { BerthGlyph, Button, cx, EASE_OUT, Pill, RevealText, Rise } from './ui';

interface HomePageProps {
  onSearchClick: () => void;
  onViewTicketsClick: () => void;
  onOperatorClick: () => void;
  onRunDemo: () => void;
  isDemoRunning: boolean;
  currentUser: User | null;
  onSelectRole: (role: string, tab: string) => void;
  onOpenAwsModal: () => void;
}

const useIsDesktop = () => {
  const [is, setIs] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => setIs(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return is;
};

const Container: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cx('mx-auto w-full max-w-[1320px] px-5 sm:px-8', className)}>{children}</div>
);

/* ============================================================================
   HERO: the coach, and one berth changing hands
============================================================================ */
const PHASES: Array<[RelayPhase, number]> = [
  ['booked', 1400],
  ['released', 2600],
  ['claimed', 2600],
  ['reissued', 3800],
];

const useRelayLoop = (active: boolean) => {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<RelayPhase>(reduce ? 'reissued' : 'booked');
  useEffect(() => {
    if (reduce || !active) return;
    let i = PHASES.findIndex(([p]) => p === phase);
    let t: number;
    const step = () => {
      t = window.setTimeout(() => {
        i = (i + 1) % PHASES.length;
        setPhase(PHASES[i][0]);
        step();
      }, PHASES[i][1]);
    };
    step();
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduce]);
  return phase;
};

const Hero: React.FC<{ onSearch: () => void; onRelease: () => void; phase: RelayPhase }> = ({ onSearch, onRelease, phase }) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const isDesktop = useIsDesktop();
  // The words drift up and fade only on desktop; on a phone the hero is taller than the screen and must stay readable.
  const textY = useTransform(scrollYProgress, [0, 1], isDesktop ? [0, -90] : [0, 0]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], isDesktop ? [1, 0] : [1, 1]);

  return (
    <section ref={ref} id="top" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      <HeroScene targetRef={ref} />

      {/* Acrylic: a light frost between the landscape and the words, clearing toward the road */}
      <div
        className="pointer-events-none absolute inset-0 -z-[5]"
        aria-hidden
        style={{
          backdropFilter: 'blur(3px) saturate(1.12)',
          WebkitBackdropFilter: 'blur(3px) saturate(1.12)',
          background:
            'linear-gradient(102deg, rgb(var(--bg) / 0.66) 0%, rgb(var(--bg) / 0.46) 36%, rgb(var(--bg) / 0.16) 66%, rgb(var(--bg) / 0.06) 100%)',
          maskImage: 'linear-gradient(180deg, #000 0%, #000 64%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 64%, transparent 80%)',
        }}
      />
      {/* the landscape ends here, before the deck plan below */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-[4] h-20 bg-gradient-to-b from-transparent to-bg" aria-hidden />

      <Container className="relative flex flex-1 flex-col pb-[26vh] pt-32 sm:pt-36">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          <motion.div style={{ y: textY, opacity: textOpacity }}>
            <motion.p
              className="kicker flex items-center gap-2.5 text-accent"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT }}
            >
              <BerthGlyph className="h-3.5 w-6" state="relay" />
              Operator-authorised seat transfer
            </motion.p>
            <RevealText
              as="h1"
              text={'Plan changes,\nyour seat finds\nits next rider.'}
              className="display mt-6 text-[clamp(2.5rem,6vw,4.6rem)] text-ink"
              delay={0.25}
              stagger={0.07}
              accentWords={[6, 7]}
            />
            <Rise delay={0.7}>
              <p className="mt-8 max-w-[34rem] text-[1.1875rem] leading-relaxed text-ink2">
                Can't make the trip? Release your seat. Someone on the same route takes it at the exact fare, the operator reissues it in their name,
                and your money comes back once it sells.
              </p>
            </Rise>
            <Rise delay={0.85}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" magnetic onClick={onSearch}>
                  <Search className="h-[18px] w-[18px]" />
                  Find a seat
                </Button>
                <Button size="lg" variant="ghost" onClick={onRelease} className="bg-surface/40 backdrop-blur-sm">
                  Release my seat
                  <ArrowRight className="h-[18px] w-[18px]" />
                </Button>
              </div>
            </Rise>
            <Rise delay={1}>
              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink2">
                {['Exact fare, never more', "Reissued in the buyer's name", 'Refund only when it sells'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent" strokeWidth={2.25} />
                    {t}
                  </li>
                ))}
              </ul>
            </Rise>
          </motion.div>

          <motion.div
            className="relative z-10 mx-auto w-full max-w-[380px] lg:mx-0"
            initial={{ opacity: 0, y: 40, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 1.1, delay: 0.6, ease: EASE_OUT }}
          >
            <ManifestSlip phase={phase} />
          </motion.div>
        </div>
      </Container>
    </section>
  );
};

/* The coach seen from above: the next scroll after the landscape */
const DeckSection: React.FC<{ phase: RelayPhase }> = ({ phase }) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const coachX = useTransform(scrollYProgress, [0, 1], ['-6%', '7%']);
  return (
    <section ref={ref} className="relative overflow-hidden pb-10 pt-12 sm:pt-16">
      <Container>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Pill tone="danger">Sold out</Pill>
            <span className="code text-xs text-ink3">UPPER DECK · 2+1 SLEEPER · KA-01-F-8899</span>
          </div>
          <span className="text-xs text-ink3">Illustrative layout and passenger names</span>
        </div>
        <motion.div style={{ x: coachX }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.1, ease: EASE_OUT }}
          >
            <DeckPlan phase={phase} />
          </motion.div>
        </motion.div>
        <Road />
      </Container>
    </section>
  );
};

const Road: React.FC = () => (
  <svg viewBox="0 0 1200 24" className="mt-2 h-4 w-full" preserveAspectRatio="none" aria-hidden>
    <line x1="0" y1="4" x2="1200" y2="4" stroke="rgb(var(--line-strong))" strokeWidth="2" />
    <line x1="0" y1="16" x2="1200" y2="16" stroke="rgb(var(--ink-3) / 0.6)" strokeWidth="3" strokeDasharray="28 22" className="animate-dash" style={{ animationDuration: '0.7s' }} />
  </svg>
);

/* ============================================================================
   THREE PEOPLE, ONE BERTH
============================================================================ */
const People: React.FC = () => {
  const rows = [
    {
      who: 'The traveller who can’t go',
      glyph: 'booked' as const,
      text: 'Rahul’s plans changed at six. His coach leaves at half past ten, inside the no-refund window. Cancelling returns nothing.',
    },
    {
      who: 'The traveller who can’t get on',
      glyph: 'open' as const,
      text: 'Priya has to be in Chennai by morning. Every coach on the route says sold out.',
    },
    {
      who: 'The seat in between',
      glyph: 'relay' as const,
      text: 'Berth U12 runs empty, or gets filled somewhere on the highway by someone who is not on the manifest.',
    },
  ];
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.4fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <RevealText as="h2" text={'Three people.\nOne berth.\nNobody wins.'} className="display text-[clamp(2.4rem,5vw,4rem)] text-ink" accentWords={[5]} accentClass="text-danger" />
            <Rise delay={0.2}>
              <p className="mt-6 max-w-sm text-[1.0625rem] leading-relaxed text-ink2">
                A ticket can't simply be handed over. Boarding checks the name on it against a government ID, and only the operator can change that name.
              </p>
            </Rise>
          </div>
          <ol className="border-t border-line">
            {rows.map((r, i) => (
              <motion.li
                key={r.who}
                className="grid gap-4 border-b border-line py-10 sm:grid-cols-[200px_1fr] sm:gap-10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: EASE_OUT }}
              >
                <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                  <BerthGlyph className="h-6 w-11" state={r.glyph} />
                  <p className="kicker text-ink3">{r.who}</p>
                </div>
                <p className="display-md text-[1.5rem] leading-snug text-ink sm:text-[1.875rem]">{r.text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
};

/* ============================================================================
   THE RELAY: a horizontal rail through four stops
============================================================================ */
const STOPS = [
  {
    title: 'Release',
    lede: 'Rahul releases U12 from My journeys. His ticket stays valid for him until someone actually buys it.',
    Visual: () => (
      <div className="space-y-3">
        <FragmentRow label="Cancel now" note="Inside the no-refund window" value="₹0" tone="danger" fill={0} />
        <FragmentRow label="Relay U12" note="Paid out when it sells" value="₹850" tone="coach" fill={1} />
        <p className="pt-2 text-sm text-ink3">If he ends up travelling after all, he withdraws the listing and boards as usual.</p>
      </div>
    ),
  },
  {
    title: 'Claim',
    lede: 'Priya searches Bangalore to Chennai. The coach is sold out, except one relayed berth at the printed fare. Two people tap at once; exactly one gets it.',
    Visual: () => <RaceFragment />,
  },
  {
    title: 'Reissue',
    lede: 'SwiftBus sees who comes off the manifest and who goes on, side by side, and approves. The old ticket is cancelled in the same step.',
    Visual: () => (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line p-4">
          <p className="kicker text-danger">Off the manifest</p>
          <p className="mt-3 font-semibold text-ink line-through decoration-danger decoration-2">Rahul Sharma</p>
          <p className="code mt-1 text-xs text-ink3">SB-92831</p>
        </div>
        <div className="rounded-xl border border-coach bg-coach/5 p-4 dark:border-accent/50">
          <p className="kicker text-accent">Onto the manifest</p>
          <p className="mt-3 font-semibold text-ink">Priya Kumar, 24</p>
          <p className="code mt-1 text-xs text-ink3">AADHAAR ···· 4821</p>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-coach px-4 py-3 text-coachink sm:col-span-2">
          <span className="text-sm font-semibold">Approve reissue</span>
          <Check className="h-5 w-5" />
        </div>
      </div>
    ),
  },
  {
    title: 'Refund',
    lede: 'Only now does Rahul get paid. Priya holds a boarding pass in her own name, and the manifest matches who is on board.',
    Visual: () => (
      <div className="rounded-xl border border-line">
        <div className="flex items-center justify-between border-b border-dashed border-linestrong px-4 py-4">
          <div>
            <p className="text-xs text-ink3">Refund to Rahul Sharma</p>
            <p className="num mt-1 text-3xl font-bold text-ink">₹850</p>
          </div>
          <Pill tone="success">Released</Pill>
        </div>
        <dl className="space-y-2 px-4 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink3">Original ticket</dt>
            <dd className="code text-ink2">SB-92831 · cancelled</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink3">New ticket</dt>
            <dd className="code text-ink2">SR-48213 · Priya Kumar</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink3">Buyer paid</dt>
            <dd className="num font-semibold text-ink">₹850, exact fare</dd>
          </div>
        </dl>
      </div>
    ),
  },
];

const FragmentRow: React.FC<{ label: string; note: string; value: string; tone: 'danger' | 'coach'; fill: number }> = ({ label, note, value, tone, fill }) => (
  <div className="rounded-xl border border-line p-4">
    <div className="flex items-baseline justify-between">
      <div>
        <p className="font-semibold text-ink">{label}</p>
        <p className="text-xs text-ink3">{note}</p>
      </div>
      <p className={cx('num text-2xl font-bold', tone === 'danger' ? 'text-danger' : 'text-accent')}>{value}</p>
    </div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface2">
      <motion.div
        className={cx('h-full origin-left rounded-full', tone === 'danger' ? 'bg-danger' : 'bg-coach dark:bg-accent')}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: fill }}
        viewport={{ once: false, amount: 0.8 }}
        transition={{ duration: 1.1, ease: EASE_OUT }}
      />
    </div>
  </div>
);

const RaceFragment: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!inView) return;
    setStage(0);
    const a = window.setTimeout(() => setStage(1), 700);
    const b = window.setTimeout(() => setStage(2), 1500);
    const c = window.setInterval(() => {
      setStage(0);
      window.setTimeout(() => setStage(1), 700);
      window.setTimeout(() => setStage(2), 1500);
    }, 4800);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
      window.clearInterval(c);
    };
  }, [inView]);
  const rows = [
    { name: 'Priya', wins: true },
    { name: 'Arjun', wins: false },
  ];
  return (
    <div ref={ref} className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-line p-4">
        <div className="flex items-center gap-3">
          <BerthGlyph className="h-6 w-11" state="relay" />
          <div>
            <p className="font-semibold text-ink">Berth U12 · Upper</p>
            <p className="text-xs text-ink3">Released by traveller</p>
          </div>
        </div>
        <p className="num text-xl font-bold text-ink">₹850</p>
      </div>
      {rows.map((r) => (
        <div key={r.name} className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
          <span className="text-sm font-medium text-ink2">{r.name} taps Claim</span>
          <AnimatePresence mode="wait">
            {stage === 0 && (
              <motion.span key="idle" exit={{ opacity: 0 }} className="h-7 w-20 rounded-full bg-surface2" />
            )}
            {stage === 1 && (
              <motion.span key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-4 w-4 animate-spin rounded-full border-2 border-ink3 border-r-transparent" />
            )}
            {stage === 2 && (
              <motion.span key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }}>
                {r.wins ? <Pill tone="coach">Claimed · ₹850 held</Pill> : <Pill tone="neutral">Just taken</Pill>}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      ))}
      <p className="code pt-1 text-[0.6875rem] text-ink3">CONDITION status = LISTED · one write wins</p>
    </div>
  );
};

const StopPanel: React.FC<{ i: number; active?: boolean }> = ({ i, active = true }) => {
  const s = STOPS[i];
  const V = s.Visual;
  return (
    <article
      className={cx(
        'grid w-[min(86vw,1040px)] flex-shrink-0 gap-8 rounded-2xl bg-surface p-6 text-ink shadow-float transition-opacity duration-500 sm:p-10 lg:h-[min(60vh,500px)] lg:grid-cols-[1fr_1.05fr] lg:gap-12',
        !active && 'lg:opacity-60'
      )}
    >
      <div className="flex flex-col">
        <p className="kicker text-accent">Stop {i + 1} of 4</p>
        <h3 className="display mt-4 text-[2.5rem] sm:text-[3.25rem]">{s.title}</h3>
        <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-ink2">{s.lede}</p>
      </div>
      <div className="self-center">
        <V />
      </div>
    </article>
  );
};

const Relay: React.FC = () => {
  const isDesktop = useIsDesktop();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    if (!isDesktop) return;
    const measure = () => {
      const t = trackRef.current;
      if (t) setDist(Math.max(0, t.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [isDesktop]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0.04, 0.96], [0, -dist]);
  const coachLeft = useTransform(scrollYProgress, [0.04, 0.96], ['0%', '100%']);
  useMotionValueEvent(scrollYProgress, 'change', (p) => setActive(Math.min(3, Math.max(0, Math.floor(((p - 0.04) / 0.92) * 4 + 0.15)))));

  const header = (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <RevealText as="h2" text="The relay, stop by stop." className="display text-[clamp(2.2rem,4.6vw,3.75rem)] text-coachink" />
      <p className="max-w-sm text-[1.0625rem] leading-relaxed text-coachink/75">
        Four stops, one berth, and the operator in the middle. Money only moves when the name on the ticket does.
      </p>
    </div>
  );

  if (!isDesktop) {
    return (
      <section id="relay" className="bg-coach py-20">
        <Container>
          {header}
          <div className="mt-12 space-y-6">
            {STOPS.map((_, i) => (
              <Rise key={i}>
                <StopPanel i={i} />
              </Rise>
            ))}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section id="relay" ref={sectionRef} className="relative bg-coach" style={{ height: `calc(100vh + ${dist}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <Container className="pt-16">
          {header}
          {/* the road, with a coach driving between the four stops */}
          <div className="relative mt-10 h-8">
            <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-coachink/20" />
            <motion.div className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-marigold" style={{ width: coachLeft }} />
            {STOPS.map((s, i) => (
              <div key={s.title} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(i / 3) * 100}%` }}>
                <span className={cx('block h-3.5 w-3.5 rounded-full border-2 transition-colors duration-300', i <= active ? 'border-marigold bg-marigold' : 'border-coachink/40 bg-coach')} />
                <span className={cx('kicker absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap transition-colors', i <= active ? 'text-coachink' : 'text-coachink/50')}>
                  {s.title}
                </span>
              </div>
            ))}
            <motion.div className="absolute top-1/2 -translate-x-1/2 -translate-y-[130%]" style={{ left: coachLeft }}>
              <BerthGlyph className="h-5 w-9" state="relay" />
            </motion.div>
          </div>
        </Container>
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="mt-14 flex gap-6 pr-[8vw]"
        >
          <div className="w-[max(20px,calc((100vw-1320px)/2+32px-24px))] flex-shrink-0" />
          {STOPS.map((_, i) => (
            <StopPanel key={i} i={i} active={i === active} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* ============================================================================
   CANCEL OR RELAY: what comes back
============================================================================ */
const AnimatedRupees: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: EASE_OUT,
      onUpdate: (v) => (el.textContent = `₹${Math.round(v).toLocaleString('en-IN')}`),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);
  return (
    <span ref={ref} className={cx('num', className)}>
      ₹{value.toLocaleString('en-IN')}
    </span>
  );
};

const Money: React.FC = () => {
  const [fare, setFare] = useState(850);
  const pct = ((fare - 400) / (2500 - 400)) * 100;
  return (
    <section id="money" className="py-24 sm:py-32">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <RevealText as="h2" text={'Cancel,\nor relay.'} className="display text-[clamp(2.6rem,5.4vw,4.5rem)] text-ink" accentWords={[2]} />
            <Rise delay={0.15}>
              <p className="mt-6 max-w-md text-[1.0625rem] leading-relaxed text-ink2">
                Close to departure, most operators keep the whole fare. A relayed seat gives it back to you, and the next traveller pays exactly what you paid.
              </p>
            </Rise>
            <Rise delay={0.25}>
              <p className="mt-6 flex max-w-md gap-3 text-sm leading-relaxed text-ink3">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-marigold" />
                If nobody takes it before the operator's cutoff, the listing closes and your ticket's normal cancellation terms apply. You are never worse off than cancelling.
              </p>
            </Rise>
          </div>

          <Rise delay={0.1}>
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-lift sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <label htmlFor="fare" className="text-sm font-medium text-ink2">
                  Your fare
                </label>
                <AnimatedRupees value={fare} className="display-md text-3xl text-ink" />
              </div>
              <input
                id="fare"
                type="range"
                min={400}
                max={2500}
                step={50}
                value={fare}
                onChange={(e) => setFare(Number(e.target.value))}
                className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full accent-[rgb(var(--coach))]"
                style={{ background: `linear-gradient(90deg, rgb(var(--coach)) ${pct}%, rgb(var(--surface-2)) ${pct}%)` }}
              />

              <div className="mt-8 space-y-5">
                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold text-ink">Cancel inside the no-refund window</p>
                    <span className="num text-2xl font-bold text-danger">₹0</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-surface2" />
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold text-ink">Relay it on SeatRelay</p>
                    <AnimatedRupees value={fare} className="text-2xl font-bold text-accent" />
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface2">
                    <motion.div
                      className="h-full origin-left rounded-full bg-coach dark:bg-accent"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: EASE_OUT }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 divide-x divide-line rounded-xl border border-line text-center">
                {[
                  ['Buyer pays', `₹${fare.toLocaleString('en-IN')}`],
                  ['Markup', '₹0'],
                  ['You get back', `₹${fare.toLocaleString('en-IN')}`],
                ].map(([k, v]) => (
                  <div key={k} className="px-2 py-3">
                    <p className="text-xs text-ink3">{k}</p>
                    <p className="num mt-1 font-semibold text-ink">{v}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink3">Illustrative. Platform fee is ₹0 in this build; operator cancellation terms vary.</p>
            </div>
          </Rise>
        </div>
      </Container>
    </section>
  );
};

/* ============================================================================
   PRECEDENT
============================================================================ */
const Precedent: React.FC = () => (
  <section className="border-y border-line bg-surface2/60 py-24 sm:py-32">
    <Container>
      <p className="kicker text-ink3">Precedent</p>
      <RevealText
        as="p"
        text="Indian Railways already lets a confirmed ticket change names. Within a family, a day ahead, at a station counter."
        className="display-md mt-8 max-w-5xl text-[clamp(1.75rem,3.4vw,3rem)] text-ink"
        stagger={0.025}
      />
      <RevealText
        as="p"
        text="SeatRelay does it between strangers, online, up to an hour before the coach leaves."
        className="display-md mt-6 max-w-5xl text-[clamp(1.75rem,3.4vw,3rem)] text-accent"
        stagger={0.025}
        delay={0.2}
      />
    </Container>
  </section>
);

/* ============================================================================
   PORTALS
============================================================================ */
const Spotlight: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onPointerMove={onMove} className={cx('group relative overflow-hidden', className)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'radial-gradient(420px circle at var(--mx) var(--my), rgb(var(--marigold) / 0.13), transparent 60%)' }}
      />
      {children}
    </div>
  );
};

const Portals: React.FC<{ currentUser: User | null; onSelectRole: HomePageProps['onSelectRole'] }> = ({ currentUser, onSelectRole }) => {
  const isOperator = currentUser?.role === 'operator';
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <RevealText as="h2" text="Board as." className="display text-[clamp(2.4rem,5vw,4rem)] text-ink" />
          <p className="max-w-sm text-[1.0625rem] text-ink2">Two demo travellers are ready. Pick a side of the transfer.</p>
        </div>

        <div className={cx('mt-12 grid gap-5', isOperator ? 'lg:grid-cols-3' : 'lg:grid-cols-2')}>
          <Rise>
            <Spotlight className="flex h-full flex-col rounded-2xl border border-line bg-surface p-7 sm:p-9">
              <div className="flex items-center justify-between">
                <Pill tone="marigold">Releasing a seat</Pill>
                <span className="code text-xs text-ink3">rahul@example.com</span>
              </div>
              <h3 className="display-md mt-8 text-[2rem] text-ink">Rahul Sharma</h3>
              <p className="mt-2 text-ink2">Holds berth U12 on tonight's 22:30 to Chennai and can't travel.</p>
              <div className="mt-8 flex items-stretch overflow-hidden rounded-xl border border-line">
                <div className="flex-1 p-4">
                  <p className="code text-xs text-ink3">SB-92831</p>
                  <p className="mt-2 font-semibold text-ink">BLR → MAA</p>
                  <p className="text-sm text-ink3">Sat 19 Sep · 22:30</p>
                </div>
                <div className="perforation w-3 self-stretch" style={{ backgroundSize: '8px 14px', backgroundRepeat: 'repeat-y' }} />
                <div className="flex flex-col items-center justify-center bg-surface2 px-5">
                  <p className="code text-lg font-semibold text-ink">U12</p>
                  <p className="num text-sm text-ink2">₹850</p>
                </div>
              </div>
              <div className="mt-auto pt-8">
                <Button className="w-full" size="lg" onClick={() => onSelectRole('seller', 'tickets')}>
                  Continue as Rahul
                  <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Spotlight>
          </Rise>

          <Rise delay={0.08}>
            <Spotlight className="flex h-full flex-col rounded-2xl border border-line bg-surface p-7 sm:p-9">
              <div className="flex items-center justify-between">
                <Pill tone="coach">Looking for a seat</Pill>
                <span className="code text-xs text-ink3">priya@example.com</span>
              </div>
              <h3 className="display-md mt-8 text-[2rem] text-ink">Priya Kumar</h3>
              <p className="mt-2 text-ink2">Needs to reach Chennai by morning. The route shows sold out.</p>
              <div className="mt-8 rounded-xl border border-line p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink">SwiftBus Express · 22:30</p>
                  <Pill tone="danger">Sold out</Pill>
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-lg bg-marigold/15 px-3 py-2.5">
                  <BerthGlyph className="h-5 w-9" state="relay" />
                  <p className="text-sm font-medium text-ink">1 relayed berth at the printed fare</p>
                </div>
              </div>
              <div className="mt-auto pt-8">
                <Button className="w-full" size="lg" variant="ghost" onClick={() => onSelectRole('buyer', 'search')}>
                  Continue as Priya
                  <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Spotlight>
          </Rise>

          {isOperator && (
            <Rise delay={0.16}>
              <Spotlight className="flex h-full flex-col rounded-2xl bg-coach p-7 text-coachink sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-coachink/10 px-2.5 text-xs font-semibold">
                    <Building2 className="h-3.5 w-3.5" /> Operator
                  </span>
                  <span className="code text-xs text-coachink/70">ops@swiftbus.in</span>
                </div>
                <h3 className="display-md mt-8 text-[2rem]">SwiftBus Dispatch</h3>
                <p className="mt-2 text-coachink/75">Approve transfers, keep the manifest true, release refunds.</p>
                <div className="mt-auto pt-8">
                  <Button className="w-full" size="lg" variant="inverse" onClick={() => onSelectRole('operator', 'operator')}>
                    Open dispatch console
                    <ArrowUpRight className="h-[18px] w-[18px]" />
                  </Button>
                </div>
              </Spotlight>
            </Rise>
          )}
        </div>
      </Container>
    </section>
  );
};

/* ============================================================================
   UNDER THE FLOOR: the reference architecture
============================================================================ */
const ARCH = [
  { stage: 'Edge', items: [{ icon: Globe, name: 'Amplify Hosting', role: 'Serves the web app' }, { icon: KeyRound, name: 'Cognito', role: 'Seller, buyer and operator groups' }] },
  { stage: 'API', items: [{ icon: Server, name: 'API Gateway', role: 'REST endpoints' }, { icon: Cpu, name: 'Lambda', role: 'Listing, claim, payment, approval' }] },
  { stage: 'Orchestration', items: [{ icon: Workflow, name: 'Step Functions', role: 'Waits for the operator, rolls back on timeout', lead: true }] },
  {
    stage: 'State and signals',
    items: [
      { icon: Database, name: 'DynamoDB', role: 'Conditional write: one buyer per seat' },
      { icon: CalendarClock, name: 'EventBridge Scheduler', role: 'Expires listings at the cutoff' },
      { icon: BellRing, name: 'SNS', role: 'Updates to all three parties' },
      { icon: HardDrive, name: 'S3', role: 'Tickets and boarding passes' },
    ],
  },
];

const Architecture: React.FC<{ onOpen: () => void }> = ({ onOpen }) => (
  <section className="bg-[rgb(var(--ink))] py-24 text-[rgb(var(--bg))] dark:bg-surface dark:text-ink sm:py-32">
    <Container>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="kicker text-marigold">Reference architecture</p>
          <RevealText as="h2" text="Under the floor." className="display mt-5 text-[clamp(2.4rem,5vw,4rem)]" />
        </div>
        <p className="max-w-md text-[1.0625rem] leading-relaxed opacity-75">
          Each transfer is a long-running workflow that pauses for the operator and undoes itself if anyone drops out. This is the AWS design the demo is built toward.
        </p>
      </div>

      <div className="relative mt-16">
        <div className="absolute left-0 right-0 top-[2.1rem] hidden h-px bg-current opacity-15 lg:block" />
        <motion.div
          className="absolute top-[calc(2.1rem-1px)] hidden h-[3px] w-24 rounded-full bg-marigold lg:block"
          animate={{ left: ['0%', '92%'] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: [0.65, 0, 0.35, 1], repeatDelay: 0.4 }}
        />
        <div className="grid gap-10 lg:grid-cols-4 lg:gap-6">
          {ARCH.map((col, ci) => (
            <Rise key={col.stage} delay={ci * 0.08}>
              <p className="kicker opacity-60">{col.stage}</p>
              <div className="mt-8 space-y-3">
                {col.items.map((it: any) => (
                  <div
                    key={it.name}
                    className={cx(
                      'flex items-start gap-3 rounded-xl border p-4 transition-colors',
                      it.lead ? 'border-marigold/60 bg-marigold/10' : ''
                    )}
                    style={{ borderColor: it.lead ? undefined : 'color-mix(in srgb, currentColor 16%, transparent)' }}
                  >
                    <it.icon className={cx('mt-0.5 h-5 w-5 flex-shrink-0', it.lead ? 'text-marigold' : 'opacity-70')} strokeWidth={1.6} />
                    <div>
                      <p className="font-semibold">{it.name}</p>
                      <p className="mt-0.5 text-sm opacity-65">{it.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Rise>
          ))}
        </div>
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-4">
        <Button variant="accent" size="lg" onClick={onOpen}>
          Read the full specification
          <ArrowUpRight className="h-[18px] w-[18px]" />
        </Button>
        <span className="text-sm opacity-60">State machine, money model and the one-buyer guarantee.</span>
      </div>
    </Container>
  </section>
);

/* ============================================================================
   QUESTIONS
============================================================================ */
const FAQS = [
  {
    q: 'What if nobody takes my seat?',
    a: "Your listing closes at the operator's cutoff, an hour before departure for SwiftBus, and your ticket's normal cancellation terms apply. If you decide to travel after all, withdraw the listing and board as usual.",
  },
  {
    q: 'Can the seller cancel after I have paid?',
    a: 'No. While a seat is being transferred, only the operator can cancel the original ticket, and it does that in the same step that reissues the seat in your name.',
  },
  {
    q: 'Why is the price always the original fare?',
    a: 'Because the point is to move a seat, not to trade it. Listings are capped at the printed fare, so nobody can profit from a sold-out route.',
  },
  {
    q: 'Who sees my government ID?',
    a: 'The operator, so your name can go on the passenger manifest. Everywhere else it is masked, and the seller never sees it.',
  },
  {
    q: 'When does the seller get paid?',
    a: "Only after the operator reissues the ticket in the buyer's name. Until then the buyer's payment is held, and it is returned automatically if the operator declines.",
  },
  {
    q: 'Which operators are on SeatRelay?',
    a: 'This build runs against one simulated operator, SwiftBus Express. A production version connects to each operator through its reservation system.',
  },
];

const Faq: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 sm:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.4fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <RevealText as="h2" text="Questions travellers ask." className="display text-[clamp(2.2rem,4.4vw,3.5rem)] text-ink" />
          </div>
          <div className="border-t border-line">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className="border-b border-line">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="display-md text-[1.25rem] text-ink sm:text-[1.5rem]">{f.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.35, ease: EASE_OUT }}
                      className={cx('grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border transition-colors', isOpen ? 'border-coach bg-coach text-coachink' : 'border-linestrong text-ink2')}
                    >
                      <Plus className="h-4 w-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: EASE_OUT }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-2xl pb-7 text-[1.0625rem] leading-relaxed text-ink2">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
};

/* ============================================================================
   CLOSE
============================================================================ */
const Close: React.FC<{ onRelease: () => void; onSearch: () => void }> = ({ onRelease, onSearch }) => (
  <section className="px-3 sm:px-5">
    <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[20px] bg-marigold px-6 py-20 text-marigoldink sm:px-14 sm:py-24">
      <div className="pointer-events-none absolute -right-10 bottom-[-18%] w-[62%] opacity-[0.16] sm:bottom-[-30%]" aria-hidden>
        <svg viewBox="0 0 400 220" className="w-full">
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => (
              <g key={`${r}${c}`}>
                <rect x={c * 98} y={r * 72} width="88" height="60" rx="10" fill="none" stroke="currentColor" strokeWidth="3" />
                <rect x={c * 98 + 62} y={r * 72 + 10} width="16" height="40" rx="5" fill="currentColor" />
              </g>
            ))
          )}
        </svg>
      </div>
      <div className="relative max-w-3xl">
        <RevealText as="h2" text={'Somebody on your route\nneeds that seat.'} className="display text-[clamp(2.3rem,5.4vw,4.5rem)]" />
        <Rise delay={0.2}>
          <p className="mt-6 max-w-xl text-[1.125rem] leading-relaxed opacity-80">
            Release it in under a minute. You'll hear from us the moment it's claimed, and again when your refund is on its way.
          </p>
        </Rise>
        <Rise delay={0.3}>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" magnetic variant="onMarigold" onClick={onRelease}>
              Release my seat
              <ArrowRight className="h-[18px] w-[18px]" />
            </Button>
            <Button size="lg" variant="onMarigoldGhost" onClick={onSearch}>
              Find a seat
            </Button>
          </div>
        </Rise>
        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium opacity-80">
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Operator-verified
          </li>
          <li className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Payment held until reissue
          </li>
        </ul>
      </div>
    </div>
  </section>
);

/* ============================================================================ */
export const HomePage: React.FC<HomePageProps> = ({ onSearchClick, currentUser, onSelectRole, onOpenAwsModal }) => {
  const release = () => onSelectRole('seller', 'tickets');
  // One relay loop drives both the manifest slip and the deck plan, so they stay in step.
  const openingRef = useRef<HTMLDivElement>(null);
  const openingInView = useInView(openingRef, { amount: 0.1 });
  const phase = useRelayLoop(openingInView);
  return (
    <div>
      <div ref={openingRef}>
        <Hero onSearch={onSearchClick} onRelease={release} phase={phase} />
        <DeckSection phase={phase} />
      </div>
      <People />
      <Relay />
      <Money />
      <Precedent />
      <Portals currentUser={currentUser} onSelectRole={onSelectRole} />
      <Architecture onOpen={onOpenAwsModal} />
      <Faq />
      <Close onRelease={release} onSearch={onSearchClick} />
    </div>
  );
};
