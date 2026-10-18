import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatINR } from '../../utils/formatters';
import { Scale, Award, ShieldAlert, TrendingDown, Info, HelpCircle } from 'lucide-react';

export default function TopsisAnalyticsView({ scenarioId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [scenarioId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/simulations/analytics/${scenarioId}`);
      if (res.data && res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate decision analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Solving TOPSIS Multi-Criteria Decision Matrix & Tail VaR...</span>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm">
        {error || 'Decision science metrics not yet available. Run the base simulation first.'}
      </div>
    );
  }

  const { topsisRankings = [], tailRiskMetrics = [] } = analytics;

  return (
    <div className="space-y-6">
      {/* Intro Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Scale className="w-4 h-4" />
          <span>Decision Science & Multi-Criteria Optimization</span>
        </div>
        <h2 className="text-xl font-bold text-white">TOPSIS Mathematical Ranking Engine</h2>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) evaluates candidates simultaneously against an 
          <span className="text-emerald-400 font-semibold"> Ideal Best Solution (A+)</span> and an 
          <span className="text-rose-400 font-semibold"> Ideal Worst Solution (A-)</span>. The option with the highest relative closeness coefficient (C<sub>i</sub>) represents the mathematical optimum across all weighted criteria.
        </p>
      </div>

      {/* TOPSIS Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-400" />
            <span>MCDM Relative Closeness Rankings</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Normalized & Weighted Criteria Matrix</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/50 uppercase text-[10px] text-slate-400 font-mono tracking-wider">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Alternative Option</th>
                <th className="py-3 px-4 text-center">TOPSIS Score</th>
                <th className="py-3 px-4 text-center">Distance to Ideal Best (d+)</th>
                <th className="py-3 px-4 text-center">Distance to Worst (d-)</th>
                <th className="py-3 px-4 text-right">Relative Closeness (Ci)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {topsisRankings.map((row) => (
                <tr key={row.optionId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                      row.topsisRank === 1 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      #{row.topsisRank}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {row.title}
                    {row.topsisRank === 1 && (
                      <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                        Optimal
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-block px-3 py-1 rounded-lg bg-slate-800 font-mono font-bold text-white text-xs">
                      {row.topsisScore} / 100
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-emerald-400">
                    {row.distanceToIdealBest}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-rose-400">
                    {row.distanceToIdealWorst}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-brand-400">
                    {(row.relativeCloseness * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Downside Tail Risk (VaR & CVaR) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Downside Tail Risk & Extreme Loss Projections (95% VaR & CVaR)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Measures the tail loss in adverse black-swan market conditions over a 5-year timeline.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-md border border-rose-500/20">
            95% Confidence Level
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tailRiskMetrics.map((item) => {
            const opt = topsisRankings.find(t => (t.optionId || '').toString() === (item.optionId || '').toString());
            return (
              <div key={item.optionId} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="font-semibold text-white text-xs truncate">
                  {opt?.title || 'Alternative'}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                      95% Value at Risk (VaR):
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {formatINR(item.valueAtRisk95)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      95% Conditional VaR (CVaR):
                    </span>
                    <span className="font-mono font-bold text-rose-400">
                      {formatINR(item.conditionalVaR95)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Downside Volatility:</span>
                    <span className="text-slate-200">{(item.downsideVolatilityRatio * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
