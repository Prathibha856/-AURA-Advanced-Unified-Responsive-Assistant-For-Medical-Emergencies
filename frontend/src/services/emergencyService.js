import api, { apiRequest } from './api';

/**
 * Emergency Service — Spring Boot SOS API Interface
 * Uses the backend database as the sole source of truth.
 * No mock/demo fallback data.
 */
export const emergencyService = {
  // ── Patient SOS Methods ───────────────────────────────────────────────────

  /**
   * POST /api/sos/alert
   * Triggers an emergency SOS alert. Backend auto-finds nearest hospital and assigns it.
   * @param {Object} payload - { userId: number, latitude: number, longitude: number }
   * @returns {Promise<Object>} SosAlertResponseDTO
   */
  async createSosAlert(payload) {
    return await api.post('/sos/alert', payload);
  },

  /**
   * GET /api/sos/alerts/user/{userId}
   * Fetches all SOS alerts for the given user, ordered by createdAt descending.
   * @param {number} userId
   * @returns {Promise<Array>} List of SosAlertResponseDTO
   */
  async getUserAlerts(userId) {
    return await api.get(`/sos/alerts/user/${userId}`);
  },

  /**
   * PATCH /api/sos/alert/{alertId}/status?status={status}
   * Updates alert status (e.g. to RESOLVED).
   */
  async updateAlertStatus(alertId, status) {
    return await apiRequest(`/sos/alert/${alertId}/status?status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    });
  },

  // ── Hospital Admin SOS Methods ────────────────────────────────────────────

  /**
   * GET /api/hospitals/admin/{userId}
   * Retrieves the hospital record (including hospitalId) for the logged-in admin.
   */
  async getHospitalByAdminUserId(userId) {
    return await api.get(`/hospitals/admin/${userId}`);
  },

  /**
   * GET /api/sos/alerts/hospital/{hospitalId}
   * Fetches all SOS alerts assigned to the given hospital.
   */
  async getHospitalAlerts(hospitalId) {
    return await api.get(`/sos/alerts/hospital/${hospitalId}`);
  },

  /**
   * POST /api/sos/alert/{alertId}/accept
   * Hospital admin accepts a PENDING SOS alert.
   * @param {number} alertId
   * @param {string|null} message - Optional response message to the patient
   */
  async acceptAlert(alertId, message = null) {
    const body = message ? { message } : {};
    return await api.post(`/sos/alert/${alertId}/accept`, body);
  },

  /**
   * POST /api/sos/alert/{alertId}/reject
   * Hospital admin rejects a PENDING SOS alert. Backend auto-reroutes to next hospital.
   * @param {number} alertId
   * @param {string|null} reason - Optional rejection reason
   */
  async rejectAlert(alertId, reason = null) {
    const body = reason ? { reason } : {};
    return await api.post(`/sos/alert/${alertId}/reject`, body);
  },

  /**
   * POST /api/sos/alert/{alertId}/resolve
   * Hospital admin resolves an ACKNOWLEDGED SOS alert.
   * @param {number} alertId
   * @param {string|null} message - Optional closing message
   */
  async resolveAlert(alertId, message = null) {
    const body = message ? { message } : {};
    return await api.post(`/sos/alert/${alertId}/resolve`, body);
  },
};

export default emergencyService;
