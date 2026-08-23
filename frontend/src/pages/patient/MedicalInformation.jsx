import React, { useState, useEffect } from 'react';
import profileService from '../../services/profileService';
import {
  User,
  Shield,
  Heart,
  AlertCircle,
  Pill,
  Phone,
  FileText,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
  Save,
  Sparkles,
  Lock
} from 'lucide-react';

function MedicalInformation() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Section edit states
  const [editingSection, setEditingSection] = useState(null);
  const [draftData, setDraftData] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await profileService.getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleStartEdit = (sectionName) => {
    setEditingSection(sectionName);
    setDraftData(JSON.parse(JSON.stringify(profile[sectionName])));
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setDraftData(null);
  };

  const handleSaveEdit = async (sectionName) => {
    const updated = {
      ...profile,
      [sectionName]: draftData
    };
    try {
      const saved = await profileService.updateProfile(updated);
      setProfile(saved);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save section', err);
    } finally {
      setEditingSection(null);
      setDraftData(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs font-semibold animate-pulse">
        Loading secure medical profile...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* HEADER SECTION */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-300 uppercase tracking-wider">
              <Lock size={13} className="text-emerald-400" />
              <span>HIPAA Compliant Data Layer</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Medical Health Profile
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xl">
              Centralized personal health record. Keep your allergies, medications, and emergency contacts updated for emergency readiness.
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400 font-bold shrink-0 shadow-inner">
            <Shield size={32} />
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-4 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check size={16} />
            <span>Health profile updated successfully!</span>
          </div>
        )}
      </section>

      {/* SECTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: PERSONAL INFO & MEDICAL HISTORY (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* 1. PERSONAL INFORMATION */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <User size={18} />
                </div>
                <h2 className="font-black text-slate-900 text-base">Personal Details</h2>
              </div>

              {editingSection === 'personalInfo' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit('personalInfo')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Save size={13} />
                    <span>Save</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartEdit('personalInfo')}
                  className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Edit Personal Information"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>

            {editingSection === 'personalInfo' ? (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={draftData.fullName}
                    onChange={(e) => setDraftData({ ...draftData, fullName: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Age</label>
                  <input
                    type="number"
                    value={draftData.age}
                    onChange={(e) => setDraftData({ ...draftData, age: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Blood Group</label>
                  <input
                    type="text"
                    value={draftData.bloodGroup}
                    onChange={(e) => setDraftData({ ...draftData, bloodGroup: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Height</label>
                  <input
                    type="text"
                    value={draftData.height}
                    onChange={(e) => setDraftData({ ...draftData, height: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Full Name</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{profile?.personalInfo?.fullName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Age & Gender</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{profile?.personalInfo?.age} yrs • {profile?.personalInfo?.gender}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Blood Group</span>
                  <span className="font-extrabold text-red-600 text-sm mt-0.5 block">{profile?.personalInfo?.bloodGroup}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">BMI Index</span>
                  <span className="font-extrabold text-emerald-600 text-sm mt-0.5 block">{profile?.personalInfo?.bmi}</span>
                </div>
              </div>
            )}
          </section>

          {/* 2. MEDICAL HISTORY */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Heart size={18} />
                </div>
                <h2 className="font-black text-slate-900 text-base">Medical History</h2>
              </div>
            </div>

            <div className="space-y-2.5">
              {profile?.medicalHistory?.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">{item.condition}</h4>
                    <span className="text-[11px] text-slate-500">Diagnosed in {item.diagnosedYear}</span>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. ALLERGIES */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <AlertCircle size={18} />
                </div>
                <h2 className="font-black text-slate-900 text-base">Known Allergies</h2>
              </div>
            </div>

            <div className="space-y-2.5">
              {profile?.allergies?.map((alg, idx) => (
                <div key={idx} className="p-3.5 bg-red-50/50 border border-red-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-red-950">{alg.allergen}</h4>
                    <span className="text-[11px] text-red-700 font-medium">{alg.severity}</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase text-red-700 bg-red-100 px-2.5 py-0.5 rounded-md">
                    Allergy Alert
                  </span>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: MEDICATIONS, EMERGENCY CONTACTS & NOTES (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* 4. CURRENT MEDICATIONS */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                  <Pill size={18} />
                </div>
                <h2 className="font-black text-slate-900 text-base">Active Medications</h2>
              </div>
            </div>

            <div className="space-y-2.5">
              {profile?.medications?.map((med, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">{med.name} ({med.dosage})</h4>
                    <span className="text-[11px] text-slate-500 font-medium">{med.frequency}</span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    Rx Active
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 5. EMERGENCY CONTACTS */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <Phone size={18} />
                </div>
                <h2 className="font-black text-slate-900 text-base">Emergency Contacts</h2>
              </div>
            </div>

            <div className="space-y-2.5">
              {profile?.emergencyContacts?.map((cnt, idx) => (
                <div key={idx} className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-950">{cnt.name} ({cnt.relationship})</h4>
                    <span className="text-[11px] text-emerald-700 font-mono">{cnt.phone}</span>
                  </div>
                  <a
                    href={`tel:${cnt.phone}`}
                    className="p-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Call
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* 6. HEALTH NOTES */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                  <FileText size={18} />
                </div>
                <h2 className="font-black text-slate-900 text-base">Clinical Notes & Preferences</h2>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-700 leading-relaxed font-medium">
              {profile?.healthNotes}
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}

export default MedicalInformation;
