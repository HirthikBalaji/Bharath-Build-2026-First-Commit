import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

/*
  The opening scene: an Indian highway by day, the same highway at night.
  Every colour comes from theme tokens (see index.css), so the pull cord
  repaints the whole landscape. Scrolling through the hero drives the
  sleeper coach along the road from left to right.
*/

const c = (token: string, alpha?: number) => (alpha === undefined ? `rgb(var(--${token}))` : `rgb(var(--${token}) / ${alpha})`);
const DAY = { opacity: 'var(--day)' } as React.CSSProperties;
const NIGHT = { opacity: 'var(--night)' } as React.CSSProperties;

const ROAD = 'M -140 820 C 170 808 380 752 660 762 S 1080 830 1320 810 S 1600 766 1760 772';

const STARS = Array.from({ length: 46 }, (_, i) => {
  const x = (i * 353.7) % 1600;
  const y = 30 + ((i * 97.3) % 380);
  const r = i % 7 === 0 ? 1.8 : i % 3 === 0 ? 1.3 : 0.9;
  return { x, y, r, d: (i % 9) * 0.35 };
});

const BUILDINGS = [
  { x: 20, w: 58, h: 170 },
  { x: 84, w: 44, h: 120 },
  { x: 134, w: 70, h: 230 },
  { x: 210, w: 40, h: 150 },
  { x: 256, w: 62, h: 200 },
  { x: 324, w: 48, h: 110 },
  { x: 378, w: 84, h: 150 },
  { x: 1350, w: 50, h: 130 },
  { x: 1406, w: 72, h: 210 },
  { x: 1484, w: 46, h: 150 },
  { x: 1536, w: 64, h: 180 },
];
const CITY_BASE = 640;

const TREES = [
  { x: 120, y: 700, s: 1 },
  { x: 205, y: 694, s: 0.8 },
  { x: 470, y: 676, s: 0.9 },
  { x: 900, y: 648, s: 0.75 },
  { x: 965, y: 654, s: 1 },
  { x: 1215, y: 690, s: 0.85 },
  { x: 1500, y: 668, s: 1.05 },
];

const Tree: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-2.5} y={-8} width={5} height={30} rx={2} style={{ fill: c('tree') }} />
    <circle cx={0} cy={-30} r={22} style={{ fill: c('tree') }} />
    <circle cx={-14} cy={-16} r={15} style={{ fill: c('tree-2') }} />
    <circle cx={14} cy={-18} r={16} style={{ fill: c('tree-2') }} />
  </g>
);

const Cloud: React.FC<{ x: number; y: number; s: number; delay: string }> = ({ x, y, s, delay }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} style={DAY}>
    <g className="animate-drift" style={{ animationDelay: delay }}>
      <ellipse cx={0} cy={0} rx={70} ry={20} fill="#ffffff" opacity={0.75} />
      <circle cx={-22} cy={-12} r={24} fill="#ffffff" opacity={0.75} />
      <circle cx={16} cy={-18} r={30} fill="#ffffff" opacity={0.75} />
    </g>
  </g>
);

