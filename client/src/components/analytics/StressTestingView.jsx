import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatINR } from '../../utils/formatters';
import {
  AlertTriangle,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';

const SHOCKS = [
  {
    key: 'recession',
    label: 'Recession & Hiring Freeze',
    badge: 'Macro Downturn',
    icon: TrendingDown,
    color: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    description: '-25% hiring contraction, wage freeze, and 1.4x market volatility.'
  },
  {
    key: 'stagflation',
    label: 'Stagflation & Living Cost Spike',
    badge: 'Cost of Living',
    icon: AlertTriangle,
    color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    description: '+45% monthly expense surge, flat compensation growth.'
  },
  {
    key: 'aiBoom',
    label: 'Generative AI Productivity Boom',
    badge: 'Tech Acceleration',
    icon: Zap,
    color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
    description: '+30% wage premium for high-skilled technical & strategic roles.'
  },
  {
    key: 'emergencyShock',
    label: 'Emergency Personal Liquidity Shock',
    badge: 'Black Swan',
    icon: Activity,
    color: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    description: 'Immediate ₹3.5L unexpected medical/family cash drain.'
  }
];

export default function StressTestingView({ scenarioId }) {
  const [selectedShock, setSelectedShock] = useState('recession');
  const [stressData, setStressData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    runStressTest(selectedShock);
  }, [scenarioId, selectedShock]);

  const runStressTest = async (shockKey) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post(`/simulations/stress-test/${scenarioId}`, { shockKey });
      if (res.data && res.data.success) {
        setStressData(res.data.stressTest);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to execute stress test');
    } finally {
      setLoading(false);
    }
  };

  const shockMeta = SHOCKS.find(s => s.key === selectedShock) || SHOCKS[0];

  return (
    <div className="space-y-6">
      {/* Intro Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 p-6 rounded-3xl border border-rose-500/20 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>Macroeconomic & Black-Swan Stress Simulator</span>
        </div>
        <h2 className="text-xl font-bold text-white">Dynamic Scenario Shock Testing</h2>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Evaluate how each decision path withstands sudden macro disruptions, stagflation, or unexpected personal liquidity shocks before committing your capital and career.
        </p>
      </div>

      {/* Shock Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SHOCKS.map((shock) => {
          const Icon = shock.icon;
          const isSelected = selectedShock === shock.key;
          return (
            <button
              key={shock.key}
              onClick={() => setSelectedShock(shock.key)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-slate-850 border-brand-500 shadow-md ring-1 ring-brand-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${shock.color}`}>
                  {shock.badge}
                </span>
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{shock.label}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                {shock.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Loading / Error States */}
      {loading && (
        <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Running stochastic Monte Carlo shock vectors...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Stress Results Table & Resilience Cards */}
      {!loading && stressData && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-400" />
                  <span>Stress Test Comparison: Baseline vs. {stressData.shockProfile?.name || shockMeta.label}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {stressData.shockProfile?.description}
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Risk Penalty: -{stressData.shockProfile?.riskPenalty || 10} pts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/50 uppercase text-[10px] text-slate-400 font-mono tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Alternative Option</th>
                    <th className="py-3 px-4 text-center">Baseline P50</th>
                    <th className="py-3 px-4 text-center">Stressed P50</th>
                    <th className="py-3 px-4 text-center">Score Impact</th>
                    <th className="py-3 px-4 text-center">Resilience %</th>
                    <th className="py-3 px-4 text-right">Downside Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {stressData.stressedResults?.map((res) => {
                    const isHighResilience = res.resilienceScore >= 80;
                    const isModerate = res.resilienceScore >= 60 && res.resilienceScore < 80;

                    return (
                      <tr key={res.optionId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {res.title}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                          {formatINR(res.baselineP50)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                          {formatINR(res.stressedP50)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="text-slate-400">{res.baselineDecisionScore}</span>
                          <span className="mx-1 text-slate-600">→</span>
                          <span className="text-rose-400 font-bold">{res.stressedDecisionScore}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          <span className={isHighResilience ? 'text-emerald-400' : isModerate ? 'text-amber-400' : 'text-rose-400'}>
                            {res.resilienceScore}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              isHighResilience
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : isModerate
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {res.resilienceTier}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
