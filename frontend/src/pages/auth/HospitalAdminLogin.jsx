import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/roles';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Building,
  ShieldAlert
} from 'lucide-react';

function HospitalAdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both administrator username/email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await login(username, password);
      if (res.success) {
        if (res.role === ROLES.HOSPITAL_ADMIN) {
          navigate('/hospital/dashboard');
        } else if (res.role === ROLES.SUPPLY_ADMIN) {
          navigate('/supply-chain');
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMsg(res.error || 'Invalid credentials or unauthorized role.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during hospital admin sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md mx-auto w-full space-y-6">
        
        <div>
          <Link
            to="/access"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Access Portal</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
              <Building2 size={24} />
            </div>

            <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-3 py-0.5 rounded-full">
              Hospital Operations Center
            </span>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Hospital Administrator Access
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage emergency alerts, capacity telemetry & hospital dispatch
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 font-medium">
            <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <span>This area is restricted strictly to authorized hospital personnel and emergency operations staff.</span>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Official Username or Email */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Official Username or Email *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@hospital.med or username"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-800 bg-slate-50 focus:outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>
            </div>

            {/* Hospital Facility ID (Optional) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Hospital Facility Identifier (Optional)</label>
              <div className="relative">
                <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  placeholder="e.g. HOSP-101"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-800 bg-slate-50 focus:outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Administrator Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-3 rounded-xl border border-slate-200 font-medium text-slate-800 bg-slate-50 focus:outline-none focus:border-slate-800 focus:bg-white"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{loading ? 'Verifying Credentials...' : 'Authenticate Hospital Admin'}</span>
              <ArrowRight size={15} />
            </button>

          </form>

          {/* Registration Link */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600 font-medium">
            Don't have an administrator account?{' '}
            <Link to="/signup/hospital-admin" className="font-extrabold text-slate-900 hover:underline">
              Register Facility Admin
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

export default HospitalAdminLogin;
