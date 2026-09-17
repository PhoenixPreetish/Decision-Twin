import React, { useState } from 'react';
import { Shield, AlertTriangle, TrendingDown, DollarSign, Briefcase, GraduationCap, Users, Heart } from 'lucide-react';
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Composite Risk Rating</span>
          <h3 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <span>{currentOption?.title}</span>
            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getRiskColor(currentScore.overallRiskLevel)}`}>
              {currentScore.overallRiskLevel} Risk ({currentScore.overallRiskScore}/100)
            </span>
          </h3>
        </div>

        {currentScore.constraintViolations?.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{currentScore.constraintViolations[0].message}</span>
          </div>
        )}
      </div>

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
    </div>
  );
}
