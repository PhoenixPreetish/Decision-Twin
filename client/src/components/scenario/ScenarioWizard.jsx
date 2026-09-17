import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Sparkles,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Building2,
  PiggyBank,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

const CATEGORIES = [
  { id: 'higher_education', title: 'Higher Education', icon: GraduationCap, desc: 'Master degrees, MBA, international universities, certifications' },
  { id: 'job_selection', title: 'Job Offer Selection', icon: Briefcase, desc: 'Compare competing offers, startup vs MNC compensation' },
  { id: 'career_change', title: 'Career Pivot / Switch', icon: TrendingUp, desc: 'Transitioning to AI/ML, product management, or tech roles' },
  { id: 'entrepreneurship', title: 'Entrepreneurship / Startup', icon: Building2, desc: 'Bootstrapping new ventures, founder runway, business models' },
  { id: 'investment_planning', title: 'Investment & Allocation', icon: PiggyBank, desc: 'Capital investments, real estate vs market portfolio' },
  { id: 'relocation', title: 'City / Country Relocation', icon: MapPin, desc: 'Domestic & overseas migration, cost of living impact' }
];

export default function ScenarioWizard() {
  const { isTwinComplete } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState('higher_education');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // 2 to 6 options (REQ-9)
  const [options, setOptions] = useState([
    {
      title: 'Option A: Tier-1 Master Degree (Full-time)',
      description: '2-year intensive program with on-campus placement pipeline',
      attributes: { tuitionCost: 1500000, programDurationMonths: 24, institutionName: 'Top Institute', isAccredited: true }
    },
    {
      title: 'Option B: Executive / Distance Degree + Continue Job',
      description: 'Part-time degree while maintaining active monthly salary',
      attributes: { tuitionCost: 500000, programDurationMonths: 18, institutionName: 'State University', isAccredited: true }
    }
  ]);

  // 7 Goal weights (REQ-14, REQ-15, BR-3: must sum to 100%)
  const [goalWeights, setGoalWeights] = useState({
    financialGrowth: 30,
    jobSecurity: 20,
    workLifeBalance: 15,
    personalGrowth: 15,
    familyStability: 10,
    locationPreference: 5,
    healthWellBeing: 5
  });

  // Constraints (REQ-16)
  const [constraints, setConstraints] = useState({
    maxBudget: 2000000,
    minAcceptableSalary: 1200000,
    maxAcceptableDebt: 1000000
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalWeight = Object.values(goalWeights).reduce((a, b) => Number(a) + Number(b), 0);

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([
      ...options,
      {
        title: `Option ${String.fromCharCode(65 + options.length)}`,
        description: '',
        attributes: {
          tuitionCost: 1000000,
          offeredSalary: 1200000,
          initialInvestment: 500000,
          workLifeBalanceRating: 7
        }
      }
    ]);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, field, value) => {
    const updated = [...options];
    updated[index][field] = value;
    setOptions(updated);
  };

  const handleAttributeChange = (index, attrKey, value) => {
    const updated = [...options];
    updated[index].attributes = {
      ...updated[index].attributes,
      [attrKey]: value
    };
    setOptions(updated);
  };

  const handleWeightChange = (key, val) => {
    setGoalWeights((prev) => ({ ...prev, [key]: Number(val) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isTwinComplete) {
      setError('Business Rule BR-1: Please complete your Digital Twin profile before creating a scenario.');
      return;
    }
    if (Math.round(totalWeight) !== 100) {
      setError(`Business Rule BR-3: Goal weights must sum to exactly 100% (currently ${totalWeight}%).`);
      return;
    }
    if (options.length < 2 || options.length > 6) {
      setError('Business Rule BR-2: You must configure between 2 and 6 options.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/scenarios', {
        title: title || `${CATEGORIES.find(c => c.id === category)?.title} Decision`,
        category,
        description,
        options,
        goalWeights,
        constraints
      });

      if (res.data && res.data.success) {
        // Automatically run simulations and forward to decision dashboard
        const scenarioId = res.data.scenario._id;
        await api.post(`/simulations/run/${scenarioId}`);
        navigate(`/scenarios/${scenarioId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create and simulate scenario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Decision Modeling Wizard (REQ-8 to REQ-18)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Create New Decision Scenario</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Define multiple alternative paths, set your weighted personal priorities, and configure hard financial constraints.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Category Selection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center font-mono">1</span>
            Select Decision Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    category === cat.id
                      ? 'bg-brand-500/10 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                      : 'bg-slate-850 border-slate-750 text-slate-400 hover:border-slate-650'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-bold text-sm text-white mb-1">
                    <Icon className={`w-4 h-4 ${category === cat.id ? 'text-brand-400' : 'text-slate-400'}`} />
                    <span>{cat.title}</span>
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed">{cat.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="pt-4 grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Scenario Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master in AI vs Senior Software Engineer Offer"
                className="w-full px-4 py-2.5 bg-slate-850 border border-slate-750 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Options Management (REQ-9, REQ-10, BR-2) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center font-mono">2</span>
              Configure Decision Alternatives ({options.length}/6 Options)
            </h2>
            {options.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-brand-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-750"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            )}
          </div>

          <div className="space-y-4 pt-2">
            {options.map((opt, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-slate-850 border border-slate-750 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-400 uppercase">Option {String.fromCharCode(65 + idx)}</span>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Option Name</label>
                    <input
                      type="text"
                      required
                      value={opt.title}
                      onChange={(e) => handleOptionChange(idx, 'title', e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  {category === 'higher_education' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Total Tuition Cost ({formatINR(Number(opt.attributes.tuitionCost || 0))})
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={50000}
                        value={opt.attributes.tuitionCost || 0}
                        onChange={(e) => handleAttributeChange(idx, 'tuitionCost', Number(e.target.value))}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {(category === 'job_selection' || category === 'career_change') && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Offered Annual Compensation ({formatINR(Number(opt.attributes.offeredSalary || 0))})
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={50000}
                        value={opt.attributes.offeredSalary || 0}
                        onChange={(e) => handleAttributeChange(idx, 'offeredSalary', Number(e.target.value))}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {category === 'entrepreneurship' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Initial Capital / Investment ({formatINR(Number(opt.attributes.initialInvestment || 0))})
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={50000}
                        value={opt.attributes.initialInvestment || 0}
                        onChange={(e) => handleAttributeChange(idx, 'initialInvestment', Number(e.target.value))}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                      Work-Life Balance Expectation (1-10)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={opt.attributes.workLifeBalanceRating || 7}
                      onChange={(e) => handleAttributeChange(idx, 'workLifeBalanceRating', Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Goal Weights & Constraints (REQ-14, REQ-15, REQ-16, BR-3) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center font-mono">3</span>
              Personal Goal Priorities & Weights
            </h2>
            <div className={`text-xs px-3 py-1 rounded-full font-bold font-mono border ${
              Math.round(totalWeight) === 100
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
            }`}>
              Total Weight: {totalWeight}% / 100%
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { key: 'financialGrowth', label: 'Financial Growth & ROI' },
              { key: 'jobSecurity', label: 'Job Security & Stability' },
              { key: 'workLifeBalance', label: 'Work-Life Balance' },
              { key: 'personalGrowth', label: 'Personal Growth & Upskilling' },
              { key: 'familyStability', label: 'Family & Proximity' },
              { key: 'locationPreference', label: 'Location / Commute Preference' },
              { key: 'healthWellBeing', label: 'Health & Well-Being' }
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1.5 p-3.5 rounded-xl bg-slate-850 border border-slate-750">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>{label}</span>
                  <span className="font-mono text-brand-400">{goalWeights[key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={goalWeights[key]}
                  onChange={(e) => handleWeightChange(key, e.target.value)}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>
            ))}
          </div>

          {/* Hard Constraints */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Hard Decision Constraints (REQ-16)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Max Acceptable Budget Limit ({formatINR(Number(constraints.maxBudget))})</label>
                <input
                  type="number"
                  step={50000}
                  value={constraints.maxBudget}
                  onChange={(e) => setConstraints(c => ({ ...c, maxBudget: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2 bg-slate-850 border border-slate-750 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Minimum Target Salary ({formatINR(Number(constraints.minAcceptableSalary))})</label>
                <input
                  type="number"
                  step={50000}
                  value={constraints.minAcceptableSalary}
                  onChange={(e) => setConstraints(c => ({ ...c, minAcceptableSalary: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2 bg-slate-850 border border-slate-750 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || Math.round(totalWeight) !== 100}
            className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 text-slate-950 font-bold text-sm hover:from-brand-400 hover:to-emerald-400 shadow-xl shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Running Monte Carlo (10,000 trials)...</span>
              </>
            ) : (
              <>
                <span>Simulate & Generate Decision Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
