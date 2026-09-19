import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, ArrowRight, CalendarDays, MapPin, Search, ShieldCheck, BusFront } from 'lucide-react';
import { Bus, ResaleSeatSummary } from '../types';
import { addDays, cityCode, duration, formatDate, formatTime, inr, seatTypeLabel } from '../lib/format';
import { BerthGlyph, Button, cx, EASE_OUT, EmptyState, Pill, RevealText, Segmented } from './ui';

interface SearchBusesProps {
  buses: Bus[];
  isLoading: boolean;
  onSearch: (from: string, to: string, date: string) => void;
  onSelectResaleSeat: (bus: Bus, seat: ResaleSeatSummary) => void;
  initial?: { from: string; to: string; date: string };
}

type Filter = 'all' | 'resale_only' | 'direct_only';

export const SearchBuses: React.FC<SearchBusesProps> = ({ buses, isLoading, onSearch, onSelectResaleSeat, initial }) => {
  const [fromCity, setFromCity] = useState(initial?.from ?? 'Bangalore');
  const [toCity, setToCity] = useState(initial?.to ?? 'Chennai');
  const [travelDate, setTravelDate] = useState(initial?.date ?? '2026-09-19');
  const [query, setQuery] = useState({ from: fromCity, to: toCity, date: travelDate });
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [swapTurn, setSwapTurn] = useState(0);

  useEffect(() => {
    if (initial) {
      setFromCity(initial.from);
      setToCity(initial.to);
      setTravelDate(initial.date);
      setQuery(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.from, initial?.to, initial?.date]);

  const run = (from = fromCity, to = toCity, date = travelDate) => {
    setQuery({ from, to, date });
    onSearch(from, to, date);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run();
  };

  const swap = () => {
    setSwapTurn((t) => t + 1);
    setFromCity(toCity);
    setToCity(fromCity);
  };

  const filteredBuses = buses.filter((bus) => {
    if (activeFilter === 'resale_only') return bus.resaleAvailableCount > 0;
    if (activeFilter === 'direct_only') return bus.availableDirect > 0;
    return true;
  });

  const relayTotal = buses.reduce((n, b) => n + (b.resaleAvailableCount || 0), 0);
  const days = [-2, -1, 0, 1, 2, 3, 4].map((d) => addDays(query.date, d));

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 pb-12 pt-32 sm:px-8 sm:pt-36">
      {/* Route header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="kicker text-accent">Find a seat</p>
          <RevealText
            key={`${query.from}-${query.to}`}
            as="h1"
            text={`${query.from} to ${query.to}`}
            className="display mt-5 text-[clamp(2.4rem,6vw,4.75rem)] text-ink"
            once
          />
          <p className="mt-4 max-w-xl text-[1.0625rem] text-ink2">
            Every coach on {formatDate(query.date, { weekday: 'long', day: 'numeric', month: 'long' })}, including berths other travellers have released at the printed fare.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          Face-value protection on every relayed seat
        </div>
      </div>

      {/* Search console */}
      <form
        onSubmit={handleSubmit}
        className="mt-10 grid overflow-hidden rounded-2xl border border-line bg-surface shadow-lift lg:grid-cols-[1fr_auto_1fr_0.8fr_auto]"
      >
        <label className="group flex flex-col justify-center gap-1 border-b border-line px-5 py-4 lg:border-b-0 lg:border-r">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink3">
            <MapPin className="h-3.5 w-3.5" /> From
          </span>
          <input
            value={fromCity}
            onChange={(e) => setFromCity(e.target.value)}
            className="bg-transparent text-lg font-semibold text-ink outline-none placeholder:text-ink3"
            placeholder="Leaving from"
            aria-label="From city"
          />
        </label>
        <div className="relative flex items-center justify-center lg:border-r lg:border-line lg:px-2">
          <motion.button
            type="button"
            onClick={swap}
            animate={{ rotate: swapTurn * 180 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            aria-label="Swap cities"
            className="absolute -top-5 right-5 z-10 grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink2 shadow-lift transition-colors hover:border-coach hover:text-ink lg:static"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </motion.button>
        </div>
        <label className="flex flex-col justify-center gap-1 border-b border-line px-5 py-4 lg:border-b-0 lg:border-r">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink3">
            <MapPin className="h-3.5 w-3.5" /> To
          </span>
          <input
            value={toCity}
            onChange={(e) => setToCity(e.target.value)}
            className="bg-transparent text-lg font-semibold text-ink outline-none placeholder:text-ink3"
            placeholder="Going to"
            aria-label="To city"
          />
        </label>
        <label className="flex flex-col justify-center gap-1 border-b border-line px-5 py-4 lg:border-b-0 lg:border-r">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink3">
            <CalendarDays className="h-3.5 w-3.5" /> Date
          </span>
          <input
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            className="bg-transparent text-lg font-semibold text-ink outline-none [color-scheme:inherit]"
            aria-label="Travel date"
          />
        </label>
        <div className="p-3">
          <Button type="submit" size="lg" className="h-full min-h-[3.25rem] w-full px-7">
            <Search className="h-[18px] w-[18px]" />
            Search coaches
          </Button>
        </div>
      </form>

      {/* Date strip */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" data-lenis-prevent>
        {days.map((d) => {
          const active = d === query.date;
          return (
            <button
              key={d}
              onClick={() => {
                setTravelDate(d);
                run(fromCity, toCity, d);
              }}
              className={cx(
                'relative flex min-w-[78px] flex-col items-center rounded-xl border px-3 py-2 transition-colors',
                active ? 'border-coach text-coachink' : 'border-line text-ink2 hover:border-linestrong hover:text-ink'
              )}
            >
              {active && <motion.span layoutId="date-active" className="absolute inset-0 rounded-[11px] bg-coach" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <span className="relative text-[0.6875rem] font-medium uppercase tracking-wide opacity-80">{formatDate(d, { weekday: 'short' })}</span>
              <span className="num relative text-lg font-bold">{formatDate(d, { day: 'numeric' })}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink2">
          <span className="num font-semibold text-ink">{filteredBuses.length}</span> {filteredBuses.length === 1 ? 'coach' : 'coaches'}
          {relayTotal > 0 && (
            <>
              {' · '}
              <span className="font-semibold text-ink">{relayTotal}</span> relayed {relayTotal === 1 ? 'berth' : 'berths'}
            </>
          )}
        </p>
        <Segmented
          id="bus-filter"
          value={activeFilter}
          onChange={setActiveFilter}
          options={[
            { value: 'all', label: 'All coaches' },
            { value: 'resale_only', label: <><BerthGlyph className="h-3 w-5" state="relay" />Relayed seats</> },
            { value: 'direct_only', label: 'Open seats' },
          ]}
        />
      </div>

      {/* Results */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading coaches">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-line bg-surface p-6">
                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
                  <div className="skeleton h-14" />
                  <div className="skeleton h-14" />
                  <div className="skeleton h-14" />
                  <div className="skeleton h-14 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBuses.length === 0 ? (
          <EmptyState
            icon={<BusFront className="h-10 w-10" strokeWidth={1.25} />}
            title="No coaches match"
            body={
              <>
                Try <button className="font-semibold text-accent underline-offset-4 hover:underline" onClick={() => setActiveFilter('all')}>all coaches</button>, or search Bangalore to Chennai on 19 September to see the demo route.
              </>
            }
          />
        ) : (
          <ul className="space-y-4">
            <AnimatePresence initial={true}>
              {filteredBuses.map((bus, i) => (
                <motion.li
                  key={bus.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.6, delay: Math.min(i * 0.07, 0.35), ease: EASE_OUT }}
                >
                  <CoachRow bus={bus} onSelect={onSelectResaleSeat} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
};

const Occupancy: React.FC<{ bus: Bus }> = ({ bus }) => {
  const total = Math.min(bus.totalSeats || 0, 40);
  const relay = bus.resaleAvailableCount || 0;
  const open = bus.availableDirect || 0;
  const cells = Array.from({ length: total }, (_, i) => (i < relay ? 'relay' : i < relay + open ? 'open' : 'booked'));
  return (
    <div>
      <div className="flex flex-wrap gap-[3px]" aria-label={`${open} open, ${relay} relayed, of ${bus.totalSeats} seats`}>
        {cells.map((c, i) => (
          <span
            key={i}
            className={cx(
              'h-3 w-2 rounded-[2px]',
              c === 'relay' ? 'bg-marigold' : c === 'open' ? 'border border-accent' : 'bg-linestrong/70'
            )}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-ink3">
        {open} open · {relay} relayed · {bus.totalSeats} berths
      </p>
    </div>
  );
};

const CoachRow: React.FC<{ bus: Bus; onSelect: (bus: Bus, seat: ResaleSeatSummary) => void }> = ({ bus, onSelect }) => {
  const hasResale = bus.resaleAvailableCount > 0;
  return (
    <article
      className={cx(
        'overflow-hidden rounded-2xl border bg-surface transition-shadow duration-300 hover:shadow-lift',
        hasResale ? 'border-marigold/60' : 'border-line'
      )}
    >
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.25fr_1.1fr_0.9fr_auto] lg:items-center">
        {/* times */}
        <div className="flex items-center gap-4">
          <div>
            <p className="num text-2xl font-bold text-ink">{formatTime(bus.departureTime)}</p>
            <p className="code text-xs text-ink3">{cityCode(bus.routeFrom)}</p>
          </div>
          <div className="flex flex-1 flex-col items-center px-1">
            <span className="text-xs text-ink3">{duration(bus.departureTime, bus.arrivalTime)}</span>
            <span className="relative my-1.5 h-px w-full bg-linestrong">
              <span className="absolute -top-[3px] left-0 h-[7px] w-[7px] rounded-full border border-linestrong bg-surface" />
              <span className="absolute -top-[3px] right-0 h-[7px] w-[7px] rounded-full bg-ink3" />
            </span>
            <span className="text-xs text-ink3">Overnight</span>
          </div>
          <div className="text-right">
            <p className="num text-2xl font-bold text-ink">{formatTime(bus.arrivalTime)}</p>
            <p className="code text-xs text-ink3">{cityCode(bus.routeTo)}</p>
          </div>
        </div>

        {/* operator */}
        <div>
          <p className="text-lg font-semibold text-ink">{bus.operator}</p>
          <p className="text-sm text-ink2">{bus.busType}</p>
          <p className="code mt-1 text-xs text-ink3">{bus.busNumber}</p>
        </div>

        <Occupancy bus={bus} />

        {/* fare and state */}
        <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-end">
          <div className="lg:text-right">
            <p className="text-xs text-ink3">Printed fare</p>
            <p className="num text-2xl font-bold text-ink">{inr(bus.baseFare)}</p>
          </div>
          {bus.isSoldOut ? <Pill tone="danger">Sold out</Pill> : <Pill tone="coach">{bus.availableDirect} open</Pill>}
        </div>
      </div>

      {bus.isSoldOut ? (
        hasResale ? (
          <div className="border-t border-marigold/40 bg-marigold/[0.09] px-5 py-4 sm:px-6">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-marigold opacity-70" />
                <span className="relative h-2 w-2 rounded-full bg-marigold" />
              </span>
              Released by a traveller, reissued in your name by {bus.operator}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {bus.resaleSeats.map((seat) => (
                <motion.button
                  key={seat.listingId}
                  onClick={() => onSelect(bus, seat)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-stretch overflow-hidden rounded-xl border border-marigold/50 bg-surface text-left shadow-lift transition-colors hover:border-marigold cursor-pointer"
                >
                  <div className="flex flex-1 items-center gap-3 px-4 py-3">
                    <BerthGlyph className="h-6 w-11" state="relay" />
                    <div>
                      <p className="code text-sm font-semibold text-ink">{seat.seatNumber}</p>
                      <p className="text-xs text-ink3">{seatTypeLabel(seat.seatType)}</p>
                    </div>
                  </div>
                  <div className="perforation w-3" style={{ backgroundSize: '8px 12px', backgroundRepeat: 'repeat-y' }} />
                  <div className="flex items-center gap-2 bg-marigold px-4 text-marigoldink">
                    <div className="text-right">
                      <p className="num text-base font-bold leading-tight">{inr(seat.resalePrice)}</p>
                      <p className="text-[0.6875rem] font-medium opacity-75">exact fare</p>
                    </div>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <p className="border-t border-line px-5 py-3 text-sm text-ink3 sm:px-6">Sold out. Nobody has released a berth on this coach yet.</p>
        )
      ) : (
        <div className="flex items-center justify-between border-t border-line bg-surface2/40 px-5 py-3 text-sm text-ink2 sm:px-6">
          <span>{bus.availableDirect} direct seats open from {bus.operator}. Direct booking supported through operator reservation desk.</span>
          <span className="code text-xs text-ink3 font-medium">Standard Fare {inr(bus.baseFare)}</span>
        </div>
      )}
    </article>
  );
};
