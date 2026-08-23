// ============================================================================
// FILE: src/pages/LandingPage.jsx
// PROJECT: AURA - Advanced Unified Responsive Assistant for Medical Emergencies
// DESCRIPTION: Production-Ready, Medical-Grade Landing Page component.
// SECTIONS (IN EXACT ORDER):
//   1. NAVBAR (Sticky glassmorphism, logo gradient, 5 nav links, SOS button, mobile menu)
//   2. HERO SECTION (Floating 3D shapes, badges, gradient headline, dual CTAs, 3 stat cards)
//   3. SYSTEM STATUS DASHBOARD (Glassmorphism card, operational green indicator, 4 modules status)
//   4. PLATFORM OVERVIEW (About AURA: 2-column layout, text + architectural flowchart, pill badges)
//   5. HOW AURA WORKS (Simplified workflow: 4 steps with icons, badges, step links)
//   6. MODULES OVERVIEW (4 cards grid: Predict, Emergency, Supply Chain, Chatbot with 3D hover effects)
//   7. WHY AURA (3 key benefits: Faster Diagnosis, Real-time Response, Trusted Information)
//   8. HEALTHCARE DISCLAIMER (Required warning banner with exact legal text)
//   9. FOOTER (Dark theme, 4 columns: Brand, Quick Links, Modules, Emergency Contact, Copyright)
// ============================================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Package,
  MessageCircle,
  Shield,
  Clock,
  ChevronRight,
  CheckCircle,
  Zap,
  Heart,
  Database,
  ArrowRight,
  Cpu,
  Radio,
  Menu,
  X,
  Sparkles,
  CircleDot,
  FileText,
  Stethoscope,
  Brain,
  PhoneCall
} from 'lucide-react';

