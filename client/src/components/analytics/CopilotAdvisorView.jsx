import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Sparkles,
  ShieldAlert,
  TrendingUp,
  CheckSquare,
  MessageSquare,
  Send,
  AlertTriangle,
  Lightbulb,
  Award,
  Bot
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What is my single biggest vulnerability?',
  'How should I negotiate compensation & sign-on bonus?',
  'Which alternative is safest in an economic downturn?',
  'What is my break-even payback timeline?'
];

export default function CopilotAdvisorView({ scenarioId }) {
  const [brief, setBrief] = useState(null);
  const [loadingBrief, setLoadingBrief] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [sendingQuery, setSendingQuery] = useState(false);

  useEffect(() => {
    fetchInitialBrief();
  }, [scenarioId]);

  const fetchInitialBrief = async () => {
    try {
      setLoadingBrief(true);
      const res = await api.post(`/simulations/copilot/${scenarioId}`, {});
      if (res.data && res.data.success) {
        setBrief(res.data.brief);
      }
    } catch (err) {
      console.error('Failed to load copilot brief', err);
    } finally {
      setLoadingBrief(false);
    }
  };

  const handleSendQuestion = async (qText) => {
    const query = qText || inputQuestion;
    if (!query || !query.trim() || sendingQuery) return;

    const userMessage = { sender: 'user', text: query.trim() };
    setChatHistory(prev => [...prev, userMessage]);
    setInputQuestion('');
    setSendingQuery(true);

    try {
      const res = await api.post(`/simulations/copilot/${scenarioId}`, { question: query.trim() });
      if (res.data && res.data.success && res.data.queryResponse) {
        const botMessage = { sender: 'bot', text: res.data.queryResponse.reply };
        setChatHistory(prev => [...prev, botMessage]);
      }
    } catch (err) {
      const errMessage = {
        sender: 'bot',
        text: 'Sorry, I encountered an issue analyzing that question. Please try again.'
      };
      setChatHistory(prev => [...prev, errMessage]);
    } finally {
      setSendingQuery(false);
    }
  };

  if (loadingBrief) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">TwinBot AI Co-Pilot analyzing multi-dimensional risks & strategy...</span>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm">
        Co-Pilot strategic brief not available. Ensure base simulations have run.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Verdict Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-brand-950/20 to-slate-900 p-6 sm:p-8 rounded-3xl border border-brand-500/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold">
            <Bot className="w-4 h-4" />
            <span>AI Decision Co-Pilot Advisory Brief</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Recommended Action Date: {brief.recommendedDecisionDate}
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <span>Strategic Synthesis for {brief.topOptionTitle}</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-300 font-mono font-bold">
              Score: {brief.compositeScore}/100
            </span>
          </h2>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {brief.verdict}
          </p>
        </div>
      </div>

      {/* Grid: Vulnerabilities & Catalysts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vulnerabilities */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Stress Points & Critical Vulnerabilities</span>
          </h3>

          <div className="space-y-3">
            {brief.vulnerabilities?.map((vuln, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{vuln.title}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      vuln.severity === 'Critical'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : vuln.severity === 'Warning'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}
                  >
                    {vuln.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{vuln.detail}</p>
                <div className="text-[11px] text-emerald-400 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/15">
                  <span className="font-semibold text-white">Mitigation: </span>
                  {vuln.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upside Catalysts */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Asymmetric Upside Catalysts</span>
          </h3>

          <div className="space-y-3">
            {brief.catalysts?.map((cat, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{cat.name}</span>
                  <span className="text-[10px] font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                    {cat.timing}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{cat.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Negotiation & Action Checklist */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-brand-400" />
          <span>Strategic Negotiation & De-Risking Checklist</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {brief.negotiationChecklist?.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                {idx + 1}
              </span>
              <span className="leading-snug pt-0.5">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Q&A Co-Pilot Chat */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-400" />
            <span>Interactive TwinBot Q&A Console</span>
          </h3>
          <span className="text-xs text-slate-400">Context: Active Scenario & Digital Twin</span>
        </div>

        {/* Suggested Quick Prompts */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuestion(q)}
              className="text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700/60 transition-colors flex items-center gap-1.5 text-left"
            >
              <Lightbulb className="w-3 h-3 text-brand-400 shrink-0" />
              <span>{q}</span>
            </button>
          ))}
        </div>

        {/* Chat History Messages */}
        {chatHistory.length > 0 && (
          <div className="space-y-3 pt-2 max-h-96 overflow-y-auto pr-1">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-brand-500/10 border border-brand-500/20 text-brand-200 ml-8'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 mr-8 whitespace-pre-line'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {msg.sender === 'user' ? 'You' : 'TwinBot AI Co-Pilot'}
                </div>
                {msg.text}
              </div>
            ))}
          </div>
        )}

        {/* Input box */}
        <div className="flex gap-2 pt-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
            placeholder="Ask TwinBot anything (e.g. 'What if I fail in the first 6 months?')"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
          <button
            onClick={() => handleSendQuestion()}
            disabled={sendingQuery || !inputQuestion.trim()}
            className="px-4 py-2.5 rounded-xl bg-brand-500 text-slate-950 text-xs font-bold hover:bg-brand-400 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
}
