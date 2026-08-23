import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLES } from '../config/roles';

/**
 * AuthContext — Centralized Frontend Authentication State Management
 * 
 * Provides mock role-based authentication state for PATIENT, HOSPITAL_ADMIN, and SUPPLY_ADMIN.
 * Designed to interface with Spring Boot JWT Bearer authentication endpoints in backend integration.
 */

const AuthContext = createContext(null);

const STORAGE_KEY_USER = 'aura_dev_user';
const STORAGE_KEY_ROLE = 'aura_dev_role';

export function AuthProvider({ children }) {
  // Initialize from sessionStorage; default to null (unauthenticated)
  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    try {
      const savedRole = sessionStorage.getItem(STORAGE_KEY_ROLE);
      if (savedRole) {
        return savedRole;
      }
      return null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = Boolean(user && role);

  // Sync state with session storage
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
      // Ignore storage errors
    }
  }, [user, role]);

  /**
   * Mock login function
   * @param {Object} userData - User profile details (e.g., { id, name, email })
   * @param {string} userRole - Target role from ROLES (PATIENT, HOSPITAL_ADMIN, SUPPLY_ADMIN)
   */
  const login = (userData, userRole = ROLES.PATIENT) => {
    setUser(userData);
    setRole(userRole);
    try {
      sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
      sessionStorage.setItem(STORAGE_KEY_ROLE, userRole);
    } catch {
      // Ignore storage errors
    }
  };

  /**
   * Complete Logout function
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
