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
  BookOpen,
  LogOut,
  LogIn,
  ShieldCheck
} from 'lucide-react';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/access');
  };

  // Determine role-appropriate navigation links
  let navLinks = [];

  if (!isAuthenticated) {
    navLinks = [
      { path: '/', label: 'Home', icon: Heart },
      { path: '/predict', label: 'Predict', icon: Activity },
      { path: '/hospitals', label: 'Hospitals', icon: Building2 },
      { path: '/emergency', label: 'Emergency', icon: AlertTriangle },
      { path: '/chatbot', label: 'Chatbot', icon: MessageSquare },
    ];
  } else if (role === ROLES.PATIENT) {
    navLinks = [
      { path: '/', label: 'Home', icon: Heart },
      { path: '/patient/dashboard', label: 'Dashboard', icon: User },
      { path: '/predict', label: 'Predict', icon: Activity },
      { path: '/patient/medical-information', label: 'Medical Info', icon: BookOpen },
      { path: '/hospitals', label: 'Hospitals', icon: Building2 },
      { path: '/emergency', label: 'Emergency', icon: AlertTriangle },
      { path: '/chatbot', label: 'Chatbot', icon: MessageSquare },
    ];
  } else if (role === ROLES.HOSPITAL_ADMIN) {
    navLinks = [
      { path: '/hospital/dashboard', label: 'Hospital Portal', icon: Building2 },
      { path: '/emergency', label: 'Emergency SOS Center', icon: AlertTriangle },
      { path: '/hospitals', label: 'Capacity & Beds', icon: Building2 },
      { path: '/supply-chain', label: 'Hospital Supplies', icon: Package },
    ];
  } else if (role === ROLES.SUPPLY_ADMIN) {
    navLinks = [
      { path: '/supply-chain', label: 'Supply Operations', icon: Package },
      { path: '/hospitals', label: 'Facility Telemetry', icon: Building2 },
      { path: '/emergency', label: 'Emergency Logistics', icon: AlertTriangle },
    ];
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo + Tagline */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 fill-white/20" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-blue-600 tracking-tight">AURA</span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full hidden sm:inline-block">
                Medical Assistant
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
                  location.pathname === path
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white/80'
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Action Controls: Access / Log In / Log Out */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="hidden lg:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-extrabold text-slate-800">{user?.name || 'Authorized User'}</p>
                  <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">{role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/access"
                className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold px-4.5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 uppercase tracking-wider transition-all"
              >
                <LogIn size={15} />
                <span>Access AURA</span>
              </Link>
            )}

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
                location.pathname === path
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
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 font-bold py-3 rounded-xl shadow-xs uppercase tracking-wider text-sm cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                to="/access"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md uppercase tracking-wider text-sm"
              >
                <LogIn className="w-5 h-5" />
                <span>Access AURA</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;