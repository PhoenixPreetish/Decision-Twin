import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatINR } from '../../utils/formatters';
import {
  TrendingUp,
  GraduationCap,
  Rocket,
  Globe,
  Briefcase,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';

export default function MarketIntelligenceView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('salaries');

  useEffect(() => {
    fetchBenchmarks();
  }, []);

  const fetchBenchmarks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/market/benchmarks');
      if (res.data && res.data.success) {
        setData(res.data.benchmarks);
      }
    } catch (err) {
      console.error('Failed to load market benchmarks', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Fetching verified 2026 market intelligence benchmarks...</span>
      </div>
    );
  }

  const {
    salaryBenchmarksByRole = {},
    degreeRoiBenchmarks = {},
    startupBenchmarks = {},
    macroEconomics = {}
  } = data || {};

  return (
    <div className="space-y-6 pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-brand-950/20 to-slate-900 p-6 sm:p-8 rounded-3xl border border-brand-500/20 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider">
          <Globe className="w-4 h-4" />
          <span>Curated Reference Intelligence • Version 1.0.2026</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Market Intelligence & Industry Benchmarks
        </h1>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Calibrated empirical reference datasets powering DecisionTwin AI’s ML prediction models, Monte Carlo variance parameters, and opportunity cost algorithms.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('salaries')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'salaries'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Tech Salary Ladders</span>
        </button>
        <button
          onClick={() => setActiveTab('degrees')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'degrees'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Degree ROI & Payback</span>
        </button>
        <button
          onClick={() => setActiveTab('startups')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'startups'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Rocket className="w-4 h-4" />
          <span>Startup Survival & Dilution</span>
        </button>
        <button
          onClick={() => setActiveTab('macro')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'macro'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Macroeconomic Indicators</span>
        </button>
      </div>

      {/* Tab 1: Salary Ladders */}
      {activeTab === 'salaries' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-400" />
              <span>Technology Compensation Ladders (INR Annualized)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">P50 Industry Medians</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/50 uppercase text-[10px] text-slate-400 font-mono tracking-wider">
                <tr>
                  <th className="py-3 px-4">Role Title</th>
                  <th className="py-3 px-4">Entry / Junior</th>
                  <th className="py-3 px-4">Mid-Level</th>
                  <th className="py-3 px-4">Senior IC</th>
                  <th className="py-3 px-4">Staff / Principal</th>
                  <th className="py-3 px-4 text-right">Director / VP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {Object.entries(salaryBenchmarksByRole).map(([key, item]) => {
                  const s = item.salaries || {};
                  return (
                    <tr key={key} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {item.title || key}
                      </td>
                      <td className="py-3.5 px-4 font-mono">{formatINR(s.entry || s.junior)}</td>
                      <td className="py-3.5 px-4 font-mono">{formatINR(s.mid)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-300">{formatINR(s.senior)}</td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400">{formatINR(s.lead || s.staff)}</td>
                      <td className="py-3.5 px-4 font-mono text-right text-amber-300">{formatINR(s.director || s.vp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Degree ROI */}
      {activeTab === 'degrees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(degreeRoiBenchmarks).map(([key, item]) => (
            <div
              key={key}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[180px]">
                  {item.degreeName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {item.avgBreakEvenMonths} Mo Payback
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Typical Tuition:</span>
                  <span className="font-mono text-white">{formatINR(item.avgTuitionINR)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Post-Grad Expected Comp:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatINR(item.avgStartingPostSalaryINR)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">5-Yr Net Capital Gain:</span>
                  <span className="font-mono text-brand-400 font-bold">{formatINR(item.fiveYearNetGainINR)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Placement Rate:</span>
                  <span className="font-mono text-slate-200">{item.placementRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Startups */}
      {activeTab === 'startups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(startupBenchmarks).map(([stage, item]) => (
            <div
              key={stage}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {stage.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Survival: {item.survivalRatePercent}%
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Typical Seed Dilution:</span>
                  <span className="font-mono text-white">{item.avgDilutionPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recommended Runway:</span>
                  <span className="font-mono text-amber-400">{item.typicalRunwayMonths} Months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Founder Liquidity Failure Rate:</span>
                  <span className="font-mono text-rose-400">{100 - item.survivalRatePercent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Macroeconomics */}
      {activeTab === 'macro' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-xs">Base Annual Inflation</span>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {((macroEconomics.baseInflationRate || 0.06) * 100).toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-500">CPI annualized baseline adjustment applied to living costs.</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-xs">Safe Risk-Free Discount Rate</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {((macroEconomics.riskFreeRate || 0.07) * 100).toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-500">Used for 5-Year Net Present Value (NPV) future discounting.</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-xs">Tech Industry Volatility Multiplier</span>
            <div className="text-2xl font-bold font-mono text-brand-400">
              {macroEconomics.techIndustryVolatilityMultiplier || 1.35}x
            </div>
            <p className="text-[11px] text-slate-500">Variance multiplier applied to equity compensation & hiring cycles.</p>
          </div>
        </div>
      )}
    </div>
  );
}
