import api from './api';
import { MOCK_PREDICTION_HISTORY, MOCK_SYMPTOMS } from '../data/mockData';

/**
 * Prediction Service — Centralized API Interface with Mock Fallbacks
 * Prepares clean integration points for Java Spring Boot prediction endpoints.
 */

export const predictionService = {
  /**
   * Fetch clinical symptom master list
   */
  async getSymptoms() {
    try {
      return await api.get('/symptoms');
    } catch {
      // Fallback to frontend mock dataset
      return MOCK_SYMPTOMS;
    }
  },

  /**
   * Analyze selected symptoms and return ML prediction report
   * @param {Object} payload - { symptoms: Array, ageRange, sex, duration, severity }
   */
  async analyzeSymptoms(payload) {
    try {
      return await api.post('/predictions/analyze', payload);
    } catch {
      // Create a mock prediction result dynamically based on submitted symptoms
      const selectedNames = payload.symptoms || [];
      const newId = `PRED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();

      let condition = 'Acute Viral Upper Respiratory Infection';
      let riskLevel = 'Low Attention';
      let urgencyColor = 'blue';
      let confidence = 87;

      if (selectedNames.some(s => s.toLowerCase().includes('chest') || s.toLowerCase().includes('breath'))) {
        condition = 'Acute Respiratory Distress Pattern';
        riskLevel = 'High Attention';
        urgencyColor = 'red';
        confidence = 91;
      } else if (selectedNames.some(s => s.toLowerCase().includes('headache') || s.toLowerCase().includes('dizziness'))) {
        condition = 'Neurological Tension / Migraine Syndrome';
        riskLevel = 'Moderate Attention';
        urgencyColor = 'amber';
        confidence = 81;
      } else if (selectedNames.some(s => s.toLowerCase().includes('nausea') || s.toLowerCase().includes('cramps') || s.toLowerCase().includes('diarrhea'))) {
        condition = 'Gastrointestinal Inflammation';
        riskLevel = 'Moderate Attention';
        urgencyColor = 'amber';
        confidence = 84;
      }

      const result = {
        id: newId,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        predictedCondition: condition,
        confidence,
        riskLevel,
        urgencyColor,
        symptomsCount: selectedNames.length,
        symptoms: selectedNames,
        demographics: {
          ageRange: payload.ageRange || 'Not specified',
          sex: payload.sex || 'Not specified',
          duration: payload.duration || 'Not specified',
          severity: payload.severity || 'Moderate',
        },
        description: `Clinical pattern analysis indicates high alignment with ${condition}. Recommended self-monitoring and clinical follow-up as necessary.`,
        precautions: [
          'Stay adequately hydrated and ensure rest.',
          'Monitor body temperature and symptom progression twice daily.',
          'Keep a record of any new or worsening symptoms.'
        ],
        recommendedActions: riskLevel === 'High Attention' 
          ? ['Seek immediate urgent medical evaluation.', 'Do not drive if feeling dizzy or faint.', 'Have emergency contacts notified.']
          : ['Monitor symptoms for 48 hours.', 'Schedule primary care consultation if symptoms persist.', 'Maintain rest and adequate fluid intake.']
      };

      // Store in session storage for local persistence during demo
      try {
        const stored = JSON.parse(sessionStorage.getItem('aura_mock_predictions') || '[]');
        sessionStorage.setItem('aura_mock_predictions', JSON.stringify([result, ...stored]));
      } catch {
        // Ignore storage errors
      }

      return result;
    }
  },

  /**
   * Fetch prediction report by ID
   */
  async getPredictionById(id) {
    try {
      return await api.get(`/predictions/${id}`);
    } catch {
      // Check session storage first
      try {
        const stored = JSON.parse(sessionStorage.getItem('aura_mock_predictions') || '[]');
        const found = stored.find(p => p.id === id);
        if (found) return found;
      } catch {
        // Fallback to mock history
      }
      return MOCK_PREDICTION_HISTORY.find(p => p.id === id) || MOCK_PREDICTION_HISTORY[0];
    }
  },

  /**
   * Fetch prediction history for current patient
   */
  async getPredictionHistory() {
    try {
      return await api.get('/predictions/history');
    } catch {
      try {
        const stored = JSON.parse(sessionStorage.getItem('aura_mock_predictions') || '[]');
        // Combine stored session predictions with baseline mock history
        const existingIds = new Set(stored.map(s => s.id));
        const combined = [...stored, ...MOCK_PREDICTION_HISTORY.filter(m => !existingIds.has(m.id))];
        return combined;
      } catch {
        return MOCK_PREDICTION_HISTORY;
      }
    }
  }
};

export default predictionService;
