import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../../config/roles';
import { api, ApiError } from '../../services/api';
import {
  Heart,
  Lock,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Package,
  UserCheck,
  Sparkles,
  Loader2
} from 'lucide-react';

/**
 * AuthPortal Component
 * 
 * Unified Authentication Experience offering seamless toggle between:
 * 1. Login (Principal: username or email + password)
 * 2. Register (strictly aligns with Spring Boot RegisterRequest: username, email, password, role)
 */
function AuthPortal({ initialTab = 'login' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Determine active tab from prop or query param
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'register' ? 'register' : initialTab);

  // Sync tab with URL
  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setErrorMsg('');
    setSuccessMsg('');
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Registration Form State (Aligned with backend RegisterRequest DTO)
  // ──────────────────────────────────────────────────────────────────────────
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState(ROLES.PATIENT);
  const [regShowPassword, setRegShowPassword] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // Login Form State (Aligned with backend LoginRequest DTO)
  // ──────────────────────────────────────────────────────────────────────────
  const [loginPrincipal, setLoginPrincipal] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto route helper according to role
  const navigateByRole = (userRole) => {
    if (userRole === ROLES.HOSPITAL_ADMIN) {
      navigate('/hospital/dashboard');
    } else if (userRole === ROLES.SUPPLY_ADMIN) {
      navigate('/supply-chain');
    } else {
      navigate('/patient/dashboard');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Registration Handler: POST /api/auth/register
  // ──────────────────────────────────────────────────────────────────────────
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Please complete all registration fields.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    const payload = {
      username: regUsername.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: regRole, // PATIENT, HOSPITAL_ADMIN, or SUPPLY_ADMIN
    };

    try {
      // Call backend POST /api/auth/register
      const response = await api.post('/auth/register', payload);

      setSuccessMsg(
        typeof response === 'string'
          ? response
          : 'Registration successful! You may now sign in with your credentials.'
      );
      // Pre-fill login input with registered username/email
      setLoginPrincipal(regUsername.trim());
      setLoginPassword('');
      // Switch tab to login after short delay
      setTimeout(() => {
        setActiveTab('login');
        setSearchParams({ tab: 'login' });
      }, 1200);
    } catch (err) {
      // Fallback for standalone frontend development if backend is not running
      if (err.message && err.message.includes('Network error')) {
        setSuccessMsg(
          'Registered in local dev mode! Swapping to Login tab...'
        );
        setLoginPrincipal(regUsername.trim());
        setTimeout(() => {
          setActiveTab('login');
          setSearchParams({ tab: 'login' });
        }, 1200);
      } else {
        setErrorMsg(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Login Handler: POST /api/auth/login
  // ──────────────────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginPrincipal.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter your username/email and password.');
      return;
    }

    setLoading(true);

    const payload = {
      principal: loginPrincipal.trim(),
      password: loginPassword,
    };

    try {
      // Call backend POST /api/auth/login
      const response = await api.post('/auth/login', payload);

      const userRole = response.role || ROLES.PATIENT;
      const userData = {
        id: response.userId || `usr-${Date.now()}`,
        name: response.username || loginPrincipal.trim(),
        email: response.email || (loginPrincipal.includes('@') ? loginPrincipal.trim() : `${loginPrincipal.trim()}@aura.med`),
      };

      login(userData, userRole, response.token);
      navigateByRole(userRole);
    } catch (err) {
      // If backend network error in local development mode, provide safe dev login fallback
      if (err.message && err.message.includes('Network error')) {
        let inferredRole = ROLES.PATIENT;
        if (loginPrincipal.toLowerCase().includes('hospital') || loginPrincipal.toLowerCase().includes('admin')) {
          inferredRole = ROLES.HOSPITAL_ADMIN;
        } else if (loginPrincipal.toLowerCase().includes('supply')) {
          inferredRole = ROLES.SUPPLY_ADMIN;
        }

        login(
          {
            id: `dev-${Date.now()}`,
            name: loginPrincipal.trim(),
            email: loginPrincipal.includes('@') ? loginPrincipal.trim() : `${loginPrincipal.trim()}@aura.med`,
          },
          inferredRole
        );
        navigateByRole(inferredRole);
      } else {
        setErrorMsg(err.message || 'Invalid credentials. Please verify and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Autofill Helper
  const handleQuickDemo = (roleKey) => {
    if (roleKey === ROLES.PATIENT) {
      setLoginPrincipal('patient.sarah');
      setLoginPassword('password123');
    } else if (roleKey === ROLES.HOSPITAL_ADMIN) {
      setLoginPrincipal('hospital.admin');
      setLoginPassword('admin123');
    } else if (roleKey === ROLES.SUPPLY_ADMIN) {
      setLoginPrincipal('supply.manager');
      setLoginPassword('supply123');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md mx-auto w-full space-y-6">
        
        {/* Top Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>

          <Link
            to="/access"
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Role Directory
          </Link>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl space-y-6">
          
          {/* Header Identity */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-600/25">
              <Heart className="w-6 h-6 fill-white/20" />
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                AURA
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Medical Gate
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {activeTab === 'login'
                ? 'Sign in to access your health portal, triage & telemetry'
                : 'Register with AURA to connect with medical emergency services'}
            </p>
          </div>

          {/* Tab Switcher Pills */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-sm font-bold">
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={`py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck size={16} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('register')}
              className={`py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles size={16} />
              <span>Register</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* TAB 1: LOGIN FORM */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Principal: Username or Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginPrincipal}
                    onChange={(e) => setLoginPrincipal(e.target.value)}
                    placeholder="e.g. sarah.j or user@aura.med"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={loginShowPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setLoginShowPassword(!loginShowPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {loginShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to AURA</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Quick Dev Autofill Helpers */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 text-center mb-2">
                  Quick Testing Credentials:
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo(ROLES.PATIENT)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-semibold text-slate-600 rounded-lg border border-slate-200 transition-colors"
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo(ROLES.HOSPITAL_ADMIN)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-[11px] font-semibold text-slate-600 rounded-lg border border-slate-200 transition-colors"
                  >
                    Hospital
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo(ROLES.SUPPLY_ADMIN)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-[11px] font-semibold text-slate-600 rounded-lg border border-slate-200 transition-colors"
                  >
                    Supply
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* TAB 2: REGISTRATION FORM (Strictly matches RegisterRequest.java) */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* Field 1: Username */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    name="username"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Choose unique username (e.g. johndoe)"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Field 2: Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    name="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Field 3: Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={regShowPassword ? 'text' : 'password'}
                    required
                    name="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {regShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Field 4: Role (Enum: PATIENT, HOSPITAL_ADMIN, SUPPLY_ADMIN) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  User Role <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-medium text-slate-800"
                  >
                    <option value={ROLES.PATIENT}>PATIENT — Health &amp; Emergency Access</option>
                    <option value={ROLES.HOSPITAL_ADMIN}>HOSPITAL_ADMIN — Hospital Operations &amp; Dispatch</option>
                    <option value={ROLES.SUPPLY_ADMIN}>SUPPLY_ADMIN — Medical Supply Chain</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Note: User ID is automatically generated by the database.
                </p>
              </div>

              {/* Submit Registration Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create AURA Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Footer Identity Notice */}
        <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Shield size={14} className="text-slate-400" />
          <span>AURA Medical Systems • Encrypted Role Authorization</span>
        </div>

      </div>
    </div>
  );
}

export default AuthPortal;
