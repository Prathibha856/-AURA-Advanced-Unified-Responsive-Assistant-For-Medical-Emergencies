import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * RoleAccessCard Component
 * 
 * Renders a role selection card for the AURA Access Portal with subtle hover elevation,
 * refined borders, active states, keyboard navigation, and responsive layout.
 */
function RoleAccessCard({ option }) {
  const navigate = useNavigate();
  const Icon = option.icon;

  const handleCardClick = () => {
    navigate(option.route);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(option.route);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label={`Access ${option.title}`}
      className={`bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group outline-none focus:ring-2 focus:ring-blue-500 ${option.borderColor}`}
    >
      <div className="space-y-4">
        {/* Top Icon + Badge */}
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-2xl ${option.iconStyle} flex items-center justify-center shadow-2xs`}>
            <Icon size={24} />
          </div>
          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${option.badgeStyle}`}>
            {option.badge}
          </span>
        </div>

        {/* Title + Description */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
            {option.title}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {option.description}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-6">
        <Link
          to={option.route}
          onClick={(e) => e.stopPropagation()}
          className={`w-full inline-flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl text-xs transition-all duration-200 ${option.buttonStyle}`}
        >
          <span>{option.actionText}</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

export default RoleAccessCard;
