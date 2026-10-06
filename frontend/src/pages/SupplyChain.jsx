import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  Filter,
  Layers,
  LoaderCircle,
  Package,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { ROLES } from '../config/roles';
import { useAuth } from '../context/AuthContext';
import { emergencyService } from '../services/emergencyService';
import supplyChainService from '../services/supplyChainService';
import api from '../services/api';

const DISPATCH_STATUSES = [
  'CREATED',
  'DISPATCHED',
  'IN_TRANSIT',
  'DELIVERED',
  'RECEIVED',
  'CANCELLED',
];

const EMPTY_DATA = {
  alerts: [],
  requests: [],
  dispatches: [],
  inventory: [],
  hospitalId: null,
  hospitalName: '',
  networkHospitals: [],
};

function asArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`The backend returned an invalid ${label} response.`);
  }
  return value;
}

function unwrap(value) {
  return value?.data ?? value;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-300/40',
    ACCEPTED: 'bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-300/40',
    RESPONDED: 'bg-indigo-50 text-indigo-800 border-indigo-300 ring-1 ring-indigo-300/40',
    DISPATCHED: 'bg-violet-50 text-violet-800 border-violet-300 ring-1 ring-violet-300/40',
    IN_TRANSIT: 'bg-sky-50 text-sky-800 border-sky-300 ring-1 ring-sky-300/40',
    DELIVERED: 'bg-teal-50 text-teal-800 border-teal-300 ring-1 ring-teal-300/40',
    RECEIVED: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-300/40',
    REJECTED: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-300/40',
    FULFILLED: 'bg-green-50 text-green-800 border-green-300 ring-1 ring-green-300/40',
    CANCELLED: 'bg-slate-100 text-slate-700 border-slate-300 ring-1 ring-slate-300/40',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase shadow-2xs ${
        styles[status] || 'bg-slate-50 text-slate-700 border-slate-200'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status || 'UNKNOWN'}
    </span>
  );
}

function EmptyState({ icon: Icon = Package, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-xs ring-1 ring-slate-200">
        <Icon size={24} />
      </div>
      {title && <h4 className="mt-3 text-sm font-bold text-slate-800">{title}</h4>}
      <p className="mt-1 max-w-md text-xs text-slate-500">{children}</p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, count, subtitle }) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
      <div>
        <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <Icon size={18} />
          </div>
          <span>{title}</span>
          {count !== undefined && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
              {count}
            </span>
          )}
        </h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLY ADMIN VIEW
