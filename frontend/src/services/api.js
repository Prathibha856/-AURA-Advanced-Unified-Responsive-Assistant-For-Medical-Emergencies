/**
 * AURA Centralized API Service Abstraction
 * 
 * Configurable HTTP client designed to interface with the Spring Boot backend.
 * Base URL is read from Vite environment variable `VITE_API_BASE_URL`,
 * falling back to the standard local Spring Boot port (http://localhost:8080/api).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Custom API Error class to wrap backend error payloads cleanly
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Base request dispatcher with standardized headers, auth injection, and error handling
 * 
 * @param {string} endpoint - API path (e.g. '/symptoms' or 'hospitals')
 * @param {Object} options - Standard fetch options (method, headers, body, etc.)
 * @returns {Promise<any>}
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Placeholder for Spring Boot JWT Bearer token injection
  const token = sessionStorage.getItem('aura_auth_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    // Parse JSON if response has content
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = (data && data.message) || response.statusText || 'API Request Failed';
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network error connecting to backend service', 0, null);
  }
}

/**
 * Helper HTTP verbs
 */
export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
  getBaseUrl: () => API_BASE_URL,
};

export default api;
