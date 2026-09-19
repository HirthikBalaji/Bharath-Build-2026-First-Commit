import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, CornerDownLeft } from 'lucide-react';
import { cx, EASE_OUT } from './ui';
import { lockScroll, unlockScroll } from '../lib/scroll';

export interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ReactElement;
  run: () => void;
}

export const CommandPalette: React.FC<{ open: boolean; onClose: () => void; actions: PaletteAction[] }> = ({
  open,
  onClose,
  actions,
}) => {
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? actions.filter((a) => `${a.label} ${a.hint ?? ''} ${a.group}`.toLowerCase().includes(s)) : actions;
  }, [q, actions]);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setCursor(0);
    lockScroll();
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      unlockScroll();
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => setCursor(0), [q]);

  // Keys are handled at window level so they work wherever focus sits
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => Math.min(results.length - 1, c + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        run(results[cursor]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, cursor]);

  const run = (a?: PaletteAction) => {
    if (!a) return;
    onClose();
    window.setTimeout(a.run, 120);
  };


  let lastGroup = '';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[85] flex items-start justify-center px-4 pt-[14vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[rgb(6_12_10/0.5)] backdrop-blur-[4px]" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-float"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-[18px] w-[18px] text-ink3" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Where to? Try “ledger” or “lights”"
                className="h-14 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink3"
                aria-label="Search commands"
              />
              <kbd className="code rounded border border-line px-1.5 py-0.5 text-[0.625rem] text-ink3">Esc</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2" data-lenis-prevent>
              {results.length === 0 && <p className="px-3 py-10 text-center text-sm text-ink3">No matches. Try another word.</p>}
              {results.map((a, i) => {
                const header = a.group !== lastGroup ? a.group : null;
                lastGroup = a.group;
                return (
                  <React.Fragment key={a.id}>
                    {header && <p className="kicker px-3 pb-1.5 pt-3 text-ink3">{header}</p>}
                    <button
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => run(a)}
                      className={cx(
                        'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[0.9375rem] transition-colors',
                        i === cursor ? 'text-ink' : 'text-ink2'
                      )}
                    >
                      {i === cursor && <span className="absolute inset-0 rounded-lg bg-surface2" />}
                      <span className="relative z-10 text-ink3">{React.cloneElement(a.icon, { className: 'h-4 w-4', strokeWidth: 1.75 })}</span>
                      <span className="relative z-10 flex-1 font-medium">{a.label}</span>
                      {a.hint && <span className="relative z-10 text-xs text-ink3">{a.hint}</span>}
                      {i === cursor && <CornerDownLeft className="relative z-10 h-3.5 w-3.5 text-ink3" />}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
