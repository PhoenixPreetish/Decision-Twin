import React, { useState } from 'react';
import api from '../../services/api';
import { formatINR, getRiskColor } from '../../utils/formatters';
import { Sliders, RefreshCw, CheckCircle2, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export default function WhatIfPanel({ scenarioId, options = [], onApplyChanges }) {
  if (!options || options.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        No options available to run What-If sensitivity analysis.
      </div>
    );
  }

  const [selectedOptionId, setSelectedOptionId] = useState(options[0]?._id);
  const currentOption = options.find(o => o._id === selectedOptionId) || options[0];

  const [simulatedParams, setSimulatedParams] = useState({
    offeredSalary: currentOption?.attributes?.offeredSalary || 1000000,
    tuitionCost: currentOption?.attributes?.tuitionCost || 500000,
    initialInvestment: currentOption?.attributes?.initialInvestment || 500000,
    workLifeBalanceRating: currentOption?.attributes?.workLifeBalanceRating || 7
  });

  const [loading, setLoading] = useState(false);
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/what-if/simulate', {
        scenarioId,
        optionId: selectedOptionId,
        modifiedAttributes: simulatedParams
      });
      if (res.data && res.data.success) {
        setWhatIfResult(res.data);
      }
    } catch (err) {
      console.error('What-If recalculation failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      await api.post('/what-if/apply', {
        optionId: selectedOptionId,
        modifiedAttributes: simulatedParams
      });
      setAppliedSuccess(true);
      if (onApplyChanges) onApplyChanges();
      setTimeout(() => setAppliedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to apply What-If adjustments', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Option Selector */}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt._id}
            onClick={() => {
              setSelectedOptionId(opt._id);
              setSimulatedParams({
                offeredSalary: opt.attributes?.offeredSalary || 1000000,
                tuitionCost: opt.attributes?.tuitionCost || 500000,
                initialInvestment: opt.attributes?.initialInvestment || 500000,
                workLifeBalanceRating: opt.attributes?.workLifeBalanceRating || 7
              });
              setWhatIfResult(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedOptionId === opt._id
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {opt.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Sliders (REQ-40, REQ-44) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-400" />
              Adjust Parameters (Live Sensitivity)
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Tuition / Upfront Cost</span>
                <span className="font-mono text-brand-400">{formatINR(simulatedParams.tuitionCost)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={4000000}
                step={50000}
                value={simulatedParams.tuitionCost}
                onChange={(e) => setSimulatedParams(p => ({ ...p, tuitionCost: Number(e.target.value) }))}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Offered / Target Annual Salary</span>
                <span className="font-mono text-brand-400">{formatINR(simulatedParams.offeredSalary)}</span>
              </div>
              <input
                type="range"
                min={300000}
                max={6000000}
                step={50000}
                value={simulatedParams.offeredSalary}
                onChange={(e) => setSimulatedParams(p => ({ ...p, offeredSalary: Number(e.target.value) }))}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Work-Life Balance Rating (1-10)</span>
                <span className="font-mono text-brand-400">{simulatedParams.workLifeBalanceRating}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={simulatedParams.workLifeBalanceRating}
                onChange={(e) => setSimulatedParams(p => ({ ...p, workLifeBalanceRating: Number(e.target.value) }))}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-800 text-brand-400 border border-brand-500/30 text-xs font-bold hover:bg-slate-750 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Recalculate What-If Outcome</span>
          </button>
        </div>

        {/* Right: Side-by-Side What-If Comparison (REQ-42) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-2">Simulated Outcome Delta</h3>
            <p className="text-xs text-slate-400 mb-4">
              Real-time sensitivity analysis comparing saved baseline against modified test values.
            </p>

            {whatIfResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-850 border border-slate-750">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Decision Score</span>
                    <span className="text-xl font-bold text-brand-400">
                      {whatIfResult.riskScore.decisionScore}/100
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Risk Level</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border inline-block mt-1 ${getRiskColor(whatIfResult.riskScore.overallRiskLevel)}`}>
                      {whatIfResult.riskScore.overallRiskLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">5-Yr Median Return</span>
                    <span className="text-sm font-bold font-mono text-white">
                      {formatINR(whatIfResult.simulation.percentiles.p50MedianCase)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Goal Fit</span>
                    <span className="text-sm font-bold font-mono text-slate-200">
                      {whatIfResult.riskScore.goalAlignmentScore}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleApply}
                  className="w-full py-2.5 rounded-xl bg-brand-500 text-slate-950 text-xs font-bold hover:bg-brand-400 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save What-If Adjustments to Option (REQ-43)</span>
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Adjust the sliders on the left and click "Recalculate What-If Outcome".
              </div>
            )}
          </div>

          {appliedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Changes permanently applied to this option!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
