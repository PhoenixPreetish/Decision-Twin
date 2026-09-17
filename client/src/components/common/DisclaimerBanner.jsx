import React from 'react';
import { Info } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-400 mb-6 shadow-sm">
      <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-slate-300">Advisory Disclaimer (BR-4): </span>
        DecisionTwin AI simulations, risk scores, and projected outcomes are algorithmically generated estimates intended for decision-support and exploratory modeling. They do not constitute certified financial, legal, medical, or career counsel.
      </div>
    </div>
  );
}
