import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * AuthLayout Component
 * 
 * Reusable wrapper component for authentication login and signup pages.
 * Enforces consistent medical blue, cool gray styling, top navigation link, and identity badge.
 */
function AuthLayout({
  children,
  backTo = '/access',
  backLabel = 'Back to Access Portal',
  badgeText,
  title,
  subtitle,
  icon: Icon,
  iconBgClass = 'bg-blue-600 text-white',
  footerText = 'AURA Medical Assistant • HIPAA Compliant Portal'
}) {
  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md mx-auto w-full space-y-6">
        
        {/* Back Link */}
        <div>
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>{backLabel}</span>
          </Link>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-6">
          
          {/* Card Header */}
          <div className="text-center space-y-2">
            {Icon && (
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-md ${iconBgClass}`}>
                <Icon size={24} />
              </div>
            )}

            {badgeText && (
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full">
                {badgeText}
              </span>
            )}

            {title && (
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {title}
              </h1>
            )}

            {subtitle && (
              <p className="text-xs text-slate-500 font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {children}

        </div>

        {/* Footer Identity Notice */}
        <div className="text-center text-[11px] text-slate-400">
          {footerText}
        </div>

      </div>
    </div>
  );
}

export default AuthLayout;