/** The sleeper coach, side view, facing right. Origin sits where the wheels touch the road. */
const Coach = React.forwardRef<SVGGElement, { wheelRefs: React.MutableRefObject<Array<SVGGElement | null>> }>(({ wheelRefs }, ref) => (
  <g ref={ref}>
    {/* headlight beam at night */}
    <path d="M 118 -28 L 420 -84 L 420 22 Z" fill="url(#beam)" style={NIGHT} />
    <ellipse cx={0} cy={2} rx={120} ry={7} fill="#000" opacity={0.22} />
    <g className="animate-idle">
      {/* body */}
      <path
        d="M -118 -22 L -118 -86 Q -118 -98 -106 -98 L 90 -98 Q 106 -98 112 -86 L 121 -52 L 121 -24 Q 121 -14 111 -14 L -108 -14 Q -118 -14 -118 -22 Z"
        style={{ fill: c('bus-body') }}
      />
      {/* roof sheen */}
      <path d="M -106 -98 L 90 -98 Q 100 -98 106 -92 L -110 -92 Q -110 -98 -106 -98 Z" fill="#ffffff" opacity={0.12} />
      {/* upper berth windows */}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`u${i}`} x={-106 + i * 31} y={-88} width={27} height={16} rx={3} style={{ fill: c('bus-window') }} />
      ))}
      {/* lower berth windows */}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`l${i}`} x={-106 + i * 31} y={-66} width={27} height={14} rx={3} style={{ fill: c('bus-window'), opacity: 0.85 }} />
      ))}
      {/* windscreen */}
      <path d="M 92 -90 L 106 -88 L 117 -52 L 92 -52 Z" style={{ fill: c('bus-window') }} />
      <path d="M 96 -86 L 104 -85 L 110 -62 L 98 -62 Z" fill="#ffffff" opacity={0.3} />
      {/* door */}
      <rect x={78} y={-64} width={12} height={46} rx={2} fill="#000" opacity={0.18} />
      {/* livery stripe */}
      <rect x={-118} y={-46} width={239} height={6} style={{ fill: c('marigold') }} />
      <rect x={-118} y={-38} width={196} height={2} style={{ fill: c('marigold') }} opacity={0.6} />
      {/* relay emblem */}
      <circle cx={-78} cy={-28} r={7} style={{ fill: c('marigold') }} />
      <path d="M -82 -30 h8 m0 0 -2.5 -2.5 M -74 -30 l -2.5 2.5 M -74 -26 h-8 m0 0 2.5 -2.5 M -82 -26 l 2.5 2.5" stroke={c('marigold-ink')} strokeWidth={1.4} strokeLinecap="round" />
      {/* mirror, lights */}
      <path d="M 112 -86 q 12 -2 12 10 v 10" stroke={c('tyre')} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <rect x={115} y={-30} width={6} height={8} rx={2} style={{ fill: c('marigold') }} />
      <rect x={-120} y={-34} width={4} height={10} rx={1.5} fill="#E0533C" />
      {/* wheel arches */}
      <path d="M -94 -14 a 22 22 0 0 1 44 0 Z" fill="#000" opacity={0.35} />
      <path d="M 48 -14 a 22 22 0 0 1 44 0 Z" fill="#000" opacity={0.35} />
    </g>
    {[-72, 70].map((x, i) => (
      <g key={x} transform={`translate(${x} -12)`}>
        <circle r={15} style={{ fill: c('tyre') }} />
        <g ref={(el) => (wheelRefs.current[i] = el)}>
          <circle r={7} fill="#9AA8A1" />
          <path d="M -7 0 H 7 M 0 -7 V 7" stroke={c('tyre')} strokeWidth={2} />
        </g>
      </g>
    ))}
  </g>
));
Coach.displayName = 'Coach';

