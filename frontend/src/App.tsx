import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { InteractiveDemoBar } from './components/InteractiveDemoBar';
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
import { Logo } from './components/Logo';
import { User, Bus, Ticket, ReissueRequestItem, ResaleTransaction, Notification, ResaleSeatSummary } from './types';

export function App() {
  // Navigation & User State
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'tickets' | 'operator' | 'transactions'>('home');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data states
  const [buses, setBuses] = useState<Bus[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reissues, setReissues] = useState<ReissueRequestItem[]>([]);
  const [transactions, setTransactions] = useState<ResaleTransaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  // Demo Runner State
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [awsModalOpen, setAwsModalOpen] = useState(false);
  const [demoSteps, setDemoSteps] = useState<Array<{ step: number; title: string; detail: string; timestamp: string }>>([]);
  const [demoNewTicket, setDemoNewTicket] = useState<Ticket | null>(null);

  // Initial Fetch & Persistent Session Check
  useEffect(() => {
    checkSavedSession();
    fetchUsers();
    fetchBuses();
    fetchReissues();
    fetchTransactions();
  }, []);

  const checkSavedSession = async () => {
    const token = localStorage.getItem('seatrelay_token');
    const savedUser = localStorage.getItem('seatrelay_user');
    if (token) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
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
      } catch (e) {}
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('seatrelay_token');
    localStorage.removeItem('seatrelay_user');
    setCurrentUser(null);
    setActiveTab('home');
  };

  // When currentUser changes, fetch their tickets and notifications
  useEffect(() => {
    if (currentUser) {
      fetchTickets(currentUser.id);
      fetchNotifications(currentUser.id);
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
      if (data.length > 0 && !currentUser) {
        // Default to Rahul Sharma (seller) for realistic demo initial state
        const rahul = data.find((u: User) => u.role === 'seller') || data[0];
        setCurrentUser(rahul);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBuses = async (from = 'Bangalore', to = 'Chennai', date = '2026-09-19') => {
    setIsBusesLoading(true);
    try {
      const res = await fetch(`/api/buses/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`);
      const data = await res.json();
      setBuses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBusesLoading(false);
    }
  };

  const fetchTickets = async (userId: string) => {
    setIsTicketsLoading(true);
    try {
      const res = await fetch(`/api/tickets/my?userId=${userId}`);
      const data = await res.json();
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTicketsLoading(false);
    }
  };

  const fetchReissues = async () => {
    setIsReissuesLoading(true);
    try {
      const res = await fetch('/api/operator/reissues');
      const data = await res.json();
      setReissues(data);
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
      setTransactions(data);
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
      setNotifications(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Operator Reissue Actions
  const handleApproveReissue = async (txId: string) => {
    try {
      const res = await fetch(`/api/operator/reissues/${txId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorUserId: currentUser?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve reissue');

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      fetchReissues();
      fetchBuses();
      fetchTransactions();
      if (currentUser) fetchTickets(currentUser.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectReissue = async (txId: string, reason: string) => {
    try {
      const res = await fetch(`/api/operator/reissues/${txId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to reject reissue');
      }
      fetchReissues();
      fetchBuses();
      fetchTransactions();
      if (currentUser) fetchTickets(currentUser.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Checkout Success handler
  const handleCheckoutSuccess = (purchaseData: any) => {
    setSelectedSeatForCheckout(null);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    fetchBuses();
    fetchReissues();
    fetchTransactions();
    if (currentUser) fetchTickets(currentUser.id);
    // Switch to operator to illustrate next step
    setActiveTab('operator');
  };

  // Automated Full Demo Runner (Section 17)
  const handleRunCompleteDemo = async () => {
    setIsDemoRunning(true);
    setDemoModalOpen(true);
    setDemoSteps([]);
    setDemoNewTicket(null);

    try {
      const res = await fetch('/demo/run-full-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Demo execution failed');

      setDemoSteps(data.steps || []);
      setDemoNewTicket(data.newTicket || null);
      confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });

      // Refresh all views
      fetchBuses();
      fetchReissues();
      fetchTransactions();
      if (currentUser) fetchTickets(currentUser.id);
    } catch (err: any) {
      alert(`Demo Error: ${err.message}`);
    } finally {
      setIsDemoRunning(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/demo/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset demo state');
      alert('Demo state reset successfully to pristine initial database.');
      fetchUsers();
      fetchBuses();
      fetchReissues();
      fetchTransactions();
      if (currentUser) fetchTickets(currentUser.id);
    } catch (err: any) {
      alert(`Reset Error: ${err.message}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        currentUser={currentUser}
        users={users}
        onSelectUser={(u) => setCurrentUser(u)}
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as any)}
        unreadCount={unreadCount}
        onOpenNotifications={() => {
          if (notifications.length === 0) {
            alert('No notifications right now.');
          } else {
            alert(notifications.map((n) => `• [${n.type}] ${n.title}\n${n.message}`).join('\n\n'));
          }
        }}
        onOpenAwsModal={() => setAwsModalOpen(true)}
        onOpenAuth={(mode = 'login') => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onRunCompleteDemo={handleRunCompleteDemo}
        isDemoRunning={isDemoRunning}
      />

      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            onSearchClick={() => setActiveTab('search')}
            onViewTicketsClick={() => setActiveTab('tickets')}
            onOperatorClick={() => setActiveTab('operator')}
            onRunDemo={handleRunCompleteDemo}
            isDemoRunning={isDemoRunning}
            currentUser={currentUser}
            onSelectRole={(role, tab) => {
              const u = users.find((user) => user.role === role);
              if (u) setCurrentUser(u);
              setActiveTab(tab as any);
            }}
          />
        )}

        {activeTab === 'search' && (
          <SearchBuses
            buses={buses}
            isLoading={isBusesLoading}
            onSearch={(f, t, d) => fetchBuses(f, t, d)}
            onSelectResaleSeat={(bus, seat) => {
              // Ensure we are shopping as Priya (buyer) if not already
              const buyerUser = users.find((u) => u.role === 'buyer') || currentUser;
              if (buyerUser) setCurrentUser(buyerUser);
              setSelectedSeatForCheckout({ bus, seat });
            }}
          />
        )}

        {activeTab === 'tickets' && currentUser && (
          <MyTickets
            currentUser={currentUser}
            tickets={tickets}
            isLoading={isTicketsLoading}
            onRefresh={() => fetchTickets(currentUser.id)}
            onViewQR={(t) => setSelectedTicketForQR(t)}
          />
        )}

        {activeTab === 'operator' && (
          currentUser?.role === 'operator' ? (
            <OperatorDashboard
              reissues={reissues}
              isLoading={isReissuesLoading}
              onRefresh={fetchReissues}
              onApprove={handleApproveReissue}
              onReject={handleRejectReissue}
            />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 font-black">
                🔒
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Restricted Access</h3>
              <p className="text-sm text-slate-500 mb-6">
                The Operator Dispatch Console is restricted to verified bus fleet operators. Please log in with operator credentials (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-slate-800">ops@swiftbus.in</code>).
              </p>
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all"
              >
                Sign In as Operator
              </button>
            </div>
          )
        )}

        {activeTab === 'transactions' && (
          <TransactionLedger
            transactions={transactions}
            isLoading={isLedgerLoading}
            onRefresh={fetchTransactions}
          />
        )}
      </main>

      {/* Checkout Modal */}
      {selectedSeatForCheckout && currentUser && (
        <CheckoutModal
          bus={selectedSeatForCheckout.bus}
          seat={selectedSeatForCheckout.seat}
          currentUser={currentUser}
          onClose={() => setSelectedSeatForCheckout(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* Digital Ticket Modal with verified QR */}
      {selectedTicketForQR && (
        <DigitalTicketModal
          ticket={selectedTicketForQR}
          onClose={() => setSelectedTicketForQR(null)}
        />
      )}

      {/* Complete Demo Progress Modal */}
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

      {/* AWS Architecture & Step Functions Modal (Hackathon Judges Spec) */}
      <AwsArchitectureModal
        isOpen={awsModalOpen}
        onClose={() => setAwsModalOpen(false)}
      />

      {/* Production Real Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          fetchUsers();
          if (user.role === 'seller') setActiveTab('tickets');
          else if (user.role === 'operator') setActiveTab('operator');
          else setActiveTab('search');
        }}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-10 text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <Logo size={34} />
              <div>
                <span className="text-base font-black text-white">Seat<span className="text-emerald-500">Relay</span></span>
                <p className="text-[11px] text-slate-400">Authorized Passenger Reissuance & Resale Platform</p>
              </div>
            </div>

            {/* Compliance badges */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>DPDP Act 2023 Compliant</span>
              </span>
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300">
                256-Bit Escrow Vault
              </span>
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-amber-300">
                Zero Scalping Policy
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>
              © {new Date().getFullYear()} SeatRelay Technologies Inc. Built for carrier-integrated reissuance. All passenger tickets are verified by carrier GDS systems prior to boarding.
            </p>
            <div className="flex items-center gap-4">
              <span className="hover:text-slate-300 cursor-pointer">Carrier Manifest Terms</span>
              <span>•</span>
              <span className="hover:text-slate-300 cursor-pointer">Data Privacy & ID Masking</span>
              <span>•</span>
              <span className="hover:text-slate-300 cursor-pointer">Escrow Settlement</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
