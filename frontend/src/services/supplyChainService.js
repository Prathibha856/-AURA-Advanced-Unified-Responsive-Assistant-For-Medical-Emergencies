import api from './api';

/**
 * AURA Supply Chain Service — Spring Boot REST API Client
 *
 * Implements the full lifecycle:
 *   SupplyAlert → SupplyRequest → Dispatch → Inventory Update
 *
 * All operations map directly to the backend Spring Boot endpoints.
 * No mock or in-memory fallback data is used.
 */
export const supplyChainService = {
  // ── SUPPLY ALERTS ─────────────────────────────────────────────────────────

  /**
   * GET /api/supply/alerts
   * Retrieves all supply alerts in the network.
   * Accessible by: SUPPLY_ADMIN, HOSPITAL_ADMIN
   * @returns {Promise<Array>} List of SupplyAlertResponseDTO
   */
  getAllAlerts() {
    return api.get('/supply/alerts');
  },

  /**
   * GET /api/supply/alerts/hospital/{hospitalId}
   * Retrieves all supply alerts directed to a specific receiving hospital.
   * @param {number|string} hospitalId
   * @returns {Promise<Array>} List of SupplyAlertResponseDTO
   */
  getHospitalAlerts(hospitalId) {
    return api.get(`/supply/alerts/hospital/${hospitalId}`);
  },

  /**
   * GET /api/supply/alerts/{id}
   * Retrieves a single alert with disease requirements and stock details.
   * @param {number|string} alertId
   * @returns {Promise<Object>} SupplyAlertResponseDTO
   */
  getAlertById(alertId) {
    return api.get(`/supply/alerts/${alertId}`);
  },

  /**
   * PUT /api/supply/alerts/{id}/reject
   * Declines to fulfill a supply alert.
   * Accessible by: SUPPLY_ADMIN
   * @param {number|string} alertId
   * @returns {Promise<Object>} SupplyAlertResponseDTO (status=REJECTED)
   */
  rejectAlert(alertId) {
    return api.put(`/supply/alerts/${alertId}/reject`, {});
  },

  // ── SUPPLY REQUESTS ───────────────────────────────────────────────────────

  /**
   * POST /api/supply/requests
   * Supply Admin creates a supply request in response to an alert.
   * Backend sets request status to ACCEPTED and alert status to RESPONDED.
   * Accessible by: SUPPLY_ADMIN
   * @param {number} alertId
   * @param {number} itemId
   * @param {number} quantity
   * @returns {Promise<Object>} SupplyRequestResponseDTO
   */
  createSupplyRequest(alertId, itemId, quantity) {
    return api.post('/supply/requests', { alertId, itemId, quantity });
  },

  /**
   * GET /api/supply/requests/source/{hospitalId}
   * Retrieves all supply requests originating from this hospital (as supplier).
   * @param {number|string} hospitalId
   * @returns {Promise<Array>} List of SupplyRequestResponseDTO
   */
  getRequestsBySourceHospital(hospitalId) {
    return api.get(`/supply/requests/source/${hospitalId}`);
  },

  /**
   * GET /api/supply/requests/destination/{hospitalId}
   * Retrieves incoming supply requests destined for this hospital (as receiver).
   * @param {number|string} hospitalId
   * @returns {Promise<Array>} List of SupplyRequestResponseDTO
   */
  getRequestsByDestinationHospital(hospitalId) {
    return api.get(`/supply/requests/destination/${hospitalId}`);
  },

  // ── DISPATCHES ────────────────────────────────────────────────────────────

  /**
   * POST /api/supply/dispatches/{requestId}
   * Deducts stock from source hospital inventory and generates a dispatch record.
   * Request status transitions to FULFILLED, dispatch created as DISPATCHED.
   * Accessible by: SUPPLY_ADMIN
   * @param {number|string} requestId
   * @returns {Promise<Object>} DispatchResponseDTO
   */
  createDispatch(requestId) {
    return api.post(`/supply/dispatches/${requestId}`, {});
  },

  /**
   * PUT /api/supply/dispatches/{id}/status
   * Updates dispatch status (e.g. IN_TRANSIT, DELIVERED, RECEIVED, CANCELLED).
   * When status is RECEIVED, destination hospital inventory is automatically credited.
   * @param {number|string} dispatchId
   * @param {string} status - CREATED, DISPATCHED, IN_TRANSIT, DELIVERED, RECEIVED, CANCELLED
   * @returns {Promise<Object>} DispatchResponseDTO
   */
  updateDispatchStatus(dispatchId, status) {
    return api.put(`/supply/dispatches/${dispatchId}/status`, { status });
  },

  /**
   * GET /api/supply/dispatches/source/{hospitalId}
   * Retrieves all dispatches dispatched from this hospital.
   * @param {number|string} hospitalId
   * @returns {Promise<Array>} List of DispatchResponseDTO
   */
  getDispatchesBySourceHospital(hospitalId) {
    return api.get(`/supply/dispatches/source/${hospitalId}`);
  },

  // ── INVENTORY ─────────────────────────────────────────────────────────────

  /**
   * GET /api/inventory/hospital/{hospitalId}
   * Returns current live inventory for a hospital.
   * @param {number|string} hospitalId
   * @returns {Promise<Object>} HospitalInventoryResponseDTO { hospitalId, hospitalName, inventory }
   */
  getHospitalInventory(hospitalId) {
    return api.get(`/inventory/hospital/${hospitalId}`);
  },
};

export default supplyChainService;
