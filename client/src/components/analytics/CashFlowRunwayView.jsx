import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatINR } from '../../utils/formatters';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { DollarSign, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

const LINE_COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'];

export default function CashFlowRunwayView({ scenarioId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCashFlow();
  }, [scenarioId]);

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/simulations/analytics/${scenarioId}`);
      if (res.data && res.data.success) {
        setData(res.data.analytics?.cashFlowRunway);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cash-flow projection');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Calculating 60-month cash flow trajectory & NPV runway...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm">
        {error || 'Cash flow projections not yet available. Run the base simulation first.'}
      </div>
    );
  }

  const { timelineChartData = [], breakEvenSummary = [] } = data;
  const optionKeys = breakEvenSummary.map(b => b.title);

  return (
    <div className="space-y-6">
      {/* Intro Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 p-6 rounded-3xl border border-emerald-500/20 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <DollarSign className="w-4 h-4" />
          <span>Financial Runway & Capital Recovery Engine</span>
        </div>
        <h2 className="text-xl font-bold text-white">60-Month Cumulative Net Wealth & Break-Even Timeline</h2>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Simulates month-by-month cash flows including upfront tuition/seed capital, living expenses with 5% annual inflation, and post-transition net compensation compounding over 5 years.
        </p>
      </div>

      {/* Chart */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Cumulative Net Wealth Projection (Month 0 to Month 60)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">5-Year Horizon (INR)</span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineChartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px'
                }}
                formatter={(val) => [formatINR(val), 'Cumulative Net Wealth']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {optionKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Break-Even Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {breakEvenSummary.map((item, idx) => {
          const isImmediate = item.breakEvenMonth === 0;
          const isLongPayback = item.breakEvenMonth === '60+ Months';

          return (
            <div
              key={item.optionId}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-md relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[200px]">
                  {item.title}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isImmediate
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : isLongPayback
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}
                >
                  {isImmediate ? 'No Debt' : `${item.breakEvenMonth} Mo Payback`}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Break-Even Horizon:</span>
                  <span className="font-semibold text-white">
                    {item.breakEvenDescription}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">5-Yr NPV (@ 8% Discount):</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatINR(item.npv5Year)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Final 5-Yr Cumulative Wealth:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {formatINR(item.finalNetWealth)}
                  </span>
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="pt-2">
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isImmediate ? 'bg-emerald-400 w-full' : isLongPayback ? 'bg-amber-400 w-1/4' : 'bg-brand-500 w-3/4'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
