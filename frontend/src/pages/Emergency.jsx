import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import emergencyService from '../services/emergencyService';
import {
  AlertTriangle,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Radio,
  Navigation,
  ShieldCheck,
  Siren,
  Loader2,
  RefreshCw,
  ExternalLink,
  Building2,
  XCircle,
} from 'lucide-react';

function Emergency() {
  const { user } = useAuth();
  const userId = user?.id || user?.userId;

  // Flow states: 'PREP' | 'CONFIRM' | 'ACTIVATED'
  const [emergencyState, setEmergencyState] = useState('PREP');
  const [selectedType, setSelectedType] = useState('Medical Emergency');
  const [activeSOS, setActiveSOS] = useState(null);

  // Real Geolocation State — strictly from navigator.geolocation
  const [coords, setCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Triggering state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [countdown, setCountdown] = useState(5);

  // Acquire real GPS coordinates via browser API
  const acquireLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error('Geolocation is not supported by your browser.');
        setLocationError(err.message);
        setLocationLoading(false);
        reject(err);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setCoords(loc);
          setLocationLoading(false);
          resolve(loc);
        },
        (err) => {
          let msg = 'Unable to retrieve your location.';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location permission was denied. Please allow location access in your browser settings to trigger SOS.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'Location information is unavailable on your device.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'The request to get user location timed out. Please try again.';
          }
          setLocationError(msg);
          setLocationLoading(false);
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  // On mount: acquire real location and check for existing active SOS in database
  useEffect(() => {
    acquireLocation().catch(() => {
      // Handled in acquireLocation state
    });

    if (userId) {
      emergencyService
        .getUserAlerts(userId)
        .then((alerts) => {
          if (Array.isArray(alerts) && alerts.length > 0) {
            const latest = alerts[0];
            if (latest.status === 'PENDING' || latest.status === 'ACKNOWLEDGED') {
              setActiveSOS(latest);
              setEmergencyState('ACTIVATED');
            }
          }
        })
        .catch((err) => {
          console.warn('Could not check existing alerts:', err);
        });
    }
  }, [userId, acquireLocation]);

  // Polling for live status updates while an alert is active
  useEffect(() => {
    if (emergencyState !== 'ACTIVATED' || !activeSOS?.alertId || !userId) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const alerts = await emergencyService.getUserAlerts(userId);
        if (Array.isArray(alerts)) {
          const updated = alerts.find((a) => a.alertId === activeSOS.alertId);
          if (updated) {
            setActiveSOS(updated);
          }
        }
      } catch (err) {
        console.warn('Failed to poll SOS status:', err);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [emergencyState, activeSOS?.alertId, userId]);

  // Countdown timer for confirmation modal
  useEffect(() => {
    let timer;
    if (emergencyState === 'CONFIRM' && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (emergencyState === 'CONFIRM' && countdown === 0) {
      handleTriggerFinal();
    }
    return () => clearInterval(timer);
  }, [emergencyState, countdown]);

  const handleStartConfirm = () => {
    setSubmitError(null);
    if (!coords && !locationLoading) {
      // Re-try acquiring location before opening confirm
      acquireLocation()
        .then(() => {
          setCountdown(5);
          setEmergencyState('CONFIRM');
        })
        .catch(() => {
          // locationError is already set
        });
      return;
    }
    setCountdown(5);
    setEmergencyState('CONFIRM');
  };

  const handleCancelConfirm = () => {
    setEmergencyState('PREP');
  };

  // Final SOS dispatch to POST /api/sos/alert
  const handleTriggerFinal = async () => {
    setSubmitError(null);

    let locationToSend = coords;
    if (!locationToSend) {
      try {
        locationToSend = await acquireLocation();
      } catch (err) {
        setSubmitError(err.message || 'Cannot trigger SOS without GPS location.');
        setEmergencyState('PREP');
        return;
      }
    }

    if (!userId) {
      setSubmitError('User session not found. Please log in as a patient to trigger an SOS.');
      setEmergencyState('PREP');
      return;
    }

    try {
      setSubmitting(true);
      // POST /api/sos/alert with real latitude, longitude, and userId
      const response = await emergencyService.createSosAlert({
        userId: Number(userId),
        latitude: locationToSend.latitude,
        longitude: locationToSend.longitude,
      });

      setActiveSOS(response);
      setEmergencyState('ACTIVATED');
    } catch (err) {
      console.error('SOS Trigger failed:', err);
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to dispatch SOS alert. Please retry or call emergency services directly.'
      );
      setEmergencyState('PREP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissActiveSOS = () => {
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

  const formatTimestamp = (ts) => {
    if (!ts) return null;
    try {
      return new Date(ts).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return ts;
    }
  };

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
              Instant one-click alert dispatch. Connects your exact browser GPS location directly with nearby hospitals and trauma centers.
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-bold shrink-0 shadow-inner">
            <AlertTriangle size={36} className="animate-bounce" />
          </div>
        </div>
      </section>

      {/* Global Error Banner */}
      {submitError && (
        <div className="bg-red-50 border border-red-300 text-red-800 text-xs font-semibold p-4 rounded-2xl flex items-center gap-2.5">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* STATE 1: EMERGENCY PREPARATION */}
      {emergencyState === 'PREP' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: EMERGENCY TYPE & SOS TRIGGER BUTTON (7 Cols) */}
          <section className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">1. Select Emergency Type</h2>
              <p className="text-xs text-slate-500">Helps dispatchers identify triage priority</p>
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

            {/* Location error notice if permission blocked */}
            {locationError && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span>GPS Location Required</span>
                </div>
                <p>{locationError}</p>
                <button
                  onClick={acquireLocation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs cursor-pointer transition-colors"
                >
                  <RefreshCw size={12} className={locationLoading ? 'animate-spin' : ''} />
                  <span>Enable & Retry GPS</span>
                </button>
              </div>
            )}

            {/* SOS Action Button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                disabled={submitting}
                onClick={handleStartConfirm}
                className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-black py-6 px-8 rounded-3xl shadow-xl shadow-red-600/30 transition-all duration-300 hover:scale-[1.02] flex flex-col items-center justify-center gap-1 uppercase tracking-widest text-lg cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {submitting ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Siren size={24} className="animate-pulse" />
                  )}
                  <span>{submitting ? 'Dispatching SOS…' : 'Trigger Emergency SOS'}</span>
                </div>
                <span className="text-xs text-red-100 font-bold lowercase tracking-normal">
                  Transmits your real GPS coordinates to nearest hospital
                </span>
              </button>
            </div>
          </section>

          {/* RIGHT: REAL GPS STATUS & EMERGENCY HOTLINES (5 Cols) */}
          <section className="lg:col-span-5 space-y-6">
            {/* GPS LOCATION STATUS */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-red-600" />
                  <h3 className="font-black text-slate-900 text-base">Browser GPS Location</h3>
                </div>
                <button
                  onClick={acquireLocation}
                  disabled={locationLoading}
                  className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                  title="Refresh GPS"
                >
                  <RefreshCw size={13} className={locationLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {locationLoading ? (
                <div className="flex items-center justify-center py-6 text-slate-400 gap-2 text-xs font-semibold">
                  <Loader2 size={16} className="animate-spin text-red-600" />
                  <span>Acquiring exact browser coordinates…</span>
                </div>
              ) : coords ? (
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      GPS Coordinates Acquired
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live GPS
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate-800 space-y-1">
                    <p>
                      <strong>Latitude:</strong> {coords.latitude.toFixed(6)}
                    </p>
                    <p>
                      <strong>Longitude:</strong> {coords.longitude.toFixed(6)}
                    </p>
                    {coords.accuracy != null && (
                      <p className="text-slate-400 text-[11px]">
                        Accuracy: ±{Math.round(coords.accuracy)} meters
                      </p>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-[11px]"
                    >
                      <span>Preview Location on Google Maps</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">GPS coordinates not acquired yet.</p>
                  <p className="text-[11px]">
                    Click the button below or trigger SOS to grant browser location permission.
                  </p>
                  <button
                    onClick={acquireLocation}
                    className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Acquire Location Now
                  </button>
                </div>
              )}
            </div>

            {/* DIRECT CALL EMERGENCY DISPATCH */}
            <div className="bg-gradient-to-br from-slate-900 to-red-950 text-white rounded-3xl p-6 shadow-md space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                  Immediate Hotline
                </span>
                <h3 className="text-base font-black text-white">Direct Phone Dial</h3>
                <p className="text-xs text-slate-300">
                  Reach local emergency dispatchers immediately via standard telecommunications.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:108"
                  className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 px-3 rounded-xl text-xs shadow-md transition-colors uppercase tracking-wider"
                >
                  <Phone size={15} />
                  <span>Ambulance (108)</span>
                </a>
                <a
                  href="tel:112"
                  className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold py-3 px-3 rounded-xl text-xs shadow-md transition-colors uppercase tracking-wider border border-slate-700"
                >
                  <Phone size={15} />
                  <span>National (112)</span>
                </a>
              </div>
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
                You are about to transmit a real emergency SOS for <strong>"{selectedType}"</strong> to the nearest hospital based on your device GPS location.
              </p>
              {coords && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] font-mono text-slate-700">
                  Lat: {coords.latitude.toFixed(5)} | Lng: {coords.longitude.toFixed(5)}
                </div>
              )}
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
                disabled={submitting}
                onClick={handleTriggerFinal}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                <span>Confirm SOS Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: SOS ACTIVATED — REAL BACKEND DATA ONLY */}
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
                    LIVE EMERGENCY SOS
                  </span>
                  <span className="text-xs font-mono text-red-100">Alert #{activeSOS.alertId}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black mt-0.5">
                  Emergency Alert Dispatched
                </h2>
              </div>
            </div>

            <button
              onClick={handleDismissActiveSOS}
              className="bg-white hover:bg-red-50 text-red-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              {activeSOS.status === 'RESOLVED' ? 'Close & Return' : 'Return to SOS Portal'}
            </button>
          </div>

          {/* Current Status Badge & Hospital Response */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Status:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                    activeSOS.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : activeSOS.status === 'ACKNOWLEDGED'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : activeSOS.status === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {activeSOS.status === 'PENDING' && <Clock size={12} className="animate-pulse" />}
                  {activeSOS.status === 'ACKNOWLEDGED' && <CheckCircle2 size={12} />}
                  {activeSOS.status === 'RESOLVED' && <ShieldCheck size={12} />}
                  {activeSOS.status === 'REJECTED' && <XCircle size={12} />}
                  <span>{activeSOS.status}</span>
                </span>
              </div>

              {activeSOS.status === 'PENDING' && (
                <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                  <Clock size={13} className="animate-pulse" />
                  Awaiting acknowledgment from hospital dispatch unit…
                </span>
              )}
              {activeSOS.status === 'ACKNOWLEDGED' && (
                <span className="text-xs text-blue-700 font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Hospital has accepted your alert and dispatched assistance!
                </span>
              )}
              {activeSOS.status === 'RESOLVED' && (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck size={13} />
                  Emergency services completed and resolved.
                </span>
              )}
            </div>

            {/* Hospital Response Message from backend */}
            {activeSOS.responseMessage && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-blue-600 block">
                  Hospital Response Message
                </span>
                <p className="font-bold text-sm">{activeSOS.responseMessage}</p>
              </div>
            )}
          </div>

          {/* Assigned Nearest Hospital Card — from backend */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building2 size={20} className="text-blue-600" />
              <div>
                <h3 className="font-black text-slate-900 text-base">Assigned Nearest Hospital</h3>
                <p className="text-xs text-slate-500">Selected automatically by backend nearest-hospital routing</p>
              </div>
            </div>

            {activeSOS.nearestHospital ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Hospital Name</p>
                  <p className="text-base font-extrabold text-slate-900">{activeSOS.nearestHospital.name}</p>
                  {activeSOS.nearestHospital.address && (
                    <p className="text-slate-600">{activeSOS.nearestHospital.address}</p>
                  )}
                </div>

                <div className="space-y-2">
                  {activeSOS.nearestHospital.phone && (
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Hospital Contact</p>
                      <a
                        href={`tel:${activeSOS.nearestHospital.phone}`}
                        className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-sm hover:underline mt-0.5"
                      >
                        <Phone size={14} />
                        <span>{activeSOS.nearestHospital.phone}</span>
                      </a>
                    </div>
                  )}

                  {activeSOS.nearestHospital.latitude != null && activeSOS.nearestHospital.longitude != null && (
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Hospital Location</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${activeSOS.nearestHospital.latitude},${activeSOS.nearestHospital.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 font-semibold"
                      >
                        <MapPin size={12} className="text-red-500" />
                        <span>
                          {Number(activeSOS.nearestHospital.latitude).toFixed(4)}, {Number(activeSOS.nearestHospital.longitude).toFixed(4)}
                        </span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium">
                Nearest hospital details pending backend dispatch assignment.
              </p>
            )}
          </div>

          {/* Real Transmitted Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Patient & Alert Info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Patient Information
              </span>
              <p className="font-extrabold text-slate-900 text-sm">
                {activeSOS.userName || user?.username || `User #${activeSOS.userId}`}
              </p>
              <p className="text-slate-500 text-[11px]">User ID: #{activeSOS.userId}</p>
            </div>

            {/* Broadcast Coordinates */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Transmitted GPS Coordinates
              </span>
              <p className="font-extrabold text-slate-900 font-mono">
                {activeSOS.latitude?.toFixed(5)}, {activeSOS.longitude?.toFixed(5)}
              </p>
              {activeSOS.latitude != null && activeSOS.longitude != null && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${activeSOS.latitude},${activeSOS.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline text-[11px] font-semibold"
                >
                  <MapPin size={11} className="text-red-500" />
                  <span>View on Map</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>

            {/* Timestamps */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Timestamps
              </span>
              <p className="text-slate-700">
                <strong>Dispatched:</strong> {formatTimestamp(activeSOS.createdAt) || '—'}
              </p>
              {activeSOS.acceptedAt && (
                <p className="text-blue-700">
                  <strong>Accepted:</strong> {formatTimestamp(activeSOS.acceptedAt)}
                </p>
              )}
              {activeSOS.resolvedAt && (
                <p className="text-emerald-700">
                  <strong>Resolved:</strong> {formatTimestamp(activeSOS.resolvedAt)}
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Emergency;