// ─────────────────────────────────────────────────────────────────────────────
function SupplyAdminView({
  data,
  busyAction,
  activeTab,
  setActiveTab,
  onReject,
  onCreateRequest,
  onCreateDispatch,
  onUpdateStatus,
}) {
  const [offerDrafts, setOfferDrafts] = useState({});
  const [alertFilter, setAlertFilter] = useState('PENDING'); // 'PENDING' | 'ALL'
  const [selectedHospitalForInventory, setSelectedHospitalForInventory] = useState('');
  const [inspectorInventory, setInspectorInventory] = useState(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);

  const pendingAlerts = useMemo(
    () => data.alerts.filter((alert) => alert.status === 'PENDING'),
    [data.alerts],
  );

  const displayedAlerts = useMemo(() => {
    if (alertFilter === 'PENDING') {
      return pendingAlerts;
    }
    return data.alerts;
  }, [alertFilter, data.alerts, pendingAlerts]);

  // Load inventory when hospital inspector selection changes
  useEffect(() => {
    if (!selectedHospitalForInventory) {
      setInspectorInventory(null);
      return;
    }

    let active = true;
    setInspectorLoading(true);

    supplyChainService
      .getHospitalInventory(selectedHospitalForInventory)
      .then((res) => {
        if (active) {
          setInspectorInventory(unwrap(res));
        }
      })
      .catch(() => {
        if (active) {
          setInspectorInventory({ inventory: [] });
        }
      })
      .finally(() => {
        if (active) setInspectorLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedHospitalForInventory]);

  function updateDraft(alertId, changes, requirement) {
    setOfferDrafts((drafts) => {
      const current = drafts[alertId] || {
        itemId: requirement.itemId,
        quantity: requirement.suggestedQuantity ?? '',
      };
      return { ...drafts, [alertId]: { ...current, ...changes } };
    });
  }

  const acceptedRequests = useMemo(
    () => data.requests.filter((r) => r.status === 'ACCEPTED'),
    [data.requests],
  );

  const inTransitDispatches = useMemo(
    () => data.dispatches.filter((d) => d.status === 'DISPATCHED' || d.status === 'IN_TRANSIT'),
    [data.dispatches],
  );

  return (
    <div className="space-y-8">
      {/* KPI METRIC CARDS */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Alerts</span>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{pendingAlerts.length}</div>
          <p className="mt-1 text-[11px] text-slate-500">Awaiting your response or rejection</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Requests</span>
            <ClipboardList size={18} className="text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{acceptedRequests.length}</div>
          <p className="mt-1 text-[11px] text-slate-500">Accepted and ready for dispatch</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Dispatches In-Transit</span>
            <Truck size={18} className="text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{inTransitDispatches.length}</div>
          <p className="mt-1 text-[11px] text-slate-500">En route to affected hospitals</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Dispatches</span>
            <Boxes size={18} className="text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{data.dispatches.length}</div>
          <p className="mt-1 text-[11px] text-slate-500">All recorded shipments</p>
        </div>
      </section>

      {/* WORKFLOW INFORMATIONAL CALLOUT */}
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-white p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Building2 size={20} />
          </div>
          <div className="text-xs leading-relaxed text-slate-600">
            <h3 className="text-sm font-bold text-slate-900">
              Supply Admin Regional Workflow
            </h3>
            <p className="mt-1">
              The backend identifies the supplying hospital from each alert's receiving hospital. Creating a supply request automatically sets its status to <span className="font-semibold text-blue-700">ACCEPTED</span> and updates the alert to <span className="font-semibold text-blue-700">RESPONDED</span>. Dispatches atomically deduct inventory at the source hospital and can be tracked through delivery.
            </p>
          </div>
        </div>
      </section>

      {/* TAB NAVIGATION (Supports Navbar ?tab=... parameter) */}
      <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3" aria-label="Supply Chain Sections">
        {[
          { key: 'all', label: 'Complete Overview', icon: Layers },
          { key: 'alerts', label: 'Supply Alerts', icon: AlertTriangle, count: pendingAlerts.length },
          { key: 'orders', label: 'Requests / Orders', icon: ClipboardList, count: data.requests.length },
          { key: 'dispatches', label: 'Dispatches & Logistics', icon: Truck, count: data.dispatches.length },
          { key: 'inventory', label: 'Hospital Inventory', icon: Boxes },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── 1. SUPPLY ALERTS SECTION ─────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'alerts') && (
        <section id="alerts" className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <SectionHeading
              icon={AlertTriangle}
              title="Supply Alerts"
              count={displayedAlerts.length}
              subtitle="Regional outbreaks requiring urgent emergency medical supplies"
            />

            {/* Filter Toggle: Pending vs All */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setAlertFilter('PENDING')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  alertFilter === 'PENDING'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({pendingAlerts.length})
              </button>
              <button
                type="button"
                onClick={() => setAlertFilter('ALL')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  alertFilter === 'ALL'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Alerts ({data.alerts.length})
              </button>
            </div>
          </div>

          {displayedAlerts.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title={alertFilter === 'PENDING' ? 'No Pending Supply Alerts' : 'No Supply Alerts Found'}
            >
              {alertFilter === 'PENDING'
                ? 'All emergency alerts have either been responded to or rejected. New outbreak reports will appear here automatically.'
                : 'No supply alerts have been generated by the backend telemetry system.'}
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {displayedAlerts.map((alert) => {
                const requirements = Array.isArray(alert.requirements) ? alert.requirements : [];
                const draft = offerDrafts[alert.alertId];
                const selectedRequirement =
                  requirements.find(
                    (requirement) => String(requirement.itemId) === String(draft?.itemId),
                  ) || requirements[0];
                const actionBusy = busyAction === `alert-${alert.alertId}`;

                return (
                  <article
                    key={alert.alertId}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
                  >
                    {/* Alert Header */}
                    <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-base font-extrabold text-slate-900">
                            Alert #{alert.alertId}: {alert.diseaseName || 'Disease Outbreak'}
                          </h3>
                          <StatusBadge status={alert.status} />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                          <span>
                            Affected Hospital (Outbreak):{' '}
                            <strong className="text-slate-900">{alert.affectedHospitalName || '—'}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Supplying/Receiving Hospital:{' '}
                            <strong className="text-slate-900">{alert.receivingHospitalName || '—'}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Reported Cases:{' '}
                            <strong className="text-rose-600">{alert.reportedCases ?? '—'}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 sm:text-right">
                        <span>Created {formatDate(alert.createdAt)}</span>
                      </div>
                    </div>

                    {/* Requirements vs Current Inventory Grid */}
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                        <h4 className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                          <span>Required items & Suggested quantities</span>
                          <Activity size={14} className="text-rose-500" />
                        </h4>
                        {requirements.length === 0 ? (
                          <p className="text-xs text-slate-400">No specific items listed for this disease.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {requirements.map((req) => {
                              const stock = (alert.currentInventory || []).find(
                                (item) => String(item.itemId) === String(req.itemId),
                              );
                              return (
                                <li
                                  key={req.itemId}
                                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs font-medium ring-1 ring-slate-200/80"
                                >
                                  <span className="font-semibold text-slate-800">
                                    {req.itemName || `Item #${req.itemId}`}
                                  </span>
                                  <span className="text-slate-600">
                                    Suggested:{' '}
                                    <strong className="text-blue-700">
                                      {req.suggestedQuantity ?? '—'} {req.unit || ''}
                                    </strong>
                                    {' · '}In Stock:{' '}
                                    <strong
                                      className={
                                        (stock?.availableQuantity || 0) < (req.suggestedQuantity || 0)
                                          ? 'text-amber-600'
                                          : 'text-emerald-600'
                                      }
                                    >
                                      {stock?.availableQuantity ?? 0} {stock?.unit || ''}
                                    </strong>
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                        <h4 className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                          <span>Supplying Hospital Inventory</span>
                          <Boxes size={14} className="text-blue-500" />
                        </h4>
                        {(alert.currentInventory || []).length === 0 ? (
                          <p className="text-xs text-slate-400">No inventory record returned for this hospital.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {alert.currentInventory.map((stock) => (
                              <li
                                key={stock.itemId}
                                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs font-medium ring-1 ring-slate-200/80"
                              >
                                <span className="text-slate-700">{stock.itemName || `Item #${stock.itemId}`}</span>
                                <span className="font-bold text-slate-900">
                                  {stock.availableQuantity ?? '—'} {stock.unit || ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Supply Admin Action Form (Only for PENDING alerts) */}
                    {alert.status === 'PENDING' && (
                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Respond to Outbreak Alert
                        </p>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                          <label className="flex-1 text-xs font-bold text-slate-700">
                            Select Inventory Item
                            <select
                              value={selectedRequirement?.itemId ?? ''}
                              onChange={(event) => {
                                const requirement = requirements.find(
                                  (item) => String(item.itemId) === event.target.value,
                                );
                                if (requirement) {
                                  updateDraft(
                                    alert.alertId,
                                    {
                                      itemId: requirement.itemId,
                                      quantity: requirement.suggestedQuantity ?? '',
                                    },
                                    requirement,
                                  );
                                }
                              }}
                              disabled={requirements.length === 0 || actionBusy}
                              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-normal shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                              {requirements.length === 0 && <option value="">No items available</option>}
                              {requirements.map((requirement) => (
                                <option key={requirement.itemId} value={requirement.itemId}>
                                  {requirement.itemName} (suggested {requirement.suggestedQuantity ?? '—'}{' '}
                                  {requirement.unit || ''})
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="text-xs font-bold text-slate-700 lg:w-44">
                            Offer Quantity
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={draft?.quantity ?? selectedRequirement?.suggestedQuantity ?? ''}
                              onChange={(event) =>
                                selectedRequirement &&
                                updateDraft(alert.alertId, { quantity: event.target.value }, selectedRequirement)
                              }
                              disabled={!selectedRequirement || actionBusy}
                              placeholder="Quantity"
                              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-normal shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              selectedRequirement &&
                              onCreateRequest(
                                alert,
                                selectedRequirement,
                                Number(draft?.quantity ?? selectedRequirement.suggestedQuantity),
                              )
                            }
                            disabled={
                              !selectedRequirement ||
                              actionBusy ||
                              Number(draft?.quantity ?? selectedRequirement?.suggestedQuantity) <= 0
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4.5 py-2.2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {actionBusy ? (
                              <LoaderCircle size={15} className="animate-spin" />
                            ) : (
                              <Send size={15} />
                            )}
                            Create Supply Request
                          </button>

                          <button
                            type="button"
                            onClick={() => onReject(alert)}
                            disabled={actionBusy}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-2.2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            <XCircle size={15} /> Reject Alert
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── 2. SUPPLY REQUESTS SECTION ───────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'orders') && (
        <section id="orders" className="space-y-4">
          <SectionHeading
            icon={ClipboardList}
            title="Supply Requests"
            count={data.requests.length}
            subtitle="Accepted supply offers originating from regional source hospitals"
          />

          {data.requests.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No Supply Requests"
            >
              No supply requests have been created yet. When you respond to a pending alert with an item offer, the request will appear here.
            </EmptyState>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2">
              {data.requests.map((request) => {
                const actionBusy = busyAction === `request-${request.requestId}`;
                return (
                  <article
                    key={request.requestId}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs transition-shadow hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <span className="text-xs font-extrabold text-slate-900">
                          Request #{request.requestId}
                          {request.alertId && (
                            <span className="ml-1.5 font-normal text-slate-500">
                              (Alert #{request.alertId})
                            </span>
                          )}
                        </span>
                        <StatusBadge status={request.status} />
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Offered Item:</span>
                          <strong className="text-slate-900">
                            {request.itemName || `Item #${request.itemId}`}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Requested Quantity:</span>
                          <strong className="text-blue-700">{request.requestedQuantity ?? '—'} units</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Source Hospital:</span>
                          <span className="font-semibold text-slate-800">
                            {request.sourceHospitalName || '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Destination:</span>
                          <span className="font-semibold text-slate-800">
                            {request.destinationHospitalName || '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                      <span>{formatDate(request.createdAt)}</span>

                      {request.status === 'ACCEPTED' ? (
                        <button
                          type="button"
                          onClick={() => onCreateDispatch(request)}
                          disabled={actionBusy}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {actionBusy ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <Truck size={14} />
                          )}
                          Create Dispatch
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-500">
                          {request.status === 'FULFILLED' ? '✓ Dispatched' : request.status}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── 3. DISPATCHES SECTION ────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'dispatches') && (
        <section id="dispatches" className="space-y-4">
          <SectionHeading
            icon={Truck}
            title="Dispatches & Shipments"
            count={data.dispatches.length}
            subtitle="Real-time shipment tracking and transit lifecycle management"
          />

          {data.dispatches.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No Dispatches Found"
            >
              No dispatches have been created yet. When you dispatch an accepted request, shipment records will appear here.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {data.dispatches.map((dispatch) => {
                const actionBusy = busyAction === `dispatch-${dispatch.dispatchId}`;
                return (
                  <article
                    key={dispatch.dispatchId}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs transition-shadow hover:shadow-md md:flex-row md:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="text-sm font-extrabold text-slate-900">
                          Dispatch #{dispatch.dispatchId}
                        </h4>
                        <StatusBadge status={dispatch.status} />
                        {dispatch.requestId && (
                          <span className="text-xs text-slate-500">
                            (Request #{dispatch.requestId})
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-700">
                        <strong className="text-blue-700">
                          {dispatch.itemName || `Item #${dispatch.itemId}`}
                        </strong>
                        {' · '}Quantity:{' '}
                        <strong className="text-slate-900">{dispatch.quantity ?? '—'} units</strong>
                        {' · Route: '}
                        <span className="text-slate-800">{dispatch.sourceHospitalName || '—'}</span>
                        <ArrowRight size={13} className="mx-1 inline text-slate-400" />
                        <span className="text-slate-800">{dispatch.destinationHospitalName || '—'}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-400">
                        <span>Dispatched: {formatDate(dispatch.dispatchedAt || dispatch.createdAt)}</span>
                        {dispatch.deliveredAt && <span>· Delivered: {formatDate(dispatch.deliveredAt)}</span>}
                        {dispatch.receivedAt && (
                          <span className="font-semibold text-emerald-600">
                            · Received: {formatDate(dispatch.receivedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <span className="whitespace-nowrap">Status:</span>
                        <select
                          value={dispatch.status}
                          onChange={(event) => onUpdateStatus(dispatch, event.target.value)}
                          disabled={actionBusy}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          {DISPATCH_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                      {actionBusy && <LoaderCircle size={16} className="animate-spin text-blue-600" />}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── 4. HOSPITAL INVENTORY INSPECTOR ──────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'inventory') && (
        <section id="inventory" className="space-y-4">
          <SectionHeading
            icon={Boxes}
            title="Hospital Inventory Telemetry"
            subtitle="Inspect live inventory levels across connected network hospitals"
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex flex-1 items-center gap-3 text-xs font-bold text-slate-700">
                <span className="whitespace-nowrap">Select Hospital:</span>
                <select
                  value={selectedHospitalForInventory}
                  onChange={(e) => setSelectedHospitalForInventory(e.target.value)}
                  className="w-full max-w-sm rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-normal shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">— Select a hospital to inspect stock —</option>
                  {data.networkHospitals.map((h) => (
                    <option key={h.hospitalId} value={h.hospitalId}>
                      {h.name} (ID #{h.hospitalId})
                    </option>
                  ))}
                </select>
              </label>

              {inspectorLoading && (
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <LoaderCircle size={15} className="animate-spin" />
                  Loading inventory...
                </div>
              )}
            </div>

            {selectedHospitalForInventory && inspectorInventory && (
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Inventory for {inspectorInventory.hospitalName || `Hospital #${selectedHospitalForInventory}`}
                </h4>

                {!inspectorInventory.inventory || inspectorInventory.inventory.length === 0 ? (
                  <EmptyState icon={Boxes} title="Zero Stock Records">
                    This hospital currently has no recorded inventory items in the backend database.
                  </EmptyState>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5">Item Name</th>
                          <th className="px-4 py-2.5 text-right">Available Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inspectorInventory.inventory.map((item) => (
                          <tr key={item.itemId} className="hover:bg-slate-50/60">
                            <td className="px-4 py-2.5 font-semibold text-slate-800">
                              {item.itemName || `Item #${item.itemId}`}
                            </td>
                            <td className="px-4 py-2.5 text-right font-extrabold text-slate-900">
                              {item.availableQuantity ?? '—'} {item.unit || ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOSPITAL ADMIN VIEW
// ─────────────────────────────────────────────────────────────────────────────
function HospitalAdminView({ data, busyAction, onReceive }) {
  return (
    <div className="space-y-8">
      {/* HOSPITAL PROFILE BANNER */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-blue-50/30 p-5 shadow-xs">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  {data.hospitalName || 'Your Hospital Facility'}
                </h2>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">
                  ID #{data.hospitalId}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Receiving facility for regional outbreak supplies & emergency inventory
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* METRIC OVERVIEW */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Incoming Requests</span>
            <ClipboardList size={18} className="text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{data.requests.length}</div>
          <p className="mt-1 text-[11px] text-slate-500">From connected hospitals</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Dispatches</span>
            <Truck size={18} className="text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{data.dispatches.length}</div>
          <p className="mt-1 text-[11px] text-slate-500">Total shipments to your hospital</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">In-Transit</span>
            <Activity size={18} className="text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {
              data.dispatches.filter((d) => d.status === 'DISPATCHED' || d.status === 'IN_TRANSIT').length
            }
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Currently on the road</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Items</span>
            <Boxes size={18} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{data.inventory.length}</div>
          <p className="mt-1 text-[11px] text-slate-500">Tracked in your pharmacy</p>
        </div>
      </section>

      {/* ── INCOMING SUPPLY REQUESTS ──────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading
          icon={ClipboardList}
          title="Incoming Supply Requests"
          count={data.requests.length}
          subtitle="Medical supply offers assigned to fulfill emergency needs at your hospital"
        />

        {data.requests.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No Incoming Supply Requests">
            There are no incoming supply requests recorded for your hospital at this time.
          </EmptyState>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2">
            {data.requests.map((request) => (
              <article
                key={request.requestId}
                className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <span className="text-xs font-extrabold text-slate-900">
                    Request #{request.requestId}
                    {request.alertId && (
                      <span className="ml-1.5 font-normal text-slate-500">(Alert #{request.alertId})</span>
                    )}
                  </span>
                  <StatusBadge status={request.status} />
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Offered Item:</span>
                    <strong className="text-slate-900">{request.itemName || `Item #${request.itemId}`}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quantity:</span>
                    <strong className="text-blue-700">{request.requestedQuantity ?? '—'} units</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supplying Hospital:</span>
                    <span className="font-semibold text-slate-800">{request.sourceHospitalName || '—'}</span>
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                  Created {formatDate(request.createdAt)}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── INCOMING DISPATCHES ───────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading
          icon={Truck}
          title="Incoming Dispatches"
          count={data.dispatches.length}
          subtitle="Shipments en route to your hospital. Confirm receipt to atomically credit inventory."
        />

        {data.dispatches.length === 0 ? (
          <EmptyState icon={Truck} title="No Incoming Dispatches">
            No active shipments are currently scheduled for delivery to your hospital.
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {data.dispatches.map((dispatch) => {
              const actionBusy = busyAction === `dispatch-${dispatch.dispatchId}`;
              const isReceived = dispatch.status === 'RECEIVED';
              const canReceive = !isReceived && dispatch.status !== 'CANCELLED';

              return (
                <article
                  key={dispatch.dispatchId}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs transition-shadow hover:shadow-md md:flex-row md:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Dispatch #{dispatch.dispatchId}
                      </h4>
                      <StatusBadge status={dispatch.status} />
                    </div>
                    <p className="text-xs text-slate-700">
                      <strong className="text-blue-700">
                        {dispatch.itemName || `Item #${dispatch.itemId}`}
                      </strong>
                      {' · '}Quantity:{' '}
                      <strong className="text-slate-900">{dispatch.quantity ?? '—'} units</strong>
                      {' · From: '}
                      <span className="font-semibold text-slate-800">
                        {dispatch.sourceHospitalName || 'Supplying Facility'}
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-400">
                      <span>Dispatched: {formatDate(dispatch.dispatchedAt || dispatch.createdAt)}</span>
                      {dispatch.deliveredAt && <span>· Delivered: {formatDate(dispatch.deliveredAt)}</span>}
                      {dispatch.receivedAt && (
                        <span className="font-bold text-emerald-600">
                          · Received at {formatDate(dispatch.receivedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isReceived ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-2xs">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        Received · Inventory Credited
                      </span>
                    ) : canReceive ? (
                      <button
                        type="button"
                        onClick={() => onReceive(dispatch)}
                        disabled={actionBusy}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-all ${
                          dispatch.status === 'DELIVERED'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-green-600 hover:bg-green-700'
                        } disabled:opacity-50`}
                      >
                        {actionBusy ? (
                          <LoaderCircle size={15} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                        {dispatch.status === 'DELIVERED' ? 'Confirm Arrival & Receive' : 'Mark Received'}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold">{dispatch.status}</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── HOSPITAL INVENTORY ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading
          icon={Boxes}
          title="Hospital Inventory"
          count={data.inventory.length}
          subtitle="Real-time pharmaceutical and equipment stock levels updated automatically on receipt"
        />

        {data.inventory.length === 0 ? (
          <EmptyState icon={Boxes} title="Inventory Empty">
            No stock records were returned for your hospital from the backend database.
          </EmptyState>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Item Name</th>
                  <th className="px-5 py-3 text-right">Available Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.inventory.map((item) => (
                  <tr key={item.itemId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {item.itemName || `Item #${item.itemId}`}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-slate-900">
                      {item.availableQuantity ?? '—'} {item.unit || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SUPPLY CHAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function SupplyChain() {
  const { user, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabParam = searchParams.get('tab') || 'all';

  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyAction, setBusyAction] = useState('');

  // Synchronize activeTab with URL query parameter
  const activeTab = useMemo(() => {
    const validTabs = ['all', 'alerts', 'orders', 'dispatches', 'inventory'];
    return validTabs.includes(currentTabParam) ? currentTabParam : 'all';
  }, [currentTabParam]);

  const setActiveTab = useCallback(
    (tab) => {
      setSearchParams(tab === 'all' ? {} : { tab }, { replace: true });
    },
    [setSearchParams],
  );

  // ── Supply Admin Data Loader ──────────────────────────────────────────────
  const loadSupplyAdminData = useCallback(async () => {
    // 1. Fetch real alerts from backend
    const alerts = asArray(unwrap(await supplyChainService.getAllAlerts()), 'alerts');

    // 2. Discover network hospitals for complete request & dispatch querying
    let networkHospitals = [];
    try {
      const hospitalsRes = unwrap(await api.get('/hospitals'));
      if (Array.isArray(hospitalsRes)) {
        networkHospitals = hospitalsRes;
      }
    } catch {
      // fallback if /hospitals is restricted
    }

    const networkHospitalIds = networkHospitals.map((h) => h.hospitalId).filter(Boolean);
    const alertSourceHospitalIds = alerts
      .map((alert) => alert.receivingHospitalId)
      .filter((id) => id !== null && id !== undefined);

    const candidateSourceIds = [...new Set([...networkHospitalIds, ...alertSourceHospitalIds])];

    // 3. Query requests and dispatches originating from all candidate source hospitals
    const [requestGroups, dispatchGroups] = await Promise.all([
      Promise.all(candidateSourceIds.map((id) => supplyChainService.getRequestsBySourceHospital(id))),
      Promise.all(candidateSourceIds.map((id) => supplyChainService.getDispatchesBySourceHospital(id))),
    ]);

    // Flatten and deduplicate by primary key
    const rawRequests = requestGroups.flatMap((group) => asArray(unwrap(group), 'source requests'));
    const requestsMap = new Map();
    rawRequests.forEach((req) => {
      if (req?.requestId) requestsMap.set(req.requestId, req);
    });
    const requests = Array.from(requestsMap.values());

    const rawDispatches = dispatchGroups.flatMap((group) => asArray(unwrap(group), 'source dispatches'));
    const dispatchesMap = new Map();
    rawDispatches.forEach((disp) => {
      if (disp?.dispatchId) dispatchesMap.set(disp.dispatchId, disp);
    });
    const dispatches = Array.from(dispatchesMap.values());

    return {
      ...EMPTY_DATA,
      alerts,
      requests,
      dispatches,
      networkHospitals,
    };
  }, []);

  // ── Hospital Admin Data Loader ────────────────────────────────────────────
  const loadHospitalAdminData = useCallback(async () => {
    let hospitalId = user?.hospitalId;
    const userId = user?.userId || user?.id;

    // Discover hospitalId from existing hospital-admin relationship
    if (!hospitalId && userId) {
      const hospitalResponse = unwrap(await emergencyService.getHospitalByAdminUserId(userId));
      hospitalId = hospitalResponse?.hospitalId;
    }

    if (!hospitalId) {
      throw new Error(
        "Could not determine this Hospital Admin's hospital ID from the existing hospital-admin relationship.",
      );
    }

    // Fetch incoming requests and inventory for this hospital
    const [requestResponse, inventoryResponse] = await Promise.all([
      supplyChainService.getRequestsByDestinationHospital(hospitalId),
      supplyChainService.getHospitalInventory(hospitalId),
    ]);

    const requests = asArray(unwrap(requestResponse), 'incoming requests');
    const inventoryData = unwrap(inventoryResponse);

    if (!inventoryData || !Array.isArray(inventoryData.inventory)) {
      throw new Error('The backend returned an invalid hospital inventory response.');
    }

    // Discover network hospitals to query candidate source dispatches
    let networkHospitalIds = [];
    try {
      const hospitalsRes = unwrap(await api.get('/hospitals'));
      if (Array.isArray(hospitalsRes)) {
        networkHospitalIds = hospitalsRes.map((h) => h.hospitalId).filter(Boolean);
      }
    } catch {
      // fallback
    }

    const candidateSourceIds = [
      ...new Set([
        ...networkHospitalIds,
        ...requests.map((r) => r.sourceHospitalId).filter(Boolean),
      ]),
    ];

    const dispatchGroups = await Promise.all(
      candidateSourceIds.map((id) => supplyChainService.getDispatchesBySourceHospital(id)),
    );

    const dispatchesMap = new Map();
    dispatchGroups
      .flatMap((group) => asArray(unwrap(group), 'source dispatches'))
      .filter((disp) => String(disp.destinationHospitalId) === String(hospitalId))
      .forEach((disp) => {
        if (disp?.dispatchId) dispatchesMap.set(disp.dispatchId, disp);
      });

    const dispatches = Array.from(dispatchesMap.values());

    return {
      alerts: [],
      requests,
      dispatches,
      inventory: inventoryData.inventory,
      hospitalId,
      hospitalName: inventoryData.hospitalName || '',
      networkHospitals: [],
    };
  }, [user]);

  const loadPageData = useCallback(async () => {
    if (role === ROLES.SUPPLY_ADMIN) return loadSupplyAdminData();
    if (role === ROLES.HOSPITAL_ADMIN) return loadHospitalAdminData();
    throw new Error('Supply Chain is available only to Supply Admins and Hospital Admins.');
  }, [role, loadHospitalAdminData, loadSupplyAdminData]);

  // Initial load
  useEffect(() => {
    let active = true;

    loadPageData()
      .then((nextData) => {
        if (active) setData(nextData);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Could not load Supply Chain data from backend.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadPageData]);

  // Manual refresh
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError('');

    try {
      setData(await loadPageData());
    } catch (loadError) {
      setError(loadError.message || 'Could not load Supply Chain data from backend.');
    } finally {
      setRefreshing(false);
    }
  }, [loadPageData]);

  // Action runner with error and success handling
  async function runAction(actionKey, operation, successMessage) {
    setBusyAction(actionKey);
    setError('');
    setNotice('');
    try {
      const response = unwrap(await operation());
      setNotice(await successMessage(response));
      await refresh();
    } catch (actionError) {
      setError(actionError.message || 'The Supply Chain operation failed.');
    } finally {
      setBusyAction('');
    }
  }

  // Supply Admin actions
  function rejectAlert(alert) {
    return runAction(
      `alert-${alert.alertId}`,
      () => supplyChainService.rejectAlert(alert.alertId),
      (response) => `Alert #${response.alertId} was updated to ${response.status} by the backend.`,
    );
  }

  function createRequest(alert, requirement, quantity) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('Offer quantity must be a positive whole number.');
      return;
    }
    return runAction(
      `alert-${alert.alertId}`,
      () => supplyChainService.createSupplyRequest(alert.alertId, requirement.itemId, quantity),
      (response) =>
        `Supply request #${response.requestId} created with status ${response.status} for ${response.itemName} (${response.requestedQuantity} units).`,
    );
  }

  function createDispatch(request) {
    return runAction(
      `request-${request.requestId}`,
      () => supplyChainService.createDispatch(request.requestId),
      (response) =>
        `Dispatch #${response.dispatchId} created with status ${response.status}. Inventory deducted at source hospital.`,
    );
  }

  function updateDispatchStatus(dispatch, status) {
    return runAction(
      `dispatch-${dispatch.dispatchId}`,
      () => supplyChainService.updateDispatchStatus(dispatch.dispatchId, status),
      (response) =>
        `Dispatch #${response.dispatchId} status updated to ${response.status} by the backend.`,
    );
  }

  // Hospital Admin action: Confirm receipt and refresh live inventory
  function receiveDispatch(dispatch) {
    return runAction(
      `dispatch-${dispatch.dispatchId}`,
      () => supplyChainService.updateDispatchStatus(dispatch.dispatchId, 'RECEIVED'),
      async (response) => {
        const inventoryResponse = unwrap(
          await supplyChainService.getHospitalInventory(data.hospitalId),
        );
        if (!Array.isArray(inventoryResponse?.inventory)) {
          throw new Error(
            'Dispatch was marked received, but the backend returned an invalid inventory response.',
          );
        }
        setData((current) => ({ ...current, inventory: inventoryResponse.inventory }));
        return `Dispatch #${response.dispatchId} marked ${response.status}. Hospital inventory atomically credited by backend!`;
      },
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER SECTION */}
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              AURA Logistics & Response
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {role === ROLES.SUPPLY_ADMIN ? 'Supply Administrator' : 'Hospital Administrator'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Medical Supply Chain</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {role === ROLES.HOSPITAL_ADMIN
              ? `${data.hospitalName || 'Receiving Hospital'} · Track incoming shipments & hospital stock`
              : 'Coordinate regional alerts, supply requests, and dispatch logistics'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => refresh()}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Backend Data'}
        </button>
      </header>

      {/* FEEDBACK BANNERS */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-medium text-rose-800 shadow-2xs"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-600" />
          <div className="flex-1">
            <strong className="font-bold">Error: </strong>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-rose-600 hover:text-rose-800 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-medium text-emerald-800 shadow-2xs"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <strong className="font-bold">Success: </strong>
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* CONTENT LOADER OR ROLE VIEW */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-16 text-slate-600 shadow-xs">
          <LoaderCircle size={28} className="animate-spin text-blue-600" />
          <span className="text-sm font-semibold">Connecting to Spring Boot Supply Chain backend...</span>
          <span className="text-xs text-slate-400">Fetching live alerts, requests, dispatches, and inventory</span>
        </div>
      ) : role === ROLES.SUPPLY_ADMIN ? (
        <SupplyAdminView
          data={data}
          busyAction={busyAction}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onReject={rejectAlert}
          onCreateRequest={createRequest}
          onCreateDispatch={createDispatch}
          onUpdateStatus={updateDispatchStatus}
        />
      ) : role === ROLES.HOSPITAL_ADMIN ? (
        <HospitalAdminView data={data} busyAction={busyAction} onReceive={receiveDispatch} />
      ) : null}
    </div>
  );
}

export default SupplyChain;
