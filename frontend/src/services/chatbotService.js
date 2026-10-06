import api from './api';

/**
 * Chatbot Service — Connects frontend to the Spring Boot /api/chat endpoint,
 * which proxies to the high-performance AURA RAG Python AI service.
 */
export const sendMessage = async (question) => {
  const response = await api.post('/chat', { question });
  return response?.data || response;
};

export default {
  sendMessage,
};
