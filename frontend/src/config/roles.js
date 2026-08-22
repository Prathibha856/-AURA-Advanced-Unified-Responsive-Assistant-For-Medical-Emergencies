/**
 * AURA User Roles Configuration
 * 
 * Approved backend roles corresponding to Spring Boot & ER Diagram:
 * - PATIENT: End-user accessing triage, disease prediction, SOS emergency, and chatbot.
 * - HOSPITAL_ADMIN: Hospital staff managing SOS alerts, bed/facility telemetry, and local inventory.
 * - SUPPLY_ADMIN: Supply logistics personnel monitoring regional stock and supply alerts.
 */

export const ROLES = Object.freeze({
  PATIENT: 'PATIENT',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  SUPPLY_ADMIN: 'SUPPLY_ADMIN',
});

/**
 * Human-readable labels for UI display
 */
export const ROLE_LABELS = Object.freeze({
  [ROLES.PATIENT]: 'Patient',
  [ROLES.HOSPITAL_ADMIN]: 'Hospital Administrator',
  [ROLES.SUPPLY_ADMIN]: 'Supply Administrator',
});

/**
 * Helper to check if a given string is a recognized AURA role
 */
export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};
