import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLES } from '../config/roles';

/**
 * AuthContext — Temporary Frontend Development Layer
 * 
 * NOTE: This is an architectural placeholder for frontend development.
 * It does NOT implement real backend security or JWT validation.
 * It is structured to be seamlessly replaced by Spring Boot authentication (e.g. JWT/OAuth2)
 * in subsequent development phases.
 */

const AuthContext = createContext(null);

const STORAGE_KEY_USER = 'aura_dev_user';
const STORAGE_KEY_ROLE = 'aura_dev_role';

export function AuthProvider({ children }) {
  // Initialize from sessionStorage or use development patient default
  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem(STORAGE_KEY_USER);
      if (savedUser !== null) {
        return savedUser ? JSON.parse(savedUser) : null;
      }
      // Development fallback user
      return { id: 'patient-001', name: 'Sarah Jenkins', email: 'sarah.j@aura.med' };
    } catch {
      return { id: 'patient-001', name: 'Sarah Jenkins', email: 'sarah.j@aura.med' };
    }
  });

  const [role, setRole] = useState(() => {
    try {
      const savedRole = sessionStorage.getItem(STORAGE_KEY_ROLE);
      if (savedRole !== null) {
        return savedRole || null;
      }
      // Development fallback role
      return ROLES.PATIENT;
    } catch {
      return ROLES.PATIENT;
    }
  });

  const isAuthenticated = Boolean(user && role);

  // Sync state with session storage for developer convenience during page refreshes
  useEffect(() => {
    try {
      if (user) {
        sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(STORAGE_KEY_USER);
      }

      if (role) {
        sessionStorage.setItem(STORAGE_KEY_ROLE, role);
      } else {
        sessionStorage.removeItem(STORAGE_KEY_ROLE);
      }
    } catch {
      // Ignore storage errors in restricted dev environments
    }
  }, [user, role]);

  /**
   * Mock login function for frontend testing
   * @param {Object} userData - User profile details (e.g., { id, name, email })
   * @param {string} userRole - Role from ROLES (PATIENT, HOSPITAL_ADMIN, SUPPLY_ADMIN)
   */
  const login = (userData, userRole = ROLES.PATIENT) => {
    setUser(userData);
    setRole(userRole);
  };

  /**
   * Mock logout function
   */
  const logout = () => {
    setUser(null);
    setRole(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY_USER);
      sessionStorage.removeItem(STORAGE_KEY_ROLE);
    } catch {
      // Ignore storage errors
    }
  };

  /**
   * Development role switcher utility
   * Allows fast testing of role-gated UI without re-authenticating
   * @param {string} newRole - Target role
   */
  const switchRole = (newRole) => {
    if (Object.values(ROLES).includes(newRole)) {
      setRole(newRole);
      if (!user) {
        setUser({ id: 'dev-user-1', name: 'Dev User', email: 'dev@aura.med' });
      }
    }
  };

  const value = {
    user,
    role,
    isAuthenticated,
    login,
    logout,
    switchRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to consume AuthContext safely
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
