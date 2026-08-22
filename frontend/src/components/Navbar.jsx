import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Heart, 
  Activity, 
  AlertTriangle, 
  Package, 
  MessageSquare, 
  Menu, 
  X,
  ChevronRight,
  User
} from 'lucide-react';

function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home', icon: Heart },
    { path: '/patient/dashboard', label: 'Dashboard', icon: User },
    { path: '/predict', label: 'Predict', icon: Activity },
    { path: '/emergency', label: 'Emergency', icon: AlertTriangle },
    { path: '/supply-chain', label: 'Supply Chain', icon: Package },
    { path: '/chatbot', label: 'Chatbot', icon: MessageSquare },
  ];

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
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  location.pathname === path
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white/80'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Quick Action Button & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <Link
              to="/emergency"
              className="hidden lg:flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-md shadow-red-600/20 uppercase tracking-wider animate-pulse hover:animate-none"
            >
              <AlertTriangle className="w-4 h-4" />
              SOS Emergency
            </Link>

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
          <div className="pt-2">
            <Link
              to="/emergency"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 rounded-xl shadow-md uppercase tracking-wider text-sm"
            >
              <AlertTriangle className="w-5 h-5" />
              Trigger Emergency SOS
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;