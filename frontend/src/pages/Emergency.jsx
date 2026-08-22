import React from 'react';

function Emergency() {
  return (
    <div className="py-12 space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-extrabold text-red-600">Emergency Alert Module</h1>
        <p className="text-slate-600 mt-2">
          One-click SOS with live GPS location broadcasting for immediate ambulance dispatch.
        </p>
      </div>
    </div>
  );
}

export default Emergency;
