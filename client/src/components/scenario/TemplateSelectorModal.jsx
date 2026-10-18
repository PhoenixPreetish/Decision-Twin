import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { formatINR } from '../../utils/formatters';
import {
  Sparkles,
  X,
  Layers,
  GraduationCap,
  Rocket,
  Globe,
  Briefcase,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const CATEGORY_ICONS = {
  higher_education: GraduationCap,
  entrepreneurship: Rocket,
  job_offer: Briefcase,
  relocation: Globe
};

export default function TemplateSelectorModal({ isOpen, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/scenarios/templates');
      if (res.data && res.data.success) {
        setTemplates(res.data.templates);
      }
    } catch (err) {
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (tmpl) => {
    try {
      setSubmittingId(tmpl.id);
      setError(null);
      // Create scenario using template structure
      const payload = {
        title: tmpl.title,
        description: tmpl.description,
        category: tmpl.category,
        goalWeights: tmpl.goalWeights,
        constraints: tmpl.constraints,
        options: tmpl.options
      };

      const res = await api.post('/scenarios', payload);
      if (res.data && res.data.success && res.data.scenario) {
        onClose();
        // Redirect straight to simulation dashboard
        navigate(`/scenarios/${res.data.scenario._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create scenario from template');
    } finally {
      setSubmittingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>1-Click Curated Decision Scenarios</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Pre-Built Industry Benchmark Templates
          </h2>
          <p className="text-xs text-slate-400">
            Launch a fully-configured decision scenario with realistic constraints and options in one click.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading pre-calibrated scenario templates...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {templates.map((tmpl) => {
              const Icon = CATEGORY_ICONS[tmpl.category] || Layers;
              const isSubmitting = submittingId === tmpl.id;

              return (
                <div
                  key={tmpl.id}
                  className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                        {tmpl.category.replace('_', ' ')}
                      </span>
                      <Icon className="w-4 h-4 text-brand-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {tmpl.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {tmpl.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tmpl.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-850 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {tmpl.options?.length || 2} Alternatives
                    </span>
                    <button
                      onClick={() => handleSelectTemplate(tmpl)}
                      disabled={isSubmitting}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-500 text-slate-950 text-xs font-bold hover:bg-brand-400 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                    >
                      {isSubmitting ? (
                        <span>Loading...</span>
                      ) : (
                        <>
                          <span>Load Scenario</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
