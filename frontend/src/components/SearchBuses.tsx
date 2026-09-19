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
  Ticket as TicketIcon
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(fromCity, toCity, travelDate);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Search Header Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-600" />
            <span>Search Bus Routes & Resale Inventory</span>
          </h2>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
            Authorized Face-Value Resale Layer Active
          </span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              From
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                placeholder="From City"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              To
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                placeholder="To City"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              Date of Journey
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 h-[42px]"
            >
              <Search className="w-4 h-4" />
              <span>Search Buses</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Available Buses ({buses.length})
          </h3>
          <p className="text-xs text-slate-500">
            Routes for {fromCity} → {toCity} on {travelDate}
          </p>
        </div>
      </div>

      {/* Bus List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-600">Querying operator schedules & resale listings...</p>
        </div>
      ) : buses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-base font-semibold text-slate-800">No buses found for this search</p>
          <p className="text-sm text-slate-500 mt-1">Try selecting Bangalore → Chennai on 19 Sep 2026</p>
        </div>
      ) : (
        <div className="space-y-4">
          {buses.map((bus) => {
            const hasResale = bus.resaleAvailableCount > 0;
            const isSoldOut = bus.isSoldOut;

            return (
              <div 
                key={bus.id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  hasResale 
                    ? 'border-emerald-300 ring-1 ring-emerald-400/30 shadow-md shadow-emerald-600/5' 
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Bus details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-lg font-bold text-slate-900">{bus.operator}</h4>
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        {bus.busNumber}
                      </span>
                      <span className="text-xs text-slate-500">{bus.busType}</span>
                    </div>

                    <div className="flex items-center gap-6 mt-3">
                      <div>
                        <div className="text-base font-bold text-slate-800">
                          {new Date(bus.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{bus.routeFrom}</div>
                      </div>

                      <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] text-slate-400 font-mono">8 hrs</span>
                        <div className="w-16 h-0.5 bg-slate-200 relative my-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-[3px] right-0"></div>
                        </div>
                      </div>

                      <div>
                        <div className="text-base font-bold text-slate-800">
                          {new Date(bus.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{bus.routeTo}</div>
                      </div>
                    </div>
                  </div>

                  {/* Status and Action */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:border-l lg:border-slate-100 lg:pl-6">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        Base Fare
                      </div>
                      <div className="text-2xl font-bold text-slate-900">
                        ₹{bus.baseFare}
                      </div>
                    </div>

                    {isSoldOut ? (
                      <div className="flex flex-col gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 w-fit">
                          Sold Out
                        </span>

                        {hasResale && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                              <span>♻️</span>
                              <span>{bus.resaleAvailableCount} seat available through SeatRelay</span>
                            </div>
                            <div className="mt-2 space-y-1.5">
                              {bus.resaleSeats.map((resale) => (
                                <button
                                  key={resale.listingId}
                                  onClick={() => onSelectResaleSeat(bus, resale)}
                                  className="w-full flex items-center justify-between gap-3 bg-white hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-sm transition-all group"
                                >
                                  <span>Seat {resale.seatNumber} ({resale.seatType})</span>
                                  <span className="font-bold group-hover:text-white">₹{resale.resalePrice} →</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {bus.availableDirect} Seats Available
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
