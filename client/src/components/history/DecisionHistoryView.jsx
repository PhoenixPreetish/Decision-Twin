import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DisclaimerBanner from '../common/DisclaimerBanner';
import { History, Award, CheckCircle2, Calendar, Star } from 'lucide-react';
import { getRiskColor } from '../../utils/formatters';

export default function DecisionHistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs uppercase tracking-wider mb-1">
          <History className="w-4 h-4" />
          <span>Longitudinal Decision Archive (REQ-50, BR-6)</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Your Decision History</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-xl">
          Review finalized decisions, historical ratings, and tracked outcomes over time.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading decision history...</div>
      ) : history.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 space-y-2">
          <History className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-white font-bold">No Finalized Decisions Yet</h3>
          <p className="text-xs text-slate-400">Once you finalize an option in any decision scenario, it will be archived here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item._id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-xs text-brand-400 font-mono font-semibold uppercase">{item.scenarioTitle}</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                    <Award className="w-4 h-4 text-brand-400" />
                    <span>Chosen Strategy: {item.chosenOptionTitle}</span>
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getRiskColor(item.riskLevel)}`}>
                    {item.riskLevel} Risk
                  </span>
                  <span className="text-sm font-bold font-mono text-white bg-slate-850 px-3 py-1 rounded-lg border border-slate-750">
                    Score: {item.decisionScore}/100
                  </span>
                </div>
              </div>

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