export const HeroScene: React.FC<{ targetRef: React.RefObject<HTMLElement> }> = ({ targetRef }) => {
  const roadRef = useRef<SVGPathElement>(null);
  const busRef = useRef<SVGGElement>(null);
  const wheelRefs = useRef<Array<SVGGElement | null>>([]);
  const [lamps, setLamps] = useState<Array<{ x: number; y: number }>>([]);

  const { scrollYProgress } = useScroll({ target: targetRef, offset: ['start start', 'end start'] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.35 });
  const farY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, 22]);
  const skyY = useTransform(scrollYProgress, [0, 1], [0, 70]);

  // Street lights sit on the far edge of the road, found from the road's own geometry.
  useLayoutEffect(() => {
    const road = roadRef.current;
    if (!road) return;
    const L = road.getTotalLength();
    const yAt = (x: number) => {
      let lo = 0;
      let hi = L;
      for (let k = 0; k < 24; k++) {
        const mid = (lo + hi) / 2;
        if (road.getPointAtLength(mid).x < x) lo = mid;
        else hi = mid;
      }
      return road.getPointAtLength(lo).y;
    };
    setLamps([150, 470, 790, 1110, 1430].map((x) => ({ x, y: yAt(x) - 32 })));
  }, []);

  // Drive the coach: position, heading and wheel spin all follow scroll.
  useEffect(() => {
    const place = (p: number) => {
      const road = roadRef.current;
      const bus = busRef.current;
      if (!road || !bus) return;
      const L = road.getTotalLength();
      const d = L * (0.2 + 0.74 * Math.min(1, Math.max(0, p)));
      const a = road.getPointAtLength(d);
      const b = road.getPointAtLength(Math.min(L, d + 6));
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      bus.setAttribute('transform', `translate(${a.x} ${a.y + 12}) rotate(${angle})`);
      const spin = (d / (2 * Math.PI * 15)) * 360;
      wheelRefs.current.forEach((w) => w?.setAttribute('transform', `rotate(${spin})`));
    };
    place(progress.get());
    return progress.on('change', place);
  }, [progress]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* sky fills whatever height the hero takes */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${c('sky-top')} 0%, ${c('sky-bottom')} 78%)` }} />

      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-[max(56.25vw,440px)] w-full"
      >
        <defs>
          <radialGradient id="sun-halo">
            <stop offset="0%" stopColor="rgb(var(--marigold))" stopOpacity={0.55} />
            <stop offset="100%" stopColor="rgb(var(--marigold))" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="moon-halo">
            <stop offset="0%" stopColor="#E8EEE9" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#E8EEE9" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="lamp-glow">
            <stop offset="0%" stopColor="rgb(var(--marigold))" stopOpacity={0.75} />
            <stop offset="100%" stopColor="rgb(var(--marigold))" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="beam" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgb(var(--marigold))" stopOpacity={0.42} />
            <stop offset="100%" stopColor="rgb(var(--marigold))" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* sun by day, moon and stars by night */}
        <motion.g style={{ y: skyY }}>
          <g style={DAY}>
            <circle cx={1210} cy={330} r={170} fill="url(#sun-halo)" />
            <circle cx={1210} cy={330} r={46} style={{ fill: c('marigold', 0.9) }} />
          </g>
          <g style={NIGHT}>
            {STARS.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#E8EEE9" className={i % 4 === 0 ? 'animate-twinkle' : undefined} style={{ animationDelay: `${s.d}s` }} opacity={0.7} />
            ))}
            <circle cx={1210} cy={300} r={140} fill="url(#moon-halo)" />
            <circle cx={1210} cy={300} r={34} fill="#E8EEE9" />
            <circle cx={1224} cy={292} r={30} style={{ fill: c('sky-top') }} opacity={0.9} />
          </g>
          <Cloud x={260} y={190} s={1} delay="0s" />
          <Cloud x={760} y={120} s={0.7} delay="-12s" />
          <Cloud x={1450} y={210} s={0.85} delay="-24s" />
        </motion.g>

        {/* far hills and the city */}
        <motion.g style={{ y: farY }}>
          <path d="M0 610 C 180 548 330 566 480 596 S 820 526 1000 566 S 1350 606 1600 548 L1600 900 L0 900 Z" style={{ fill: c('hill-far') }} />
          {BUILDINGS.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={CITY_BASE - b.h} width={b.w} height={b.h + 40} style={{ fill: c('city') }} />
              <g style={NIGHT}>
                {Array.from({ length: Math.floor(b.h / 26) }, (_, r) =>
                  Array.from({ length: Math.floor(b.w / 16) }, (_, k) =>
                    (r * 7 + k * 3 + i) % 4 === 0 ? (
                      <rect key={`${r}-${k}`} x={b.x + 6 + k * 16} y={CITY_BASE - b.h + 10 + r * 26} width={6} height={9} style={{ fill: c('marigold', 0.75) }} />
                    ) : null
                  )
                )}
              </g>
            </g>
          ))}
        </motion.g>

        {/* mid hills with trees */}
        <motion.g style={{ y: midY }}>
          <path d="M0 690 C 150 650 300 660 460 684 S 760 628 960 658 S 1300 708 1600 648 L1600 900 L0 900 Z" style={{ fill: c('hill-mid') }} />
          {TREES.slice(2, 5).map((t, i) => (
            <Tree key={i} {...t} />
          ))}
        </motion.g>

        {/* near ground, the road and the lights */}
        <path d="M0 748 C 200 722 380 708 560 726 S 900 766 1120 752 S 1420 708 1600 722 L1600 900 L0 900 Z" style={{ fill: c('hill-near') }} />
        {[TREES[0], TREES[1], TREES[5], TREES[6]].map((t, i) => (
          <Tree key={i} {...t} />
        ))}
        <path d="M0 840 C 300 828 500 800 700 808 S 1100 856 1350 842 S 1600 810 1600 810 L1600 900 L0 900 Z" style={{ fill: c('ground') }} />

        {lamps.map((l, i) => (
          <g key={i}>
            <circle cx={l.x + 14} cy={l.y - 52} r={46} fill="url(#lamp-glow)" style={NIGHT} />
            <path d={`M ${l.x} ${l.y + 30} V ${l.y - 50} q 0 -6 8 -6 h 8`} stroke={c('tyre')} strokeWidth={3} fill="none" opacity={0.75} />
            <rect x={l.x + 12} y={l.y - 58} width={10} height={5} rx={2} style={{ fill: c('marigold') }} />
          </g>
        ))}

        <path d={ROAD} fill="none" style={{ stroke: c('road-edge') }} strokeWidth={70} strokeLinecap="round" />
        <path ref={roadRef} d={ROAD} fill="none" style={{ stroke: c('road') }} strokeWidth={62} strokeLinecap="round" />
        <path d={ROAD} fill="none" style={{ stroke: c('road-line') }} strokeWidth={3} strokeDasharray="26 22" />

        <Coach ref={busRef} wheelRefs={wheelRefs} />
      </svg>
    </div>
  );
};
