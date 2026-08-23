import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import predictionService from '../services/predictionService';
import { SYMPTOM_CATEGORIES } from '../data/mockData';
import {
  Activity,
  Search,
  Check,
  X,
  Sparkles,
  ShieldAlert,
  Sliders,
  ChevronRight,
  Info,
  Clock,
  User,
  HeartPulse,
  RotateCcw,
  ArrowRight,
  Loader2
} from 'lucide-react';

function Predict() {
  const navigate = useNavigate();
  const [symptomsList, setSymptomsList] = useState([]);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Selected state
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  
  // Optional Demographic & Symptom parameters (Frontend Preparation for future ML models)
  const [ageRange, setAgeRange] = useState('18-30');
  const [biologicalSex, setBiologicalSex] = useState('Female');
  const [duration, setDuration] = useState('1-3 days');
  const [severity, setSeverity] = useState('Moderate');

  // Loading / Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const analysisStepsMessages = [
    'Analyzing selected symptom vector...',
    'Evaluating risk patterns against 5 clinical categories...',
    'Generating AURA health prediction report...'
  ];

  useEffect(() => {
    async function fetchSymptoms() {
      try {
        const data = await predictionService.getSymptoms();
        setSymptomsList(data);
      } catch (err) {
        console.error('Failed to load symptoms list', err);
      } finally {
        setLoadingSymptoms(false);
      }
    }
    fetchSymptoms();
  }, []);

  const toggleSymptom = (symptomName) => {
    if (selectedSymptoms.includes(symptomName)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptomName));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomName]);
    }
  };

  const handleClearAll = () => {
    setSelectedSymptoms([]);
  };

  const filteredSymptoms = symptomsList.filter(s => {
    const matchesQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisStep(0);

    // Step 1 -> 2 -> 3 animation
    const step1Timer = setTimeout(() => setAnalysisStep(1), 800);
    const step2Timer = setTimeout(() => setAnalysisStep(2), 1600);

    // Complete analysis & redirect
    const completeTimer = setTimeout(async () => {
      try {
        const result = await predictionService.analyzeSymptoms({
          symptoms: selectedSymptoms,
          ageRange,
          sex: biologicalSex,
          duration,
          severity
        });
        navigate(`/prediction/result/${result.id}`);
      } catch (err) {
        console.error('Analysis error', err);
        setIsAnalyzing(false);
      }
    }, 2400);

    return () => {
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
      clearTimeout(completeTimer);
    };
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* ========================================================================= */}
      {/* A. INTRODUCTION SECTION */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold text-blue-300 uppercase tracking-wider">
            <Activity size={14} className="text-blue-400" />
            <span>AURA Clinical Risk Assessment</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Tell us what you're experiencing
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
            Select your current symptoms below to evaluate health patterns using AURA's intelligent risk scoring system across 5 clinical categories.
          </p>

          {/* Medical Disclaimer Banner */}
          <div className="mt-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-start gap-3 text-xs text-blue-100">
            <ShieldAlert size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold text-amber-300 uppercase tracking-wider block">Important Clinical Disclaimer</span>
              <p className="leading-relaxed">
                This feature provides AI-assisted health analysis for informational purposes only. It is <strong>not a medical diagnosis</strong>. In case of emergency or severe symptoms, please contact emergency medical services immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Left (Symptom Selector) & Right (Selected & Options) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: SYMPTOM SEARCH & SELECTOR (7 Cols) */}
        <section className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Symptom Library</h2>
              <p className="text-xs text-slate-500">Search and tap symptoms to add</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symptoms..."
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 bg-slate-50"
              />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SYMPTOM_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Symptom Selection Cards Grid */}
          {loadingSymptoms ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold animate-pulse">
              Loading symptom repository...
            </div>
          ) : filteredSymptoms.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
              No symptoms match "{searchQuery}" in category "{selectedCategory}".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredSymptoms.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom.name);
                return (
                  <button
                    key={symptom.id}
                    onClick={() => toggleSymptom(symptom.name)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 text-blue-900 shadow-2xs font-extrabold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-semibold'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs">{symptom.name}</p>
                      <span className="text-[10px] text-slate-600 uppercase tracking-wider block font-medium">
                        {symptom.category}
                      </span>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? <Check size={14} /> : <span className="text-xs font-bold">+</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        </section>

        {/* RIGHT COLUMN: SELECTED SYMPTOMS & DEMOGRAPHICS (5 Cols) */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* C. SELECTED SYMPTOMS AREA */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base">Selected Symptoms</h3>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  {selectedSymptoms.length} selected
                </span>
              </div>

              {selectedSymptoms.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs font-bold text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {selectedSymptoms.length === 0 ? (
              <div className="p-6 text-center bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl space-y-2">
                <p className="text-xs text-slate-500 font-medium">
                  No symptoms selected yet. Tap any symptom from the library to add.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((symName) => (
                  <span
                    key={symName}
                    className="inline-flex items-center gap-1.5 bg-blue-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-2xs"
                  >
                    <span>{symName}</span>
                    <button
                      onClick={() => toggleSymptom(symName)}
                      className="p-0.5 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
                      title="Remove symptom"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* D. OPTIONAL INFORMATION (Frontend Preparation) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">Additional Parameters</h3>
                <p className="text-[11px] text-slate-400">Preparation for future ML models</p>
              </div>
              <Sliders size={18} className="text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Age Range */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Age Range</label>
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Under 18">Under 18</option>
                  <option value="18-30">18-30 years</option>
                  <option value="31-45">31-45 years</option>
                  <option value="46-60">46-60 years</option>
                  <option value="60+">60+ years</option>
                </select>
              </div>

              {/* Biological Sex */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Biological Sex</label>
                <select
                  value={biologicalSex}
                  onChange={(e) => setBiologicalSex(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="<24 hours">&lt; 24 hours</option>
                  <option value="1-3 days">1-3 days</option>
                  <option value="4-7 days">4-7 days</option>
                  <option value="2+ weeks">2+ weeks</option>
                </select>
              </div>

              {/* Severity */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>
            </div>
          </div>

          {/* E. PREDICTION BUTTON & ANIMATED LOADING STATE */}
          <button
            onClick={handleAnalyze}
            disabled={selectedSymptoms.length === 0 || isAnalyzing}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 text-sm uppercase tracking-wider cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Analyzing Symptoms...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Analyze Symptoms with AURA</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

        </section>

      </div>

      {/* ANALYSIS MODAL OVERLAY */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30 animate-pulse">
              <Sparkles size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">AURA AI Analysis</h3>
              <p className="text-xs text-blue-600 font-bold min-h-[20px] transition-all">
                {analysisStepsMessages[analysisStep]}
              </p>
            </div>

            {/* Step Progress Dots */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === analysisStep ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Predict;
