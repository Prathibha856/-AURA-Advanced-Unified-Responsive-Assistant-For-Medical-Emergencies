import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles';

/**
 * ProtectedRoute Component
 * 
 * Reusable JWT and role-aware route guard for React Router.
 * 1. Checks if JWT token exists in localStorage or auth state
 * 2. If not authenticated, redirects to /login
 * 3. Enforces requiredRole or allowedRoles
 * 4. If role mismatch, redirects to the user's appropriate role dashboard
 */
function ProtectedRoute({ allowedRoles = [], requiredRole, redirectTo = '/login', children }) {
  const { isAuthenticated, getUserRole } = useAuth();

  // 1. Check if token exists in localStorage or auth context
  const authed = typeof isAuthenticated === 'function'
    ? isAuthenticated()
    : Boolean(localStorage.getItem('token'));

  if (!authed) {
    return <Navigate to={redirectTo} replace />;
  }

  // 2. Determine target roles (supports both requiredRole and allowedRoles)
  const targetRoles = requiredRole ? [requiredRole] : allowedRoles;
  const currentRole = (getUserRole && getUserRole()) || localStorage.getItem('role') || ROLES.PATIENT;

  // 3. If role restricted and current role mismatch, redirect to user's correct dashboard
  if (targetRoles.length > 0 && !targetRoles.includes(currentRole)) {
    if (currentRole === ROLES.HOSPITAL_ADMIN) {
      return <Navigate to="/hospital/dashboard" replace />;
    } else if (currentRole === ROLES.SUPPLY_ADMIN) {
      return <Navigate to="/supply-chain" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
