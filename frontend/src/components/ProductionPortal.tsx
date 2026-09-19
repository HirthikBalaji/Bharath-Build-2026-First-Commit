import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BusFront, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  Users, 
  Ticket, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronRight,
  LogOut,
  UserCheck
} from 'lucide-react';
import { Bus, User, Seat } from '../types';
import { inr, formatTime, formatDate, seatTypeLabel, maskId } from '../lib/format';
import { Button, BerthGlyph, Pill, Modal, cx, EASE_OUT } from './ui';

interface ProductionPortalProps {
  currentUser: User | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  onSelectResaleSeat: (bus: Bus, seat: any) => void;
}

export const ProductionPortal: React.FC<ProductionPortalProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onSelectResaleSeat
}) => {
  const [subTab, setSubTab] = useState<'marketplace' | 'fleet' | 'direct_booking' | 'kyc'>('marketplace');
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Bus Form State
  const [busNumber, setBusNumber] = useState('');
  const [busType, setBusType] = useState('AC Sleeper (2+1)');
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().slice(0, 10));
  const [departureTime, setDepartureTime] = useState('22:00');
  const [arrivalTime, setArrivalTime] = useState('06:00');
  const [baseFare, setBaseFare] = useState('850');
  const [seatCount, setSeatCount] = useState('12');
  const [isSubmittingBus, setIsSubmittingBus] = useState(false);

  // Direct Booking State
  const [selectedBusForDirect, setSelectedBusForDirect] = useState<Bus | null>(null);
  const [directSeats, setDirectSeats] = useState<any[]>([]);
  const [selectedSeatNumber, setSelectedSeatNumber] = useState('');
  const [directPassengerName, setDirectPassengerName] = useState('');
  const [directPassengerAge, setDirectPassengerAge] = useState('25');
  const [directPassengerGender, setDirectPassengerGender] = useState('Male');
  const [directPassengerPhone, setDirectPassengerPhone] = useState('');
  const [directAadhaar, setDirectAadhaar] = useState('');
  const [isBookingDirect, setIsBookingDirect] = useState(false);
  const [directBookingSuccess, setDirectBookingSuccess] = useState<any>(null);

  // DigiLocker Testing State
  const [testAadhaar, setTestAadhaar] = useState('');
  const [testTxnId, setTestTxnId] = useState<string | null>(null);
  const [testOtp, setTestOtp] = useState('');
  const [testKycResult, setTestKycResult] = useState<any>(null);
  const [isTestingKyc, setIsTestingKyc] = useState(false);

  const isOperator = currentUser?.role === 'operator';

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('seatrelay_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (currentUser?.id) headers['x-user-id'] = currentUser.id;
    return headers;
  };

  const fetchLiveBuses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/buses/search?live=true');
      const data = await res.json();
      setBuses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveBuses();
  }, []);

  const handleCreateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOperator) {
      setErrorMessage('Only verified operators can register new coaches.');
      return;
    }
    setIsSubmittingBus(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const count = Math.max(4, Math.min(36, parseInt(seatCount) || 12));
      const seats = [];
      for (let i = 1; i <= Math.ceil(count / 2); i++) {
        seats.push({ seatNumber: `U${i}`, seatType: 'UPPER_BERTH' });
      }
      for (let i = 1; i <= Math.floor(count / 2); i++) {
        seats.push({ seatNumber: `L${i}`, seatType: 'LOWER_BERTH' });
      }

      const depIso = `${travelDate}T${departureTime}:00.000Z`;
      const arrIso = `${travelDate}T${arrivalTime}:00.000Z`;

      const res = await fetch('/api/operator/buses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          busNumber,
          busType,
          routeFrom,
          routeTo,
          departureTime: depIso,
          arrivalTime: arrIso,
          travelDate,
          baseFare: parseFloat(baseFare),
          seats
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add coach to fleet');

      setSuccessMessage(`Coach ${busNumber.toUpperCase()} added successfully with ${count} seats.`);
      setBusNumber('');
      setRouteFrom('');
      setRouteTo('');
      fetchLiveBuses();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmittingBus(false);
    }
  };

  const handleDeleteBus = async (busId: string) => {
    if (!confirm('Are you sure you want to remove this coach from the live fleet?')) return;
    try {
      const res = await fetch(`/api/operator/buses/${busId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Could not delete coach');
      }
      setSuccessMessage('Coach removed from fleet.');
      fetchLiveBuses();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const loadSeatsForBus = async (busId: string) => {
    try {
      const res = await fetch(`/api/buses/${busId}/seats`);
      if (res.ok) {
        const data = await res.json();
        const available = (Array.isArray(data) ? data : []).filter((s: any) => s.status === 'AVAILABLE');
        setDirectSeats(available);
        if (available.length > 0) {
          setSelectedSeatNumber(available[0].seatNumber);
        } else {
          setSelectedSeatNumber('');
        }
      }
    } catch (err) {
      console.error('Error fetching seats:', err);
    }
  };

  const handleStartDirectBooking = (bus: Bus) => {
    setSelectedBusForDirect(bus);
    setDirectBookingSuccess(null);
    loadSeatsForBus(bus.id);
    setSubTab('direct_booking');
  };

  const handleBookDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusForDirect || !selectedSeatNumber) {
      setErrorMessage('Please select a seat');
      return;
    }
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    setIsBookingDirect(true);
    setErrorMessage(null);
    try {
      // Find seat id
      const seatId = `seat_${selectedBusForDirect.id}_${selectedSeatNumber}`;
      const res = await fetch('/api/tickets/book-direct', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          busId: selectedBusForDirect.id,
          seatId,
          passengerName: directPassengerName || currentUser.name,
          passengerAge: directPassengerAge,
          passengerGender: directPassengerGender,
          phone: directPassengerPhone || currentUser.phone,
          govIdType: 'Aadhaar Card',
          govIdNumber: directAadhaar || 'XXXX'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setDirectBookingSuccess(data.ticket);
      fetchLiveBuses();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsBookingDirect(false);
    }
  };

  // DigiLocker test runner
  const handleInitiateTestKyc = async () => {
    setIsTestingKyc(true);
    setTestKycResult(null);
    try {
      const res = await fetch('/api/digilocker/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarNumber: testAadhaar || '987654321012' })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Initiate failed');
      setTestTxnId(d.txnId);
      setTestOtp('123456');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsTestingKyc(false);
    }
  };

  const handleVerifyTestKyc = async () => {
    setIsTestingKyc(true);
    try {
      const res = await fetch('/api/digilocker/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnId: testTxnId,
          otp: testOtp,
          expectedName: currentUser?.name || 'Verified Citizen'
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Verification failed');
      setTestKycResult(d);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsTestingKyc(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 pb-16 pt-32 sm:px-8 sm:pt-36">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="h-4 w-4" /> Live Production Product Workspace
          </div>
          <h1 className="display text-[clamp(2.2rem,5vw,3.5rem)] text-ink">
            SeatRelay Real-Time GDS
          </h1>
          <p className="mt-2 text-ink2 max-w-2xl text-[1.0625rem]">
            Real bus fleets, DigiLocker Aadhaar e-KYC integration, and authorized manifest reissuance without mock data.
          </p>
        </div>

        {/* User / Session Box */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3 bg-surface border border-line rounded-2xl p-2.5 px-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-coach text-coachink flex items-center justify-center font-bold text-sm">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-ink leading-tight">{currentUser.name}</p>
                <p className="text-xs text-ink3 capitalize">{currentUser.role} · {currentUser.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="ml-2 text-ink3 hover:text-danger p-1 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={() => onOpenAuth('login')} variant="ghost">Sign In</Button>
              <Button onClick={() => onOpenAuth('register')}>Register Real Account</Button>
            </div>
          )}
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-line py-4">
        {[
          { id: 'marketplace', label: 'Live Coach Inventory & Resales', icon: BusFront },
          { id: 'fleet', label: isOperator ? 'Operator Fleet Console' : 'Operator Fleet (Restricted)', icon: Users },
          { id: 'direct_booking', label: 'Direct Ticket Booking', icon: Ticket },
          { id: 'kyc', label: 'DigiLocker Identity Gateway', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={cx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap',
                active ? 'bg-ink text-surface dark:bg-surface2 dark:text-ink shadow-sm' : 'text-ink2 hover:bg-surface2 hover:text-ink'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-medium">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm font-medium">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: MARKETPLACE */}
      {subTab === 'marketplace' && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">Active Coaches in Service</h2>
              <p className="text-sm text-ink3">Real scheduled departures with live seat availability.</p>
            </div>
            <Button variant="ghost" onClick={fetchLiveBuses} loading={isLoading}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>

          {buses.length === 0 ? (
            <div className="text-center py-16 bg-surface rounded-2xl border border-line">
              <BusFront className="h-12 w-12 text-ink3 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-ink">Fleet Inventory is Empty</h3>
              <p className="text-sm text-ink2 mt-1 max-w-md mx-auto">
                No coaches have been registered yet. Authenticate as an authorized fleet operator to publish coaches, configure layouts, and schedule departures.
              </p>
              {isOperator ? (
                <Button className="mt-5" onClick={() => setSubTab('fleet')}>
                  Open Fleet Management
                </Button>
              ) : (
                <Button className="mt-5" variant="quiet" onClick={() => onOpenAuth('login')}>
                  Sign in as Operator
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {buses.map((bus) => (
                <div key={bus.id} className="bg-surface rounded-2xl border border-line p-6 hover:shadow-lift transition-all">
                  <div className="grid md:grid-cols-[1.4fr_1fr_1fr_auto] gap-6 items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-lg">{bus.routeFrom} → {bus.routeTo}</span>
                        {bus.isSoldOut ? (
                          <Pill tone="danger">Sold Out</Pill>
                        ) : (
                          <Pill tone="coach">{bus.availableDirect} Seats Open</Pill>
                        )}
                        {bus.resaleAvailableCount > 0 && (
                          <Pill tone="marigold">♻️ {bus.resaleAvailableCount} Relayed</Pill>
                        )}
                      </div>
                      <p className="text-xs text-ink3 mt-1">
                        {bus.operator} · {bus.busType} · <span className="code font-mono">{bus.busNumber}</span>
                      </p>
                    </div>

                    <div className="text-sm text-ink2">
                      <p className="font-semibold text-ink">{formatDate(bus.travelDate)}</p>
                      <p className="text-xs text-ink3">{formatTime(bus.departureTime)} departure</p>
                    </div>

                    <div>
                      <p className="text-xs text-ink3">Base Fare</p>
                      <p className="text-xl font-bold text-ink">{inr(bus.baseFare)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!bus.isSoldOut && (
                        <Button size="sm" variant="ghost" onClick={() => handleStartDirectBooking(bus)}>
                          Book Direct
                        </Button>
                      )}
                      {bus.resaleAvailableCount > 0 && (
                        <Button size="sm" onClick={() => onSelectResaleSeat(bus, bus.resaleSeats[0])}>
                          Claim Relayed Berth
                        </Button>
                      )}
                      {isOperator && (
                        <button
                          onClick={() => handleDeleteBus(bus.id)}
                          className="p-2 text-ink3 hover:text-danger transition-colors rounded-lg hover:bg-danger/10"
                          title="Remove coach"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OPERATOR FLEET MANAGEMENT */}
      {subTab === 'fleet' && (
        <div className="mt-8 space-y-8">
          {!isOperator ? (
            <div className="max-w-md mx-auto py-16 text-center bg-surface border border-line rounded-2xl p-8">
              <ShieldCheck className="h-12 w-12 text-marigold mx-auto mb-4" />
              <h3 className="text-xl font-bold text-ink">Operator Authorization Required</h3>
              <p className="text-sm text-ink2 mt-2">
                This console allows adding buses, defining deck plans, and scheduling real-time routes. Sign in with operator privileges to access.
              </p>
              <Button className="mt-6 w-full" onClick={() => onOpenAuth('login')}>
                Sign in as Operator
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
              {/* Form: Add New Bus */}
              <div className="bg-surface rounded-2xl border border-line p-6 sm:p-8">
                <h2 className="text-xl font-bold text-ink mb-1">Add Coach to Live Fleet</h2>
                <p className="text-sm text-ink3 mb-6">Create real routes, departure times, and seat capacity.</p>

                <form onSubmit={handleCreateBus} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-xs font-semibold text-ink2 block mb-1">Bus Number / Reg</span>
                      <input
                        required
                        value={busNumber}
                        onChange={(e) => setBusNumber(e.target.value)}
                        placeholder="KA-01-F-1234"
                        className="field code uppercase"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-ink2 block mb-1">Coach Type</span>
                      <select value={busType} onChange={(e) => setBusType(e.target.value)} className="field">
                        <option>AC Sleeper (2+1)</option>
                        <option>Multi-Axle Volvo (2+2)</option>
                        <option>Mercedes Super Luxury</option>
                        <option>Electric Intercity Coach</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-xs font-semibold text-ink2 block mb-1">Origin City</span>
                      <input
                        required
                        value={routeFrom}
                        onChange={(e) => setRouteFrom(e.target.value)}
                        placeholder="e.g. Bangalore"
                        className="field"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-ink2 block mb-1">Destination City</span>
                      <input
                        required
                        value={routeTo}
                        onChange={(e) => setRouteTo(e.target.value)}
                        placeholder="e.g. Hyderabad"
                        className="field"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-ink2 block mb-1">Travel Date</span>
                      <input
                        type="date"
                        required
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="field"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-ink2 block mb-1">Departure</span>
                      <input
                        type="time"
                        required
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        className="field"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-ink2 block mb-1">Arrival</span>
                      <input
                        type="time"
                        required
                        value={arrivalTime}
                        onChange={(e) => setArrivalTime(e.target.value)}
                        className="field"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-xs font-semibold text-ink2 block mb-1">Ticket Fare (₹)</span>
                      <input
                        type="number"
                        required
                        min={100}
                        value={baseFare}
                        onChange={(e) => setBaseFare(e.target.value)}
                        className="field num"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-ink2 block mb-1">Total Berths / Seats</span>
                      <input
                        type="number"
                        required
                        min={4}
                        max={36}
                        value={seatCount}
                        onChange={(e) => setSeatCount(e.target.value)}
                        className="field num"
                      />
                    </label>
                  </div>

                  <Button type="submit" className="w-full mt-4" loading={isSubmittingBus}>
                    <Plus className="h-4 w-4" /> Register & Publish Coach
                  </Button>
                </form>
              </div>

              {/* Current Fleet List */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-ink">Active Fleet Manifest ({buses.length})</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {buses.map((b) => (
                    <div key={b.id} className="bg-surface rounded-xl border border-line p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-ink text-sm">{b.busNumber} · {b.routeFrom} → {b.routeTo}</p>
                        <p className="text-xs text-ink3">{b.busType} · {b.totalSeats} seats · {inr(b.baseFare)}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteBus(b.id)}
                        className="p-2 text-ink3 hover:text-danger rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DIRECT TICKET BOOKING */}
      {subTab === 'direct_booking' && (
        <div className="mt-8 max-w-2xl mx-auto bg-surface rounded-2xl border border-line p-6 sm:p-8">
          <h2 className="text-xl font-bold text-ink">Direct Ticket Reservation Desk</h2>
          <p className="text-sm text-ink3 mb-6">Book initial passenger tickets into the manifest from zero.</p>

          {directBookingSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-ink">Ticket Confirmed!</h3>
              <p className="text-sm text-ink2">
                Ticket Number <span className="code font-bold text-ink">{directBookingSuccess.ticketNumber}</span> issued for passenger <span className="font-bold text-ink">{directBookingSuccess.passengerName}</span>.
              </p>
              {directBookingSuccess.qrCode && (
                <img src={directBookingSuccess.qrCode} alt="QR Code" className="mx-auto h-44 w-44 rounded-xl border border-line shadow-sm" />
              )}
              <div className="flex gap-2 justify-center pt-4">
                <Button variant="ghost" onClick={() => setDirectBookingSuccess(null)}>Book Another</Button>
                <Button onClick={() => setSubTab('marketplace')}>View Coaches</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBookDirect} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-ink2 block mb-1">Select Coach</span>
                <select
                  className="field"
                  value={selectedBusForDirect?.id || ''}
                  onChange={(e) => {
                    const b = buses.find((x) => x.id === e.target.value);
                    setSelectedBusForDirect(b || null);
                    if (b) {
                      loadSeatsForBus(b.id);
                    } else {
                      setDirectSeats([]);
                      setSelectedSeatNumber('');
                    }
                  }}
                  required
                >
                  <option value="">-- Choose a coach --</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.busNumber} ({b.routeFrom} → {b.routeTo} · {b.availableDirect} open)
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-ink2 block mb-1">Available Berth / Seat</span>
                  {directSeats.length > 0 ? (
                    <select
                      required
                      value={selectedSeatNumber}
                      onChange={(e) => setSelectedSeatNumber(e.target.value)}
                      className="field font-mono"
                    >
                      {directSeats.map((s) => (
                        <option key={s.id || s.seatNumber} value={s.seatNumber}>
                          Seat {s.seatNumber} ({seatTypeLabel(s.seatType)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      required
                      placeholder="e.g. U1, L2"
                      value={selectedSeatNumber}
                      onChange={(e) => setSelectedSeatNumber(e.target.value.toUpperCase())}
                      className="field code uppercase"
                    />
                  )}
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-ink2 block mb-1">Passenger Name</span>
                  <input
                    required
                    placeholder="Full name"
                    value={directPassengerName}
                    onChange={(e) => setDirectPassengerName(e.target.value)}
                    className="field"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-ink2 block mb-1">Age</span>
                  <input
                    type="number"
                    required
                    min={5}
                    value={directPassengerAge}
                    onChange={(e) => setDirectPassengerAge(e.target.value)}
                    className="field num"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-ink2 block mb-1">Gender</span>
                  <select value={directPassengerGender} onChange={(e) => setDirectPassengerGender(e.target.value)} className="field">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-ink2 block mb-1">Mobile</span>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 00000"
                    value={directPassengerPhone}
                    onChange={(e) => setDirectPassengerPhone(e.target.value)}
                    className="field"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-ink2 block mb-1">Aadhaar Card Number</span>
                <input
                  required
                  placeholder="12-digit Aadhaar"
                  value={directAadhaar}
                  onChange={(e) => setDirectAadhaar(e.target.value)}
                  className="field code"
                />
              </label>

              <Button type="submit" className="w-full mt-4" loading={isBookingDirect}>
                Confirm Direct Reservation
              </Button>
            </form>
          )}
        </div>
      )}

      {/* TAB 4: DIGILOCKER GATEWAY VERIFIER */}
      {subTab === 'kyc' && (
        <div className="mt-8 max-w-2xl mx-auto bg-surface rounded-2xl border border-line p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
              🆔
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">DigiLocker National Identity Gateway</h2>
              <p className="text-xs text-ink3">Official UIDAI Aadhaar Verification Protocol for Passenger Reissue</p>
            </div>
          </div>

          <div className="p-4 bg-surface2/60 rounded-xl border border-line text-sm text-ink2 space-y-2">
            <p className="font-semibold text-ink">Why DigiLocker is Mandated for Reissues:</p>
            <p className="text-xs leading-relaxed text-ink3">
              Under Section 15 & 16 of the SeatRelay specification and DPDP Act 2023, tickets can only be reissued by the operator to passengers whose legal identities are verified cryptographically through Government of India DigiLocker or UIDAI e-KYC.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-ink2 block mb-1">Enter 12-Digit Aadhaar or Virtual ID</span>
              <input
                value={testAadhaar}
                onChange={(e) => setTestAadhaar(e.target.value)}
                placeholder="9876 5432 1012"
                className="field code text-lg"
              />
            </label>

            {!testTxnId ? (
              <Button onClick={handleInitiateTestKyc} loading={isTestingKyc} className="w-full">
                Initiate DigiLocker Authentication Session
              </Button>
            ) : (
              <div className="space-y-4 p-4 border border-line rounded-xl bg-surface2/40">
                <p className="text-sm font-semibold text-ink">Session: <span className="code text-accent">{testTxnId}</span></p>
                <label className="block">
                  <span className="text-xs font-semibold text-ink2 block mb-1">Enter OTP received on registered mobile</span>
                  <input
                    value={testOtp}
                    onChange={(e) => setTestOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="field code text-center tracking-widest text-lg"
                  />
                </label>
                <Button onClick={handleVerifyTestKyc} loading={isTestingKyc} className="w-full">
                  Verify & Sign Digital Consent Token
                </Button>
              </div>
            )}

            {testKycResult && (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 text-ink space-y-2">
                <div className="flex items-center gap-2 text-accent font-bold text-sm">
                  <ShieldCheck className="h-5 w-5" />
                  <span>DigiLocker Identity Authenticated</span>
                </div>
                <div className="text-xs space-y-1 font-mono text-ink2">
                  <p>Passenger: <span className="text-ink font-bold">{testKycResult.verifiedProfile.name}</span></p>
                  <p>Issuer: {testKycResult.issuer}</p>
                  <p>Timestamp: {testKycResult.verifiedAt}</p>
                  <p className="truncate">Signature: {testKycResult.xmlSignature}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
