import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLES } from '../config/roles';
import api from '../services/api';

/**
 * AuthContext — Production JWT Role-Based Authentication State Management
 * 
 * Synchronizes JWT tokens and user metadata with localStorage:
 * - "token": Stores the raw JWT Bearer token
 * - "user": Stores serialized user metadata { id, username, email, role }
 * - "role": Stores the user role (PATIENT, HOSPITAL_ADMIN, SUPPLY_ADMIN)
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize state directly from localStorage
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    try {
      return localStorage.getItem('role') || (user && user.role) || null;
    } catch {
      return null;
    }
  });

  // Restore and synchronize auth state on app mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedRole = localStorage.getItem('role');

      if (storedToken) {
        setToken(storedToken);
        sessionStorage.setItem('aura_auth_token', storedToken);
      }
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedRole) {
        setRole(storedRole);
      }
    } catch (e) {
      console.warn('Failed to restore auth from localStorage:', e);
    }
  }, []);

  /**
   * Login user with username (or email) and password
   * Calls POST /api/auth/login
   */
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        principal: username.trim(),
        username: username.trim(),
        password: password,
      });

      if (!response || !response.token) {
        throw new Error('Authentication response did not contain a valid token.');
      }

      const jwtToken = response.token;
      const userRole = response.role || ROLES.PATIENT;
      const userData = {
        id: response.userId,
        username: response.username || username.trim(),
        email: response.email || '',
        role: userRole,
      };

      // Persist to localStorage
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userRole);
      sessionStorage.setItem('aura_auth_token', jwtToken);

      setToken(jwtToken);
      setUser(userData);
      setRole(userRole);

      return { success: true, user: userData, role: userRole, token: jwtToken };
    } catch (error) {
      const errorMessage =
        (error && error.message) || 'Login failed. Please verify your credentials.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Register new user
   * Calls POST /api/auth/register
   */
  const register = async (username, email, password, targetRole = ROLES.PATIENT) => {
    try {
      const response = await api.post('/auth/register', {
        username: username.trim(),
        email: email.trim(),
        password: password,
        role: targetRole,
      });

      return {
        success: true,
        message: typeof response === 'string' ? response : 'Registration successful! Please log in.',
      };
    } catch (error) {
      const errorMessage =
        (error && error.message) || 'Registration failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout user, clear storage and redirect to /login
   */
  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      sessionStorage.removeItem('aura_auth_token');
      sessionStorage.removeItem('aura_dev_user');
      sessionStorage.removeItem('aura_dev_role');
    } catch {
      // Ignore storage errors
    }

    setToken(null);
    setUser(null);
    setRole(null);

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  /**
   * Returns true if JWT token exists in localStorage or state
   */
  const isAuthenticated = () => {
    try {
      return Boolean(localStorage.getItem('token') || token);
    } catch {
      return Boolean(token);
    }
  };

  /**
   * Returns role from localStorage or state
   */
  const getUserRole = () => {
    try {
      return localStorage.getItem('role') || role || (user && user.role) || null;
    } catch {
      return role || null;
    }
  };

  const value = {
    token,
    user,
    role,
    // Supports both functional isAuthenticated() and boolean isAuthed
    isAuthenticated,
    isAuthed: Boolean(token),
    login,
    register,
    logout,
    getUserRole,
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
