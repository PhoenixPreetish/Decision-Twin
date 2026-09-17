import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Download,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Award,
  CheckSquare,
  Square,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export default function ReportView({ scenarioId, onFinalizeSuccess }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState({});
  const [finalizing, setFinalizing] = useState(false);
  const [finalizedSuccess, setFinalizedSuccess] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [scenarioId]);

  const fetchReport = async () => {
    try {
      const res = await api.get(`/reports/${scenarioId}`);
      if (res.data && res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (index) => {
    setCompletedTasks(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleFinalize = async () => {
    if (!reportData || !reportData.rankedOptions?.[0]) return;
    setFinalizing(true);
    try {
      const winner = reportData.rankedOptions[0];
      await api.post('/reports/finalize', {
        scenarioId,
        chosenOptionId: winner.option._id,
        userFeedback: {
          rating: 5,
          notes: 'Finalized based on top DecisionTwin AI score and lowest risk.'
        }
      });
      setFinalizedSuccess(true);
      if (onFinalizeSuccess) onFinalizeSuccess();
    } catch (err) {
      console.error('Failed to finalize decision', err);
    } finally {
      setFinalizing(false);
    }
  };

  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const scenario = reportData.scenario;
    const report = reportData.report;
    const topOption = reportData.rankedOptions[0];

    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(34, 197, 94); // emerald-500
    doc.setFontSize(18);
    doc.text('DecisionTwin AI — Executive Decision Report', 14, 18);
    doc.setTextColor(203, 213, 225);
    doc.setFontSize(10);
    doc.text(`Scenario: ${scenario.title} | Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

    // Summary Box
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text('Recommended Decision Strategy', 14, 48);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const splitText = doc.splitTextToSize(report.recommendationSummary, 180);
    doc.text(splitText, 14, 56);

    // Rankings Table
    const tableBody = reportData.rankedOptions.map(item => [
      `#${item.riskScore.rank} ${item.option.title}`,
      `${item.riskScore.decisionScore}/100`,
      item.riskScore.overallRiskLevel,
      `${item.riskScore.goalAlignmentScore}%`,
      formatINR(item.simulation.percentiles.p50MedianCase)
    ]);

    const runAutoTable = (options) => {
      if (typeof doc.autoTable === 'function') {
        doc.autoTable(options);
      } else {
        autoTable(doc, options);
      }
    };

    runAutoTable({
      startY: 75,
      head: [['Rank & Alternative', 'Decision Score', 'Risk Level', 'Goal Fit', '5-Yr Median Valuation']],
      body: tableBody,
      headStyles: { fillStyle: [34, 197, 94], textColor: [15, 23, 42], fontStyle: 'bold' }
    });

    // Action Plan Milestones
    const actionY = (doc.lastAutoTable?.finalY || 140) + 15;
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Personalized Step-by-Step Action Roadmap', 14, actionY);

    const actionBody = report.actionPlan.map(a => [a.phase, a.task]);
    runAutoTable({
      startY: actionY + 6,
      head: [['Phase & Horizon', 'Key Action Item']],
      body: actionBody,
      headStyles: { fillStyle: [51, 65, 85], textColor: [255, 255, 255] }
    });

    // Disclaimer
    const lastY = (doc.lastAutoTable?.finalY || 220) + 12;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Advisory Disclaimer: Algorithmically generated estimates for decision support. Not professional counsel.', 14, lastY);

    doc.save(`DecisionTwin_Report_${scenario.title.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Compiling Explainable AI report...</div>;
  }

  if (!reportData) return null;

  const { report, rankedOptions } = reportData;

  return (
    <div className="space-y-8">
      {/* Action Header & Export (REQ-49) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-brand-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Explainable AI (XAI) Synthesis
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Executive Recommendation & Action Plan</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-750 flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-brand-400" />
            <span>Export PDF Report (REQ-49)</span>
          </button>

          <button
            onClick={handleFinalize}
            disabled={finalizing || finalizedSuccess}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 text-slate-950 text-xs font-bold hover:from-brand-400 hover:to-emerald-400 flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {finalizedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Decision Finalized!</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Finalize & Archive Decision (REQ-50)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Plain Language Narrative (REQ-46) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-400" />
          Primary Recommendation Rationale
        </h3>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed bg-slate-850 p-5 rounded-xl border border-slate-750">
          {report.recommendationSummary}
        </p>
      </div>

      {/* Feature Importance Attribution (REQ-45) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Top Influencing Decision Factors (Permutation Importance)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {report.featureContributions.map((fc) => (
            <div key={fc.feature} className="p-4 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-200 block">{fc.feature}</span>
                <span className="text-[11px] text-slate-400">Relative weight contribution</span>
              </div>
              <span className={`font-mono text-sm font-bold ${fc.direction === 'positive' ? 'text-emerald-400' : 'text-amber-400'}`}>
                +{fc.importance}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pros & Cons Matrix (REQ-47) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-base font-bold text-white">Pros & Cons Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {report.optionBreakdown.map((item) => (
            <div key={item.optionId} className="p-5 rounded-xl bg-slate-850 border border-slate-750 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-750 pb-3">
                <span className="font-bold text-white text-sm">#{item.rank} {item.title}</span>
                <span className="text-xs font-mono text-brand-400 font-bold">{item.decisionScore}/100</span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5" /> Strengths & Pros
                </span>
                <ul className="space-y-1">
                  {item.pros.map((p, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <ThumbsDown className="w-3.5 h-3.5" /> Considerations & Cons
                </span>
                <ul className="space-y-1">
                  {item.cons.map((c, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-rose-400 mt-0.5">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step-by-Step Checkable Action Plan (REQ-48) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-brand-400" />
          Step-by-Step Personalized Action Roadmap
        </h3>
        <div className="space-y-3">
          {report.actionPlan.map((action, idx) => {
            const isDone = completedTasks[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleTask(idx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isDone
                    ? 'bg-brand-500/10 border-brand-500/30 text-slate-300'
                    : 'bg-slate-850 border-slate-750 text-slate-200 hover:border-slate-650'
                }`}
              >
                <button type="button" className="mt-0.5 text-brand-400">
                  {isDone ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
                <div className="space-y-1">
                  <span className={`text-xs font-bold uppercase tracking-wider block ${isDone ? 'text-brand-400 line-through' : 'text-slate-400'}`}>
                    {action.phase}
                  </span>
                  <p className={`text-sm ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                    {action.task}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
