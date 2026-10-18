import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatINR } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';
import {
  Sparkles,
  Clock,
  Target,
  Grid,
  Zap,
  Brain,
  Play,
  Pause,
  Award,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Layers,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

export default function AdvancedDecisionLabView({ scenarioId }) {
  const { isDark } = useTheme();
  const [suiteData, setSuiteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all' | 'time_machine' | 'goal_solver' | 'regret_matrix' | 'shock_injector' | 'behavioral_audit'

  // 1. Parallel Universe Time-Machine states
  const [selectedYear, setSelectedYear] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [twinAId, setTwinAId] = useState('');
  const [twinBId, setTwinBId] = useState('');

  // 2. Reverse Goal-Solver state
  const [targetGoal, setTargetGoal] = useState(3000000);
  const [updatingGoal, setUpdatingGoal] = useState(false);

  // 4. Life Event Shock Injector state
  const [activeShocks, setActiveShocks] = useState(['marriage_house', 'ai_boom_promo']);
  const [updatingShocks, setUpdatingShocks] = useState(false);

  // 8. De-Risking Portfolio active hedges state
  const [activeHedges, setActiveHedges] = useState(['ringfence_buffer', 'scholarship_sponsorship']);

  const colors = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

  useEffect(() => {
    fetchAdvancedSuite(targetGoal, activeShocks, activeHedges, true);
  }, [scenarioId]);

  // Auto-advance year slider when Time-Machine is playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setSelectedYear((prev) => {
        if (prev >= 5) {
          setIsPlaying(false);
          return 5;
        }
        return prev + 1;
      });
    }, 1100);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const fetchAdvancedSuite = async (goalVal, shockIds, hedgeIds = activeHedges, isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await api.post(`/simulations/advanced-suite/${scenarioId}`, {
        targetWealthGoal: goalVal,
        activeShockIds: shockIds,
        activeHedgeIds: hedgeIds
      });
      if (res.data && res.data.success) {
        const s = res.data.suite;
        setSuiteData(s);

        // Initialize Twin A and Twin B IDs on first load
        if (isInitial && s?.parallelUniverse?.optionTimelines) {
          const ids = Object.keys(s.parallelUniverse.optionTimelines);
          if (ids.length >= 2) {
            setTwinAId(ids[0]);
            setTwinBId(ids[1]);
          } else if (ids.length === 1) {
            setTwinAId(ids[0]);
            setTwinBId(ids[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load Advanced Decision Suite:', err);
    } finally {
      setLoading(false);
      setUpdatingGoal(false);
      setUpdatingShocks(false);
    }
  };

  const handleGoalChange = (newGoal) => {
    setTargetGoal(newGoal);
    setUpdatingGoal(true);
    fetchAdvancedSuite(newGoal, activeShocks, activeHedges, false);
  };

  const handleToggleShock = (shockId) => {
    const nextShocks = activeShocks.includes(shockId)
      ? activeShocks.filter((id) => id !== shockId)
      : [...activeShocks, shockId];
    setActiveShocks(nextShocks);
    setUpdatingShocks(true);
    fetchAdvancedSuite(targetGoal, nextShocks, activeHedges, false);
  };

  const handleToggleHedge = (hedgeId) => {
    const nextHedges = activeHedges.includes(hedgeId)
      ? activeHedges.filter((id) => id !== hedgeId)
      : [...activeHedges, hedgeId];
    setActiveHedges(nextHedges);
    fetchAdvancedSuite(targetGoal, activeShocks, nextHedges, false);
  };

  const handlePlayTimeMachine = () => {
    if (selectedYear >= 5) {
      setSelectedYear(0);
    }
    setIsPlaying(!isPlaying);
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-900/60 border border-slate-800 rounded-3xl">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Initializing 10-Module Nexus Decision Intelligence Lab...</span>
      </div>
    );
  }

  if (!suiteData) return null;

  const {
    parallelUniverse,
    reverseGoalSolver,
    regretMatrix,
    shockInjector,
    behavioralAudit,
    evpiEngine,
    counterfactualSolver,
    premortemAndOptionality,
    deRiskingAndMvc,
    householdBargaining,
    tripwireMonitor
  } = suiteData;

  const timelineOptions = Object.values(parallelUniverse?.optionTimelines || {});
  const twinA = parallelUniverse?.optionTimelines?.[twinAId] || timelineOptions[0];
  const twinB = parallelUniverse?.optionTimelines?.[twinBId] || timelineOptions[1] || timelineOptions[0];

  const snapA = twinA?.snapshots?.[selectedYear] || {};
  const snapB = twinB?.snapshots?.[selectedYear] || {};
  const wealthDiffAB = (snapA.netWealth || 0) - (snapB.netWealth || 0);

  const activeCrossover =
    parallelUniverse?.crossovers?.find(
      (c) =>
        (c.optionAId === twinA?.optionId && c.optionBId === twinB?.optionId) ||
        (c.optionAId === twinB?.optionId && c.optionBId === twinA?.optionId)
    ) || parallelUniverse?.crossovers?.[0];

  const subTabs = [
    { id: 'all', label: 'All 10 Flagship Modules', icon: Layers },
    { id: 'time_machine', label: '1. Parallel Universe Time-Machine', icon: Clock },
    { id: 'goal_solver', label: '2. Reverse Goal-Solver', icon: Target },
    { id: 'regret_matrix', label: '3. Minimax Regret Matrix', icon: Grid },
    { id: 'shock_injector', label: '4. Life Event Shock Injector', icon: Zap },
    { id: 'behavioral_audit', label: '5. Cognitive Bias & Prospect Theory', icon: Brain },
    { id: 'evpi_engine', label: '6. EVPI Question Engine', icon: Sparkles },
    { id: 'premortem_optionality', label: '7. Premortem & Real-Options', icon: ShieldAlert },
    { id: 'derisking_mvc', label: '8. De-Risking & MVC Micro-Experiments', icon: CheckCircle2 },
    { id: 'household_tripwires', label: '9. Household Nash & Tripwires', icon: Award }
  ];

  const showSection = (id) => activeSubTab === 'all' || activeSubTab === id;

  return (
    <div className="space-y-8">
      {/* Top Banner & Module Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DecisionTwin AI: Nexus • 10-Module Decision Intelligence Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Next-Gen Prescriptive, Bayesian EVPI & Game-Theoretic Lab
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Combines Parallel-Universe Digital Twin simulation, Reverse Goal Backcasting, Savage Minimax Regret, Bayesian Value of Information (EVPI), Adversarial Red-Team Premortem, Real-Options Optionality, Quantified De-Risking Hedges, and Multi-Stakeholder Nash Bargaining.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          {subTabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeSubTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveSubTab(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-brand-500 text-slate-950 shadow-md'
                    : 'bg-slate-850 text-slate-300 border border-slate-750 hover:border-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          MODULE 1: PARALLEL UNIVERSE TIME-MACHINE (TWIN A VS TWIN B)
         ===================================================================== */}
      {showSection('time_machine') && twinA && twinB && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Clock className="w-4 h-4" />
                <span>Module 1 • Temporal Twin Evolution (2026 – 2031)</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                "Parallel Universe" Twin A vs. Twin B Time-Machine
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Slide across time from Year 0 to Year 5 to inspect how two parallel versions of your life evolve side-by-side.
              </p>
            </div>

            {/* Twin Selectors */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-850 border border-slate-750 rounded-xl px-3 py-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-400 font-semibold">Twin A:</span>
                <select
                  value={twinA.optionId}
                  onChange={(e) => setTwinAId(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  {timelineOptions.map((o) => (
                    <option key={o.optionId} value={o.optionId} className="bg-slate-900 text-white">
                      {o.title}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-500 font-bold">VS</span>

              <div className="flex items-center gap-1.5 bg-slate-850 border border-slate-750 rounded-xl px-3 py-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-slate-400 font-semibold">Twin B:</span>
                <select
                  value={twinB.optionId}
                  onChange={(e) => setTwinBId(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  {timelineOptions.map((o) => (
                    <option key={o.optionId} value={o.optionId} className="bg-slate-900 text-white">
                      {o.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Time Slider Control Bar */}
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayTimeMachine}
                  className="px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-brand-400 transition-all shadow-sm"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause Timeline' : 'Play 5-Yr Evolution'}</span>
                </button>
                <div>
                  <span className="text-xs text-slate-400 block">Active Time Horizon</span>
                  <span className="text-base font-extrabold text-white font-mono">
                    Year {selectedYear} ({2026 + selectedYear})
                  </span>
                </div>
              </div>

              {activeCrossover && (
                <div className="px-3.5 py-2 rounded-xl bg-brand-500/10 border border-brand-500/25 text-xs text-brand-400 font-medium max-w-md">
                  <span className="font-bold uppercase tracking-wider block text-[10px]">⚡ Crossover Intelligence</span>
                  {activeCrossover.narrative}
                </div>
              )}
            </div>

            {/* Year Step Buttons & Range Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={selectedYear}
                onChange={(e) => {
                  setIsPlaying(false);
                  setSelectedYear(Number(e.target.value));
                }}
                className="w-full accent-brand-500 cursor-pointer h-2 rounded-lg"
              />
              <div className="grid grid-cols-6 gap-1 text-center">
                {[0, 1, 2, 3, 4, 5].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => {
                      setIsPlaying(false);
                      setSelectedYear(yr);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      selectedYear === yr
                        ? 'bg-brand-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Yr {yr} ({2026 + yr})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Side-by-Side Parallel Twin Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { twin: twinA, snap: snapA, label: 'TWIN A (UNIVERSE ALPHA)', accent: 'emerald', isLeading: wealthDiffAB >= 0, diff: wealthDiffAB },
              { twin: twinB, snap: snapB, label: 'TWIN B (UNIVERSE BETA)', accent: 'sky', isLeading: wealthDiffAB < 0, diff: -wealthDiffAB }
            ].map(({ twin, snap, label, isLeading, diff }, idx) => (
              <div
                key={idx}
                className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-4 ${
                  isLeading
                    ? 'bg-slate-850/90 border-brand-500/40 shadow-md'
                    : 'bg-slate-850/40 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block">
                      {label} • YEAR {selectedYear} ({2026 + selectedYear})
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">{twin.title}</h4>
                  </div>
                  {isLeading && diff > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                      +{formatINR(diff)} Lead
                    </span>
                  )}
                </div>

                {/* Career Stage Pill */}
                <div className="flex items-center justify-between text-xs bg-slate-900/80 px-3.5 py-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Life & Career Stage:</span>
                  <span className="font-bold text-brand-400">{snap.careerStage}</span>
                </div>

                {/* 4 Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block">Cumulative Net Worth</span>
                    <span className={`text-lg font-extrabold font-mono mt-0.5 block ${snap.netWealth < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatINR(snap.netWealth)}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block">Active Annual Income</span>
                    <span className="text-lg font-extrabold font-mono text-white mt-0.5 block">
                      {formatINR(snap.annualIncome)}/yr
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block">Monthly Cash Surplus/Burn</span>
                    <span className={`text-sm font-bold font-mono mt-0.5 block ${snap.monthlyCashFlow < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {snap.monthlyCashFlow >= 0 ? `+${formatINR(snap.monthlyCashFlow)}/mo` : `${formatINR(snap.monthlyCashFlow)}/mo`}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block">Unpaid Capex / Tuition</span>
                    <span className="text-sm font-bold font-mono text-slate-300 mt-0.5 block">
                      {formatINR(snap.remainingDebt)}
                    </span>
                  </div>
                </div>

                {/* Well-Being Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Work-Life & Sustainability Index</span>
                    <span className="font-mono font-bold text-emerald-400">{snap.wellBeingIndex}/100</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${snap.wellBeingIndex}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Parallel Trajectory Chart */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={parallelUniverse.comparisonSeries} margin={{ top: 10, right: 25, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#E2DDD5'} />
                <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#57534E'} tick={{ fontSize: 11 }} />
                <YAxis
                  stroke={isDark ? '#94a3b8' : '#57534E'}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#EAE6E1',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                  formatter={(val) => [formatINR(val), undefined]}
                />
                <Legend />
                <ReferenceLine
                  x={`Year ${selectedYear} (${2026 + selectedYear})`}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
                {timelineOptions.map((o, idx) => (
                  <Area
                    key={o.optionId}
                    type="monotone"
                    dataKey={o.title}
                    stroke={colors[idx % colors.length]}
                    fill={colors[idx % colors.length]}
                    fillOpacity={0.14}
                    strokeWidth={2.5}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 2: REVERSE GOAL-SOLVER & TIPPING-POINT BACKCASTER
         ===================================================================== */}
      {showSection('goal_solver') && reverseGoalSolver && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Target className="w-4 h-4" />
                <span>Module 2 • Mathematical Backcasting & Optimization</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Reverse Goal-Solver & Break-Even Tipping Points
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Solves backward to find the exact scholarship %, starting salary package, or monthly savings needed for any option to hit your target wealth or beat the #1 choice.
              </p>
            </div>

            {/* Target Wealth Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Target 5-Yr Goal:</span>
              {[1500000, 3000000, 5000000, 7500000, 10000000].map((val) => (
                <button
                  key={val}
                  onClick={() => handleGoalChange(val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                    targetGoal === val
                      ? 'bg-brand-500 text-slate-950 border-brand-500 shadow-xs'
                      : 'bg-slate-850 text-slate-300 border-slate-750 hover:border-slate-600'
                  }`}
                >
                  {formatINR(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Backcast Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {reverseGoalSolver.backcastResults.map((item) => (
              <div
                key={item.optionId}
                className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-all ${
                  item.isWinner
                    ? 'bg-brand-500/[0.04] border-brand-500/35'
                    : 'bg-slate-850/70 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-xs font-bold">
                        Rank #{item.rank}
                      </span>
                      <h4 className="text-base font-bold text-white">{item.title}</h4>
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Current 5-Yr Median Valuation: <strong className="text-white font-mono">{formatINR(item.currentMedianWealth)}</strong>
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                      Goal Success Prob
                    </span>
                    <span className={`text-lg font-extrabold font-mono ${
                      item.targetGoalAnalysis.achievementProbabilityPct >= 70
                        ? 'text-emerald-400'
                        : item.targetGoalAnalysis.achievementProbabilityPct >= 45
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}>
                      {item.targetGoalAnalysis.achievementProbabilityPct}%
                    </span>
                  </div>
                </div>

                {/* Tipping Point Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Req. Scholarship / Discount
                    </span>
                    <span className="text-sm font-bold font-mono text-amber-400 mt-1 block">
                      {item.isWinner
                        ? '0% (Already #1)'
                        : item.upfrontCost > 0
                        ? `${item.tippingPoints.requiredScholarshipPct}% (${formatINR(item.tippingPoints.requiredScholarshipAmount)})`
                        : 'N/A (Zero Capex)'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Break-Even Package
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-400 mt-1 block">
                      {formatINR(item.tippingPoints.requiredStartingSalary)}/yr
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Monthly Savings Delta
                    </span>
                    <span className="text-sm font-bold font-mono text-sky-400 mt-1 block">
                      {item.tippingPoints.requiredMonthlySavingsBoost > 0
                        ? `+${formatINR(item.tippingPoints.requiredMonthlySavingsBoost)}/mo`
                        : 'On Track ✓'}
                    </span>
                  </div>
                </div>

                {/* Actionable Negotiation Prescription */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Prescriptive Negotiation Playbook: </span>
                    {item.prescription}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 3: GAME THEORY REGRET & OPPORTUNITY COST MATRIX
         ===================================================================== */}
      {showSection('regret_matrix') && regretMatrix && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Grid className="w-4 h-4" />
                <span>Module 3 • Savage Minimax Regret Criterion & Game Theory</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Regret Minimization & Opportunity Cost Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Measures the exact opportunity cost (₹ lost by not picking the best performer in each future state) and identifies the path that minimizes worst-case life regret.
              </p>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                ★ Minimax Regret Winner
              </span>
              <span className="font-bold text-white text-sm">{regretMatrix.minimaxWinnerTitle}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 pl-5 pr-4">Minimax Rank & Option</th>
                  {regretMatrix.statesOfNature.map((st) => (
                    <th key={st.id} className="py-3.5 px-3 text-center">
                      <div>{st.name}</div>
                      <div className="text-[10px] font-mono text-brand-400 font-normal">
                        Prob: {(st.probability * 100).toFixed(0)}%
                      </div>
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-right">Max Regret (Worst Case)</th>
                  <th className="py-3.5 pl-3 pr-5 text-right">Expected Regret</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {regretMatrix.regretRows.map((row) => (
                  <tr
                    key={row.optionId}
                    className={row.isMinimaxWinner ? 'bg-emerald-500/[0.04]' : 'hover:bg-slate-800/30'}
                  >
                    <td className="py-4 pl-5 pr-4 align-middle">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                          row.isMinimaxWinner
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          #{row.minimaxRank}
                        </span>
                        <div>
                          <span className="font-bold text-white block">{row.title}</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{row.age80Narrative}</span>
                        </div>
                      </div>
                    </td>

                    {regretMatrix.statesOfNature.map((st) => {
                      const reg = row.regrets[st.id];
                      const payoff = row.payoffs[st.id];
                      const isZeroRegret = reg === 0;
                      return (
                        <td key={st.id} className="py-4 px-3 text-center align-middle">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                                isZeroRegret
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : reg > 1000000
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                              }`}
                            >
                              {isZeroRegret ? '₹0 Regret ★' : `-${formatINR(reg)}`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-1">
                              Payoff: {formatINR(payoff)}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-4 px-4 text-right align-middle font-mono font-bold text-amber-400">
                      {row.maxRegret === 0 ? '₹0 (Optimal)' : formatINR(row.maxRegret)}
                    </td>

                    <td className="py-4 pl-3 pr-5 text-right align-middle font-mono text-slate-300">
                      {formatINR(row.expectedRegret)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 4: INTERACTIVE LIFE EVENT & BLACK SWAN SHOCK INJECTOR
         ===================================================================== */}
      {showSection('shock_injector') && shockInjector && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Zap className="w-4 h-4" />
                <span>Module 4 • Dynamic Timeline Stress & Life Event Simulator</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Interactive "Life Event & Black Swan" Shock Injector
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle real-world personal milestones and unexpected shocks across Years 1–5 to test which decision path stays solvent without depleting emergency savings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-850 border border-slate-750 text-brand-400">
                {activeShocks.length} Active Life Events Injected
              </span>
            </div>
          </div>

          {/* 6 Toggleable Shock Event Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {shockInjector.catalog.map((event) => {
              const isSelected = activeShocks.includes(event.id);
              const isPositive = event.id === 'ai_boom_promo' || event.id === 'grant_bonus';
              return (
                <button
                  key={event.id}
                  onClick={() => handleToggleShock(event.id)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    isSelected
                      ? isPositive
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                        : 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-slate-850/60 border-slate-800 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <span className="text-xs font-bold text-white">{event.title}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        isPositive
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {event.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{event.description}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] font-semibold uppercase tracking-wider">
                    <span className="text-slate-400">{event.category} • Year {event.year}</span>
                    <span className={isSelected ? 'text-brand-400 font-bold' : 'text-slate-500'}>
                      {isSelected ? '● Active in Timeline' : '○ Click to Inject'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Post-Shock Survival Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shockInjector.optionShockResults.map((res) => (
              <div
                key={res.optionId}
                className="p-5 rounded-2xl bg-slate-850 border border-slate-750 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white truncate">{res.title}</h4>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                      res.isSolvent
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {res.survivalStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Baseline Yr-5 Wealth</span>
                    <span className="font-mono font-bold text-slate-300">{formatINR(res.baselineYear5Wealth)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Post-Shock Yr-5 Wealth</span>
                    <span className={`font-mono font-bold ${res.shockedYear5Wealth < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatINR(res.shockedYear5Wealth)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Lowest Cash Point:</span>
                  <span className={`font-mono font-bold ${res.minLiquidityPoint < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {formatINR(res.minLiquidityPoint)} ({res.emergencyBufferMonths} mo buffer)
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Post-Shock Trajectory Chart */}
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={shockInjector.combinedTimeline} margin={{ top: 10, right: 25, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#E2DDD5'} />
                <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#57534E'} tick={{ fontSize: 11 }} />
                <YAxis
                  stroke={isDark ? '#94a3b8' : '#57534E'}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#EAE6E1',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                  formatter={(val) => [formatINR(val), undefined]}
                />
                <Legend />
                <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="3 3" />
                {shockInjector.optionShockResults.map((res, idx) => (
                  <Line
                    key={res.optionId}
                    type="monotone"
                    dataKey={`${res.title} (Post-Shock)`}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 5: BEHAVIORAL ECONOMICS & COGNITIVE BIAS AUDITOR
         ===================================================================== */}
      {showSection('behavioral_audit') && behavioralAudit && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Brain className="w-4 h-4" />
                <span>Module 5 • Kahneman & Tversky Prospect Theory Auditor</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Behavioral Economics & Cognitive Bias Diagnostic
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Audits your decision model using Nobel-Prize Prospect Theory (Loss Aversion coefficient λ = 2.25x) to uncover hidden cognitive blindspots.
              </p>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-850 border border-slate-750 text-xs font-mono text-slate-300">
              v(x) = x^0.88 (gains) | -2.25·(-x)^0.88 (losses)
            </div>
          </div>

          {/* Prospect Utility vs Expected Value Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {behavioralAudit.optionProspects.map((opt) => (
              <div
                key={opt.optionId}
                className="p-4 rounded-2xl bg-slate-850 border border-slate-750 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white truncate">{opt.title}</span>
                  <span className="text-xs font-mono font-bold text-brand-400">
                    Utility: {opt.prospectUtilityScore}/100
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Rational EV Rank: <strong className="text-white">#{opt.expectedValueRank}</strong></span>
                  <span>Prospect Rank: <strong className="text-emerald-400">#{opt.prospectTheoryRank}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* 5 Cognitive Biases Diagnostic Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {behavioralAudit.biases.map((bias) => {
              const isHigh = bias.severity === 'high';
              const isMed = bias.severity === 'medium';
              return (
                <div
                  key={bias.id}
                  className="p-5 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{bias.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{bias.theoryRef}</span>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                        isHigh
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : isMed
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {bias.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed">{bias.diagnosis}</div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300">
                    <span className="font-bold text-brand-400">Debiasing Prescription: </span>
                    {bias.debiasingPrescription}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 6: BAYESIAN VALUE-OF-INFORMATION (EVPI) ADAPTIVE QUESTION ENGINE
         ===================================================================== */}
      {showSection('evpi_engine') && evpiEngine && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Module 6 • Bayesian Expected Value of Perfect Information (EVPI)</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Value-of-Information (EVPI) & Adaptive Question Engine
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Quantifies the exact rupee value of resolving uncertainty before committing ({evpiEngine.topOptionTitle} vs {evpiEngine.challengerOptionTitle}).
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                  Total EVPI (Value of Information)
                </span>
                <span className="font-bold font-mono text-white text-base">
                  {formatINR(evpiEngine.totalEvpiINR ?? evpiEngine.evpiINR ?? 0)}
                </span>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Winner Score Margin
                </span>
                <span className="font-bold font-mono text-white text-base">
                  +{evpiEngine.scoreGap ?? 0} pts
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {(evpiEngine.adaptiveQuestions || evpiEngine.topAdaptiveQuestions || []).map((q, idx) => (
              <div key={q.attribute || idx} className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/30">
                      Question #{idx + 1} · Swing: {q.scoreSwingPoints} pts
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      EVPI: {formatINR(q.evpiINR)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-snug">{q.questionText || q.question}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{q.whyItMatters || q.whyAsk}</p>
                  <p className="text-[11px] text-sky-400 font-medium">{q.recommendation}</p>
                </div>

                {q.quickPresets?.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase text-slate-500 block">
                      Possible Verification Outcomes:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {q.quickPresets.map((p, pIdx) => (
                        <span
                          key={pIdx}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
                        >
                          {p.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 7: ADVERSARIAL RED-TEAM PREMORTEM & REAL-OPTIONS OPTIONALITY
         ===================================================================== */}
      {showSection('premortem_optionality') && premortemAndOptionality && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Module 7 • Adversarial Red-Team Premortem & Real-Options Valuation</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {premortemAndOptionality.premortemHeadline || 'Minimum-Distance Failure Cluster & Skill-Graph Optionality'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {premortemAndOptionality.premortemNarrative}
              </p>
            </div>
          </div>

          {/* Minimum-Distance Failure Cluster */}
          {premortemAndOptionality.minimumDistanceFailureCluster?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {premortemAndOptionality.minimumDistanceFailureCluster.map((fc, i) => (
                <div key={i} className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400">{fc.factor}</span>
                    <span className="text-xs font-mono font-bold text-rose-300">{formatINR(fc.cashImpactINR)}</span>
                  </div>
                  <div className="text-[11px] font-mono text-amber-300">{fc.plausibleShift}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{fc.mechanism}</p>
                </div>
              ))}
            </div>
          )}

          {/* Real Options Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {premortemAndOptionality.realOptionsComparison?.map((opt) => (
              <div key={opt.optionId} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-white">{opt.title}</h4>
                    <span className="text-xs text-slate-400">
                      Option-Adjusted Valuation:{' '}
                      <strong className="text-emerald-400 font-mono">
                        {formatINR(opt.optionAdjustedValuationINR)}
                      </strong>
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    Optionality: {opt.optionalityScore}/100
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Real-Option Flexibility Value</span>
                    <span className="text-sm font-bold font-mono text-sky-400 mt-0.5 block">
                      +{formatINR(opt.realOptionFlexibilityValueINR)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">AI Automation Resilience</span>
                    <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
                      {opt.automationResilience}% · Half-Life: {opt.skillHalfLifeYears} yrs
                    </span>
                  </div>
                </div>

                {opt.unlockedAdjacentRoles?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400 font-semibold">Unlocked Adjacent Doors:</span>
                    {opt.unlockedAdjacentRoles.map((door, dIdx) => (
                      <span key={dIdx} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-brand-300">
                        {door}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 8: QUANTIFIED DE-RISKING HEDGES & 14-DAY MVC EXPERIMENT LAB
         ===================================================================== */}
      {showSection('derisking_mvc') && deRiskingAndMvc && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Module 8 • Quantified Risk-Mitigation Portfolio & MVC Experiment Lab</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Interactive Risk Hedges & 14-to-21 Day Micro-Experiments
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle concrete risk-mitigation hedges for {deRiskingAndMvc.targetOptionTitle} to see live improvements in Decision Score, Ruin Probability, and VaR95.
              </p>
            </div>

            {deRiskingAndMvc.impactSummary && (
              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Unhedged → Mitigated Risk</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    {deRiskingAndMvc.impactSummary.baselineRiskScore} → {deRiskingAndMvc.impactSummary.mitigatedRiskScore}/100 ({deRiskingAndMvc.impactSummary.mitigatedRiskLevel})
                  </span>
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 block">Mitigated Decision Score</span>
                  <span className="text-sm font-bold font-mono text-white">
                    {deRiskingAndMvc.impactSummary.baselineDecisionScore} → {deRiskingAndMvc.impactSummary.mitigatedDecisionScore}/100
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Hedge Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deRiskingAndMvc.hedgeCatalog?.map((h) => {
              const isSelected = activeHedges.includes(h.id);
              return (
                <div
                  key={h.id}
                  onClick={() => handleToggleHedge(h.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="accent-emerald-500"
                      />
                      {h.title}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      +{h.decisionScoreLiftPts} Score | -{h.riskReductionPts} Risk
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{h.actionStep}</p>
                  <div className="flex items-center gap-4 mt-2.5 text-[11px] font-mono text-slate-400">
                    <span>Ruin Reduction: <strong className="text-emerald-400">-{h.ruinReductionPct}%</strong></span>
                    <span>VaR95 Floor Lift: <strong className="text-sky-400">+{formatINR(h.var95LiftINR)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 14-to-21 Day Minimum Viable Commitment (MVC) Micro-Experiment Protocol */}
          {deRiskingAndMvc.mvcProtocol && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-brand-400 block">
                    Minimum Viable Commitment (MVC) Pre-Commitment Experiment
                  </span>
                  <h4 className="text-base font-bold text-white">{deRiskingAndMvc.mvcProtocol.title}</h4>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                  {deRiskingAndMvc.mvcProtocol.durationDays} Days · Cost: {formatINR(deRiskingAndMvc.mvcProtocol.costINR)} · {deRiskingAndMvc.mvcProtocol.reversibility}
                </span>
              </div>

              <p className="text-xs text-slate-300">
                <strong>Hypothesis Tested:</strong> {deRiskingAndMvc.mvcProtocol.hypothesis}
              </p>

              <div className="space-y-1.5">
                {deRiskingAndMvc.mvcProtocol.steps?.map((st, sIdx) => (
                  <div key={sIdx} className="text-xs text-slate-300 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl">
                    {st}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <strong>Go / Commit Gate:</strong> {deRiskingAndMvc.mvcProtocol.passThreshold}
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  <strong>Pivot Gate:</strong> {deRiskingAndMvc.mvcProtocol.pivotThreshold}
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  <strong>Abort Gate:</strong> {deRiskingAndMvc.mvcProtocol.abortThreshold}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODULE 9 & 10: HOUSEHOLD NASH BARGAINING & ASSUMPTION DECAY TRIPWIRES
         ===================================================================== */}
      {showSection('household_tripwires') && (householdBargaining || tripwireMonitor) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {householdBargaining && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Award className="w-4 h-4" />
                  <span>Module 9 • Multi-Stakeholder &quot;Household Twin&quot; & Priority Drift</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Nash Bargaining Compromise & Year-3 Priority Drift
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consensus Winner: <strong className="text-emerald-400">{householdBargaining.consensusWinnerTitle}</strong>
                </p>
              </div>

              <div className="space-y-2.5">
                {householdBargaining.optionsAlignment?.map((o) => (
                  <div key={o.optionId} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-white block">{o.title}</span>
                      <span className="text-[11px] text-slate-400">
                        User Utility: <strong className="text-brand-400">{o.userUtility}</strong> · Partner/Family Utility: <strong className="text-purple-400">{o.stakeholderUtility}</strong> · Yr-3 Drift Score: <strong className="text-sky-400">{o.priorityDriftYear3Score}</strong>
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400 block">
                        Nash: {o.nashBargainingScore}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Robustness: {o.driftRobustnessPct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tripwireMonitor && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Module 10 • Assumption Decay Early-Warning Tripwires</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Live Assumption Health Monitor
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {tripwireMonitor.tripwires?.map((tw, idx) => (
                  <div key={tw.parameter || idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{tw.label || tw.parameter}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        tw.status === 'Safe'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : tw.status === 'Near_Breach'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {tw.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Current: <strong className="text-slate-200">{tw.currentValue} {tw.unit}</strong> | Threshold ({tw.operator}): <strong className="text-rose-400">{tw.thresholdValue} {tw.unit}</strong>
                    </div>
                    <p className="text-[11px] text-slate-400">{tw.consequence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
