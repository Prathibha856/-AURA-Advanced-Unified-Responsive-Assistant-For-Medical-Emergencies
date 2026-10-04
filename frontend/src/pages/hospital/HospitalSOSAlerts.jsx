import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { emergencyService } from '../../services/emergencyService';
import {
  Siren,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Clock,
  MapPin,
  User,
  Building2,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  Phone,
  ExternalLink,
} from 'lucide-react';

// ── Status badge helper ───────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    PENDING:      { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: 'Pending' },
    ACKNOWLEDGED: { bg: 'bg-blue-100',  text: 'text-blue-800',  border: 'border-blue-300',  label: 'Acknowledged' },
    REJECTED:     { bg: 'bg-red-100',   text: 'text-red-800',   border: 'border-red-300',   label: 'Rejected' },
    RESOLVED:     { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: 'Resolved' },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      {status === 'PENDING'      && <Clock size={10} />}
      {status === 'ACKNOWLEDGED' && <CheckCircle2 size={10} />}
      {status === 'REJECTED'     && <XCircle size={10} />}
      {status === 'RESOLVED'     && <ShieldCheck size={10} />}
      {s.label}
    </span>
  );
}

// ── Timestamp formatter ───────────────────────────────────────────────────────
function fmt(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

// ── Single alert card ────────────────────────────────────────────────────────
function AlertCard({ alert, onAccept, onReject, onResolve, actionLoading }) {
  const [expanded, setExpanded] = useState(false);
  const [acceptMsg, setAcceptMsg] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [resolveMsg, setResolveMsg] = useState('');
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);

  const isLoading = actionLoading === alert.alertId;

  const handleAccept = () => {
    onAccept(alert.alertId, acceptMsg.trim() || null);
    setShowAcceptForm(false);
    setAcceptMsg('');
  };

  const handleReject = () => {
    onReject(alert.alertId, rejectReason.trim() || null);
    setShowRejectForm(false);
    setRejectReason('');
  };

  const handleResolve = () => {
    onResolve(alert.alertId, resolveMsg.trim() || null);
    setShowResolveForm(false);
    setResolveMsg('');
  };

  const hasCoords = alert.latitude != null && alert.longitude != null;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${alert.latitude},${alert.longitude}`
    : null;

  return (
    <div
      className={`bg-white border rounded-2xl shadow-xs overflow-hidden transition-all ${
        alert.status === 'PENDING'
          ? 'border-amber-200'
          : alert.status === 'ACKNOWLEDGED'
          ? 'border-blue-200'
          : alert.status === 'REJECTED'
          ? 'border-red-200'
          : 'border-emerald-200'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              alert.status === 'PENDING'
                ? 'bg-amber-100 text-amber-600'
                : alert.status === 'ACKNOWLEDGED'
                ? 'bg-blue-100 text-blue-600'
                : alert.status === 'REJECTED'
                ? 'bg-red-100 text-red-600'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <Siren size={20} className={alert.status === 'PENDING' ? 'animate-pulse' : ''} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-slate-400 font-bold">#{alert.alertId}</span>
              <StatusBadge status={alert.status} />
              {alert.emergencyType && (
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  {alert.emergencyType}
                </span>
              )}
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
              Patient: {alert.userName || `User #${alert.userId}`}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
            <Clock size={11} />
            {fmt(alert.createdAt)}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title={expanded ? 'Collapse' : 'Expand details'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Main summary row */}
      <div className="px-5 pb-3 text-xs text-slate-600 flex flex-wrap gap-4 border-b border-slate-100">
        {hasCoords && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
          >
            <MapPin size={13} className="text-red-500 shrink-0" />
            <span>{Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}</span>
            <ExternalLink size={11} />
          </a>
        )}
        {alert.userPhone && (
          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
            <Phone size={13} className="text-slate-400 shrink-0" />
            <a href={`tel:${alert.userPhone}`} className="hover:underline">{alert.userPhone}</a>
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-slate-400 sm:hidden">
          <Clock size={11} />
          {fmt(alert.createdAt)}
        </span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 space-y-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
            <div>
              <span className="font-bold text-slate-500">Alert ID:</span>{' '}
              <span className="font-mono">{alert.alertId}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500">User ID:</span>{' '}
              <span className="font-mono">{alert.userId}</span>
            </div>
            {alert.userEmail && (
              <div>
                <span className="font-bold text-slate-500">Email:</span> {alert.userEmail}
              </div>
            )}
            {alert.hospitalName && (
              <div>
                <span className="font-bold text-slate-500">Hospital:</span> {alert.hospitalName}
              </div>
            )}
            {alert.updatedAt && (
              <div>
                <span className="font-bold text-slate-500">Updated:</span> {fmt(alert.updatedAt)}
              </div>
            )}
            {alert.responseMessage && (
              <div className="sm:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-800">
                <span className="font-bold">Hospital Note:</span> {alert.responseMessage}
              </div>
            )}
            {alert.rejectionReason && (
              <div className="sm:col-span-2 bg-red-50 border border-red-200 rounded-lg p-2 text-red-800">
                <span className="font-bold">Rejection Reason:</span> {alert.rejectionReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action footer */}
      <div className="px-5 py-3 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-medium">
          {alert.status === 'PENDING' && (
            <span className="text-amber-700 font-semibold flex items-center gap-1">
              <Clock size={12} /> Requires immediate response
            </span>
          )}
          {alert.status === 'ACKNOWLEDGED' && (
            <span className="text-blue-700 font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} /> Unit dispatched / en route
            </span>
          )}
          {alert.status === 'REJECTED' && (
            <span className="text-red-700 font-semibold flex items-center gap-1">
              <XCircle size={12} /> Alert was rejected & rerouted
            </span>
          )}
          {alert.status === 'RESOLVED' && (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck size={12} /> Emergency resolved
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {alert.status === 'PENDING' && (
            <>
              <button
                disabled={isLoading}
                onClick={() => {
                  setShowAcceptForm(!showAcceptForm);
                  setShowRejectForm(false);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                <span>Accept Alert</span>
              </button>
              <button
                disabled={isLoading}
                onClick={() => {
                  setShowRejectForm(!showRejectForm);
                  setShowAcceptForm(false);
                }}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle size={13} />
                <span>Reject</span>
              </button>
            </>
          )}

          {alert.status === 'ACKNOWLEDGED' && (
            <button
              disabled={isLoading}
              onClick={() => setShowResolveForm(!showResolveForm)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
              <span>Mark Resolved</span>
            </button>
          )}
        </div>
      </div>

      {/* Accept form modal/bar */}
      {showAcceptForm && (
        <div className="p-4 bg-blue-50 border-t border-blue-200 space-y-2">
          <p className="text-xs font-bold text-blue-900">
            Accept Emergency SOS #{alert.alertId}
          </p>
          <input
            type="text"
            placeholder="Optional response message (e.g. Ambulance dispatched, ETA 8 mins)"
            value={acceptMsg}
            onChange={(e) => setAcceptMsg(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowAcceptForm(false)}
              className="text-xs px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
            >
              {isLoading && <Loader2 size={12} className="animate-spin" />}
              Confirm Accept
            </button>
          </div>
        </div>
      )}

      {/* Reject form modal/bar */}
      {showRejectForm && (
        <div className="p-4 bg-red-50 border-t border-red-200 space-y-2">
          <p className="text-xs font-bold text-red-900">
            Reject SOS #{alert.alertId} (Will be automatically rerouted to next nearest hospital)
          </p>
          <input
            type="text"
            placeholder="Reason for rejection (e.g. Trauma unit at capacity)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowRejectForm(false)}
              className="text-xs px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
            >
              {isLoading && <Loader2 size={12} className="animate-spin" />}
              Confirm Reject & Reroute
            </button>
          </div>
        </div>
      )}

      {/* Resolve form modal/bar */}
      {showResolveForm && (
        <div className="p-4 bg-emerald-50 border-t border-emerald-200 space-y-2">
          <p className="text-xs font-bold text-emerald-900">
            Resolve Emergency SOS #{alert.alertId}
          </p>
          <input
            type="text"
            placeholder="Optional resolution note (e.g. Patient safely admitted to ER)"
            value={resolveMsg}
            onChange={(e) => setResolveMsg(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowResolveForm(false)}
              className="text-xs px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
            >
              {isLoading && <Loader2 size={12} className="animate-spin" />}
              Confirm Resolved
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
function HospitalSOSAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [resolvedHospital, setResolvedHospital] = useState(null);

  // Discover hospital record for this admin
  const resolveHospital = useCallback(async () => {
    if (user?.hospitalId) {
      return { hospitalId: user.hospitalId, name: user.hospital || 'Hospital' };
    }
    const adminUserId = user?.userId || user?.id;
    if (adminUserId) {
      try {
        const res = await emergencyService.getHospitalByAdminUserId(adminUserId);
        const data = res?.data || res;
        return data;
      } catch (err) {
        console.warn('Could not resolve hospital from userId:', err);
        return null;
      }
    }
    return null;
  }, [user]);

  // Fetch alerts assigned to this hospital
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const h = await resolveHospital();
      if (!h || !h.hospitalId) {
        setFetchError('No hospital linked to this account. Contact your system administrator.');
        setLoading(false);
        return;
      }
      setResolvedHospital(h);

      const res = await emergencyService.getHospitalAlerts(h.hospitalId);
      const data = res?.data || res;
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching hospital alerts:', err);
      setFetchError(err.response?.data?.message || err.message || 'Failed to load SOS alerts.');
    } finally {
      setLoading(false);
    }
  }, [resolveHospital]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Action handlers
  const handleAccept = async (alertId, message) => {
    try {
      setActionLoading(alertId);
      setActionError(null);
      setActionSuccess(null);
      await emergencyService.acceptAlert(alertId, message);
      setActionSuccess(`Alert #${alertId} accepted! Patient notified.`);
      await fetchAlerts();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to accept alert.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (alertId, reason) => {
    try {
      setActionLoading(alertId);
      setActionError(null);
      setActionSuccess(null);
      await emergencyService.rejectAlert(alertId, reason);
      setActionSuccess(`Alert #${alertId} rejected and rerouted to next hospital.`);
      await fetchAlerts();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject alert.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (alertId, message) => {
    try {
      setActionLoading(alertId);
      setActionError(null);
      setActionSuccess(null);
      await emergencyService.resolveAlert(alertId, message);
      setActionSuccess(`Alert #${alertId} marked as resolved.`);
      await fetchAlerts();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to resolve alert.');
    } finally {
      setActionLoading(null);
    }
  };

  // Status filtering
  const filtered = alerts.filter((a) => {
    if (filterStatus === 'ALL') return true;
    return a.status === filterStatus;
  });

  const counts = {
    ALL: alerts.length,
    PENDING: alerts.filter((a) => a.status === 'PENDING').length,
    ACKNOWLEDGED: alerts.filter((a) => a.status === 'ACKNOWLEDGED').length,
    REJECTED: alerts.filter((a) => a.status === 'REJECTED').length,
    RESOLVED: alerts.filter((a) => a.status === 'RESOLVED').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <Siren size={30} className={counts.PENDING > 0 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">SOS Emergency Alerts</h1>
              {counts.PENDING > 0 && (
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                  {counts.PENDING} New
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
              {resolvedHospital?.name || user?.hospital || 'Hospital Management'} • Live Incoming SOS Queue
            </p>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Action feedback banners */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="bg-red-50 border border-red-300 text-red-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'PENDING', 'ACKNOWLEDGED', 'REJECTED', 'RESOLVED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-colors cursor-pointer ${
              filterStatus === s
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
            }`}
          >
            {s === 'ALL'
              ? `All (${counts.ALL})`
              : `${s.charAt(0) + s.slice(1).toLowerCase()} (${counts[s]})`}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {loading && alerts.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span className="text-sm font-semibold">Loading SOS alerts…</span>
        </div>
      ) : fetchError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-3">
          <AlertTriangle size={32} className="text-red-500 mx-auto" />
          <p className="text-sm font-bold text-red-800">{fetchError}</p>
          <button
            onClick={fetchAlerts}
            className="text-xs font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <ShieldCheck size={40} className="text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-600">
            {filterStatus === 'ALL'
              ? 'No SOS alerts have been assigned to your hospital yet.'
              : `No ${filterStatus.toLowerCase()} alerts.`}
          </p>
          {filterStatus !== 'ALL' && (
            <button
              onClick={() => setFilterStatus('ALL')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              View all alerts
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((alert) => (
            <AlertCard
              key={alert.alertId}
              alert={alert}
              onAccept={handleAccept}
              onReject={handleReject}
              onResolve={handleResolve}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HospitalSOSAlerts;