// ============================================================================
// 1. NAVBAR SECTION
// ============================================================================
function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/', isAnchor: true, targetId: 'hero' },
    { name: 'Predict', path: '/predict', isAnchor: false },
    { name: 'Emergency', path: '/emergency', isAnchor: false },
    { name: 'Supply Chain', path: '/supply-chain', isAnchor: false },
    { name: 'Chatbot', path: '/chatbot', isAnchor: false },
  ];

  const handleNavClick = (link) => {
    setActiveNav(link.name);
    setMobileMenuOpen(false);

    if (link.isAnchor) {
      const element = document.getElementById(link.targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      navigate(link.path);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo with Gradient Text */}
          <Link 
            to="/" 
            onClick={() => handleNavClick(navLinks[0])}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform duration-300">
              <Heart className="w-6 h-6 fill-white/20" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                AURA
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
                Medical Assistant
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 shadow-inner">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${
                  activeNav === link.name
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white/80'
                }`}
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* Right Action Button & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <Link
              to="/emergency"
              className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold px-4.5 py-2.5 rounded-xl shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 uppercase tracking-wider animate-pulse hover:animate-none transition-all duration-300"
            >
              <AlertTriangle className="w-4 h-4" />
              Emergency SOS
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-300">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link)}
              className={`w-full text-left px-4 py-3 rounded-xl text-base font-semibold transition-all flex items-center justify-between ${
                activeNav === link.name
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
              }`}
            >
              <span>{link.name}</span>
              <ChevronRight className="w-5 h-5 opacity-70" />
            </button>
          ))}
          <div className="pt-2">
            <Link
              to="/emergency"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold py-3 rounded-xl shadow-md uppercase tracking-wider text-sm"
            >
              <AlertTriangle className="w-5 h-5" />
              Trigger Emergency SOS
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ============================================================================
// 2. HERO SECTION
// ============================================================================
function HeroSection() {
  return (
    <section id="hero" className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/60">
      
      {/* Animated 3D Floating Background Circles */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-300/25 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl animate-float-reverse" />
        <div className="absolute bottom-10 left-1/4 w-64 h-64 bg-sky-200/30 rounded-full blur-2xl animate-pulse-glow" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Badges */}
        <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6">
          <span className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase border border-rose-200/80 shadow-xs animate-pulse">
            <AlertTriangle size={14} />
            🚨 TRIGGER EMERGENCY SOS
          </span>
          <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase border border-blue-200/80 shadow-xs">
            <Shield size={14} className="text-blue-600" />
            🛡️ 4 INTEGRATED MODULES
          </span>
        </div>

        {/* Main Headline + CTAs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight">
              Advanced Unified Responsive Assistant for{' '}
              <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent block mt-2">
                Medical Emergencies
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              AI-powered disease prediction, emergency alerts, medical supply chain, and chatbot assistance — all in one platform.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/access"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 transition-all duration-300 text-base animate-pulse-subtle group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>

              <a
                href="#about"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 hover:text-blue-600 font-bold px-8 py-4 rounded-xl border-2 border-slate-300 hover:border-blue-600 shadow-xs transition-all duration-300 text-base"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Right Hero Graphic Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl shadow-blue-900/10 border border-slate-200/90 overflow-hidden card-3d-hover">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">
                    AURA Core Active
                  </span>
                </div>
                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  v2.4 Live
                </span>
              </div>

              <div className="mt-5 space-y-3.5">
                <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-lg">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">ML Disease Predictor</div>
                      <div className="text-[11px] text-slate-500">5 Disease Models</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-white px-2 py-1 rounded-md shadow-xs">99.4% Accurate</span>
                </div>

                <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-600 text-white rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">GPS Emergency SOS</div>
                      <div className="text-[11px] text-slate-500">Live Telemetry</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-600 bg-white px-2 py-1 rounded-md shadow-xs">&lt; 3s Dispatch</span>
                </div>

                <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-lg">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Supply Chain Monitor</div>
                      <div className="text-[11px] text-slate-500">Inventory Synced</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded-md shadow-xs">Optimal Stock</span>
                </div>

                <div className="p-3.5 bg-purple-50/80 rounded-xl border border-purple-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600 text-white rounded-lg">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">RAG Medical Assistant</div>
                      <div className="text-[11px] text-slate-500">24/7 AI Triage</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-white px-2 py-1 rounded-md shadow-xs">Online</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Unified Academic Platform</span>
                <span className="text-blue-600 font-semibold flex items-center gap-1">
                  Medical Grade <Sparkles className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Stat Cards Below */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-blue-100 text-center hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Activity size={26} />
              </div>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Prediction Accuracy</h3>
            <p className="text-sm font-semibold text-blue-600 mt-1">ML Diagnostics</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-rose-100 text-center hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <AlertTriangle size={26} />
              </div>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Emergency Dispatch</h3>
            <p className="text-sm font-semibold text-rose-600 mt-1">Instant SOS</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-purple-100 text-center hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                <MessageCircle size={26} />
              </div>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Availability</h3>
            <p className="text-sm font-semibold text-purple-600 mt-1">24/7 AI Guidance</p>
          </div>
        </div>

      </div>
    </section>
  );
}

// ============================================================================
// 3. SYSTEM STATUS DASHBOARD
// ============================================================================
function SystemStatusDashboard() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-200/70">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl shadow-blue-900/10 border border-slate-200/90 p-6 md:p-8 border-t-2 border-t-blue-500">
          
          {/* Header Title with Animated Green Dot */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="relative flex items-center justify-center">
              <CircleDot className="text-emerald-500 fill-emerald-500" size={22} />
              <span className="absolute w-5 h-5 bg-emerald-500/40 rounded-full animate-ping" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              🟢 SYSTEM STATUS: OPERATIONAL
            </h2>
          </div>

          {/* 4 Status Items in Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Item 1 */}
            <div className="flex items-start gap-3.5 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 hover:bg-emerald-50 transition-colors">
              <CheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-bold text-slate-900 text-sm">A.M. Disease Predictor</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  v2.4 Live • <span className="text-emerald-700 font-bold">99.4% Accurate</span>
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-start gap-3.5 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 hover:bg-emerald-50 transition-colors">
              <CheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-bold text-slate-900 text-sm">GPS Emergency SOS</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Telemetry Stream <span className="text-emerald-700 font-bold">Active</span>
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-start gap-3.5 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 hover:bg-emerald-50 transition-colors">
              <CheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-bold text-slate-900 text-sm">Supply Chain Monitor</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Inventory <span className="text-emerald-700 font-bold">Synced Real-Time</span>
                </p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-start gap-3.5 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 hover:bg-emerald-50 transition-colors">
              <CheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-bold text-slate-900 text-sm">RAG Medical Assistant</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  24/7 AI Triage <span className="text-emerald-700 font-bold">Ready</span>
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

// ============================================================================
// 4. PLATFORM OVERVIEW (About AURA)
// ============================================================================
function PlatformOverview() {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 relative">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-blue-600 font-extrabold text-xs tracking-widest uppercase bg-blue-100/80 px-3.5 py-1 rounded-full border border-blue-200">
            AURA Academic Platform
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-3">
            PLATFORM OVERVIEW
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto mt-3 rounded-full" />
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: About AURA Text */}
          <div className="space-y-6">
            <h3 className="text-2xl font-extrabold text-slate-900">About AURA</h3>
            <p className="text-slate-600 leading-relaxed text-base">
              AURA is an intelligent healthcare platform designed to bridge the gap between patients, hospitals, and emergency services. By integrating disease prediction, emergency alerts, supply chain management, and an AI chatbot, AURA ensures faster, smarter, and more reliable medical assistance.
            </p>

            {/* 4 Checkmark Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <CheckCircle className="text-blue-600 shrink-0" size={18} />
                <span>Unified Medical Data Flow</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <CheckCircle className="text-blue-600 shrink-0" size={18} />
                <span>Instant Geolocation SOS</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <CheckCircle className="text-blue-600 shrink-0" size={18} />
                <span>5-Disease ML Screening</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <CheckCircle className="text-blue-600 shrink-0" size={18} />
                <span>RAG AI Clinical Assistant</span>
              </div>
            </div>

            {/* Pill Badges */}
            <div className="flex flex-wrap gap-3 pt-4">
              <span className="bg-blue-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-600/20">
                4 MODULES
              </span>
              <span className="bg-slate-900 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md">
                5 DISEASES
              </span>
              <span className="bg-indigo-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/20">
                REAL-TIME ALERTS
              </span>
            </div>
          </div>

          {/* Right Column: ARCHITECTURAL MODEL Vertical Flowchart */}
          <div>
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <h4 className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">
                  ARCHITECTURAL MODEL
                </h4>
                <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Medical Grade
                </span>
              </div>

              {/* Flowchart Steps */}
              <div className="space-y-4">
                {/* Box 1 */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:border-blue-300 transition-colors">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Database size={22} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-sm">Patient Input</h5>
                    <p className="text-xs text-slate-500">Structured symptom &amp; health telemetry extraction</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center my-1">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-blue-400 to-indigo-500 animate-pulse" />
                </div>

                {/* Box 2 */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4.5 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center gap-4">
                  <div className="p-3 bg-white/20 text-white rounded-xl">
                    <Cpu size={22} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-white text-sm">AURA AI Core Engine</h5>
                    <p className="text-xs text-blue-100">ML Classifier models &amp; Telemetry Hub</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center my-1">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-indigo-500 to-emerald-500 animate-pulse" />
                </div>

                {/* Box 3 */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:border-emerald-300 transition-colors">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                    <Radio size={22} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-sm">Emergency Dispatch &amp; Logistics</h5>
                    <p className="text-xs text-slate-500">Hospital &amp; Supply Chain Sync</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-400 font-medium italic">
                  Seamless synchronization between patients, emergency response, and healthcare providers.
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

// ============================================================================
// 5. HOW AURA WORKS
// ============================================================================
function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Enter Symptoms',
      description: 'Input patient symptoms, health parameters, or trigger an immediate emergency help request.',
      icon: Stethoscope,
      color: 'blue',
      badge: 'Step 1: Input Data',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    },
    {
      number: '02',
      title: 'AI Analysis',
      description: 'Machine learning algorithms rapidly evaluate risk factors across 5 major disease categories.',
      icon: Brain,
      color: 'indigo',
      badge: 'Step 2: ML Triage',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconBg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    },
    {
      number: '03',
      title: 'Emergency Response',
      description: 'Automated high-priority alert system broadcasts live GPS location to local medical response teams.',
      icon: Radio,
      color: 'rose',
      badge: 'Step 3: Dispatch SOS',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
    },
    {
      number: '04',
      title: 'Get Assistance',
      description: 'Immediate diagnostic insights, triage recommendations, and continuous access to verified guidance.',
      icon: MessageCircle,
      color: 'purple',
      badge: 'Step 4: Continuous Support',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/70">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-blue-600 font-extrabold text-xs tracking-widest uppercase bg-blue-100/80 px-3.5 py-1 rounded-full border border-blue-200">
            SIMPLIFIED WORKFLOW
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-3">
            How AURA Works
          </h2>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto text-base">
            Four streamlined steps to deliver immediate diagnostic insights and life-saving assistance.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center transition-colors duration-300 shadow-xs`}>
                      <Icon size={26} />
                    </div>
                    <span className="text-4xl font-black text-slate-200 group-hover:text-blue-300 transition-colors duration-300">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Step {idx + 1}: {step.title}</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

