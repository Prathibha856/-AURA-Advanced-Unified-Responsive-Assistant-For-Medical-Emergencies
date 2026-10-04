import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { emergencyService } from '../../services/emergencyService';
import {
  Building2,
  Siren,
  Bed,
  Activity,
  Package,
  ShieldCheck,
  Radio,
  LogOut,
  ChevronRight,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

function HospitalDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const adminName = user?.name || 'Hospital Admin';
  const hospitalName = user?.hospital || 'Hospital Emergency Center';

  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAlerts() {
      try {
        setAlertsLoading(true);
        setAlertsError(null);

        let hospitalId = user?.hospitalId;
        const adminUserId = user?.userId || user?.id;

        // If hospitalId is not directly in user object, look it up by userId
        if (!hospitalId && adminUserId) {
          try {
            const hRes = await emergencyService.getHospitalByAdminUserId(adminUserId);
            const hData = hRes?.data || hRes;
            hospitalId = hData?.hospitalId;
          } catch {
            // Handled below
          }
        }

        if (!hospitalId) {
          if (isMounted) {
            setAlertsLoading(false);
          }
          return;
        }

        const res = await emergencyService.getHospitalAlerts(hospitalId);
        const data = res?.data || res;
        const list = Array.isArray(data) ? data : [];

        // Show pending & acknowledged alerts in the live monitor
        const active = list.filter(
          (a) => a.status === 'PENDING' || a.status === 'ACKNOWLEDGED'
        );

        if (isMounted) {
          setActiveAlerts(active);
        }
      } catch (err) {
        if (isMounted) {
          setAlertsError('Could not load incoming alerts.');
        }
      } finally {
        if (isMounted) {
          setAlertsLoading(false);
        }
      }
    }

    loadAlerts();
    const interval = setInterval(loadAlerts, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/access');
  };

  const pendingCount = activeAlerts.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER SECTION */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0 border border-slate-700">
              <Building2 size={28} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Hospital Administration Portal
                </h1>
                <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider">
                  <ShieldCheck size={12} />
                  Hospital Admin
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
                {hospitalName} • Logged in as <span className="text-white font-bold">{adminName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-red-900/50 border border-slate-700 hover:border-red-700/50 rounded-xl transition-all cursor-pointer shrink-0"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      {/* SOS ALERT BANNER if pending alerts */}
      {pendingCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center justify-between gap-4 text-red-700 text-xs font-bold animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <span>
              {pendingCount} incoming SOS {pendingCount === 1 ? 'alert' : 'alerts'} pending response!
            </span>
          </div>
          <Link
            to="/hospital/sos-alerts"
            className="text-[10px] uppercase tracking-wider font-extrabold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg shrink-0 transition-colors"
          >
            Respond Now
          </Link>
        </div>
      )}

      {/* METRICS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/hospital/sos-alerts"
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between hover:border-red-200 transition-colors"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency Dispatches</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {alertsLoading ? '—' : `${activeAlerts.length} Active`}
            </h3>
            <p className="text-[11px] text-red-600 font-bold mt-1">
              {pendingCount > 0 ? `${pendingCount} Pending Response` : 'Standby Mode'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
            <Siren size={24} className={pendingCount > 0 ? 'animate-pulse' : ''} />
          </div>
        </Link>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ICU Bed Telemetry</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">12 Available Beds</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">84% Total Occupancy</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Bed size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trauma Center Status</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">Level 1 Operational</h3>
            <p className="text-[11px] text-blue-600 font-bold mt-1">All Staff On Duty</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Activity size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Inventory</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">Stock Normal</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Synced with Logistics</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
            <Package size={24} />
          </div>
        </div>
      </div>

      {/* DISPATCH MONITOR & QUICK TOOLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* DISPATCH MONITOR (7 Cols) — real backend data */}
        <section className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Live Emergency Dispatch Monitor</h3>
              <p className="text-xs text-slate-500">Incoming patient SOS alerts assigned to your hospital</p>
            </div>
            <Link
              to="/hospital/sos-alerts"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200"
            >
              <span>Manage All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {alertsLoading ? (
            <div className="flex items-center gap-3 py-8 justify-center text-slate-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-semibold">Loading alerts…</span>
            </div>
          ) : alertsError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500 shrink-0" />
              {alertsError}
            </div>
          ) : activeAlerts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm font-semibold">
              No active or pending SOS alerts.
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.slice(0, 5).map((alert) => (
                <div key={alert.alertId} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">#{alert.alertId}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        alert.status === 'PENDING'
                          ? 'text-amber-800 bg-amber-100'
                          : 'text-blue-800 bg-blue-100'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">
                      Patient: {alert.userName || `User #${alert.userId}`}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock size={10} />
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </div>

                  <Link
                    to="/hospital/sos-alerts"
                    className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 hover:bg-blue-100 shrink-0 ml-3"
                  >
                    Respond
                  </Link>
                </div>
              ))}
              {activeAlerts.length > 5 && (
                <p className="text-xs text-center text-slate-400 font-semibold">
                  +{activeAlerts.length - 5} more alerts —{' '}
                  <Link to="/hospital/sos-alerts" className="text-blue-600 hover:underline">view all</Link>
                </p>
              )}
            </div>
          )}
        </section>

        {/* OPERATIONAL SHORTCUTS (5 Cols) */}
        <section className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-black text-slate-900 text-lg pb-3 border-b border-slate-100">
            Hospital Admin Modules
          </h3>

          <div className="space-y-3">
            <Link
              to="/hospital/sos-alerts"
              className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-extrabold text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} className="text-red-600" />
                <span>SOS Alert Management</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </Link>

            <Link
              to="/hospitals"
              className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-extrabold text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Building2 size={18} className="text-blue-600" />
                <span>Hospital Map & Capacity Telemetry</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </Link>

            <Link
              to="/supply-chain"
              className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-extrabold text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Package size={18} className="text-teal-600" />
                <span>Supply Chain & Inventory Management</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HospitalDashboard;
