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

  // Demo Runner State
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [awsModalOpen, setAwsModalOpen] = useState(false);
  const [demoSteps, setDemoSteps] = useState<Array<{ step: number; title: string; detail: string; timestamp: string }>>([]);
  const [demoNewTicket, setDemoNewTicket] = useState<Ticket | null>(null);

  // Initial Fetch
  useEffect(() => {
    fetchUsers();
    fetchBuses();
    fetchReissues();
    fetchTransactions();
  }, []);

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
        onRunCompleteDemo={handleRunCompleteDemo}
        isDemoRunning={isDemoRunning}
      />

      {/* Interactive Hackathon Demo Bar with Live Status & Controls */}
      <InteractiveDemoBar
        currentUser={currentUser}
        users={users}
        onSelectUser={(u) => setCurrentUser(u)}
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as any)}
        onRunDemo={handleRunCompleteDemo}
        onResetDemo={handleResetDemo}
        onOpenAwsModal={() => setAwsModalOpen(true)}
        isDemoRunning={isDemoRunning}
        tickets={tickets}
        reissues={reissues}
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
          <OperatorDashboard
            reissues={reissues}
            isLoading={isReissuesLoading}
            onRefresh={fetchReissues}
            onApprove={handleApproveReissue}
            onReject={handleRejectReissue}
          />
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-800">SeatRelay</span> — Face-Value Bus Ticket Resale Protocol
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Operator: SwiftBus Express</span>
            <span>Escrow: Verified</span>
            <span>Price: Original Fare Bound</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
