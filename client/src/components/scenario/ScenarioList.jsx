import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import DisclaimerBanner from '../common/DisclaimerBanner';
import {
  Plus,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Building2,
  PiggyBank,
  MapPin,
  Clock,
  Sparkles,
  Award,
  AlertCircle
} from 'lucide-react';

const categoryIcons = {
  higher_education: GraduationCap,
  job_selection: Briefcase,
  career_change: TrendingUp,
  entrepreneurship: Building2,
  investment_planning: PiggyBank,
  relocation: MapPin
};

export default function ScenarioList() {
  const { isTwinComplete } = useAuth();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const res = await api.get('/scenarios');
      if (res.data && res.data.success) {
        setScenarios(res.data.scenarios);
      }
    } catch (err) {
      console.error('Failed to load scenarios', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Simulation & Decision Twin</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Data-driven clarity for your highest-stakes decisions.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Simulate 10,000 future trajectories, assess multi-dimensional risks, and get explainable AI action roadmaps for education, career pivots, job offers, and startups.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/scenarios/new"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 text-slate-950 font-bold text-xs sm:text-sm hover:from-brand-400 hover:to-emerald-400 shadow-lg shadow-brand-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Decision Scenario</span>
            </Link>

            {!isTwinComplete && (
              <Link
                to="/profile"
                className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-semibold text-xs sm:text-sm hover:bg-slate-750 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Complete Digital Twin First</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Your Decision Scenarios</h2>
          <span className="text-xs text-slate-400 font-mono">
            {scenarios.length} {scenarios.length === 1 ? 'Scenario' : 'Scenarios'} Active (Max 5 on Free Tier)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading your scenarios...</div>
        ) : scenarios.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">No Scenarios Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Start by building your Digital Twin profile and then simulate your first career or educational decision.
            </p>
            <div className="pt-2">
              <Link
                to={isTwinComplete ? "/scenarios/new" : "/profile"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold hover:bg-brand-500/20"
              >
                {isTwinComplete ? "Create First Scenario" : "Setup Digital Twin"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((item) => {
              const Icon = categoryIcons[item.category] || Sparkles;
              return (
                <Link
                  key={item._id}
                  to={`/scenarios/${item._id}`}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-0.5 shadow-sm group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {item.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-brand-400 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {item.description || 'Simulated options, Monte Carlo percentile projections, and risk matrix.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(item.updatedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <span className="text-brand-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      View Analytics <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
