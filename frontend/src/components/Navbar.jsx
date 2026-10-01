import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles';
import { 
  Heart, 
  Activity, 
  AlertTriangle, 
  Package, 
  MessageSquare, 
  Menu, 
  X,
  ChevronRight,
  User,
  Building2,
  LogOut,
  Boxes,
  ClipboardList,
  BarChart3,
  Bell
} from 'lucide-react';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, getUserRole, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check auth and role directly
  const authed = typeof isAuthenticated === 'function'
    ? isAuthenticated()
    : Boolean(localStorage.getItem('token'));
  const activeRole = (getUserRole && getUserRole()) || localStorage.getItem('role');

  // Requirement: If no role (not logged in), hide Navbar entirely
  if (!authed || !activeRole) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  // Determine logo redirect based on role
  const getDashboardRoute = () => {
    if (activeRole === ROLES.HOSPITAL_ADMIN) return '/hospital/dashboard';
    if (activeRole === ROLES.SUPPLY_ADMIN) return '/supply-chain';
    if (activeRole === ROLES.PATIENT) return '/dashboard';
    return '/';
  };

  // Determine role-appropriate navigation links
  let navLinks = [];

  if (activeRole === ROLES.PATIENT) {
    navLinks = [
      { path: '/dashboard', label: 'Dashboard', icon: User },
      { path: '/predict', label: 'Predict', icon: Activity },
      { path: '/emergency', label: 'Emergency', icon: AlertTriangle },
      { path: '/hospitals', label: 'Hospitals', icon: Building2 },
      { path: '/chatbot', label: 'Chatbot', icon: MessageSquare },
    ];
  } else if (activeRole === ROLES.HOSPITAL_ADMIN) {
    navLinks = [
      { path: '/hospital/dashboard', label: 'Hospital Dashboard', icon: Building2 },
      { path: '/emergency', label: 'SOS Alerts', icon: Bell },
      { path: '/supply-chain', label: 'Supply Overview', icon: Package },
    ];
  } else if (activeRole === ROLES.SUPPLY_ADMIN) {
    navLinks = [
      { path: '/supply-chain', label: 'Dashboard', icon: Package },
      { path: '/supply-chain?tab=inventory', label: 'Inventory', icon: Boxes },
      { path: '/supply-chain?tab=orders', label: 'Orders', icon: ClipboardList },
      { path: '/supply-chain?tab=analytics', label: 'Analytics', icon: BarChart3 },
    ];
  }

  const isLinkActive = (path) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Role-Aware Clickable Logo */}
          <Link to={getDashboardRoute()} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 fill-white/20" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-blue-600 tracking-tight">AURA</span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full hidden sm:inline-block">
                {activeRole}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  isLinkActive(path)
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white/80'
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Action Controls: Profile + Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-extrabold text-slate-800">
                  {user?.username || user?.name || 'Authorized User'}
                </p>
                <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">{activeRole}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 shadow-xl">
          {navLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                isLinkActive(path)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                <span>{label}</span>
              </div>
              <ChevronRight className="w-5 h-5 opacity-70" />
            </Link>
          ))}

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 font-bold py-3 rounded-xl shadow-xs uppercase tracking-wider text-sm cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;