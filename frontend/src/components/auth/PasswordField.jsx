import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

/**
 * PasswordField Component
 * 
 * Reusable password input field with show/hide password toggle.
 */
function PasswordField({
  label = 'Password',
  value,
  onChange,
  placeholder = '••••••••',
  required = true,
  focusBorderClass = 'focus:border-blue-500',
  forgotLink,
  onForgotClick
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-700">{label}</label>
        {forgotLink && (
          <a
            href="#forgot"
            onClick={(e) => {
              e.preventDefault();
              if (onForgotClick) onForgotClick();
            }}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
          >
            Forgot password?
          </a>
        )}
      </div>
      <div className="relative">
        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-9 pr-10 py-3 rounded-xl border border-slate-200 font-medium text-slate-800 bg-slate-50 focus:outline-none focus:bg-white ${focusBorderClass}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default PasswordField;
