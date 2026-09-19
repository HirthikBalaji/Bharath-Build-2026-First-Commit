import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  Search,
  Menu,
  X,
  Route,
  Scale,
  MessageCircleQuestion,
  Network,
  PlayCircle,
  Command,
  LogOut,
  Ticket,
  Building2,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { Wordmark } from './Logo';
import { BerthGlyph, cx, EASE_OUT, Pill } from './ui';
import { Notification, User } from '../types';
import { initials, timeAgo } from '../lib/format';

type Tab = 'home' | 'search' | 'tickets' | 'operator' | 'transactions';

interface NavbarProps {
  currentUser: User | null;
  users: User[];
  onSelectUser: (user: User) => void;
  activeTab: string;
  setActiveTab: (tab: Tab) => void;
  notifications: Notification[];
  unreadCount: number;
  onOpenAwsModal: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  onRunCompleteDemo: () => void;
  onResetDemo: () => void;
  isDemoRunning: boolean;
  onOpenPalette: () => void;
  onJump: (sectionId: string) => void;
}

/** Closes a popover on outside click and Escape. */
function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
}

const panelMotion = {
  initial: { opacity: 0, y: -8, scale: 0.98, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -6, scale: 0.99, transition: { duration: 0.15 } },
  transition: { duration: 0.32, ease: EASE_OUT },
};

