import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

/**
 * ProtectedRoute Component
 * 
 * Reusable role-aware route guard for React Router.
 * 
 * @param {Array<string>} allowedRoles - Optional list of authorized roles from ROLES config
 * @param {string} redirectTo - Path to redirect unauthenticated visitors (defaults to '/')
 * @param {React.ReactNode} children - Direct child elements (optional, otherwise renders <Outlet />)
 */
function ProtectedRoute({ allowedRoles = [], redirectTo = '/', children }) {
  const { isAuthenticated, role } = useAuth();

  // If user is not authenticated at all
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If role-restricted and current role does not have permission
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="py-16 max-w-lg mx-auto text-center px-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
          <p className="text-slate-600 text-sm mt-2">
            Your current role (<span className="font-semibold text-slate-800">{role}</span>) does not have permission to view this section.
          </p>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
