import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';
import { DeckPlan } from './DeckPlan';
import { Button, cx, EASE_OUT, Modal, Segmented } from './ui';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
  initialMode?: 'login' | 'register';
  prefillEmail?: string;
}

const DEMO = [
  { label: 'Rahul', role: 'Seller', email: 'rahul@example.com', password: 'rahul@123' },
  { label: 'Priya', role: 'Buyer', email: 'priya@example.com', password: 'priya@123' },
  { label: 'SwiftBus', role: 'Operator', email: 'ops@swiftbus.in', password: 'operator@123' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, initialMode = 'login', prefillEmail }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | 'operator'>('buyer');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setError(null);
    if (prefillEmail) setEmail(prefillEmail);
  }, [isOpen, initialMode, prefillEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? { email, password } : { name, email, phone, role, password };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign in failed. Check your email and password.');
      localStorage.setItem('seatrelay_token', data.token);
      localStorage.setItem('seatrelay_user', JSON.stringify(data.user));
      onSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} label={mode === 'login' ? 'Sign in' : 'Create account'} size="lg">
      <div className="grid md:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-coach p-8 text-coachink md:flex">
          <Logo size={40} />
          <div>
            <h2 className="display text-[2.5rem]">Welcome aboard.</h2>
            <p className="mt-3 text-coachink/75">Release a seat you can't use, or claim one someone else released. The operator puts the right name on it.</p>
          </div>
          <div className="-mx-2 opacity-90">
            <DeckPlan phase="reissued" showOthers={false} />
          </div>
        </aside>

        <div className="p-7 sm:p-9">
          <div className="pr-8">
            <Segmented
              id="auth-mode"
              value={mode}
              onChange={(m) => {
                setMode(m);
                setError(null);
              }}
              options={[
                { value: 'login', label: 'Sign in' },
                { value: 'register', label: 'Create account' },
              ]}
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-3.5 text-sm text-danger" role="alert">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                  className="space-y-4 overflow-hidden"
                >
                  <label className="block pt-0.5">
                    <span className="mb-1.5 block text-sm font-medium text-ink2">Full name, as on your ID</span>
                    <input className="field" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink2">Mobile number</span>
                    <input className="field" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />
                  </label>
                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-ink2">I'm here to</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v: 'buyer' as const, t: 'Find a seat' },
                        { v: 'seller' as const, t: 'Release a seat' },
                        { v: 'operator' as const, t: 'Run a fleet' },
                      ].map((o) => (
                        <button
                          type="button"
                          key={o.v}
                          onClick={() => setRole(o.v)}
                          aria-pressed={role === o.v}
                          className={cx(
                            'rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors',
                            role === o.v ? 'border-coach bg-coach text-coachink' : 'border-line text-ink2 hover:border-linestrong'
                          )}
                        >
                          {o.t}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink2">Email</span>
              <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink2">Password</span>
              <span className="relative block">
                <input
                  className="field pr-11"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-ink3 hover:text-ink"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <Button type="submit" size="lg" className="w-full" loading={isLoading}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          {mode === 'login' && (
            <div className="mt-8 border-t border-line pt-6">
              <p className="text-sm font-medium text-ink2">Demo accounts</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {DEMO.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    aria-label={`Use the ${d.label} demo account (${d.role})`}
                    onClick={() => {
                      setEmail(d.email);
                      setPassword(d.password);
                      setError(null);
                    }}
                    className={cx('rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-linestrong', email === d.email ? 'border-coach dark:border-accent' : 'border-line')}
                  >
                    <span className="block text-sm font-semibold text-ink">{d.label}</span>
                    <span className="block text-xs text-ink3">{d.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
