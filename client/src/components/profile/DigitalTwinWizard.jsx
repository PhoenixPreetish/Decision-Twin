import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { UserCheck, Shield, Sparkles, CheckCircle2, DollarSign, GraduationCap, Briefcase, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export default function DigitalTwinWizard() {
  const { digitalTwin, refreshDigitalTwin } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    age: 24,
    highestEducation: 'Bachelor',
    fieldOfStudy: 'Computer Science & AI',
    currentOccupation: 'Software Developer',
    yearsOfExperience: 2,
    currentSalary: 750000,
    savings: 200000,
    debt: 50000,
    monthlyExpenses: 30000,
    keySkills: 'Python, React, Node.js, Machine Learning',
    riskTolerance: 'medium'
  });

  useEffect(() => {
    if (digitalTwin) {
      setFormData({
        age: digitalTwin.age || 24,
        highestEducation: digitalTwin.highestEducation || 'Bachelor',
        fieldOfStudy: digitalTwin.fieldOfStudy || 'Computer Science & AI',
        currentOccupation: digitalTwin.currentOccupation || 'Software Developer',
        yearsOfExperience: digitalTwin.yearsOfExperience || 2,
        currentSalary: digitalTwin.currentSalary || 750000,
        savings: digitalTwin.savings || 200000,
        debt: digitalTwin.debt || 0,
        monthlyExpenses: digitalTwin.monthlyExpenses || 30000,
        keySkills: Array.isArray(digitalTwin.keySkills) ? digitalTwin.keySkills.join(', ') : (digitalTwin.keySkills || ''),
        riskTolerance: digitalTwin.riskTolerance || 'medium'
      });
    }
  }, [digitalTwin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/digital-twin', formData);
      await refreshDigitalTwin();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save Digital Twin profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Digital Twin Configuration (REQ-4)</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Your Personal Digital Twin</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            This structured profile acts as the baseline simulation model for all your life decision analytics, salary projections, and risk evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-850 px-4 py-2.5 rounded-xl border border-slate-750 self-start sm:self-auto">
          <UserCheck className={`w-5 h-5 ${digitalTwin?.isComplete ? 'text-emerald-400' : 'text-amber-400'}`} />
          <div className="text-left">
            <div className="text-xs text-slate-400 font-medium">Profile Status</div>
            <div className={`text-xs font-bold ${digitalTwin?.isComplete ? 'text-emerald-400' : 'text-amber-400'}`}>
              {digitalTwin?.isComplete ? 'Ready & Verified' : 'Incomplete'}
            </div>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5" />
          <span>Digital Twin saved successfully! You are now eligible to create decision scenarios (BR-1).</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm">
        <button
          onClick={() => setStep(1)}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all ${
            step === 1 ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>1. Education & Experience</span>
        </button>
        <button
          onClick={() => setStep(2)}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all ${
            step === 2 ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>2. Financial Baseline (₹ INR)</span>
        </button>
        <button
          onClick={() => setStep(3)}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all ${
            step === 3 ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>3. Skills & Risk Tolerance</span>
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Age</label>
              <input
                type="number"
                name="age"
                required
                min={16}
                max={90}
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-850 border border-slate-750 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Highest Education Level</label>
              <select
                name="highestEducation"
                value={formData.highestEducation}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-850 border border-slate-750 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="High School">High School</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor">Bachelor Degree</option>
                <option value="Master">Master Degree</option>
                <option value="Doctorate">Doctorate (Ph.D.)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Field of Study</label>
              <input
                type="text"
                name="fieldOfStudy"
                required
                value={formData.fieldOfStudy}
                onChange={handleChange}
                placeholder="e.g. Computer Science, Business, Electronics"
                className="w-full px-4 py-2.5 bg-slate-850 border border-slate-750 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Current Occupation / Role</label>
              <input
                type="text"
                name="currentOccupation"
                required
                value={formData.currentOccupation}
                onChange={handleChange}
                placeholder="e.g. Student, Software Engineer, Analyst"
                className="w-full px-4 py-2.5 bg-slate-850 border border-slate-750 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Years of Professional Experience ({formData.yearsOfExperience} yrs)
              </label>
              <input
                type="range"
                name="yearsOfExperience"
                min={0}
                max={30}
                value={formData.yearsOfExperience}
                onChange={handleChange}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>0 years (Fresh Graduate)</span>
                <span>15 years</span>
                <span>30+ years (Senior Executive)</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Current Annual Income / Salary ({formatINR(Number(formData.currentSalary))})
              </label>
              <input
                type="number"
                name="currentSalary"
                required
                min={0}
                step="any"
                value={formData.currentSalary}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-850 border border-slate-750 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Set to 0 if full-time student without active income.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Total Available Savings ({formatINR(Number(formData.savings))})
              </label>
              <input
                type="number"
                name="savings"
                required
                min={0}
                step="any"
                value={formData.savings}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-850 border border-slate-750 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Outstanding Debt / Loans ({formatINR(Number(formData.debt))})
              </label>
              <input
                type="number"
                name="debt"
                min={0}
                step="any"
                value={formData.debt}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-850 border border-slate-750 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Monthly Living Expenses ({formatINR(Number(formData.monthlyExpenses))})
              </label>
              <input
                type="number"
                name="monthlyExpenses"
                required
                min={0}
                step="any"
                value={formData.monthlyExpenses}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-850 border border-slate-750 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Key Skills & Competencies (comma separated)
              </label>
              <input
                type="text"
                name="keySkills"
                value={formData.keySkills}
                onChange={handleChange}
                placeholder="Python, Project Management, Financial Modeling, System Architecture"
                className="w-full px-4 py-2.5 bg-slate-850 border border-slate-750 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Self-Declared Risk Tolerance Profile
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'low', title: 'Conservative (Low)', desc: 'Prioritizes job security and low downside risk.' },
                  { id: 'medium', title: 'Moderate (Medium)', desc: 'Balanced risk appetite with steady upside ambition.' },
                  { id: 'high', title: 'Aggressive (High)', desc: 'Open to high-stakes ventures and maximum financial upside.' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, riskTolerance: item.id }))}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      formData.riskTolerance === item.id
                        ? 'bg-brand-500/10 border-brand-500 text-white'
                        : 'bg-slate-850 border-slate-750 text-slate-400 hover:border-slate-650'
                    }`}
                  >
                    <div className="font-bold text-sm text-white">{item.title}</div>
                    <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 hover:bg-slate-750"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Step</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-3">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-100 text-xs font-semibold flex items-center gap-2 hover:bg-slate-750"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 text-slate-950 font-bold text-xs hover:from-brand-400 hover:to-emerald-400 shadow-lg shadow-brand-500/20 disabled:opacity-50"
              >
                {loading ? 'Saving Digital Twin...' : 'Save & Verify Digital Twin'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
