import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShieldCheck, Bell } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-12 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Heart className="w-4 h-4 fill-white/20" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">AURA</span>
            </div>
            <p className="text-xs font-semibold text-slate-300">
              Advanced Unified Responsive Assistant for Medical Emergencies
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Integrated medical platform connecting disease prediction, emergency alerts, supply chain management, and AI triage assistance.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-blue-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Medical-Grade Architecture</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-white uppercase tracking-widest">
              Quick Links
            </h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
              <li><Link to="/predict" className="hover:text-blue-400 transition-colors">Disease Predictor</Link></li>
              <li><Link to="/emergency" className="hover:text-blue-400 transition-colors">Emergency Alert</Link></li>
              <li><Link to="/supply-chain" className="hover:text-blue-400 transition-colors">Supply Chain</Link></li>
              <li><Link to="/chatbot" className="hover:text-blue-400 transition-colors">Medical Chatbot</Link></li>
            </ul>
          </div>

          {/* Capabilities */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-white uppercase tracking-widest">
              Modules
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>5-Disease ML Diagnostics</li>
              <li>1-Click GPS Emergency SOS</li>
              <li>Medical Supply Tracking</li>
              <li>RAG-Based AI Chatbot</li>
            </ul>
          </div>

          {/* Emergency Alert */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-white uppercase tracking-widest">
              Emergency SOS
            </h5>
            <p className="text-xs text-slate-400">
              In severe health crises, contact local emergency services immediately.
            </p>
            <div className="p-3 bg-red-950/60 rounded-xl border border-red-900/60 text-red-300 text-xs font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-400 shrink-0" />
              <span>Call 911 / Local SOS</span>
            </div>
          </div>

        </div>

        {/* Disclaimer Warning */}
        <div className="py-6 border-b border-slate-800/80 text-[11px] text-amber-400/90 leading-relaxed font-medium">
          ⚠️ Disclaimer: AURA is for informational and educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider. In case of emergency, call your local emergency number immediately.
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 AURA. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span>|</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span>|</span>
            <span className="hover:text-slate-300 cursor-pointer">Disclaimer</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