// ============================================================================
// 6. MODULES OVERVIEW
// ============================================================================
function ModulesSection() {
  const modules = [
    {
      title: 'Disease Prediction',
      icon: Activity,
      description: 'Predict 5 diseases using Machine Learning algorithms with multi-parameter health evaluation.',
      cta: 'Launch Predictor',
      link: '/predict',
      badge: 'ML Powered',
      color: 'blue',
      borderColor: 'border-t-blue-600',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-100 text-blue-600',
      ctaStyle: 'text-blue-600 hover:text-blue-700',
    },
    {
      title: 'Emergency Alert',
      icon: AlertTriangle,
      description: 'One-click SOS with GPS location broadcasting directly to nearby ambulances & emergency teams.',
      cta: 'Trigger SOS',
      link: '/emergency',
      badge: 'High Priority',
      color: 'rose',
      borderColor: 'border-t-rose-600',
      badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-100 text-rose-600',
      ctaStyle: 'text-rose-600 hover:text-rose-700',
    },
    {
      title: 'Supply Chain',
      icon: Package,
      description: 'Track inventory, prevent shortages, and optimize critical blood, oxygen & medicine dispatch.',
      cta: 'Track Supplies',
      link: '/supply-chain',
      badge: 'Real-time Tracking',
      color: 'emerald',
      borderColor: 'border-t-emerald-600',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-600',
      ctaStyle: 'text-emerald-600 hover:text-emerald-700',
    },
    {
      title: 'Medical Chatbot',
      icon: MessageCircle,
      description: '24/7 instant assistance providing verified health answers grounded in medical documentation.',
      cta: 'Chat Now',
      link: '/chatbot',
      badge: 'RAG Assistant',
      color: 'purple',
      borderColor: 'border-t-purple-600',
      badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-100 text-purple-600',
      ctaStyle: 'text-purple-600 hover:text-purple-700',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200/70">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-blue-600 font-extrabold text-xs tracking-widest uppercase bg-blue-100/80 px-3.5 py-1 rounded-full border border-blue-200">
            EXPLORE OUR MODULES
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-3">
            Our Modules
          </h2>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto text-base">
            Explore AURA's four medical-grade core modules designed for clinical accuracy and rapid action.
          </p>
        </div>

        {/* 4 Cards Grid with 3D Hover Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 perspective-container">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.title}
                className={`bg-white rounded-3xl shadow-md border-t-4 ${mod.borderColor} border-x border-b border-slate-200/90 p-8 card-3d-hover group flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <div className={`p-4 rounded-2xl ${mod.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={30} />
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${mod.badgeStyle}`}>
                      {mod.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mt-2">
                    {mod.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <Link
                    to={mod.link}
                    className={`inline-flex items-center gap-2 text-sm font-extrabold ${mod.ctaStyle} group-hover:gap-3 transition-all duration-300`}
                  >
                    <span>{mod.cta}</span>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

// ============================================================================
// 7. WHY AURA (3 Reasons)
// ============================================================================
function WhyAuraSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />

      <div className="relative max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16 space-y-3">
          <span className="text-blue-400 font-extrabold text-xs tracking-widest uppercase bg-blue-950/80 px-3.5 py-1 rounded-full border border-blue-800">
            CORE ADVANTAGES
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Why AURA?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base">
            Designed specifically to elevate speed, precision, and trust when seconds count.
          </p>
        </div>

        {/* 3 Large Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Reason 1 */}
          <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700/80 hover:border-blue-500/60 hover:-translate-y-2 transition-all duration-300 group space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Zap size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              ⚡ Faster Diagnosis
            </h3>
            <p className="text-blue-400 text-xs font-extrabold uppercase tracking-wider">
              → ML-powered prediction
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Machine Learning algorithms evaluate patient symptoms in seconds, delivering instant preliminary risk scores to guide care decisions.
            </p>
          </div>

          {/* Reason 2 */}
          <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700/80 hover:border-rose-500/60 hover:-translate-y-2 transition-all duration-300 group space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
              <Radio size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              🚨 Real-time Response
            </h3>
            <p className="text-rose-400 text-xs font-extrabold uppercase tracking-wider">
              → Emergency alerts in seconds
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              One-click SOS dispatches live GPS location telemetry directly to surrounding emergency units and emergency contacts without delay.
            </p>
          </div>

          {/* Reason 3 */}
          <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700/80 hover:border-purple-500/60 hover:-translate-y-2 transition-all duration-300 group space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
              <Brain size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              🧠 Trusted Information
            </h3>
            <p className="text-purple-400 text-xs font-extrabold uppercase tracking-wider">
              → RAG-based accurate answers
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              AI medical assistant utilizes Retrieval-Augmented Generation to reference validated clinical guidelines, eliminating medical hallucinations.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}

// ============================================================================
// 8. HEALTHCARE DISCLAIMER (REQUIRED)
// ============================================================================
function Disclaimer() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-y-2 border-amber-400/80">
      <div className="max-w-6xl mx-auto">
        <div className="bg-amber-50/90 border-2 border-amber-400/90 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start gap-5">
          
          <div className="bg-amber-500 text-white p-3 rounded-2xl shrink-0 shadow-md animate-bounce">
            <Shield size={28} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-amber-900 text-base uppercase tracking-wider">
                Important Medical Disclaimer
              </h4>
              <span className="px-2.5 py-0.5 bg-amber-200 text-amber-950 font-bold rounded-md text-[11px]">
                REQUIRED NOTICE
              </span>
            </div>
            <p className="text-sm font-medium text-amber-950 leading-relaxed">
              ⚠️ Disclaimer: AURA is for informational and educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider. In case of emergency, call your local emergency number immediately.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

// ============================================================================
// 9. FOOTER
// ============================================================================
function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
      <div className="max-w-6xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="text-blue-500 fill-blue-500/20" size={26} />
              <span className="text-2xl font-black text-white tracking-tight">AURA</span>
            </div>
            <p className="text-sm font-semibold text-slate-300">
              Advanced Unified Responsive Assistant for Medical Emergencies
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              A major academic healthcare initiative integrating Machine Learning disease prediction, real-time GPS emergency alerts, smart medical inventory tracking, and RAG chatbot triage.
            </p>
            <div className="inline-block bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-xs text-blue-400 font-semibold">
              Medical-Grade Academic Architecture
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-widest">
              QUICK LINKS
            </h4>
            <ul className="space-y-2 text-sm font-medium">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
              <li><Link to="/predict" className="hover:text-blue-400 transition-colors">Disease Predictor</Link></li>
              <li><Link to="/emergency" className="hover:text-blue-400 transition-colors">Emergency Alert</Link></li>
              <li><Link to="/supply-chain" className="hover:text-blue-400 transition-colors">Supply Chain</Link></li>
              <li><Link to="/chatbot" className="hover:text-blue-400 transition-colors">Medical Chatbot</Link></li>
            </ul>
          </div>

          {/* Column 3: Modules */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-widest">
              MODULES
            </h4>
            <ul className="space-y-2 text-sm text-slate-400 font-medium">
              <li>5-Disease ML Model</li>
              <li>GPS SOS Dispatch</li>
              <li>Inventory Tracker</li>
              <li>RAG AI Assistant</li>
              <li>Real-time Telemetry</li>
            </ul>
          </div>

          {/* Column 4: Emergency Contact */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-widest">
              EMERGENCY CONTACT
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              In case of immediate severe health crisis, always contact national emergency services.
            </p>
            <div className="p-4 bg-rose-950/60 border border-rose-900/60 rounded-2xl space-y-1">
              <div className="flex items-center justify-center gap-2 text-rose-400 font-black text-xl">
                <PhoneCall size={20} />
                <span>🚨 112 / 108 / 911</span>
              </div>
              <p className="text-[11px] text-slate-400 text-center font-medium">National Emergency Helpline</p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© 2026 AURA. All rights reserved.</p>
          <div className="flex gap-6 font-medium">
            <a href="#about" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
            <span>|</span>
            <a href="#about" className="hover:text-blue-400 transition-colors">Terms &amp; Conditions</a>
            <span>|</span>
            <a href="#about" className="hover:text-blue-400 transition-colors">Disclaimer</a>
          </div>
        </div>

      </div>
    </footer>
  );
}

// ============================================================================
// MAIN LANDING PAGE COMPONENT (Renders all 9 sections in exact order)
// ============================================================================
function LandingPage() {
  return (
    <div className="bg-white min-h-screen font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Hero Section */}
      <HeroSection />

      {/* 3. System Status Dashboard */}
      <SystemStatusDashboard />

      {/* 4. Platform Overview (About AURA) */}
      <PlatformOverview />

      {/* 5. How AURA Works */}
      <HowItWorks />

      {/* 6. Modules Overview */}
      <ModulesSection />

      {/* 7. Why AURA */}
      <WhyAuraSection />

      {/* 8. Healthcare Disclaimer */}
      <Disclaimer />

      {/* 9. Footer */}
      <LandingFooter />
    </div>
  );
}

export default LandingPage;