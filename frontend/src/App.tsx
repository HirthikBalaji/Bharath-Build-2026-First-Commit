import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  Search,
  Ticket as TicketIcon,
  BookOpen,
  Building2,
  Home,
  Lightbulb,
  Network,
  PlayCircle,
  RotateCcw,
  LogIn,
  LogOut,
  Route,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { SearchBuses } from './components/SearchBuses';
import { MyTickets } from './components/MyTickets';
import { OperatorDashboard } from './components/OperatorDashboard';
import { CheckoutModal } from './components/CheckoutModal';
import { DigitalTicketModal } from './components/DigitalTicketModal';
import { DemoProgressModal } from './components/DemoProgressModal';
import { TransactionLedger } from './components/TransactionLedger';
import { AwsArchitectureModal } from './components/AwsArchitectureModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { LightCord } from './components/LightCord';
import { Preloader } from './components/Preloader';
import { CommandPalette, PaletteAction } from './components/CommandPalette';
import { DeckPlan } from './components/DeckPlan';
import { Button, EASE_OUT } from './components/ui';
import { ThemeProvider, useTheme } from './lib/theme';
import { ToastProvider, useToast } from './lib/toast';
import { initSmoothScroll, scrollToId, scrollToTop } from './lib/scroll';
import { ProductionPortal } from './components/ProductionPortal';
import { User, Bus, Ticket, ReissueRequestItem, ResaleTransaction, Notification, ResaleSeatSummary } from './types';

type Tab = 'home' | 'search' | 'tickets' | 'operator' | 'transactions' | 'live';

const TITLES: Record<Tab, string> = {
  home: 'SeatRelay · Your seat finds its next rider',
  search: 'Find a seat · SeatRelay',
  tickets: 'My journeys · SeatRelay',
  operator: 'Dispatch · SeatRelay',
  transactions: 'Resale ledger · SeatRelay',
  live: 'Production Workspace · SeatRelay Live',
};

