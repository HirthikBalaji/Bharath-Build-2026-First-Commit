import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Clock, 
  Ticket as TicketIcon,
  Filter,
  Info,
  Zap,
  Users
} from 'lucide-react';
import { Bus, ResaleSeatSummary } from '../types';

interface SearchBusesProps {
  buses: Bus[];
  isLoading: boolean;
  onSearch: (from: string, to: string, date: string) => void;
  onSelectResaleSeat: (bus: Bus, seat: ResaleSeatSummary) => void;
}

export const SearchBuses: React.FC<SearchBusesProps> = ({
  buses,
  isLoading,
  onSearch,
  onSelectResaleSeat
}) => {
  const [fromCity, setFromCity] = useState('Bangalore');
  const [toCity, setToCity] = useState('Chennai');
  const [travelDate, setTravelDate] = useState('2026-09-19');
  const [activeFilter, setActiveFilter] = useState<'all' | 'resale_only' | 'direct_only'>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(fromCity, toCity, travelDate);
  };

  const filteredBuses = buses.filter((bus) => {
    if (activeFilter === 'resale_only') return bus.resaleAvailableCount > 0;
    if (activeFilter === 'direct_only') return bus.availableDirect > 0;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Search Header Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
              <Search className="w-5 h-5 text-emerald-600" />
              <span>Search Bus Routes & Resale Inventory</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Direct carrier availability plus verified face-value seats released by travellers
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-bold font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Face-Value Protection Active</span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
              From City
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                placeholder="From City"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
              To City
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                placeholder="To City"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Travel Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 h-[44px] cursor-pointer"
            >
              <Search className="w-4 h-4 stroke-[3]" />
              <span>Search Buses</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Controls & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900">
            Available Buses ({filteredBuses.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Routes for <span className="font-bold text-slate-800">{fromCity}</span> → <span className="font-bold text-slate-800">{toCity}</span> on {travelDate}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Buses
          </button>
          <button
            onClick={() => setActiveFilter('resale_only')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeFilter === 'resale_only'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span>♻️ Resale Seats Only</span>
          </button>
          <button
            onClick={() => setActiveFilter('direct_only')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeFilter === 'direct_only'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Direct Carrier
          </button>
        </div>
      </div>

      {/* Bus List */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm font-bold text-slate-800">Querying operator schedules & resale inventory...</p>
          <p className="text-xs text-slate-400 mt-1">Checking live seat reservation locks</p>
        </div>
      ) : filteredBuses.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-bold text-slate-800">No buses matching filter criteria</p>
          <p className="text-xs text-slate-500 mt-1">Try switching the filter to "All Buses" or search Bangalore → Chennai on 19 Sep 2026.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBuses.map((bus) => {
            const hasResale = bus.resaleAvailableCount > 0;
            const isSoldOut = bus.isSoldOut;

            return (
              <div 
                key={bus.id}
                className={`bg-white rounded-3xl p-6 border transition-all ${
                  hasResale 
                    ? 'border-emerald-300 ring-2 ring-emerald-400/30 shadow-lg shadow-emerald-600/5' 
                    : 'border-slate-200 shadow-sm hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Bus details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4 className="text-xl font-black text-slate-900">{bus.operator}</h4>
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {bus.busNumber}
                      </span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                        {bus.busType}
                      </span>
                    </div>

                    {/* Schedule times */}
                    <div className="flex items-center gap-6 mt-4">
                      <div>
                        <div className="text-xl font-black text-slate-900">
                          {new Date(bus.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">{bus.routeFrom}</div>
                      </div>

                      <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">8 hrs</span>
                        <div className="w-20 h-0.5 bg-slate-200 relative my-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -top-[4px] right-0 ring-4 ring-emerald-100"></div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xl font-black text-slate-900">
                          {new Date(bus.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">{bus.routeTo}</div>
                      </div>
                    </div>
                  </div>

                  {/* Status, Price, and Action */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:border-l lg:border-slate-100 lg:pl-6">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        Original Fare
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        ₹{bus.baseFare}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold">
                        Zero Markup Guaranteed
                      </div>
                    </div>

                    {isSoldOut ? (
                      <div className="flex flex-col gap-2.5 w-full sm:w-auto">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 w-fit">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Sold Out</span>
                        </span>

                        {hasResale ? (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 shadow-inner">
                            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                              <span className="text-base">♻️</span>
                              <span>{bus.resaleAvailableCount} seat available through SeatRelay</span>
                            </div>
                            <p className="text-[11px] text-emerald-700 mt-0.5">
                              Released by traveller at original price
                            </p>

                            <div className="mt-3 space-y-2">
                              {bus.resaleSeats.map((resale) => (
                                <button
                                  key={resale.listingId}
                                  onClick={() => onSelectResaleSeat(bus, resale)}
                                  className="w-full flex items-center justify-between gap-3 bg-white hover:bg-emerald-600 hover:text-white px-3.5 py-2 rounded-xl border border-emerald-300 text-emerald-900 text-xs font-bold shadow-sm transition-all group cursor-pointer hover:scale-[1.02]"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="bg-emerald-100 text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white px-1.5 py-0.5 rounded font-mono text-[10px]">
                                      {resale.seatNumber}
                                    </span>
                                    <span>Seat {resale.seatNumber} ({resale.seatType})</span>
                                  </div>
                                  <div className="flex items-center gap-1 font-black text-emerald-700 group-hover:text-white">
                                    <span>₹{resale.resalePrice}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400">
                            No passengers have released seats for this route yet.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{bus.availableDirect} Seats Available (Direct)</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
