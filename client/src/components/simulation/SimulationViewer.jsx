import React, { useState } from 'react';
import { formatINR } from '../../utils/formatters';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { TrendingUp, BarChart3, Clock, Sparkles } from 'lucide-react';

export default function SimulationViewer({ simulations, options }) {
  const [selectedOptionId, setSelectedOptionId] = useState(options[0]?._id);

  if (!simulations || simulations.length === 0) return null;

  const getOptId = (item) => (item?.optionId?._id || item?.optionId || '').toString();
  const getObjId = (opt) => (opt?._id || '').toString();

  const currentSim = simulations.find(s => getOptId(s) === (selectedOptionId || '').toString()) || simulations[0];
  const currentOption = options.find(o => getObjId(o) === (selectedOptionId || '').toString()) || options[0];

  const timelineData = currentSim?.timeline?.map(item => ({
    year: `Year ${item.year}`,
    'Worst-Case (10th %)': item.p10,
    'Median Outcome (50th %)': item.p50,
    'Best-Case (90th %)': item.p90
  })) || [];

  const binData = currentSim?.distributionBins?.map(bin => ({
    range: bin.rangeLabel,
    count: bin.count,
    probability: `${(bin.probability * 100).toFixed(1)}%`
  })) || [];

  return (
    <div className="space-y-6">
      {/* Option Selector Pill Tabs */}
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

      {/* Percentiles Summary Cards (REQ-25) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-rose-400 font-semibold uppercase tracking-wider">10th Percentile (Worst-Case)</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {formatINR(currentSim?.percentiles?.p10WorstCase)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">90% likelihood of exceeding this return</p>
        </div>

        <div className="bg-slate-900 border border-brand-500/30 p-5 rounded-2xl bg-brand-500/5">
          <span className="text-xs text-brand-400 font-semibold uppercase tracking-wider">50th Percentile (Expected Median)</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {formatINR(currentSim?.percentiles?.p50MedianCase)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Central stochastic expected outcome</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">90th Percentile (Best-Case)</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {formatINR(currentSim?.percentiles?.p90BestCase)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Top 10% high-market performance tier</p>
        </div>
      </div>

      {/* Empirical Tail Risk & Solvency Metrics (Nexus Upgrade) */}
      {currentSim?.tailRisk && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">Value at Risk (VaR 95%)</span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {formatINR(currentSim.tailRisk.var95)}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">5th percentile floor return</p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] text-rose-400 font-semibold uppercase tracking-wider">Expected Shortfall (CVaR 95%)</span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {formatINR(currentSim.tailRisk.cvar95)}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Mean of worst 5% tail trials</p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] text-purple-400 font-semibold uppercase tracking-wider">5-Yr Ruin Probability</span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {currentSim.tailRisk.ruinProbabilityPct ?? 0}%
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Trials hitting insolvency</p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] text-sky-400 font-semibold uppercase tracking-wider">Downside Semi-Deviation</span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {formatINR(currentSim.tailRisk.downsideSemiDeviation)}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Sub-median volatility</p>
          </div>
        </div>
      )}

      {/* 1-yr, 3-yr, 5-yr Horizon Timeline Area Chart (REQ-26) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              Projected Multi-Year Horizon Bands (1, 3, 5 Years)
            </h3>
            <p className="text-xs text-slate-400">Monte Carlo percentile spreads over time for {currentOption?.title}</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="p90Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="p50Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                formatter={(val) => [formatINR(val), '']}
              />
              <Area type="monotone" dataKey="Best-Case (90th %)" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#p90Grad)" />
              <Area type="monotone" dataKey="Median Outcome (50th %)" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#p50Grad)" />
              <Area type="monotone" dataKey="Worst-Case (10th %)" stroke="#f43f5e" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5-Year Solvency Survival Curve & Markov Scenario Regimes */}
      {(currentSim?.survivalCurve?.length > 0 || currentSim?.scenarioRegimes) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentSim?.survivalCurve?.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                5-Year Financial Solvency Survival Curve
              </h3>
              <p className="text-xs text-slate-400 mb-4">Percentage of 10,000 Markov-regime paths remaining above financial ruin threshold</p>
              <div className="space-y-3">
                {currentSim.survivalCurve.map((pt) => (
                  <div key={pt.year} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">Year {pt.year}</span>
                      <span className="text-slate-400 font-mono">
                        <strong className={pt.solvencyProbabilityPct >= 85 ? 'text-emerald-400' : pt.solvencyProbabilityPct >= 65 ? 'text-amber-400' : 'text-rose-400'}>
                          {pt.solvencyProbabilityPct}%
                        </strong>{' '}
                        solvent · Median Liquidity: {formatINR(pt.medianLiquidWealth)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pt.solvencyProbabilityPct >= 85 ? 'bg-emerald-500' : pt.solvencyProbabilityPct >= 65 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, Math.max(0, pt.solvencyProbabilityPct))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSim?.scenarioRegimes && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Markov Regime-Switching Outcome States
              </h3>
              <p className="text-xs text-slate-400 mb-4">Statistically grounded regime projections vs. assumption-break stress test</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'optimistic', label: 'Optimistic Boom', color: 'text-emerald-400', border: 'border-emerald-500/20' },
                  { key: 'realistic', label: 'Realistic Baseline', color: 'text-sky-400', border: 'border-sky-500/20' },
                  { key: 'adverse', label: 'Adverse Contraction', color: 'text-amber-400', border: 'border-amber-500/20' },
                  { key: 'assumptionBreak', label: 'Assumption Break', color: 'text-rose-400', border: 'border-rose-500/20' }
                ].map(({ key, label, color, border }) => {
                  const reg = currentSim.scenarioRegimes[key];
                  if (!reg) return null;
                  return (
                    <div key={key} className={`bg-slate-950/80 border ${border} rounded-xl p-3`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] font-bold uppercase ${color}`}>{label}</span>
                        <span className="text-[10px] font-mono text-slate-400">{Math.round((reg.probability || 0) * 100)}% prob</span>
                      </div>
                      <div className="text-base font-bold font-mono text-white mt-1">
                        {formatINR(reg.netReturn5Yr)}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{reg.narrative}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 10,000 Monte Carlo Trials Distribution Histogram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            10,000 Trials Probability Distribution Histogram
          </h3>
          <p className="text-xs text-slate-400">Frequency distribution of 10,000 stochastic randomized simulation trials</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={binData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Simulated Trials Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
