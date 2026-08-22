import React from 'react';

function Predict() {
  return (
    <div className="py-12 space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-900">Disease Prediction Module</h1>
        <p className="text-slate-600 mt-2">
          Select or enter clinical parameters to predict disease risk across 5 categories using Machine Learning.
        </p>
      </div>
    </div>
  );
}

export default Predict;
