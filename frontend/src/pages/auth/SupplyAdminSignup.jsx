import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/roles';
import {
  Package,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

function SupplyAdminSignup() {
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Username validation: 3-20 characters, no spaces
    if (!username.trim() || username.length < 3 || username.length > 20 || /\s/.test(username)) {
      setErrorMsg('Username must be 3-20 characters long with no spaces.');
      return;
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid organization email address.');
      return;
    }

    // 3. Password length validation
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    // 4. Password confirmation check
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please agree to healthcare supply telemetry & data policy.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await register(username.trim(), email.trim(), password, ROLES.SUPPLY_ADMIN);
      if (res.success) {
        setSuccessMsg(res.message || 'Registration successful, login again to access dashboard');
      } else {
        setErrorMsg(res.error || 'Registration failed. Username or email may already be in use.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during supply admin registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md mx-auto w-full space-y-6">
        
        <div>
          <Link
            to="/login/supply-admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Supply Admin Login</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center mx-auto shadow-md shadow-teal-700/20">
              <Package size={24} />
            </div>

            <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-0.5 rounded-full">
              Supply Logistics Authorization
            </span>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Register Supply Personnel
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Create an administrative profile for medical inventory and supply chain tracking
            </p>
          </div>

          <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 font-medium">
            <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <span>Authorized access provides live supply chain tracking and hospital inventory management.</span>
          </div>

          {successMsg && (
            <div className="bg-green-50 border border-green-300 text-green-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-green-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Username */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Logistics Username *</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. supplymgr (3-20 chars, no spaces)"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-800 bg-slate-50 focus:outline-none focus:border-teal-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Organization Email *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="logistics@aura.med"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-800 bg-slate-50 focus:outline-none focus:border-teal-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-9 pr-10 py-3 rounded-xl border border-slate-200 font-medium text-slate-800 bg-slate-50 focus:outline-none focus:border-teal-600 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Confirm Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-800 bg-slate-50 focus:outline-none focus:border-teal-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-slate-600 font-medium text-[11px] leading-relaxed">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-700 border-slate-300 focus:ring-teal-700 mt-0.5"
                />
                <span>
                  I agree to the AURA Healthcare Supply Chain &amp; Logistics Management Policy.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md shadow-teal-700/20 transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{loading ? 'Creating Account...' : 'Register Supply Admin'}</span>
              <ArrowRight size={15} />
            </button>

          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600 font-medium">
            Already have a supply account?{' '}
            <Link to="/login/supply-admin" className="font-extrabold text-teal-700 hover:underline">
              Sign In
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

export default SupplyAdminSignup;
