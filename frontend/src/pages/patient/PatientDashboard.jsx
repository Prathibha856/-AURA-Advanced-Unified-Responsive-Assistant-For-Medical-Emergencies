import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/roles';
import predictionService from '../../services/predictionService';
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
  Building2,
  CheckCircle2,
  Calendar,
  HeartPulse,
  Flame,
  Search,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const patientName = user?.name || 'Sarah Jenkins';
  const patientEmail = user?.email || 'sarah.j@aura.med';
  const userInitial = patientName.charAt(0).toUpperCase();

  useEffect(() => {
    async function loadData() {
      try {
        const history = await predictionService.getPredictionHistory();
        setPredictions(history);
      } catch (err) {
        console.error('Failed to load predictions', err);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/access');
  };

  const quickActions = [
    {
      id: 'predict',
      title: 'Start Disease Prediction',
      description: 'Analyze symptoms across 5 clinical risk categories with AI',
      icon: Activity,
      path: '/predict',
      badge: 'ML Engine',
      color: 'bg-blue-600 text-white shadow-blue-600/30',
      iconBg: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    },
    {
      id: 'result',
      title: 'View Prediction Result',
      description: 'Review your latest AI diagnostic report & precautions',
      icon: FileText,
      path: predictions[0] ? `/prediction/result/${predictions[0].id}` : '/predict',
      badge: 'Latest Report',
      color: 'bg-indigo-600 text-white shadow-indigo-600/30',
      iconBg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    },
    {
      id: 'medical-info',
      title: 'Medical Information',
      description: 'Manage personal health history, allergies & medications',
      icon: BookOpen,
      path: '/patient/medical-information',
      badge: 'Health Profile',
      color: 'bg-emerald-600 text-white shadow-emerald-600/30',
      iconBg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    },
    {
      id: 'hospitals',
      title: 'Find Nearby Hospitals',
      description: 'Locate 24/7 ER units & live ICU bed availability',
      icon: Building2,
      path: '/hospitals',
      badge: 'Live Map',
      color: 'bg-purple-600 text-white shadow-purple-600/30',
      iconBg: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    },
    {
      id: 'emergency',
      title: 'Emergency SOS',
      description: 'One-touch GPS dispatch for rapid medical assistance',
      icon: AlertTriangle,
      path: '/emergency',
      badge: 'High Priority',
      color: 'bg-red-600 text-white shadow-red-600/30',
      iconBg: 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white',
    },
  ];

  const activityTimeline = [
    {
      id: 'act-1',
      title: 'Disease Prediction Completed',
      details: 'Analyzed 3 symptoms (Dry Cough, Fever, Sore Throat)',
      time: '2 hours ago',
      type: 'prediction',
      icon: Activity,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'act-2',
      title: 'Medical Profile Updated',
      details: 'Confirmed emergency contact & allergy records',
      time: 'Yesterday at 16:40',
      type: 'profile',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'act-3',
      title: 'Nearby Hospital Saved',
      details: 'St. Jude Emergency & Specialty Hospital added to fast-dial',
      time: '3 days ago',
      type: 'hospital',
      icon: Building2,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      id: 'act-4',
      title: 'Emergency SOS Readiness Check',
      details: 'GPS location tracking & alert channel status verified',
      time: '5 days ago',
      type: 'emergency',
      icon: Shield,
      color: 'text-red-600 bg-red-50 border-red-200',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. TOP WELCOME AREA */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-gradient-to-bl from-blue-100/40 via-indigo-50/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Welcome Text */}
          <div className="flex items-start sm:items-center gap-4">
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
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 flex items-center gap-2">
                <Calendar size={14} className="text-blue-600" />
                <span>{formattedDate}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">AURA Healthcare Intelligence</span>
              </p>
            </div>
          </div>

          {/* Health Insight Box & Logout */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl px-4 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles size={16} />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider">AURA Health Insight</p>
                <p className="text-xs text-blue-700 font-medium">Record symptoms early for highest predictive accuracy.</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-slate-600 hover:text-red-600 bg-slate-100/80 hover:bg-red-50 border border-slate-200/70 hover:border-red-200 rounded-xl transition-all cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. HEALTH OVERVIEW METRICS */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Health Status</p>
            <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-1.5">
              <span>Optimal Standing</span>
            </h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              All Vitals Normal
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <HeartPulse size={24} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Prediction</p>
            <h3 className="text-sm font-black text-slate-900 mt-1 truncate max-w-[140px]">
              {predictions[0]?.predictedCondition || 'No recent tests'}
            </h3>
            <p className="text-[11px] text-blue-600 font-bold mt-1">
              {predictions[0] ? `${predictions[0].confidence}% Confidence` : 'Ready for evaluation'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Activity size={24} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tracked Symptoms</p>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              {predictions[0]?.symptomsCount || 3} Active Symptoms
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Updated 2 hours ago
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Flame size={24} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency Readiness</p>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Standby Ready
            </h3>
            <p className="text-[11px] text-indigo-600 font-bold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              GPS & Hospitals Connected
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Shield size={24} />
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. EMERGENCY SOS BANNER */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-3xl p-6 sm:p-7 shadow-lg shadow-red-600/20 relative overflow-hidden">
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
                  Emergency SOS Alert
                </h2>
              </div>
              <p className="text-red-100 text-xs sm:text-sm mt-1 font-medium">
                Experiencing severe chest pain, breathlessness, or trauma? Broadcast live GPS to emergency responders immediately.
              </p>
            </div>
          </div>

          <Link
            to="/emergency"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 font-extrabold px-6 py-3.5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 shrink-0 text-sm tracking-wide uppercase cursor-pointer"
          >
            <span>Trigger SOS</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. QUICK ACTIONS GRID */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Quick Actions</h2>
            <p className="text-xs text-slate-500">Access core patient tools & health services</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                      {action.badge}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed mt-1.5">
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
      {/* 5. RECENT PREDICTIONS HISTORY & HEALTH TIMELINE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* RECENT PREDICTIONS (7 Cols) */}
        <section className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Recent Predictions</h3>
              <p className="text-xs text-slate-500">AI symptom assessment history</p>
            </div>
            <Link
              to="/predict"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200/80 transition-colors"
            >
              <span>+ New Assessment</span>
            </Link>
          </div>

          {loadingHistory ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold animate-pulse">
              Loading prediction records...
            </div>
          ) : predictions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Activity size={24} />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-slate-800">No Recent Predictions</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Start your first symptom assessment to generate an AI risk score report.
                </p>
              </div>
              <Link
                to="/predict"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
              >
                <span>Start Assessment</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {predictions.map((pred) => (
                <div
                  key={pred.id}
                  className="p-4 bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-blue-200 rounded-2xl transition-all shadow-2xs hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">{pred.id}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-500 font-medium">{pred.date} at {pred.time}</span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 truncate">
                      {pred.predictedCondition}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-extrabold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                        {pred.confidence}% Confidence
                      </span>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          pred.riskLevel === 'High Attention'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : pred.riskLevel === 'Moderate Attention'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {pred.riskLevel}
                      </span>

                      <span className="text-[11px] text-slate-500 font-medium">
                        {pred.symptomsCount} symptoms
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/prediction/result/${pred.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-600 font-bold border border-slate-200 hover:border-blue-300 text-xs rounded-xl transition-all shrink-0 shadow-2xs"
                  >
                    <span>View Details</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* HEALTH ACTIVITY TIMELINE (5 Cols) */}
        <section className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Health Activity</h3>
              <p className="text-xs text-slate-500">Log of recent interactions</p>
            </div>
            <Clock size={18} className="text-slate-400" />
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activityTimeline.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{item.details}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>

    </div>
  );
}

export default PatientDashboard;