function Shell() {
  const { notify } = useToast();
  const { toggleTheme } = useTheme();

  // Navigation & User State
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data states
  const [buses, setBuses] = useState<Bus[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reissues, setReissues] = useState<ReissueRequestItem[]>([]);
  const [transactions, setTransactions] = useState<ResaleTransaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState({ from: 'Bangalore', to: 'Chennai', date: '2026-09-19' });

  // Loading states
  const [isBusesLoading, setIsBusesLoading] = useState(false);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);
  const [isReissuesLoading, setIsReissuesLoading] = useState(false);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  // Modals
  const [selectedSeatForCheckout, setSelectedSeatForCheckout] = useState<{ bus: Bus; seat: ResaleSeatSummary } | null>(null);
  const [selectedTicketForQR, setSelectedTicketForQR] = useState<Ticket | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authPrefill, setAuthPrefill] = useState<string | undefined>(undefined);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Demo Runner State
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [awsModalOpen, setAwsModalOpen] = useState(false);
  const [demoSteps, setDemoSteps] = useState<Array<{ step: number; title: string; detail: string; timestamp: string }>>([]);
  const [demoNewTicket, setDemoNewTicket] = useState<Ticket | null>(null);

  // Initial Fetch & Persistent Session Check
  useEffect(() => {
    initSmoothScroll();
    checkSavedSession();
    fetchUsers();
    fetchBuses();
    fetchReissues();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = TITLES[activeTab];
    scrollToTop(true);
    // Each page arrives with fresh data
    if (activeTab === 'search') fetchBuses();
    if (activeTab === 'operator') fetchReissues();
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'tickets' && currentUser) {
      fetchTickets(currentUser.id);
      fetchNotifications(currentUser.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Ctrl/Cmd + K opens the command menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const checkSavedSession = async () => {
    const token = localStorage.getItem('seatrelay_token');
    const savedUser = localStorage.getItem('seatrelay_user');
    if (token) {
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
          return;
        }
      } catch (e) {
        console.error('Session check failed', e);
      }
    }
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        /* ignore corrupt session */
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('seatrelay_token');
    localStorage.removeItem('seatrelay_user');
    setCurrentUser(null);
    setActiveTab('home');
    notify({ tone: 'info', title: 'Signed out', body: 'See you on the next trip.' });
  };

  // When currentUser changes, fetch their tickets and notifications
  useEffect(() => {
    if (currentUser) {
      fetchTickets(currentUser.id);
      fetchNotifications(currentUser.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
      if (data.length > 0 && !currentUser) {
        // Default to Rahul Sharma (seller) for realistic demo initial state
        const rahul = data.find((u: User) => u.role === 'seller') || data[0];
        setCurrentUser((cur) => cur ?? rahul);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBuses = async (from = searchQuery.from, to = searchQuery.to, date = searchQuery.date) => {
    setIsBusesLoading(true);
    setSearchQuery({ from, to, date });
    try {
      const res = await fetch(`/api/buses/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`);
      const data = await res.json();
      setBuses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      notify({ tone: 'error', title: 'Could not load coaches', body: 'Check that the SeatRelay API is running, then search again.' });
    } finally {
      setIsBusesLoading(false);
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('seatrelay_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (currentUser?.id) headers['x-user-id'] = currentUser.id;
    return headers;
  };

  const fetchTickets = async (userId: string) => {
    setIsTicketsLoading(true);
    try {
      const res = await fetch(`/api/tickets/my?userId=${userId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTicketsLoading(false);
    }
  };

  const fetchReissues = async () => {
    setIsReissuesLoading(true);
    try {
      const res = await fetch('/api/operator/reissues', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setReissues(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsReissuesLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setIsLedgerLoading(true);
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLedgerLoading(false);
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const res = await fetch(`/api/notifications/${userId}`);
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAll = () => {
    fetchReissues();
    fetchBuses();
    fetchTransactions();
    if (currentUser) {
      fetchTickets(currentUser.id);
      fetchNotifications(currentUser.id);
    }
  };

  // Operator Reissue Actions
  const handleApproveReissue = async (txId: string) => {
    const req = reissues.find((r) => r.transactionId === txId);
    try {
      const res = await fetch(`/api/operator/reissues/${txId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ operatorUserId: currentUser?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'The reissue did not go through.');
      notify({
        tone: 'success',
        title: req ? `Berth ${req.seat.seatNumber} reissued to ${req.newPassenger.name}` : 'Ticket reissued',
        body: req ? `${req.originalPassenger.ticketNumber} cancelled. Refund released to ${req.originalPassenger.name}.` : 'Old ticket cancelled, refund released.',
      });
      refreshAll();
    } catch (err: any) {
      notify({ tone: 'error', title: 'Reissue failed', body: err.message });
    }
  };

  const handleRejectReissue = async (txId: string, reason: string) => {
    try {
      const res = await fetch(`/api/operator/reissues/${txId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'The transfer could not be declined.');
      }
      notify({ tone: 'info', title: 'Transfer declined', body: "The buyer's payment is on its way back and the berth is on sale again." });
      refreshAll();
    } catch (err: any) {
      notify({ tone: 'error', title: 'Could not decline', body: err.message });
    }
  };

  // Checkout Success handler
  const handleCheckoutSuccess = () => {
    const seat = selectedSeatForCheckout?.seat;
    setSelectedSeatForCheckout(null);
    notify({
      tone: 'success',
      title: seat ? `Berth ${seat.seatNumber} is held for you` : 'Seat held',
      body: 'The operator reissues it in your name next. Your boarding pass will appear in My journeys.',
    });
    refreshAll();
  };

  // Automated Full Demo Runner
  const handleRunCompleteDemo = async () => {
    setIsDemoRunning(true);
    setDemoModalOpen(true);
    setDemoSteps([]);
    setDemoNewTicket(null);
    try {
      const res = await fetch('/demo/run-full-flow', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'The walkthrough stopped early.');
      setDemoSteps(data.steps || []);
      setDemoNewTicket(data.newTicket || null);
      refreshAll();
    } catch (err: any) {
      setDemoModalOpen(false);
      notify({ tone: 'error', title: 'Walkthrough stopped', body: `${err.message} Try Reset demo data, then run it again.` });
    } finally {
      setIsDemoRunning(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/demo/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed.');
      notify({ tone: 'success', title: 'Demo data reset', body: 'Rahul holds U12 again and the coach is sold out.' });
      fetchUsers();
      refreshAll();
    } catch (err: any) {
      notify({ tone: 'error', title: 'Could not reset', body: err.message });
    }
  };

  const openAuth = (mode: 'login' | 'register' = 'login', prefill?: string) => {
    setAuthModalMode(mode);
    setAuthPrefill(prefill);
    setAuthModalOpen(true);
  };

  const jump = useCallback(
    (id: string) => {
      if (activeTab !== 'home') {
        setActiveTab('home');
        window.setTimeout(() => scrollToId(id), 650);
      } else {
        scrollToId(id);
      }
    },
    [activeTab]
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const isOperator = currentUser?.role === 'operator';

  const paletteActions: PaletteAction[] = useMemo(
    () => [
      { id: 'home', group: 'Go to', label: 'Home', icon: <Home />, run: () => setActiveTab('home') },
      { id: 'search', group: 'Go to', label: 'Find a seat', hint: 'Search coaches', icon: <Search />, run: () => setActiveTab('search') },
      { id: 'tickets', group: 'Go to', label: 'My journeys', icon: <TicketIcon />, run: () => setActiveTab('tickets') },
      { id: 'ledger', group: 'Go to', label: 'Resale ledger', icon: <BookOpen />, run: () => setActiveTab('transactions') },
      { id: 'live', group: 'Go to', label: 'Live Production Portal', hint: 'Real Fleet & DigiLocker', icon: <ShieldCheck className="h-4 w-4" />, run: () => setActiveTab('live') },
      ...(isOperator ? [{ id: 'ops', group: 'Go to', label: 'Dispatch console', icon: <Building2 />, run: () => setActiveTab('operator') }] : []),
      { id: 'relay', group: 'Learn', label: 'The relay, stop by stop', icon: <Route />, run: () => jump('relay') },
      { id: 'arch', group: 'Learn', label: 'Reference architecture', hint: 'AWS', icon: <Network />, run: () => setAwsModalOpen(true) },
      { id: 'lights', group: 'Actions', label: 'Switch the lights', hint: 'Light or dark', icon: <Lightbulb />, run: () => toggleTheme() },
      { id: 'demo', group: 'Actions', label: 'Run live walkthrough', icon: <PlayCircle />, run: handleRunCompleteDemo },
      { id: 'reset', group: 'Actions', label: 'Reset demo data', icon: <RotateCcw />, run: handleResetDemo },
      currentUser
        ? { id: 'out', group: 'Account', label: `Sign out ${currentUser.name.split(' ')[0]}`, icon: <LogOut />, run: handleLogout }
        : { id: 'in', group: 'Account', label: 'Sign in', icon: <LogIn />, run: () => openAuth('login') },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOperator, currentUser, jump, toggleTheme]
  );

  // A thin marigold line sweeps the top edge as you read
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  return (
    <div className="flex min-h-screen flex-col bg-bg font-sans text-ink">
      <Preloader />
      <motion.div className="fixed inset-x-0 top-0 z-[66] h-[2px] origin-left bg-marigold" style={{ scaleX: progress }} />
      <LightCord hint />

      <Navbar
        currentUser={currentUser}
        users={users}
        onSelectUser={(u) => setCurrentUser(u)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        unreadCount={unreadCount}
        onOpenAwsModal={() => setAwsModalOpen(true)}
        onOpenAuth={(mode = 'login') => openAuth(mode)}
        onLogout={handleLogout}
        onRunCompleteDemo={handleRunCompleteDemo}
        onResetDemo={handleResetDemo}
        isDemoRunning={isDemoRunning}
        onOpenPalette={() => setPaletteOpen(true)}
        onJump={jump}
      />

      <main className="flex-1">
        {/* Enter-only transition: a page can never be left stranded mid-exit */}
        <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
          >
            {activeTab === 'home' && (
              <HomePage
                onSearchClick={() => setActiveTab('search')}
                onViewTicketsClick={() => setActiveTab('tickets')}
                onOperatorClick={() => setActiveTab('operator')}
                onRunDemo={handleRunCompleteDemo}
                isDemoRunning={isDemoRunning}
                currentUser={currentUser}
                onOpenAwsModal={() => setAwsModalOpen(true)}
                onSelectRole={(role, tab) => {
                  const u = users.find((user) => user.role === role);
                  if (u) setCurrentUser(u);
                  setActiveTab(tab as Tab);
                }}
              />
            )}

            {activeTab === 'search' && (
              <SearchBuses
                buses={buses}
                isLoading={isBusesLoading}
                initial={searchQuery}
                onSearch={(f, t, d) => fetchBuses(f, t, d)}
                onSelectResaleSeat={(bus, seat) => {
                  if (currentUser?.role === 'buyer') {
                    setSelectedSeatForCheckout({ bus, seat });
                    return;
                  }
                  // Demo convenience: step into the demo buyer so the seller is not buying their own seat
                  const demoBuyer = users.find((u) => u.role === 'buyer');
                  if (!demoBuyer) {
                    openAuth('login');
                    return;
                  }
                  setCurrentUser(demoBuyer);
                  notify({ tone: 'info', title: `Claiming as ${demoBuyer.name}`, body: 'Switched to the demo buyer. Sign in to claim as yourself.' });
                  setSelectedSeatForCheckout({ bus, seat });
                }}
              />
            )}

            {activeTab === 'tickets' &&
              (currentUser ? (
                <MyTickets
                  currentUser={currentUser}
                  tickets={tickets}
                  isLoading={isTicketsLoading}
                  onRefresh={() => {
                    fetchTickets(currentUser.id);
                    fetchNotifications(currentUser.id);
                    fetchBuses();
                  }}
                  onViewQR={(t) => setSelectedTicketForQR(t)}
                />
              ) : (
                <Gate
                  title="Sign in to see your journeys."
                  body="Your tickets, released seats and refunds live here."
                  action={<Button size="lg" onClick={() => openAuth('login')}>Sign in</Button>}
                />
              ))}

            {activeTab === 'operator' &&
              (isOperator ? (
                <OperatorDashboard
                  reissues={reissues}
                  isLoading={isReissuesLoading}
                  onRefresh={fetchReissues}
                  onApprove={handleApproveReissue}
                  onReject={handleRejectReissue}
                />
              ) : (
                <Gate
                  title="Dispatch is for operator staff."
                  body={
                    <>
                      Reissuing a ticket changes who is on the manifest, so only signed-in operators can do it. Use the SwiftBus demo account,{' '}
                      <span className="code text-ink">ops@swiftbus.in</span>.
                    </>
                  }
                  action={
                    <Button size="lg" onClick={() => openAuth('login', 'ops@swiftbus.in')}>
                      <Lock className="h-4 w-4" />
                      Sign in as operator
                    </Button>
                  }
                />
              ))}

            {activeTab === 'transactions' && <TransactionLedger transactions={transactions} isLoading={isLedgerLoading} onRefresh={fetchTransactions} />}

            {activeTab === 'live' && (
              <ProductionPortal
                currentUser={currentUser}
                onOpenAuth={(mode = 'login') => openAuth(mode)}
                onLogout={handleLogout}
                onSelectResaleSeat={(bus, seat) => {
                  if (currentUser?.role === 'buyer') {
                    setSelectedSeatForCheckout({ bus, seat });
                    return;
                  }
                  const demoBuyer = users.find((u) => u.role === 'buyer');
                  if (!demoBuyer) {
                    openAuth('login');
                    return;
                  }
                  setCurrentUser(demoBuyer);
                  setSelectedSeatForCheckout({ bus, seat });
                }}
              />
            )}
        </motion.div>
      </main>

      <Footer onNavigate={setActiveTab} onJump={jump} onOpenAwsModal={() => setAwsModalOpen(true)} isOperator={isOperator} />

      {/* Checkout */}
      {selectedSeatForCheckout && currentUser && (
        <CheckoutModal
          bus={selectedSeatForCheckout.bus}
          seat={selectedSeatForCheckout.seat}
          currentUser={currentUser}
          onClose={() => setSelectedSeatForCheckout(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* Boarding pass */}
      {selectedTicketForQR && <DigitalTicketModal ticket={selectedTicketForQR} onClose={() => setSelectedTicketForQR(null)} />}

      <DemoProgressModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        isRunning={isDemoRunning}
        steps={demoSteps}
        newTicket={demoNewTicket}
        onViewTicket={(t) => {
          setDemoModalOpen(false);
          setSelectedTicketForQR(t);
        }}
      />

      <AwsArchitectureModal isOpen={awsModalOpen} onClose={() => setAwsModalOpen(false)} />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        prefillEmail={authPrefill}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          fetchUsers();
          notify({ tone: 'success', title: `Welcome aboard, ${user.name.split(' ')[0]}` });
          if (user.role === 'seller') setActiveTab('tickets');
          else if (user.role === 'operator') setActiveTab('operator');
          else setActiveTab('search');
        }}
      />

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} actions={paletteActions} />
    </div>
  );
}

const Gate: React.FC<{ title: string; body: React.ReactNode; action: React.ReactNode }> = ({ title, body, action }) => (
  <div className="mx-auto w-full max-w-[1320px] px-5 pb-12 pt-32 sm:px-8 sm:pt-40">
    <div className="mx-auto grid max-w-4xl items-center gap-10 rounded-2xl border border-line bg-surface p-8 sm:p-12 md:grid-cols-[1.1fr_0.9fr]">
      <div>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface2 text-ink2">
          <Lock className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h1 className="display-md mt-6 text-[2rem] text-ink">{title}</h1>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink2">{body}</p>
        <div className="mt-8">{action}</div>
      </div>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 0.55 }} transition={{ duration: 0.8, ease: EASE_OUT }} className="hidden md:block">
        <DeckPlan phase="booked" showOthers={false} />
      </motion.div>
    </div>
  </div>
);

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
