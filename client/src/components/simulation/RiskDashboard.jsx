import React, { useState } from 'react';
import { Shield, AlertTriangle, TrendingDown, DollarSign, Briefcase, GraduationCap, Users, Heart, Layers, CheckCircle2, Radar, Lock } from 'lucide-react';
import { getRiskColor } from '../../utils/formatters';

export default function RiskDashboard({ riskScores, options }) {
  const [selectedOptionId, setSelectedOptionId] = useState(options[0]?._id);

  if (!riskScores || riskScores.length === 0) return null;

  const getOptId = (item) => (item?.optionId?._id || item?.optionId || '').toString();
  const getObjId = (opt) => (opt?._id || '').toString();

  const currentScore = riskScores.find(s => getOptId(s) === (selectedOptionId || '').toString()) || riskScores[0];
  const currentOption = options.find(o => getObjId(o) === (selectedOptionId || '').toString()) || options[0];

  const dimensions = [
    { title: 'Financial Risk', score: currentScore.financialRisk, icon: DollarSign, desc: 'Debt-to-income ratio, upfront capital strain, worst-case downside' },
    { title: 'Career & Skill Risk', score: currentScore.careerRisk, icon: Briefcase, desc: 'Industry volatility, skill match gap, and promotion/employment probability' },
    { title: 'Market & Economic Risk', score: currentScore.marketRisk, icon: TrendingDown, desc: 'Macroeconomic inflation, hiring cycles, sector demand index' },
    { title: 'Educational Risk', score: currentScore.educationalRisk, icon: GraduationCap, desc: 'Accreditation validity, degree currency, syllabus relevance' },
    { title: 'Personal & Work-Life Risk', score: currentScore.personalRisk, icon: Heart, desc: 'Burnout hazard, expected weekly hours, health impact' },
    { title: 'Family & Relocation Risk', score: currentScore.familyRisk, icon: Users, desc: 'Geographic displacement distance, family stability index' }
  ];

  const fourTensor = currentScore.fourTensor;
  const readiness = currentScore.decisionReadiness;
  const hiddenHazards = currentScore.hiddenHazards || [];

  return (
    <div className="space-y-6">
      {/* Option Selector */}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt._id}
            onClick={() => setSelectedOptionId(opt._id)}
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

      {/* Aggregate Score Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Composite Risk & Decision Profile</span>
          <h3 className="text-2xl font-bold text-white mt-1 flex flex-wrap items-center gap-2">
            <span>{currentOption?.title}</span>
            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getRiskColor(currentScore.overallRiskLevel)}`}>
              {currentScore.overallRiskLevel} Risk ({currentScore.overallRiskScore}/100)
            </span>
            <span className="text-xs px-3 py-1 rounded-full font-bold border border-brand-500/30 bg-brand-500/10 text-brand-300">
              Decision Score: {currentScore.compositeDecisionScore}/100
            </span>
          </h3>
        </div>

        {currentScore.constraintViolations?.length > 0 && (
          <div className="space-y-1.5 w-full lg:w-auto">
            {currentScore.constraintViolations.map((v, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{v.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4-Tensor Orthogonal Risk & Uncertainty Decomposition + 4-Gate Decision Readiness Index */}
      {(fourTensor || readiness) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {fourTensor && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    4-Tensor Orthogonal Risk Decomposition
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Separates stochastic volatility, missing knowledge, lock-in, and ruin</p>
                </div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  R = (A, E, I, Ruin)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Aleatoric Risk (A)</span>
                    <span className="font-mono font-bold text-amber-400">{fourTensor.aleatoricRisk}/100</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Irreducible market & macro variance</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Epistemic Uncertainty (E)</span>
                    <span className="font-mono font-bold text-sky-400">{fourTensor.epistemicUncertainty}/100</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Reducible via research & experiments</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-purple-400" /> Irreversibility (I)
                    </span>
                    <span className="font-mono font-bold text-purple-400">{fourTensor.irreversibilityIndex}/100</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Sunk capital & pivot friction</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">5-Yr Ruin Prob.</span>
                    <span className="font-mono font-bold text-rose-400">{fourTensor.ruinProbabilityPct}%</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Probability of exhausting emergency buffer</p>
                </div>
              </div>
            </div>
          )}

          {readiness && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    4-Gate Decision Readiness Index (DRI)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Evaluates execution preparedness before irreversible commitment</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  readiness.status === 'Ready_to_Commit'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : readiness.status === 'Conditional_Go'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}>
                  {readiness.score}/100 · {readiness.status?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Data Completeness Gate', val: readiness.gates?.dataCompleteness ?? 75 },
                  { label: 'Financial Runway Gate', val: readiness.gates?.financialRunway ?? 70 },
                  { label: 'Skill Readiness Gate', val: readiness.gates?.skillReadiness ?? 75 },
                  { label: 'Assumption Stability Gate', val: readiness.gates?.assumptionStability ?? 75 }
                ].map((g) => (
                  <div key={g.label} className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{g.label}</span>
                      <span className="font-mono font-bold text-white">{g.val}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${g.val >= 75 ? 'bg-emerald-500' : g.val >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${g.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6 Dimensions Grid (REQ-29 to REQ-34) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dimensions.map((dim) => {
          const Icon = dim.icon;
          let levelColor = 'text-emerald-400';
          let barBg = 'bg-emerald-500';
          if (dim.score > 60) {
            levelColor = 'text-rose-400';
            barBg = 'bg-rose-500';
          } else if (dim.score > 35) {
            levelColor = 'text-amber-400';
            barBg = 'bg-amber-500';
          }

          return (
            <div key={dim.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                  <div className="p-2 rounded-lg bg-slate-800 text-brand-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{dim.title}</span>
                </div>
                <span className={`font-mono font-bold text-sm ${levelColor}`}>
                  {dim.score}/100
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barBg} transition-all duration-700`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">{dim.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Compounding Hidden Hazards & Contradiction Radar */}
      {hiddenHazards.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Radar className="w-4 h-4 text-rose-400" />
              Hidden Compounding Risks & Contradiction Radar
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Non-linear interaction risks, unstated dependencies, and assumption contradictions detected for {currentOption?.title}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hiddenHazards.map((haz, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  haz.severity === 'Critical'
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : haz.severity === 'High'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-white">{haz.title}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    haz.severity === 'Critical'
                      ? 'bg-rose-500/20 text-rose-300'
                      : haz.severity === 'High'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-sky-500/20 text-sky-300'
                  }`}>
                    {haz.severity} · {haz.hazardType?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{haz.whyItMatters}</p>
                {haz.mitigationAction && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400">
                    <strong>Recommended Hedge:</strong> {haz.mitigationAction}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
