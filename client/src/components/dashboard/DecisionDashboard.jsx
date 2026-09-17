import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import DisclaimerBanner from '../common/DisclaimerBanner';
import ScoreGauge from '../common/ScoreGauge';
import OptionComparison from '../comparison/OptionComparison';
import SimulationViewer from '../simulation/SimulationViewer';
import RiskDashboard from '../simulation/RiskDashboard';
import WhatIfPanel from '../whatif/WhatIfPanel';
import ReportView from '../report/ReportView';
import { formatINR, getRiskColor } from '../../utils/formatters';
import {
  Sparkles,
  Award,
  RefreshCw,
  TrendingUp,
  BarChart2,
  ShieldAlert,
  Sliders,
  FileText,
  Clock,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

export default function DecisionDashboard() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [reRunning, setReRunning] = useState(false);

  useEffect(() => {
    fetchScenarioDetails();
  }, [id]);

  const fetchScenarioDetails = async () => {
    try {
      const res = await api.get(`/scenarios/${id}`);
      if (res.data && res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load scenario', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReRunSimulation = async () => {
    setReRunning(true);
    try {
      await api.post(`/simulations/run/${id}`);
      await fetchScenarioDetails();
    } catch (err) {
      console.error('Failed to rerun simulation', err);
    } finally {
      setReRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Computing Monte Carlo trajectories & analytics...</span>
      </div>
    );
  }

  if (!data || !data.scenario) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <h2 className="text-lg font-bold text-white">Scenario not found</h2>
        <Link to="/" className="text-brand-400 text-xs underline">Return to Dashboard</Link>
      </div>
    );
  }

  const getOptId = (item) => (item?.optionId?._id || item?.optionId || '').toString();
  const getObjId = (opt) => (opt?._id || '').toString();

  const topScore = riskScores?.[0];
  const topOption = options?.find(o => getObjId(o) === getOptId(topScore)) || options?.[0];
  const topSim = simulations?.find(s => getOptId(s) === getObjId(topOption));
  const topPred = predictions?.find(p => getOptId(p) === getObjId(topOption));

  const tabs = [
    { id: 'overview', label: 'Decision Overview', icon: Award },
    { id: 'comparison', label: 'Alternatives Matrix', icon: BarChart2 },
    { id: 'simulation', label: 'Monte Carlo Projections', icon: TrendingUp },
    { id: 'risk', label: 'Multi-Risk Matrix', icon: ShieldAlert },
    { id: 'whatif', label: 'What-If Sensitivity', icon: Sliders },
    { id: 'report', label: 'Explainable AI & Action Plan', icon: FileText }
  ];

  return (
    <div className="space-y-6 pb-16">
      <DisclaimerBanner />

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/" className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to All Scenarios
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{scenario.title}</h1>
            <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {scenario.category.replace('_', ' ')}
            </span>
          </div>
        </div>

        <button
          onClick={handleReRunSimulation}
          disabled={reRunning}
          className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-750 flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-brand-400 ${reRunning ? 'animate-spin' : ''}`} />
          <span>{reRunning ? 'Re-simulating (10k)...' : 'Re-Run Simulations (REQ-28)'}</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto text-xs font-semibold no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Recommendation Banner (REQ-38) */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-brand-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold">
                  <Award className="w-4 h-4" />
                  <span>Top Recommended Decision Choice</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{topOption?.title}</h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Achieved highest composite score across your 7 weighted goal priorities with a{' '}
                  <span className="text-white font-semibold">{topScore?.overallRiskLevel} Risk Rating</span> and an estimated 5-year median valuation of{' '}
                  <span className="text-brand-400 font-bold font-mono">{formatINR(topSim?.percentiles?.p50MedianCase)}</span>.
                </p>
                <div className="pt-2 flex items-center gap-4 text-xs text-slate-400 font-mono">
                  <span>Confidence Score: {topScore?.confidenceScore}%</span>
                  <span>•</span>
                  <span>Goal Alignment: {topScore?.goalAlignmentScore}%</span>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
                <ScoreGauge value={topScore?.decisionScore || 85} label="Decision Score" size="lg" />
                <div className="space-y-2 text-left">
                  <div className="text-xs text-slate-400">Risk Assessment</div>
                  <div className={`text-sm font-bold px-3 py-1 rounded-full border inline-block ${getRiskColor(topScore?.overallRiskLevel)}`}>
                    {topScore?.overallRiskLevel || 'Low'} Risk
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Success Prob: {((topPred?.successProbability || 0.85) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Alternatives Summary */}
          <OptionComparison
            options={options}
            riskScores={riskScores || []}
            predictions={predictions || []}
            simulations={simulations || []}
          />
        </div>
      )}

      {/* Tab Content 2: Alternatives Comparison */}
      {activeTab === 'comparison' && (
        <OptionComparison
          options={options}
          riskScores={riskScores || []}
          predictions={predictions || []}
          simulations={simulations || []}
        />
      )}

      {/* Tab Content 3: Monte Carlo Simulation */}
      {activeTab === 'simulation' && (
        <SimulationViewer
          simulations={simulations || []}
          options={options}
        />
      )}

      {/* Tab Content 4: Multi-Risk Matrix */}
      {activeTab === 'risk' && (
        <RiskDashboard
          riskScores={riskScores || []}
          options={options}
        />
      )}

      {/* Tab Content 5: What-If Analysis */}
      {activeTab === 'whatif' && (
        <WhatIfPanel
          scenarioId={scenario._id}
          options={options}
          onApplyChanges={fetchScenarioDetails}
        />
      )}

      {/* Tab Content 6: XAI & Report */}
      {activeTab === 'report' && (
        <ReportView
          scenarioId={scenario._id}
          onFinalizeSuccess={fetchScenarioDetails}
        />
      )}
    </div>
  );
}
