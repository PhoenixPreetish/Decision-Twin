import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, Award, CheckCircle2, Calendar, Star, Target, PlusCircle } from 'lucide-react';
import { getRiskColor, formatINR } from '../../utils/formatters';

export default function DecisionHistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCheckInId, setActiveCheckInId] = useState(null);
  const [checkInForm, setCheckInForm] = useState({
    checkpointLabel: '90-Day Milestone',
    actualSalaryOrReturn: 1600000,
    actualCost: 500000,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/reports/history');
      if (res.data && res.data.success) {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogCheckIn = async (historyId) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/reports/history/${historyId}/checkin`, checkInForm);
      if (res.data && res.data.success) {
        setActiveCheckInId(null);
        fetchHistory();
      }
    } catch (err) {
      console.error('Failed to record milestone check-in', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs uppercase tracking-wider mb-1">
          <History className="w-4 h-4" />
          <span>Longitudinal Decision Archive & Brier Calibration Journal (REQ-50, BR-6)</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Your Decision History & Outcome Calibration</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Review finalized decisions, log 30/90/180-day real-world milestone outcomes, and track your Brier forecast accuracy and estimation bias over time.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading decision history...</div>
      ) : history.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 space-y-2">
          <History className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-white font-bold">No Finalized Decisions Yet</h3>
          <p className="text-xs text-slate-400">Once you finalize an option in any decision scenario, it will be archived here for longitudinal calibration.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item._id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-xs text-brand-400 font-mono font-semibold uppercase">{item.scenarioTitle}</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                    <Award className="w-4 h-4 text-brand-400" />
                    <span>Chosen Strategy: {item.chosenOptionTitle}</span>
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getRiskColor(item.riskLevel)}`}>
                    {item.riskLevel} Risk
                  </span>
                  <span className="text-sm font-bold font-mono text-white bg-slate-850 px-3 py-1 rounded-lg border border-slate-750">
                    Score: {item.decisionScore}/100
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveCheckInId(activeCheckInId === item._id ? null : item._id)}
                    className="px-3 py-1.5 rounded-lg bg-brand-500/15 text-brand-400 border border-brand-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-brand-500/25"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Log Outcome Check-In</span>
                  </button>
                </div>
              </div>

              {/* Calibration Scorecard Summary if available */}
              {item.calibrationSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Brier Calibration Score</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      {item.calibrationSummary.brierScore} (Lower = Better)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">P10–P90 Coverage Rate</span>
                    <span className="text-sm font-mono font-bold text-sky-400">
                      {item.calibrationSummary.coverageRatePct}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Cost Estimation Bias</span>
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {item.calibrationSummary.costEstimationBiasPct > 0 ? '+' : ''}
                      {item.calibrationSummary.costEstimationBiasPct}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Income Estimation Bias</span>
                    <span className="text-sm font-mono font-bold text-brand-400">
                      {item.calibrationSummary.incomeEstimationBiasPct > 0 ? '+' : ''}
                      {item.calibrationSummary.incomeEstimationBiasPct}%
                    </span>
                  </div>
                </div>
              )}

              {/* Previous Check-ins */}
              {item.milestoneCheckIns?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                    Recorded Milestone Check-Ins:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {item.milestoneCheckIns.map((ci, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">{ci.checkpointLabel}</span>
                          <span className="text-[11px] text-slate-400">
                            Actual Return: <strong className="text-emerald-400">{formatINR(ci.actualSalaryOrReturn)}</strong> · Cost: <strong className="text-slate-200">{formatINR(ci.actualCost)}</strong>
                          </span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          ci.withinPredictedBand
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {ci.withinPredictedBand ? 'In P10–P90 Band ✓' : 'Outlier Band'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Check-In Form */}
              {activeCheckInId === item._id && (
                <div className="p-4 rounded-xl bg-slate-950 border border-brand-500/30 space-y-3">
                  <h4 className="text-xs font-bold text-brand-400 uppercase flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    Record Actual vs. Predicted Milestone Outcome
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Milestone Checkpoint</label>
                      <select
                        value={checkInForm.checkpointLabel}
                        onChange={(e) => setCheckInForm((f) => ({ ...f, checkpointLabel: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <option value="30-Day Milestone">30-Day Milestone</option>
                        <option value="90-Day Milestone">90-Day Milestone</option>
                        <option value="180-Day Milestone">180-Day Milestone</option>
                        <option value="1-Year Review">1-Year Review</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Actual Annualized Return / Salary (INR)</label>
                      <input
                        type="number"
                        value={checkInForm.actualSalaryOrReturn}
                        onChange={(e) => setCheckInForm((f) => ({ ...f, actualSalaryOrReturn: Number(e.target.value) }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Actual Cost Incurred (INR)</label>
                      <input
                        type="number"
                        value={checkInForm.actualCost}
                        onChange={(e) => setCheckInForm((f) => ({ ...f, actualCost: Number(e.target.value) }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCheckInId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleLogCheckIn(item._id)}
                      className="px-4 py-1.5 rounded-lg bg-brand-500 text-slate-950 font-bold text-xs hover:bg-brand-400"
                    >
                      {submitting ? 'Saving Calibration...' : 'Save & Compute Brier Score'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Finalized on {new Date(item.createdAt).toLocaleDateString('en-IN')}</span>
                </div>

                {item.userFeedback?.rating && (
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>Rating: {item.userFeedback.rating}/5</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
