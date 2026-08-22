import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/roles';
import {
  Activity,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Shield,
  FileText,
  Clock,
  BookOpen,
  Stethoscope,
  ChevronRight,
  User,
  LogOut,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  Search,
  Bell
} from 'lucide-react';

/**
 * PatientDashboard Component
 * 
 * Central hub for authenticated patients in AURA.
 * Provides high-priority emergency access, quick triage actions,
 * system status overview, recent diagnostic records, activity timeline,
 * and AI triage assistance shortcuts.
 */
function PatientDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedPrompt, setSelectedPrompt] = useState('');

  // Determine dynamic greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Safe fallback patient name
  const patientName = user?.name || 'Patient';
  const patientEmail = user?.email || 'patient@aura.med';
  const userInitial = patientName.charAt(0).toUpperCase();

  const handlePromptClick = (promptText) => {
    navigate('/chatbot', { state: { initialPrompt: promptText } });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const quickActions = [
    {
      id: 'predict',
      title: 'Disease Prediction',
      description: 'Evaluate symptoms across 5 clinical risk categories with ML models',
      icon: Activity,
      path: '/predict',
      badge: '5 Categories',
      color: 'blue',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    },
    {
      id: 'history',
      title: 'Prediction History',
      description: 'Review previous health assessment logs and risk score summaries',
      icon: FileText,
      path: '/predict',
      badge: 'Clinical Records',
      color: 'indigo',
      borderColor: 'border-indigo-200',
      iconBg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    },
    {
      id: 'medical-info',
      title: 'Medical Information',
      description: 'Explore verified symptoms, conditions, and prevention guides',
      icon: BookOpen,
      path: '/chatbot',
      badge: 'Verified Guides',
      color: 'emerald',
      borderColor: 'border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    },
    {
      id: 'ask-aura',
      title: 'Ask AURA',
      description: '24/7 intelligent health assistant grounded in clinical guidelines',
      icon: MessageSquare,
      path: '/chatbot',
      badge: 'AI Assistant',
      color: 'purple',
      borderColor: 'border-purple-200',
      iconBg: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    },
  ];

  const suggestedQuestions = [
    'What does this symptom mean?',
    'Explain my prediction.',
    'When should I seek medical help?',
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. PATIENT WELCOME & PROFILE HEADER */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-gradient-to-bl from-blue-100/40 via-indigo-50/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar badge */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md shadow-blue-600/20 shrink-0">
              {userInitial}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {getGreeting()}, {patientName}
                </h1>
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  <User size={12} />
                  Patient
                </span>
              </div>
              <p className="text-slate-600 text-sm sm:text-base font-medium mt-1">
                How can AURA assist you today?
              </p>
            </div>
          </div>

          {/* Quick Profile Actions */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="hidden sm:block text-right pr-2">
              <p className="text-xs font-bold text-slate-800">{patientName}</p>
              <p className="text-[11px] text-slate-400 font-mono">{patientEmail}</p>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-red-600 bg-slate-100/80 hover:bg-red-50 border border-slate-200/70 hover:border-red-200 rounded-xl transition-all cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. EMERGENCY SOS BANNER */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-3xl p-6 sm:p-7 shadow-lg shadow-red-600/20 relative overflow-hidden">
        {/* Background glow and subtle pulsing waves */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <AlertTriangle size={26} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-md">
                  High Priority
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Emergency SOS
                </h2>
              </div>
              <p className="text-red-100 text-sm mt-1 font-medium">
                Need immediate assistance? Broadcast live GPS coordinates to local emergency services.
              </p>
            </div>
          </div>

          <Link
            to="/emergency"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 font-extrabold px-6 py-3.5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 shrink-0 text-sm tracking-wide uppercase"
          >
            <span>Trigger SOS</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. QUICK ACTIONS GRID (4 Cards) */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Quick Actions</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Instant medical services</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.id}
                to={action.path}
                className="group bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${action.iconBg} flex items-center justify-center transition-colors duration-300 shadow-xs`}>
                      <Icon size={24} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {action.badge}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed mt-1.5">
                    {action.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Open module</span>
                  <ChevronRight size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. AURA ASSISTANT INTERACTIVE SHORTCUT & OVERVIEW STATS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: AURA ASSISTANT (7 Cols) */}
        <section className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">✨ AURA Assistant</h3>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  RAG Clinical AI
                </span>
              </div>
            </div>

            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <p className="text-slate-900 font-bold text-sm">
              Hello! 👋 How can I help you today?
            </p>
            <p className="text-slate-600 text-xs leading-relaxed">
              Ask about symptom interpretations, guidance on potential health conditions, or when to schedule emergency consultation.
            </p>
          </div>

          {/* Suggested Prompt Chips */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Suggested Questions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handlePromptClick(q)}
                  className="text-left text-xs font-semibold text-slate-700 bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare size={14} className="text-purple-500 shrink-0" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/chatbot"
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md shadow-purple-600/20 transition-all hover:shadow-purple-600/30 cursor-pointer"
            >
              <MessageSquare size={16} />
              <span>Launch Full Medical Chatbot</span>
            </Link>
          </div>
        </section>

        {/* RIGHT COLUMN: YOUR AURA OVERVIEW (5 Cols) */}
        <section className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-black text-slate-900 text-lg">Your AURA Overview</h3>
            <span className="text-xs font-semibold text-slate-500">Status Monitor</span>
          </div>

          <div className="space-y-3.5">
            {/* Overview Item 1 */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3.5">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl mt-0.5 shrink-0">
                <Activity size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Prediction History</h4>
                  <span className="text-[11px] font-semibold text-slate-500">0 Reports</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Your prediction history will appear here once submitted.
                </p>
              </div>
            </div>

            {/* Overview Item 2 */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3.5">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-xl mt-0.5 shrink-0">
                <Sparkles size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">AURA Assistant</h4>
                  <span className="text-[11px] font-bold text-purple-600">Active</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Ask AURA anytime for verified medical insights.
                </p>
              </div>
            </div>

            {/* Overview Item 3 */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3.5">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl mt-0.5 shrink-0">
                <Shield size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Emergency Status</h4>
                  <span className="text-[11px] font-bold text-emerald-600">Standby</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  No active emergency. Rapid GPS SOS ready.
                </p>
              </div>
            </div>

            {/* Overview Item 4 */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3.5">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl mt-0.5 shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Medical Knowledge</h4>
                  <span className="text-[11px] font-semibold text-slate-500">5 Categories</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Verified clinical references available for triage guidance.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* 5. RECENT PREDICTIONS & RECENT ACTIVITY (Honest Development States) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* RECENT PREDICTIONS (7 Cols) */}
        <section className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Recent Predictions</h3>
              <p className="text-xs text-slate-500">Diagnostic evaluations matching clinical records</p>
            </div>
            <Link
              to="/predict"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>New Assessment</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Honest Empty State */}
          <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
              <Activity size={24} />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-sm font-bold text-slate-800">No Recent Predictions</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                You haven't run any disease prediction assessments yet. When you submit clinical symptoms, your records and risk reports will appear here.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/predict"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl shadow-2xs transition-colors"
              >
                <span>Start Disease Prediction</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* RECENT ACTIVITY (5 Cols) */}
        <section className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Recent Activity</h3>
              <p className="text-xs text-slate-500">Timeline of healthcare interactions</p>
            </div>
          </div>

          {/* Honest Empty State */}
          <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto shadow-xs">
              <Clock size={24} />
            </div>
            <div className="space-y-1 max-w-xs mx-auto">
              <h4 className="text-sm font-bold text-slate-800">No Activity Logged</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your diagnostic evaluations, assistant conversations, and emergency actions will be tracked here.
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* 6. MEDICAL INFORMATION SHORTCUT */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-blue-400" />
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                Clinical Reference
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Explore Medical Information
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Access verified information across major condition categories, common clinical symptoms, and preventive healthcare recommendations.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
            <Link
              to="/predict"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl border border-white/20 text-xs transition-colors"
            >
              <Stethoscope size={14} />
              <span>Browse Symptoms</span>
            </Link>
            <Link
              to="/chatbot"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/30 transition-colors"
            >
              <Sparkles size={14} />
              <span>Ask AURA</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

export default PatientDashboard;
