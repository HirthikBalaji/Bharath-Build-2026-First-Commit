import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'light' | 'dark';
type Origin = { x: number; y: number };

interface ThemeCtx {
  theme: Theme;
  /** Switch the cabin lights. `origin` is where the reveal starts (the cord bead). */
  toggleTheme: (origin?: Origin) => void;
  switching: boolean;
}

const Ctx = createContext<ThemeCtx>({ theme: 'light', toggleTheme: () => {}, switching: false });

const readTheme = (): Theme =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';

const applyTheme = (t: Theme) => {
  const root = document.documentElement;
  root.classList.toggle('dark', t === 'dark');
  root.style.colorScheme = t;
  try {
    localStorage.setItem('seatrelay_theme', t);
  } catch (e) {
    /* storage unavailable: theme still applies for this visit */
  }
};

let audio: AudioContext | null = null;
/** A short, quiet switch click, synthesised so no asset is needed. */
const playClick = (on: boolean) => {
  try {
    audio = audio ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audio;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(on ? 2400 : 1500, t);
    osc.frequency.exponentialRampToValueAtTime(on ? 900 : 500, t + 0.05);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  } catch (e) {
    /* audio is decoration only */
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const meta = document.querySelectorAll('meta[name="theme-color"]');
    meta.forEach((m) => m.setAttribute('content', theme === 'dark' ? '#080E0C' : '#F3F4F0'));
  }, [theme]);

  const toggleTheme = useCallback(
    (origin?: Origin) => {
      const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      playClick(next === 'light');

      const commit = () => {
        applyTheme(next);
        flushSync(() => setTheme(next));
      };

      const doc = document as any;
      if (reduce || typeof doc.startViewTransition !== 'function') {
        commit();
        return;
      }

      const x = origin?.x ?? window.innerWidth - 40;
      const y = origin?.y ?? 40;
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      setSwitching(true);
      const vt = doc.startViewTransition(commit);
      vt.ready
        .then(() => {
          const root = document.documentElement;
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
            { duration: next === 'light' ? 1000 : 1150, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
          );
          if (next === 'light') {
            // Lights on: the tube catches, stutters once, then holds.
            root.animate(
              { filter: ['brightness(1.9) saturate(0.5)', 'brightness(0.75)', 'brightness(1.35)', 'brightness(0.95)', 'brightness(1)'] },
              { duration: 820, easing: 'linear', pseudoElement: '::view-transition-new(root)' }
            );
          } else {
            // Lights off: the old room lingers a beat, dimming as the dark spreads.
            root.animate(
              { filter: ['brightness(1)', 'brightness(0.55)'] },
              { duration: 1150, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', pseudoElement: '::view-transition-old(root)' }
            );
          }
        })
        .catch(() => {});
      vt.finished.finally(() => setSwitching(false));
    },
    []
  );

  const value = useMemo(() => ({ theme, toggleTheme, switching }), [theme, toggleTheme, switching]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useTheme = () => useContext(Ctx);
