import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useTheme } from '../lib/theme';

const LENGTH = 78;
const THRESHOLD = 28;

/**
 * The berth reading-lamp cord. Pull it (drag or click) to switch the cabin lights.
 * The reveal radiates from the bead, so the light visibly comes from the cord.
 */
export const LightCord: React.FC<{ hint?: boolean }> = ({ hint }) => {
  const { theme, toggleTheme } = useTheme();
  const y = useMotionValue(0);
  const cordHeight = useTransform(y, (v) => LENGTH + Math.max(0, v));
  const beadRef = useRef<HTMLButtonElement>(null);
  const dragged = useRef(false);
  const [hover, setHover] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const dark = theme === 'dark';

  useEffect(() => {
    if (!hint) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem('seatrelay_cord_hint') === '1';
    } catch (e) {
      seen = false;
    }
    if (seen) return;
    const t1 = window.setTimeout(() => setShowHint(true), 900);
    const t2 = window.setTimeout(() => setShowHint(false), 5200);
    try {
      sessionStorage.setItem('seatrelay_cord_hint', '1');
    } catch (e) {
      /* ignore */
    }
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [hint]);

  const fire = () => {
    const r = beadRef.current?.getBoundingClientRect();
    toggleTheme(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined);
    setShowHint(false);
  };

  const tug = () => {
    animate(y, [0, 34, 0], { duration: 0.55, times: [0, 0.35, 1], ease: ['easeOut', [0.34, 1.56, 0.64, 1]] });
    window.setTimeout(fire, 170);
  };

  return (
    <div className="pointer-events-none fixed right-3 top-0 z-[65] flex flex-col items-center sm:right-5" aria-live="polite">
      <motion.span
        className="block w-[2px] origin-top rounded-b-full"
        style={{
          height: cordHeight,
          background: dark
            ? 'linear-gradient(rgb(var(--line-strong)), rgb(var(--marigold) / 0.7))'
            : 'linear-gradient(rgb(var(--line-strong)), rgb(var(--ink-3)))',
        }}
      />
      <motion.button
        ref={beadRef}
        type="button"
        aria-label={dark ? 'Turn the lights on (switch to light mode)' : 'Turn the lights off (switch to dark mode)'}
        title={dark ? 'Pull for lights on' : 'Pull for lights off'}
        className="pointer-events-auto relative -mt-[2px] grid h-7 w-7 cursor-grab touch-none place-items-center rounded-full active:cursor-grabbing"
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.9 }}
        dragMomentum={false}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={(_, info) => {
          if (info.offset.y > THRESHOLD) fire();
          window.setTimeout(() => (dragged.current = false), 50);
        }}
        onClick={() => {
          if (!dragged.current) tug();
        }}
        onHoverStart={() => setHover(true)}
        onHoverEnd={() => setHover(false)}
        whileHover={{ scale: 1.08 }}
      >
        {/* lamp glow when the cabin is dark */}
        <motion.span
          className="absolute inset-[-14px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgb(var(--marigold) / 0.55), rgb(var(--marigold) / 0) 70%)' }}
          animate={{ opacity: dark ? [0.65, 1, 0.65] : 0 }}
          transition={dark ? { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        />
        <span
          className="relative block h-[18px] w-[14px] rounded-[7px] shadow-lift"
          style={{
            background: dark
              ? 'linear-gradient(160deg, rgb(255 226 160), rgb(var(--marigold)) 55%, rgb(196 128 10))'
              : 'linear-gradient(160deg, rgb(var(--ink-3)), rgb(var(--ink)) 70%)',
          }}
        />
      </motion.button>

      <AnimatePresence>
        {(hover || showHint) && (
          <motion.span
            initial={{ opacity: 0, x: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="kicker absolute right-9 whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 text-ink shadow-lift"
            style={{ top: LENGTH - 2 }}
          >
            {showHint && !hover ? 'Pull the cord' : dark ? 'Lights on' : 'Lights off'}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
