import React, { useState, useEffect } from 'react';
import hospitalService from '../services/hospitalService';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  Search,
  Filter,
  Navigation,
  ShieldCheck,
  Bed,
  Star,
  ExternalLink,
  ChevronRight,
  Map as MapIcon,
  List,
  Maximize2,
  Compass
} from 'lucide-react';

function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState('');
  const [sortBy, setSortBy] = useState('distance');

  // Selected hospital pin on map
  const [selectedHospital, setSelectedHospital] = useState(null);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const data = await hospitalService.getHospitals({
        search: searchQuery,
        emergencyOnly,
        maxDistance,
        sortBy
      });
      setHospitals(data);
      if (data.length > 0 && !selectedHospital) {
        setSelectedHospital(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch hospitals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [searchQuery, emergencyOnly, maxDistance, sortBy]);

  const handleOpenDirections = (hosp) => {
    const encoded = encodeURIComponent(`${hosp.name}, ${hosp.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* HEADER SECTION */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold text-blue-300 uppercase tracking-wider">
              <Building2 size={14} className="text-blue-400" />
              <span>Real-Time Healthcare Facilities</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Find Nearby Emergency Hospitals
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xl">
              Locate 24/7 trauma centers, check live ICU bed availability, estimated drive times, and trigger instant directions.
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-blue-400 font-bold shrink-0 shadow-inner">
            <Compass size={32} />
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <section className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* Search Box (5 cols) */}
          <div className="lg:col-span-5 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospital name, address, or trauma level..."
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 bg-slate-50"
            />
          </div>

          {/* Distance Filter (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Distance Ranges</option>
              <option value="5">Within 5 km radius</option>
              <option value="10">Within 10 km radius</option>
              <option value="20">Within 20 km radius</option>
            </select>
          </div>

          {/* Sort By (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="distance">Nearest First</option>
              <option value="rating">Highest Rated</option>
              <option value="beds">Most ICU Beds</option>
            </select>
          </div>

          {/* 24/7 ER Toggle (2 cols) */}
          <div className="lg:col-span-2 flex items-center justify-end">
            <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={emergencyOnly}
                onChange={(e) => setEmergencyOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>24/7 ER Only</span>
            </label>
          </div>

        </div>
      </section>

      {/* MAP & HOSPITAL LIST SPLIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT / MAIN MAP-READY COMPONENT (7 Cols) */}
        <section className="lg:col-span-7 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-lg relative min-h-[480px] flex flex-col justify-between p-6">
          
          {/* Map Header Overlay */}
          <div className="flex items-center justify-between z-10 bg-slate-950/70 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-white">
            <div className="flex items-center gap-2">
              <MapIcon size={18} className="text-blue-400" />
              <span className="text-xs font-black tracking-wide">Interactive GPS Map Canvas</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Live Location Sync Active
            </span>
          </div>

          {/* Simulated Map Visual Grid with Animated Pins */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-60 flex items-center justify-center">
            
            {/* Distance Rings Visual */}
            <div className="w-80 h-80 rounded-full border border-blue-500/20 flex items-center justify-center animate-ping" style={{ animationDuration: '8s' }} />
            <div className="w-56 h-56 rounded-full border border-blue-500/30 absolute" />
            <div className="w-32 h-32 rounded-full border border-blue-500/40 absolute" />

            {/* Center User Location Pin */}
            <div className="absolute z-20 flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/50 flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <span className="text-[10px] font-extrabold text-blue-300 bg-slate-900/90 px-2 py-0.5 rounded-md mt-1 border border-blue-500/30">
                You Are Here
              </span>
            </div>

            {/* Hospital Map Pins */}
            {hospitals.map((hosp, idx) => {
              const isSelected = selectedHospital?.id === hosp.id;
              // Simple relative coordinate offset simulation
              const offsets = [
                { top: '25%', left: '30%' },
                { top: '40%', left: '70%' },
                { top: '65%', left: '25%' },
                { top: '75%', left: '60%' },
                { top: '30%', left: '80%' },
              ];
              const pos = offsets[idx % offsets.length];

              return (
                <button
                  key={hosp.id}
                  onClick={() => setSelectedHospital(hosp)}
                  style={{ top: pos.top, left: pos.left }}
                  className={`absolute z-20 group transition-all duration-300 cursor-pointer ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg border-2 transition-colors ${
                      isSelected
                        ? 'bg-red-600 border-white text-white shadow-red-600/50'
                        : 'bg-white border-blue-600 text-blue-600'
                    }`}
                  >
                    <Building2 size={18} />
                  </div>
                  <span className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-white bg-slate-950 px-2 py-1 rounded-md shadow-md">
                    {hosp.name} ({hosp.distanceKm} km)
                  </span>
                </button>
              );
            })}
          </div>

          {/* Map Footer Selected Hospital Card */}
          {selectedHospital && (
            <div className="z-10 bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white space-y-2 mt-auto">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">
                  Selected Map Location
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {selectedHospital.distanceKm} km away ({selectedHospital.travelTimeMins} mins drive)
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-white">{selectedHospital.name}</h3>
                  <p className="text-xs text-slate-400">{selectedHospital.address}</p>
                </div>

                <button
                  onClick={() => handleOpenDirections(selectedHospital)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                >
                  <Navigation size={14} />
                  <span>Navigate</span>
                </button>
              </div>
            </div>
          )}

        </section>

        {/* RIGHT HOSPITAL CARDS LIST (5 Cols) */}
        <section className="lg:col-span-5 space-y-4 max-h-[580px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="text-base font-black text-slate-900">Hospital Listings ({hospitals.length})</h2>
            <span className="text-xs text-slate-500 font-medium">Sorted by {sortBy}</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold animate-pulse">
              Loading hospital coordinates...
            </div>
          ) : hospitals.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
              No hospitals match your search criteria. Try clearing filters.
            </div>
          ) : (
            hospitals.map((hosp) => {
              const isSelected = selectedHospital?.id === hosp.id;
              return (
                <div
                  key={hosp.id}
                  onClick={() => setSelectedHospital(hosp)}
                  className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          {hosp.distanceKm} km
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          ~{hosp.travelTimeMins} mins
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base mt-1 group-hover:text-blue-600">
                        {hosp.name}
                      </h3>
                    </div>

                    {hosp.emergency247 && (
                      <span className="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                        24/7 ER
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{hosp.address}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Bed size={15} className="text-indigo-600" />
                      <span>{hosp.icuAvailable} ICU Beds</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Star size={15} className="text-amber-500 fill-amber-500" />
                      <span>{hosp.rating} ({hosp.reviewsCount})</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`tel:${hosp.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors"
                    >
                      <Phone size={13} />
                      <span>Call</span>
                    </a>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDirections(hosp);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-xs"
                    >
                      <Navigation size={13} />
                      <span>Directions</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>

      </div>

    </div>
  );
}

export default Hospitals;
