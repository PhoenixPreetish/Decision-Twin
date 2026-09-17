import React from 'react';
import { formatINR, formatPercent, getRiskColor } from '../../utils/formatters';
import { Award, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

export default function OptionComparison({ options, riskScores, predictions, simulations }) {
  if (!options || options.length === 0) return null;

  // Radar chart data for all options
  const radarMetrics = [
    { metric: 'Financial Stability', key: 'financialRisk', invert: true },
    { metric: 'Career Growth', key: 'careerRisk', invert: true },
    { metric: 'Market Safety', key: 'marketRisk', invert: true },
    { metric: 'WLB / Personal', key: 'personalRisk', invert: true },
    { metric: 'Family Fit', key: 'familyRisk', invert: true }
  ];

  const getOptId = (item) => (item?.optionId?._id || item?.optionId || '').toString();
  const getObjId = (opt) => (opt?._id || '').toString();

  const radarData = radarMetrics.map(({ metric, key, invert }) => {
    const row = { metric };
    options.forEach(opt => {
      const score = riskScores.find(s => getOptId(s) === getObjId(opt));
      if (score) {
        row[opt.title] = invert ? (100 - score[key]) : score[key];
      }
    });
    return row;
  });

  const colors = ['#22c55e', '#38bdf8', '#f59e0b', '#a855f7', '#ec4899', '#64748b'];

  return (
    <div className="space-y-8">
      {/* Side by side comparison table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden">
        <h3 className="text-base font-bold text-white mb-4">Side-by-Side Alternatives Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                <th className="py-3 px-4">Rank & Option</th>
                <th className="py-3 px-4">Decision Score</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Goal Alignment</th>
                <th className="py-3 px-4">5-Yr Median Valuation</th>
                <th className="py-3 px-4">Success Prob</th>
                <th className="py-3 px-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {options.map((opt) => {
                const score = riskScores.find(s => getOptId(s) === getObjId(opt));
                const pred = predictions.find(p => getOptId(p) === getObjId(opt));
                const sim = simulations.find(s => getOptId(s) === getObjId(opt));
                const isWinner = score?.rank === 1;

                return (
                  <tr key={opt._id} className={isWinner ? 'bg-brand-500/5' : ''}>
                    <td className="py-4 px-4 font-medium text-white flex items-center gap-2">
                      {isWinner && <Award className="w-4 h-4 text-brand-400 shrink-0" />}
                      <span className="font-mono text-xs text-slate-400">#{score?.rank || '-'}</span>
                      <span className="font-semibold">{opt.title}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-base text-white">{score?.decisionScore || '-'}/100</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getRiskColor(score?.overallRiskLevel)}`}>
                        {score?.overallRiskLevel || 'Medium'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-300">
                      {score?.goalAlignmentScore ? `${score.goalAlignmentScore}%` : '-'}
                    </td>
                    <td className="py-4 px-4 font-mono text-brand-400 font-bold">
                      {formatINR(sim?.percentiles?.p50MedianCase)}
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {pred?.successProbability ? formatPercent(pred.successProbability * 100) : '-'}
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      {score?.confidenceScore ? `${score.confidenceScore}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Radar Chart Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="mb-4">
          <h3 className="text-base font-bold text-white">Multi-Dimensional Stability Radar</h3>
          <p className="text-xs text-slate-400">Higher values on outer axes represent stronger stability and lower risk.</p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {options.map((opt, i) => (
                <Radar
                  key={opt._id}
                  name={opt.title}
                  dataKey={opt.title}
                  stroke={colors[i % colors.length]}
                  fill={colors[i % colors.length]}
                  fillOpacity={0.25}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
