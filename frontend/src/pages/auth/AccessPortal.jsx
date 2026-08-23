import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  UserCheck,
  Building2,
  Package,
  ShieldCheck
} from 'lucide-react';
import { ROLES } from '../../config/roles';
import RoleAccessCard from '../../components/auth/RoleAccessCard';

function AccessPortal() {
  const roleOptions = [
    {
      id: 'patient',
      role: ROLES.PATIENT,
      title: 'PATIENT',
      badge: 'Personal Healthcare',
      icon: UserCheck,
      description: 'Access your personal health dashboard, AI-assisted symptom analysis, medical information, emergency support, and healthcare services.',
      actionText: 'Continue as Patient',
      route: '/login/patient',
      borderColor: 'hover:border-blue-500',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
      iconStyle: 'bg-blue-100 text-blue-600',
      buttonStyle: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20',
    },
    {
      id: 'hospital-admin',
      role: ROLES.HOSPITAL_ADMIN,
      title: 'HOSPITAL ADMIN',
      badge: 'Hospital Operations',
      icon: Building2,
      description: 'Manage emergency alerts, hospital capacity, patient emergency coordination, inventory, and healthcare operations.',
      actionText: 'Hospital Admin Access',
      route: '/login/hospital-admin',
      borderColor: 'hover:border-slate-700',
      badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
      iconStyle: 'bg-slate-800 text-white',
      buttonStyle: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm',
    },
    {
      id: 'supply-admin',
      role: ROLES.SUPPLY_ADMIN,
      title: 'SUPPLY CHAIN ADMIN',
      badge: 'Medical Logistics',
      icon: Package,
      description: 'Monitor medical inventory, supply availability, low-stock alerts, and healthcare logistics.',
      actionText: 'Supply Chain Access',
      route: '/login/supply-admin',
      borderColor: 'hover:border-teal-600',
      badgeStyle: 'bg-teal-50 text-teal-700 border-teal-200',
      iconStyle: 'bg-teal-100 text-teal-700',
      buttonStyle: 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm shadow-teal-700/20',
    },
  ];

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-4xl mx-auto w-full space-y-10">
        
        {/* HEADER SECTION */}
        <div className="text-center space-y-3">
          {/* Logo Identity */}
          <div className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <Heart className="w-7 h-7 fill-white/20" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-blue-600 tracking-tight">AURA</span>
              <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                Access Portal
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Welcome to AURA
          </h1>

          <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-widest">
            Advanced Unified Responsive Assistant for Medical Emergencies
          </p>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed pt-1">
            "One intelligent platform connecting patients, hospitals, emergency response, and healthcare operations."
          </p>
        </div>

        {/* ROLE SELECTION QUESTION */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-slate-900">How would you like to access AURA?</h2>
          <p className="text-xs text-slate-500">Select your authorization portal to proceed</p>
        </div>

        {/* ROLE OPTIONS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {roleOptions.map((opt) => (
            <RoleAccessCard key={opt.id} option={opt} />
          ))}
        </div>

        {/* FOOTER NOTICE */}
        <div className="text-center text-xs text-slate-500 pt-4 flex items-center justify-center gap-1.5">
          <ShieldCheck size={16} className="text-slate-400" />
          <span>Encrypted HIPAA-ready session layer for all authorized roles.</span>
        </div>

      </div>
    </div>
  );
}

export default AccessPortal;
