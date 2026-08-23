import api from './api';
import { MOCK_HEALTH_PROFILE } from '../data/mockData';

/**
 * Profile Service — Centralized API Interface with Mock Fallbacks
 * Controls patient medical health profile reads/writes.
 */

export const profileService = {
  async getProfile() {
    try {
      return await api.get('/patient/profile');
    } catch {
      try {
        const stored = sessionStorage.getItem('aura_patient_profile');
        if (stored) return JSON.parse(stored);
      } catch {
        // Fallback to mock profile
      }
      return MOCK_HEALTH_PROFILE;
    }
  },

  async updateProfile(updatedData) {
    try {
      return await api.put('/patient/profile', updatedData);
    } catch {
      try {
        sessionStorage.setItem('aura_patient_profile', JSON.stringify(updatedData));
      } catch {
        // Ignore storage errors
      }
      return updatedData;
    }
  }
};

export default profileService;
