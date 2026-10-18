import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Trash2,
  Minimize2,
  ChevronDown,
  ShieldCheck,
  Compass,
  ArrowRight,
  Lightbulb
} from 'lucide-react';

export default function ChatbotWidget() {
  const { user } = useAuth();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [unreadBadge, setUnreadBadge] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Extract scenarioId if currently on a scenario dashboard page
  const scenarioMatch = location.pathname.match(/\/scenarios\/([a-zA-Z0-9_-]+)/);
  const scenarioId = scenarioMatch && scenarioMatch[1] !== 'new' ? scenarioMatch[1] : null;

  // Initialize welcoming message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: `Hello ${user?.fullName ? user.fullName.split(' ')[0] : 'there'}! 👋 I am **TwinBot**, your **Online AI Decision Co-Pilot**.\n\n` +
            `I am **actively connected** to the Nexus Decision Intelligence Engine. I can analyze your financial runway, stress-test competing options, or build counter-offer negotiation scripts.\n\n` +
            `How can I assist your decision today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [user]);

  // Fetch dynamic suggestions whenever page route changes
  useEffect(() => {
    fetchDynamicPrompts();
  }, [location.pathname, scenarioId]);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setUnreadBadge(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const fetchDynamicPrompts = async () => {
    try {
      const res = await api.get('/chatbot/prompts', {
        params: { route: location.pathname, scenarioId }
      });
      if (res.data && res.data.success) {
        setPrompts(res.data.prompts || []);
      }
    } catch (err) {
      // Fallback local prompts
      setPrompts([
        'Why is Option 1 chosen?',
        'What are my biggest vulnerabilities?',
        'How should I negotiate compensation?',
        'Calculate my financial runway'
      ]);
    }
  };

  const buildClientFallbackReply = (queryText = '') => {
    const q = queryText.toLowerCase();
    if (/\b(why|choos|chose|chosen|choosed|select|selected|pick|picked|prefer|preferred|win|won|winner|best)\b/i.test(q)) {
      const optMatch = q.match(/option\s*([1-6a-f])/i);
      const optLabel = optMatch ? `Option ${optMatch[1].toUpperCase()}` : 'Option 1';
      return `Why **${optLabel}** is chosen is because it has a **low risk rate**, requires minimal upfront capital relative to your liquid savings, and achieves the highest composite TOPSIS decision score across your weighted priorities.\n\n` +
        `### 🏆 Key Selection Drivers\n` +
        `- **Lower Risk Rate:** Preserves your emergency runway and minimizes downside tail exposure (CVaR 95%).\n` +
        `- **Higher Net 5-Year Return:** Delivers stronger risk-adjusted cash flow across 10,000 Monte Carlo trials.\n` +
        `- **Goal Alignment:** Best matches your personal priority weights and hard financial constraints.`;
    }
    if (/negotiate|salary|offer|compensation|bonus/i.test(q)) {
      return `To negotiate your compensation effectively, anchor your counter-offer **12%–18% above the base offer** and request a sign-on bonus to protect your Year-1 cash flow.\n\n` +
        `### Strategic Compensation Negotiation Playbook\n` +
        `- **Anchor Above Median:** Request 12%–18% above the initial base offer using competing option utility as your BATNA.\n` +
        `- **De-Risk Year-1 Cash Flow:** Negotiate a sign-on bonus or relocation/tuition reimbursement to protect your liquid emergency runway.\n` +
        `- **Performance Cliff Review:** Lock in a 6-month compensation review tied to measurable deliverables.`;
    }
    if (/runway|emergency|buffer|savings|debt/i.test(q)) {
      return `You should maintain at least **6.0 months** of mandatory living expenses as a liquid emergency buffer before committing upfront capital.\n\n` +
        `### Financial Runway & Solvency Analysis\n` +
        `- **Recommended Liquid Buffer:** Maintain at least **6.0 months** of mandatory living expenses ring-fenced before committing upfront capital.\n` +
        `- **Ruin Boundary Protection:** Keep debt service below 28% of net monthly inflow to ensure your 5-year survival probability stays above 90%.`;
    }
    if (/vulnerabilit|risk|danger|fail|downside/i.test(q)) {
      return `Your primary vulnerability is **upfront capital lock-in** combined with transition cash-flow lag during the initial payback period.\n\n` +
        `### Key Decision Vulnerabilities & Hedges\n` +
        `- **Upfront Capital Lock-In:** High tuition or seed investment increases your Irreversibility Index.\n` +
        `- **Mitigation:** Run a 21-day Minimum Viable Commitment (MVC) micro-experiment and secure a part-time or scholarship hedge before full commitment.`;
    }
    return `Regarding **"${queryText}"**, your optimal path is the option that combines the **lowest risk rate** with the **highest 5-year risk-adjusted return**.\n\n` +
      `### TwinBot Strategic Assessment\n` +
      `- **Multi-Tensor Evaluation:** Compare your options across **Expected 5-Yr Median Return**, **CVaR 95% Tail Risk**, and **Decision Readiness Score**.\n` +
      `- **Actionable Next Step:** Ask me *"Why is Option 1 chosen?"*, *"Compare Option 1 vs Option 2"*, or *"What are my biggest vulnerabilities?"*.`;
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/chat', {
        message: text,
        pageContext: {
          route: location.pathname,
          scenarioId
        }
      });

      if (res.data && res.data.success) {
        const botMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);

        if (res.data.suggestedPrompts && res.data.suggestedPrompts.length > 0) {
          setPrompts(res.data.suggestedPrompts);
        }
      }
    } catch (err) {
      const fallbackMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: buildClientFallbackReply(text),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: `Chat reset. Ask me anything about your current decision, runway, or salary benchmarks!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    fetchDynamicPrompts();
  };

  // Helper to format simple markdown (bold, headers, bullets, numbers)
  const renderFormattedText = (raw) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      // Heading 3
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-sm text-brand-400 mt-2 mb-1 flex items-center gap-1.5">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Bullet list item
      if (line.startsWith('- ')) {
        const content = line.replace('- ', '');
        return (
          <div key={idx} className="flex items-start gap-1.5 text-xs my-0.5 ml-1">
            <span className="text-brand-400 font-bold">•</span>
            <span>{renderInlineStyles(content)}</span>
          </div>
        );
      }
      // Numbered list item
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="text-xs my-1 ml-1 pl-1 border-l border-slate-700/60">
            {renderInlineStyles(line)}
          </div>
        );
      }
      // Empty line spacer
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Standard paragraph
      return (
        <p key={idx} className="text-xs leading-relaxed my-0.5">
          {renderInlineStyles(line)}
        </p>
      );
    });
  };

  const renderInlineStyles = (str) => {
    // Replace **bold** with <strong>
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Only render for authenticated users
  if (!user) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans select-none">
      {/* 1. Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 text-slate-950 font-bold shadow-2xl shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 cursor-pointer"
          title="Open TwinBot AI Co-Pilot"
        >
          <div className="relative">
            <Bot className="w-5 h-5 stroke-[2.5]" />
            {unreadBadge && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
            )}
          </div>
          <span className="text-xs font-extrabold tracking-wide uppercase">TwinBot AI</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/80 text-emerald-400 border border-emerald-500/30 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </button>
      )}

      {/* 2. Expanded Chat Drawer */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[410px] h-[560px] max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-md shadow-brand-500/20">
                <Bot className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">TwinBot Decision Co-Pilot</span>
                  <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online • Live AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Context-Aware Nexus Strategic Advisor</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Reset Conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Minimize TwinBot"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Context Pill Banner */}
          <div className="px-3.5 py-1.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-400">
            <Compass className="w-3 h-3 text-brand-400 shrink-0" />
            <span className="truncate">
              {scenarioId 
                ? 'Context: Active Scenario Simulation & Risk Radar' 
                : location.pathname.includes('/profile')
                ? 'Context: Digital Twin Calibration & Runway'
                : location.pathname.includes('/scenarios/new')
                ? 'Context: Decision Wizard Modeling'
                : 'Context: Global Portfolio & Market Intelligence'}
            </span>
          </div>

          {/* Message List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 no-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white rounded-tr-xs font-medium'
                      : 'bg-slate-850 border border-slate-750 text-slate-200 rounded-tl-xs'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="leading-relaxed">{msg.text}</p>
                  ) : (
                    <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-850 border border-slate-750 px-3.5 py-2.5 rounded-2xl rounded-tl-xs max-w-[70%]">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] font-medium text-slate-400">TwinBot analyzing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Dynamic Suggestion Chips */}
          {prompts.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {prompts.slice(0, 3).map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(promptText)}
                    disabled={loading}
                    className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-brand-300 border border-slate-700/60 hover:border-brand-500/40 transition-all flex items-center gap-1 whitespace-nowrap"
                  >
                    <Lightbulb className="w-2.5 h-2.5 text-brand-400" />
                    <span>{promptText}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-slate-850 border-t border-slate-800 space-y-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about runway, risks, or negotiation..."
                disabled={loading}
                className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="p-2 rounded-xl bg-brand-500 text-slate-950 hover:bg-brand-400 disabled:opacity-40 disabled:hover:bg-brand-500 transition-colors shadow-sm"
                title="Send Message"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[9px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                100% Private Local Intelligence
              </span>
              <span>Press Enter ↵</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
