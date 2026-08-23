import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/roles';
import {
  Heart,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

function PatientLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('sarah.j@aura.med');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Simulate mock authentication delay
    setTimeout(() => {
      login(
        {
          id: 'patient-001',
          name: 'Sarah Jenkins',
          email: email.trim(),
        },
        ROLES.PATIENT
      );
      setLoading(false);
      navigate('/patient/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md mx-auto w-full space-y-6">
        
        {/* Back Link */}
        <div>
          <Link
            to="/access"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Access Portal</span>
          </Link>
        </div>

        {/* MAIN LOGIN CARD */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-6">
          
          {/* Header Identity */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-600/20">
              <UserCheck size={24} />
            </div>

            <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full">
              Personal Healthcare Access
            </span>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Sign in to your patient dashboard & medical tools
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Patient Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@aura.med"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Password</label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Demo Mode: Click "Sign In as Patient" to proceed.');
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-3 rounded-xl border border-slate-200 font-medium text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white"
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

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md shadow-blue-600/20 transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In as Patient'}</span>
              <ArrowRight size={15} />
            </button>

          </form>

          {/* Demo Hint Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">Development Demo Login:</span>
            <p>Pre-populated with demo credentials. Click "Sign In as Patient" to enter dashboard.</p>
          </div>

          {/* Signup Link */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600 font-medium">
            New to AURA?{' '}
            <Link to="/signup/patient" className="font-extrabold text-blue-600 hover:text-blue-700">
              Create Patient Account
            </Link>
          </div>

        </div>

        <div className="text-center text-[11px] text-slate-400">
          AURA Medical Assistant • HIPAA Compliant Patient Portal
        </div>

      </div>
    </div>
  );
}

export default PatientLogin;
