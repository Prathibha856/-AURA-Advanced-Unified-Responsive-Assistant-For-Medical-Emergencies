import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/roles';
import {
  Package,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Boxes,
  ShieldAlert
} from 'lucide-react';

function SupplyAdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('logistics@aura.med');
  const [password, setPassword] = useState('supplypass123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      login(
        {
          id: 'supply-admin-01',
          name: 'Marcus Brody',
          email: email.trim(),
          organization: 'Central Health Logistics Hub',
        },
        ROLES.SUPPLY_ADMIN
      );
      setLoading(false);
      navigate('/supply-chain');
    }, 400);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md mx-auto w-full space-y-6">
        
        <div>
          <Link
            to="/access"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Access Portal</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center mx-auto shadow-md shadow-teal-700/20">
              <Package size={24} />
            </div>

            <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-0.5 rounded-full">
              Supply Chain Operations
            </span>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Supply Operations Access
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Monitor medical inventory, stock telemetry & healthcare logistics
            </p>
          </div>

          <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 font-medium">
            <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <span>Access is restricted to authorized healthcare supply personnel and logistics administrators.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Organization Email */}
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
                  placeholder="••••••••"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md shadow-teal-700/20 transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Authenticate Supply Admin'}</span>
              <ArrowRight size={15} />
            </button>

          </form>

          {/* Demo Hint Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">Demo Supply Credentials:</span>
            <p>Click "Authenticate Supply Admin" to enter Supply Chain Dashboard.</p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default SupplyAdminLogin;
