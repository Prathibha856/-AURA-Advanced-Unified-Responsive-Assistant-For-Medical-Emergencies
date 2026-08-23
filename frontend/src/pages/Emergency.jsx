import React, { useState, useEffect } from 'react';
import emergencyService from '../services/emergencyService';
import {
  AlertTriangle,
  MapPin,
  Phone,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Radio,
  X,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Siren,
  Loader2
} from 'lucide-react';

function Emergency() {
  // Emergency Flow States: 'PREP' | 'CONFIRM' | 'ACTIVATED'
  const [emergencyState, setEmergencyState] = useState('PREP');
  const [selectedType, setSelectedType] = useState('Medical Emergency');
  const [activeSOS, setActiveSOS] = useState(null);

  // GPS Simulation state
  const [gpsLocation, setGpsLocation] = useState({
    lat: 37.7749,
    lng: -122.4194,
    address: '450 Health Sciences Parkway, Metro City',
    accuracy: '± 4 meters (High Accuracy GPS)'
  });

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    async function checkExisting() {
      const active = await emergencyService.getActiveSOS();
      if (active) {
        setActiveSOS(active);
        setEmergencyState('ACTIVATED');
      }
    }
    checkExisting();
  }, []);

  // Handle countdown during confirmation state
  useEffect(() => {
    let timer;
    if (emergencyState === 'CONFIRM' && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (emergencyState === 'CONFIRM' && countdown === 0) {
      handleTriggerFinal();
    }
    return () => clearInterval(timer);
  }, [emergencyState, countdown]);

  const handleStartConfirm = () => {
    setCountdown(5);
    setEmergencyState('CONFIRM');
  };

  const handleCancelConfirm = () => {
    setEmergencyState('PREP');
  };

  const handleTriggerFinal = async () => {
    const sosData = await emergencyService.triggerSOS({
      emergencyType: selectedType,
      location: gpsLocation,
      contactName: 'David Jenkins (Spouse)',
      contactPhone: '+1 (555) 234-5678'
    });
    setActiveSOS(sosData);
    setEmergencyState('ACTIVATED');
  };

  const handleCancelActiveSOS = async () => {
    if (activeSOS) {
      await emergencyService.cancelSOS(activeSOS.sosId);
    }
    setActiveSOS(null);
    setEmergencyState('PREP');
  };

  const emergencyTypes = [
    { id: 't-1', name: 'Medical Emergency', desc: 'Severe illness or unknown critical symptoms' },
    { id: 't-2', name: 'Cardiac / Stroke', desc: 'Chest pressure, facial numbness, arm weakness' },
    { id: 't-3', name: 'Severe Trauma / Injury', desc: 'Deep wounds, fractures, or heavy bleeding' },
    { id: 't-4', name: 'Respiratory Distress', desc: 'Severe shortness of breath or choking' },
    { id: 't-5', name: 'Pregnancy Emergency', desc: 'Labor complications or acute severe pain' },
  ];

  return (
    <div className="space-y-8 pb-16">
      
      {/* HEADER SECTION */}
      <section className="bg-gradient-to-r from-red-600 via-rose-700 to-red-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-red-600/20 relative overflow-hidden">
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 px-3 py-1 rounded-full text-xs font-black text-white uppercase tracking-wider">
              <Siren size={14} className="animate-pulse" />
              <span>Priority SOS Emergency Portal</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Emergency Assistance System
            </h1>

            <p className="text-red-100 text-xs sm:text-sm font-medium max-w-xl">
              Instant one-click alert dispatch. Connects your exact GPS location directly with emergency response teams and local hospital trauma units.
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-bold shrink-0 shadow-inner">
            <AlertTriangle size={36} className="animate-bounce" />
          </div>
        </div>
      </section>

      {/* STATE 1: EMERGENCY PREPARATION */}
      {emergencyState === 'PREP' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: EMERGENCY TYPE & SOS TRIGGER BUTTON (7 Cols) */}
          <section className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
            
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">1. Select Emergency Type</h2>
              <p className="text-xs text-slate-500">Helps dispatchers route the correct paramedic response</p>
            </div>

            <div className="space-y-2.5">
              {emergencyTypes.map((t) => {
                const isSelected = selectedType === t.name;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedType(t.name)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-red-50/90 border-red-500 text-red-950 font-extrabold ring-2 ring-red-500/20 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-semibold'
                    }`}
                  >
                    <div>
                      <p className="text-sm">{t.name}</p>
                      <p className="text-xs text-slate-500 font-normal mt-0.5">{t.desc}</p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Giant SOS Action Button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleStartConfirm}
                className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-700 text-white font-black py-6 px-8 rounded-3xl shadow-xl shadow-red-600/30 transition-all duration-300 hover:scale-[1.02] flex flex-col items-center justify-center gap-1 uppercase tracking-widest text-lg cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Siren size={24} className="animate-pulse" />
                  <span>Trigger Emergency SOS</span>
                </div>
                <span className="text-xs text-red-100 font-bold lowercase tracking-normal">
                  Tap to launch instant dispatch alert
                </span>
              </button>
            </div>

          </section>

          {/* RIGHT: GPS LOCATION & EMERGENCY CONTACTS (5 Cols) */}
          <section className="lg:col-span-5 space-y-6">
            
            {/* GPS LOCATION STATUS */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-red-600" />
                  <h3 className="font-black text-slate-900 text-base">GPS Location Broadcast</h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Detected Address</span>
                  <span className="font-mono text-[10px] text-slate-400">{gpsLocation.accuracy}</span>
                </div>
                <p className="font-extrabold text-slate-900 text-sm leading-snug">
                  {gpsLocation.address}
                </p>
                <p className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                  Lat: {gpsLocation.lat} | Lng: {gpsLocation.lng}
                </p>
              </div>
            </div>

            {/* DIRECT CALL EMERGENCY DISPATCH */}
            <div className="bg-gradient-to-br from-slate-900 to-red-950 text-white rounded-3xl p-6 shadow-md space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                  Immediate Hotline
                </span>
                <h3 className="text-base font-black text-white">Direct Phone Dial</h3>
                <p className="text-xs text-slate-300">
                  If you prefer calling directly, reach local emergency dispatchers instantly.
                </p>
              </div>

              <a
                href="tel:911"
                className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm shadow-md transition-colors uppercase tracking-wider"
              >
                <Phone size={18} />
                <span>Call Emergency (911 / 108)</span>
              </a>
            </div>

          </section>

        </div>
      )}

      {/* STATE 2: CONFIRMATION MODAL OVERLAY */}
      {emergencyState === 'CONFIRM' && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl border border-red-200 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border-4 border-red-200 animate-pulse">
              <AlertTriangle size={40} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Confirm Emergency Alert</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Are you sure you want to broadcast an emergency SOS alert for <strong>"{selectedType}"</strong> to nearby hospitals and dispatchers?
              </p>
            </div>

            {/* Countdown Ring Indicator */}
            <div className="py-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-600 text-white font-black text-xl shadow-md">
                {countdown}s
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Auto-activating when timer reaches 0</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCancelConfirm}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleTriggerFinal}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer"
              >
                Confirm SOS Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: SOS ACTIVATED */}
      {emergencyState === 'ACTIVATED' && activeSOS && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-red-500 shadow-xl space-y-8 animate-in fade-in">
          
          {/* Active Banner */}
          <div className="bg-red-600 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Radio size={22} className="animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                    LIVE EMERGENCY BROADCAST
                  </span>
                  <span className="text-xs font-mono text-red-100">ID: {activeSOS.sosId}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black mt-0.5">Emergency SOS Activated</h2>
              </div>
            </div>

            <button
              onClick={handleCancelActiveSOS}
              className="bg-white hover:bg-red-50 text-red-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Cancel Emergency Alert
            </button>
          </div>

          {/* Alert Status Timeline */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900">Dispatch Response Timeline</h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {activeSOS.timeline?.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    step.completed
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950 animate-pulse'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Step {idx + 1}</span>
                    {step.completed ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : (
                      <Loader2 size={16} className="text-amber-600 animate-spin" />
                    )}
                  </div>
                  <h4 className="text-xs font-extrabold">{step.step}</h4>
                  <span className="text-[11px] font-medium opacity-80 mt-1 block">{step.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active GPS & Emergency Contacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Broadcasting Location</span>
              <p className="font-extrabold text-slate-900">{activeSOS.location?.address}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Emergency Contact Notified</span>
              <p className="font-extrabold text-slate-900">{activeSOS.contactName} ({activeSOS.contactPhone})</p>
            </div>
          </div>

        </section>
      )}

    </div>
  );
}

export default Emergency;