const notifIcon = (type: Notification['type']) =>
  type === 'SUCCESS' ? (
    <CheckCircle2 className="h-4 w-4 text-accent" />
  ) : type === 'WARNING' || type === 'ACTION_REQUIRED' ? (
    <AlertTriangle className="h-4 w-4 text-marigold" />
  ) : (
    <Info className="h-4 w-4 text-ink3" />
  );

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  onSelectUser,
  activeTab,
  setActiveTab,
  notifications,
  unreadCount,
  onOpenAwsModal,
  onOpenAuth,
  onLogout,
  onRunCompleteDemo,
  onResetDemo,
  isDemoRunning,
  onOpenPalette,
  onJump,
}) => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [raised, setRaised] = useState(false);
  const [menu, setMenu] = useState<null | 'platform' | 'bell' | 'user'>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useMotionValueEvent(scrollY, 'change', (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setRaised(v > 24);
    if (menu || mobileOpen) return;
    setHidden(v > 420 && v > prev + 4);
    if (v < prev - 4) setHidden(false);
  });

  const close = () => setMenu(null);
  const platformRef = useDismiss<HTMLDivElement>(menu === 'platform', close);
  const bellRef = useDismiss<HTMLDivElement>(menu === 'bell', close);
  const userRef = useDismiss<HTMLDivElement>(menu === 'user', close);

  const isOperator = currentUser?.role === 'operator';
  const links: Array<{ tab: Tab; label: string }> = [
    { tab: 'search', label: 'Find a seat' },
    { tab: 'tickets', label: 'My journeys' },
    { tab: 'transactions', label: 'Ledger' },
    ...(isOperator ? [{ tab: 'operator' as Tab, label: 'Dispatch' }] : []),
  ];

  const go = (tab: Tab) => {
    setActiveTab(tab);
    setMenu(null);
    setMobileOpen(false);
  };

  const personas = users.filter((u) => u.role === 'seller' || u.role === 'buyer');

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5"
        animate={{ y: hidden ? -96 : 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
      >
        <div className="mx-auto max-w-[1320px] pr-9 sm:pr-11">
          <div
            className={cx(
              'flex h-16 items-center justify-between gap-4 rounded-2xl pl-3 pr-2 transition-[background-color,box-shadow,border-color] duration-500',
              raised || menu ? 'border border-line bg-surface/85 shadow-lift backdrop-blur-xl' : 'border border-transparent'
            )}
          >
            <button onClick={() => go('home')} className="rounded-lg p-1" aria-label="SeatRelay home">
              <Wordmark size={32} />
            </button>

            {/* Primary navigation */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              {links.map((l) => {
                const active = activeTab === l.tab;
                return (
                  <button
                    key={l.tab}
                    onClick={() => go(l.tab)}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'relative h-10 rounded-lg px-3.5 text-[0.9375rem] font-medium transition-colors',
                      active ? 'text-ink' : 'text-ink2 hover:bg-surface2/70 hover:text-ink'
                    )}
                  >
                    {l.label}
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-3.5 -bottom-[3px] h-[3px] rounded-full bg-marigold"
                        transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                      />
                    )}
                  </button>
                );
              })}

              <div className="relative" ref={platformRef}>
                <button
                  onClick={() => setMenu(menu === 'platform' ? null : 'platform')}
                  aria-expanded={menu === 'platform'}
                  className={cx(
                    'flex h-10 items-center gap-1 rounded-lg px-3.5 text-[0.9375rem] font-medium transition-colors',
                    menu === 'platform' ? 'bg-surface2 text-ink' : 'text-ink2 hover:bg-surface2/70 hover:text-ink'
                  )}
                >
                  Platform
                  <motion.span animate={{ rotate: menu === 'platform' ? 180 : 0 }}>
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {menu === 'platform' && (
                    <motion.div
                      {...panelMotion}
                      className="absolute left-1/2 top-[calc(100%+14px)] w-[720px] -translate-x-1/2 origin-top overflow-hidden rounded-2xl border border-line bg-surface shadow-float"
                    >
                      <div className="grid grid-cols-[1fr_1fr_220px]">
                        <MenuColumn title="How it works">
                          <MenuItem icon={<Route />} title="The relay, stop by stop" body="Release, claim, reissue, refund." onClick={() => { close(); onJump('relay'); }} />
                          <MenuItem icon={<Scale />} title="Cancel or relay" body="What you get back, side by side." onClick={() => { close(); onJump('money'); }} />
                          <MenuItem icon={<MessageCircleQuestion />} title="Questions" body="Refunds, IDs and what if nobody buys." onClick={() => { close(); onJump('faq'); }} />
                        </MenuColumn>
                        <MenuColumn title="Under the hood">
                          <MenuItem icon={<Network />} title="Reference architecture" body="Step Functions, DynamoDB, EventBridge." onClick={() => { close(); onOpenAwsModal(); }} />
                          <MenuItem icon={<PlayCircle />} title="Live walkthrough" body="Run a full transfer end to end." onClick={() => { close(); onRunCompleteDemo(); }} disabled={isDemoRunning} />
                          <MenuItem icon={<Command />} title="Command menu" body="Jump anywhere with Ctrl K." onClick={() => { close(); onOpenPalette(); }} />
                        </MenuColumn>
                        <div className="relative m-2 flex flex-col justify-between overflow-hidden rounded-xl bg-coach p-5 text-coachink">
                          <BerthGlyph className="h-8 w-14" state="relay" />
                          <div>
                            <p className="display-md text-lg">Face value, always.</p>
                            <p className="mt-2 text-sm leading-snug text-coachink/75">A relayed seat never costs more than the fare printed on it.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenPalette}
                className="hidden h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm text-ink3 transition-colors hover:border-linestrong hover:text-ink md:flex"
                aria-label="Open command menu"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
                <kbd className="code rounded border border-line px-1.5 py-0.5 text-[0.625rem] text-ink3">Ctrl K</kbd>
              </button>

              {currentUser && (
                <div className="relative" ref={bellRef}>
                  <button
                    onClick={() => setMenu(menu === 'bell' ? null : 'bell')}
                    aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                    aria-expanded={menu === 'bell'}
                    className="relative grid h-10 w-10 place-items-center rounded-lg text-ink2 transition-colors hover:bg-surface2 hover:text-ink"
                  >
                    <Bell className="h-[19px] w-[19px]" strokeWidth={1.75} />
                    {unreadCount > 0 && (
                      <span className="num absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-marigold px-1 text-[0.625rem] font-bold text-marigoldink">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {menu === 'bell' && (
                      <motion.div
                        {...panelMotion}
                        className="absolute right-0 top-[calc(100%+14px)] w-[min(380px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-line bg-surface shadow-float"
                      >
                        <div className="flex items-center justify-between border-b border-line px-4 py-3">
                          <p className="font-semibold text-ink">Updates</p>
                          <span className="text-xs text-ink3">{notifications.length} total</span>
                        </div>
                        <div className="max-h-[360px] overflow-y-auto" data-lenis-prevent>
                          {notifications.length === 0 ? (
                            <p className="px-4 py-10 text-center text-sm text-ink3">Nothing new. We'll tell you when your seat moves.</p>
                          ) : (
                            notifications.map((n, i) => (
                              <motion.div
                                key={n.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                                className="flex gap-3 border-b border-line/70 px-4 py-3 last:border-0"
                              >
                                <span className="mt-0.5">{notifIcon(n.type)}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                                    {!n.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-marigold" />}
                                  </div>
                                  <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink2">{n.message}</p>
                                  <p className="mt-1 text-xs text-ink3">{timeAgo(n.createdAt)}</p>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {currentUser ? (
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setMenu(menu === 'user' ? null : 'user')}
                    aria-expanded={menu === 'user'}
                    aria-label="Account menu"
                    className="flex h-10 items-center gap-2 rounded-lg pl-1 pr-2 transition-colors hover:bg-surface2"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-coach text-[0.75rem] font-bold text-coachink">
                      {initials(currentUser.name)}
                    </span>
                    <span className="hidden text-left leading-tight xl:block">
                      <span className="block text-sm font-semibold text-ink">{currentUser.name.split(' ')[0]}</span>
                      <span className="block text-[0.6875rem] capitalize text-ink3">{currentUser.role}</span>
                    </span>
                    <ChevronDown className="hidden h-4 w-4 text-ink3 sm:block" />
                  </button>
                  <AnimatePresence>
                    {menu === 'user' && (
                      <motion.div
                        {...panelMotion}
                        className="absolute right-0 top-[calc(100%+14px)] w-[300px] origin-top-right overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-float"
                      >
                        <div className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-3">
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-coach text-sm font-bold text-coachink">
                            {initials(currentUser.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">{currentUser.name}</p>
                            <p className="truncate text-xs text-ink3">{currentUser.email}</p>
                          </div>
                          <Pill tone="coach" className="ml-auto capitalize">{currentUser.role}</Pill>
                        </div>

                        {personas.length > 1 && !isOperator && (
                          <div className="px-2 pb-1 pt-3">
                            <p className="kicker mb-2 text-ink3">Travel as</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {personas.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    onSelectUser(p);
                                    close();
                                  }}
                                  className={cx(
                                    'rounded-lg border px-2.5 py-2 text-left transition-colors',
                                    p.id === currentUser.id ? 'border-coach bg-coach/5 dark:border-accent' : 'border-line hover:border-linestrong'
                                  )}
                                >
                                  <span className="block truncate text-sm font-semibold text-ink">{p.name.split(' ')[0]}</span>
                                  <span className="block text-[0.6875rem] text-ink3">{p.role === 'seller' ? 'Releasing a seat' : 'Looking for one'}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-1.5 border-t border-line pt-1.5">
                          <UserMenuItem icon={<Ticket />} label="My journeys" onClick={() => go('tickets')} />
                          {isOperator && <UserMenuItem icon={<Building2 />} label="Dispatch console" onClick={() => go('operator')} />}
                          <UserMenuItem icon={<BookOpen />} label="Resale ledger" onClick={() => go('transactions')} />
                        </div>
                        <div className="mt-1.5 border-t border-line pt-1.5">
                          <p className="kicker px-3 pb-1 pt-2 text-ink3">Demo controls</p>
                          <UserMenuItem icon={<Zap />} label={isDemoRunning ? 'Walkthrough running' : 'Run live walkthrough'} onClick={() => { close(); onRunCompleteDemo(); }} disabled={isDemoRunning} />
                          <UserMenuItem icon={<RotateCcw />} label="Reset demo data" onClick={() => { close(); onResetDemo(); }} />
                        </div>
                        <div className="mt-1.5 border-t border-line pt-1.5">
                          <UserMenuItem icon={<LogOut />} label="Sign out" onClick={() => { close(); onLogout(); }} tone="danger" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden items-center gap-1.5 sm:flex">
                  <button onClick={() => onOpenAuth('login')} className="h-10 rounded-lg px-3.5 text-[0.9375rem] font-medium text-ink2 hover:bg-surface2 hover:text-ink">
                    Sign in
                  </button>
                  <button onClick={() => onOpenAuth('register')} className="h-10 rounded-[10px] bg-coach px-4 text-[0.9375rem] font-semibold text-coachink transition-colors hover:bg-coach2">
                    Create account
                  </button>
                </div>
              )}

              <button
                onClick={() => setMobileOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-lg text-ink transition-colors hover:bg-surface2 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu: the curtain draws across */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col bg-coach text-coachink lg:hidden"
            initial={{ clipPath: 'inset(0 0 0 100%)' }}
            animate={{ clipPath: 'inset(0 0 0 0%)' }}
            exit={{ clipPath: 'inset(0 0 0 100%)', transition: { duration: 0.4, ease: [0.65, 0, 0.35, 1] } }}
            transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex h-[4.75rem] items-center justify-between px-5">
              <Wordmark size={32} tone="light" />
              <button onClick={() => setMobileOpen(false)} className="mr-8 grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col justify-center gap-1 px-6">
              {[{ tab: 'home' as Tab, label: 'Home' }, ...links].map((l, i) => (
                <motion.button
                  key={l.tab}
                  onClick={() => go(l.tab)}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + i * 0.06, duration: 0.6, ease: EASE_OUT }}
                  className="display flex items-center justify-between border-b border-white/10 py-4 text-left text-[2.25rem]"
                >
                  {l.label}
                  <ArrowUpRight className={cx('h-6 w-6 transition-opacity', activeTab === l.tab ? 'text-marigold opacity-100' : 'opacity-30')} />
                </motion.button>
              ))}
            </nav>
            <motion.div
              className="grid grid-cols-2 gap-2 px-6 pb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button onClick={() => { setMobileOpen(false); onOpenAwsModal(); }} className="rounded-xl border border-white/15 px-4 py-3 text-left text-sm font-semibold">
                Architecture
              </button>
              <button onClick={() => { setMobileOpen(false); onRunCompleteDemo(); }} className="rounded-xl border border-white/15 px-4 py-3 text-left text-sm font-semibold">
                Live walkthrough
              </button>
              {currentUser ? (
                <button onClick={() => { setMobileOpen(false); onLogout(); }} className="col-span-2 rounded-xl bg-white/10 px-4 py-3 text-left text-sm font-semibold">
                  Sign out {currentUser.name.split(' ')[0]}
                </button>
              ) : (
                <button onClick={() => { setMobileOpen(false); onOpenAuth('login'); }} className="col-span-2 rounded-xl bg-marigold px-4 py-3 text-left text-sm font-semibold text-marigoldink">
                  Sign in
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const MenuColumn: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="p-3">
    <p className="kicker px-3 pb-2 pt-2 text-ink3">{title}</p>
    <div className="space-y-0.5">{children}</div>
  </div>
);

const MenuItem: React.FC<{ icon: React.ReactElement; title: string; body: string; onClick: () => void; disabled?: boolean }> = ({
  icon,
  title,
  body,
  onClick,
  disabled,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface2 disabled:opacity-50"
  >
    <span className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-line text-ink2 transition-colors group-hover:border-coach group-hover:bg-coach group-hover:text-coachink">
      {React.cloneElement(icon, { className: 'h-4 w-4', strokeWidth: 1.75 })}
    </span>
    <span>
      <span className="block text-sm font-semibold text-ink">{title}</span>
      <span className="block text-[0.8125rem] leading-snug text-ink3">{body}</span>
    </span>
  </button>
);

const UserMenuItem: React.FC<{ icon: React.ReactElement; label: string; onClick: () => void; tone?: 'danger'; disabled?: boolean }> = ({
  icon,
  label,
  onClick,
  tone,
  disabled,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cx(
      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50',
      tone === 'danger' ? 'text-danger hover:bg-danger/10' : 'text-ink2 hover:bg-surface2 hover:text-ink'
    )}
  >
    {React.cloneElement(icon, { className: 'h-4 w-4', strokeWidth: 1.75 })}
    {label}
  </button>
);
