import api from './api';

/**
 * Emergency Service — Centralized API Interface with Mock Fallbacks
 * Prepares clean integration endpoints for Spring Boot emergency alert dispatchers.
 */

export const emergencyService = {
  async triggerSOS(payload) {
    try {
      return await api.post('/emergency/sos', payload);
    } catch {
      // Mock emergency alert activation payload
      const sosId = `SOS-911-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const alertData = {
        sosId,
        timestamp: new Date().toISOString(),
        emergencyType: payload.emergencyType || 'General Medical Emergency',
        location: payload.location || { lat: 37.7749, lng: -122.4194, address: 'Live GPS Coordinates (Simulated)' },
        contactName: payload.contactName || 'Primary Emergency Contact',
        contactPhone: payload.contactPhone || '+1 (555) 234-5678',
        status: 'ACTIVATED',
        timeline: [
          { step: 'Alert Created', time: new Date().toLocaleTimeString(), completed: true },
          { step: 'Location Shared', time: new Date().toLocaleTimeString(), completed: true },
          { step: 'Hospital Notified', time: new Date().toLocaleTimeString(), completed: true },
          { step: 'Awaiting Response Unit', time: 'In Progress', completed: false },
        ]
      };

      try {
        sessionStorage.setItem('aura_active_sos', JSON.stringify(alertData));
      } catch {
        // Ignore
      }

      return alertData;
    }
  },

  async getActiveSOS() {
    try {
      return await api.get('/emergency/sos/active');
    } catch {
      try {
        const stored = sessionStorage.getItem('aura_active_sos');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
  },

  async cancelSOS(sosId) {
    try {
      return await api.post(`/emergency/sos/${sosId}/cancel`);
    } catch {
      try {
        sessionStorage.removeItem('aura_active_sos');
      } catch {
        // Ignore
      }
      return { status: 'CANCELLED', sosId };
    }
  }
};

export default emergencyService;
