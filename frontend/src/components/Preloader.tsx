import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from './Logo';

/** Berth curtains part once per visit. Skipped for reduced motion and repeat views. */
export const Preloader: React.FC = () => {
  const [show, setShow] = useState(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      return sessionStorage.getItem('seatrelay_intro') !== '1';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem('seatrelay_intro', '1');
    } catch (e) {
      /* ignore */
    }
    const t = window.setTimeout(() => setShow(false), 1500);
    return () => window.clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[100] flex" exit={{ pointerEvents: 'none' }} aria-hidden>
          {[0, 1].map((side) => (
            <motion.div
              key={side}
              className="relative h-full w-1/2 bg-coach"
              initial={{ x: 0 }}
              exit={{ x: side === 0 ? '-101%' : '101%' }}
              transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            >
              {/* curtain pleats */}
              <div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, rgb(0 0 0 / 0.5) 0 2px, transparent 2px 46px, rgb(255 255 255 / 0.25) 46px 48px, transparent 48px 92px)',
                }}
              />
            </motion.div>
          ))}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-coachink"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.3 } }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Logo size={56} />
            <p className="text-2xl font-extrabold tracking-[-0.02em]" style={{ fontStretch: '122%' }}>
              SeatRelay
            </p>
            <div className="h-[2px] w-40 overflow-hidden rounded-full bg-coachink/15">
              <motion.div
                className="h-full bg-marigold"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
                style={{ transformOrigin: 'left' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
