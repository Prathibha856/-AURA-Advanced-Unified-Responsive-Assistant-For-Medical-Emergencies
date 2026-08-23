import api from './api';
import { MOCK_HOSPITALS } from '../data/mockData';

/**
 * Hospital Service — Centralized API Interface with Mock Fallbacks
 * Modular abstraction for GET /api/hospitals endpoints in Spring Boot.
 */

export const hospitalService = {
  async getHospitals(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = queryParams ? `/hospitals?${queryParams}` : '/hospitals';
      return await api.get(endpoint);
    } catch {
      // Apply frontend filtering on mock dataset
      let result = [...MOCK_HOSPITALS];

      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(h => 
          h.name.toLowerCase().includes(query) || 
          h.address.toLowerCase().includes(query) ||
          h.traumaCenter.toLowerCase().includes(query)
        );
      }

      if (filters.emergencyOnly) {
        result = result.filter(h => h.emergency247);
      }

      if (filters.maxDistance) {
        const max = parseFloat(filters.maxDistance);
        result = result.filter(h => h.distanceKm <= max);
      }

      if (filters.sortBy === 'distance') {
        result.sort((a, b) => a.distanceKm - b.distanceKm);
      } else if (filters.sortBy === 'rating') {
        result.sort((a, b) => b.rating - a.rating);
      } else if (filters.sortBy === 'beds') {
        result.sort((a, b) => b.icuAvailable - a.icuAvailable);
      }

      return result;
    }
  },

  async getHospitalById(id) {
    try {
      return await api.get(`/hospitals/${id}`);
    } catch {
      return MOCK_HOSPITALS.find(h => h.id === id) || MOCK_HOSPITALS[0];
    }
  }
};

export default hospitalService;
