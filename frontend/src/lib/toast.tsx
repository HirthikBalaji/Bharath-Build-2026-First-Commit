import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type Tone = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  tone: Tone;
  title: string;
  body?: string;
}

interface ToastCtx {
  notify: (t: Omit<Toast, 'id'>) => void;
}

const Ctx = createContext<ToastCtx>({ notify: () => {} });
let seq = 0;

const icons = {
  success: <CheckCircle2 className="h-[18px] w-[18px] text-accent" strokeWidth={1.75} />,
  error: <AlertTriangle className="h-[18px] w-[18px] text-danger" strokeWidth={1.75} />,
  info: <Info className="h-[18px] w-[18px] text-marigold" strokeWidth={1.75} />,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const notify = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++seq;
      setToasts((all) => [...all.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismiss(id), t.tone === 'error' ? 7000 : 4800);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-5 z-[90] flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-float"
              role={t.tone === 'error' ? 'alert' : 'status'}
            >
              <span className="mt-0.5">{icons[t.tone]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] font-semibold text-ink">{t.title}</p>
                {t.body && <p className="mt-0.5 text-sm leading-snug text-ink2">{t.body}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="-mr-1 rounded-md p-1 text-ink3 transition-colors hover:bg-surface2 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
};

export const useToast = () => useContext(Ctx);
