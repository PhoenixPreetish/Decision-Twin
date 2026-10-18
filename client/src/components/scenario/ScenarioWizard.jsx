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
  ArrowRight,
  Cpu,
  Compass,
  Wand2
} from 'lucide-react';
import {
  formatINR,
  CURRENCY_CONFIG,
  getActiveCurrency,
  setActiveCurrency,
  detectCurrencyFromText,
  getUnitMultiplier
} from '../../utils/formatters';

const CATEGORIES = [
  { id: 'higher_education', title: 'Higher Education', icon: GraduationCap, desc: 'Master degrees, MBA, international universities, certifications' },
  { id: 'job_selection', title: 'Job Offer Selection', icon: Briefcase, desc: 'Compare competing offers, startup vs MNC compensation' },
  { id: 'career_change', title: 'Career Pivot / Switch', icon: TrendingUp, desc: 'Transitioning to AI/ML, product management, or tech roles' },
  { id: 'entrepreneurship', title: 'Entrepreneurship / Startup', icon: Building2, desc: 'Bootstrapping new ventures, founder runway, business models' },
  { id: 'investment_planning', title: 'Investment & Allocation', icon: PiggyBank, desc: 'Capital investments, real estate vs market portfolio' },
  { id: 'relocation', title: 'City / Country Relocation', icon: MapPin, desc: 'Domestic & overseas migration, PPP & tax impact' },
  { id: 'skill_investment', title: 'Bootcamp & Skill Investment', icon: Cpu, desc: 'Intensive upskilling, AI/Cloud certifications, part-time cohorts' },
  { id: 'custom_decision', title: 'Custom Life Decision', icon: Compass, desc: 'Major personal, academic, sabbaticals, or user-defined choices' }
];

export default function ScenarioWizard() {
  const { isTwinComplete } = useAuth();
  const navigate = useNavigate();

  const [currency, setCurrency] = useState(getActiveCurrency());
  const [category, setCategory] = useState('higher_education');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [nlPrompt, setNlPrompt] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlFeedback, setNlFeedback] = useState('');

  const handleCurrencyChange = (newCode) => {
    const updated = setActiveCurrency(newCode);
    setCurrency(updated);
  };

  // 2 to 6 options (REQ-9)
  const [options, setOptions] = useState([
    {
      title: 'Option A: Tier-1 Master Degree (Full-time)',
      description: '2-year intensive program with on-campus placement pipeline',
      attributes: { tuitionCost: 1500000, offeredSalary: 2000000, programDurationMonths: 24, institutionName: 'Top Institute', isAccredited: true, workLifeBalanceRating: 6 }
    },
    {
      title: 'Option B: Executive / Distance Degree + Continue Job',
      description: 'Part-time degree while maintaining active monthly salary',
      attributes: { tuitionCost: 500000, offeredSalary: 1400000, programDurationMonths: 18, institutionName: 'State University', isAccredited: true, workLifeBalanceRating: 7 }
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

  // All 5 Hard Constraints (REQ-16)
  const [constraints, setConstraints] = useState({
    maxBudget: 2000000,
    minAcceptableSalary: 1200000,
    maxAcceptableDebt: 1000000,
    requiredLocation: '',
    maxDurationMonths: 36
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const extractMonetaryTokens = (snippet = '') => {
    const tokens = [];
    const regex = /(?:₹|\$|€|¥|£|rs\.?|inr|usd|eur|jpy|gbp|aed|sgd|cad|aud)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(t|tn|trillions?|b|bn|bil|billions?|cr|crores?|m|mn|mil|mill|millions?|lpa|lakhs?|lacs?|l\b|k|thousands?|grand|h|hundreds?)?(?:\s*(?:rupees?|rs\.?|inr|dollars?|usd|bucks?|euros?|eur|yen|jpy|pounds?|gbp|sterling|dirhams?|aed|sgd|cad|aud))?\b/gi;
    let match;
    while ((match = regex.exec(snippet)) !== null) {
      const fullMatch = match[0];
      const numStr = (match[1] || '').replace(/,/g, '');
      const unitStr = match[2] || '';
      const rawNum = parseFloat(numStr);
      if (!Number.isFinite(rawNum)) continue;

      const startIdx = match.index;
      const endIdx = startIdx + fullMatch.length;
      const beforeText = snippet.slice(Math.max(0, startIdx - 28), startIdx).toLowerCase();
      const afterText = snippet.slice(endIdx, Math.min(snippet.length, endIdx + 28)).toLowerCase();

      if (/tier\s*-\s*$/.test(beforeText) || /^\s*-?\s*(?:years?|yrs?|months?|mos?|days?|weeks?)\b/.test(afterText)) {
        continue;
      }

      const value = Math.round(rawNum * getUnitMultiplier(unitStr));

      let role = 'unclassified';
      if (/^\s*(?:for\s+)?(?:cost|costs|tuition|fee|fees|investment|capital|spend|price|loan|outlay)\b/i.test(afterText)) {
        role = 'cost';
      } else if (/^\s*(?:for\s+)?(?:salary|pay|package|ctc|income|earning|stipend|wage|offer|return|revenue|upside)\b/i.test(afterText)) {
        role = 'salary';
      } else if (!/\d/.test(beforeText.slice(-12)) && /\b(?:cost|costs|tuition|fee|fees|investment|capital|spend|price|loan|outlay)\s*(?:of|is|:|=)?\s*$/i.test(beforeText)) {
        role = 'cost';
      } else if (!/\d/.test(beforeText.slice(-12)) && /\b(?:salary|pay|package|ctc|income|earning|stipend|wage|offer|earning|earn|at|return|revenue)\s*(?:of|is|:|=)?\s*$/i.test(beforeText)) {
        role = 'salary';
      }

      tokens.push({ value, role, raw: fullMatch.trim() });
    }
    return tokens;
  };

  const assignCostForCategory = (costVal, targetCategory, extraAttrs = {}) => {
    const c = Math.max(0, Math.round(Number(costVal) || 0));
    return {
      tuitionCost: (targetCategory === 'higher_education' || !['entrepreneurship', 'investment_planning', 'skill_investment'].includes(targetCategory)) ? c : 0,
      initialInvestment: (targetCategory === 'entrepreneurship' || targetCategory === 'investment_planning' || targetCategory === 'custom_decision') ? c : 0,
      courseCost: targetCategory === 'skill_investment' ? c : 0,
      ...extraAttrs
    };
  };

  const compilePromptLocally = (promptText = '') => {
    const text = (promptText || '').trim();
    const lower = text.toLowerCase();
    const baseSalary = 800000;

    const detectedCurr = detectCurrencyFromText(text) || currency || 'INR';

    let detectedCategory = 'career_change';
    if (/relocat|move to|moving to|city|abroad|germany|usa|uk|canada|dubai|singapore|tokyo|london|berlin/i.test(lower)) {
      detectedCategory = 'relocation';
    } else if (/startup|founder|venture|bootstrap|saas|business|entrepreneur/i.test(lower)) {
      detectedCategory = 'entrepreneurship';
    } else if (/mba|m\.?tech|ms\b|master|masters|degree|university|college|iit|iim|tuition|study|phd/i.test(lower)) {
      detectedCategory = 'higher_education';
    } else if (/invest|mutual fund|real estate|sip|portfolio|stock|property/i.test(lower)) {
      detectedCategory = 'investment_planning';
    } else if (/course|bootcamp|certificat|upskill|nanodegree/i.test(lower)) {
      detectedCategory = 'skill_investment';
    } else if (/job|offer|mnc|company|package|lpa|salary|switch/i.test(lower)) {
      detectedCategory = 'job_selection';
    }

    const allTokens = extractMonetaryTokens(text);
    const allValues = allTokens.map((t) => t.value);

    const cleanedIntro = text
      .replace(/^.*?(?:deciding between|choosing between|comparing|debating between|confused between|evaluating)\s+/i, '')
      .trim();

    const rawSegments = cleanedIntro
      .split(/\s+(?:vs\.?|versus|or)\s+/i)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2)
      .slice(0, 6);

    const parsedOptions = [];
    if (rawSegments.length >= 2) {
      rawSegments.forEach((seg, idx) => {
        const segLower = seg.toLowerCase();
        const segTokens = extractMonetaryTokens(seg);

        const isEduSeg = /\b(mba|m\.?tech|ms\b|master|masters|degree|university|college|iit|iim|tuition|phd|study|postgrad|diploma)\b/i.test(segLower);
        const isBootcampSeg = /\b(bootcamp|course|certificat|cohort|upskill|nanodegree|training)\b/i.test(segLower);
        const isStartupSeg = /\b(startup|bootstrap|saas|venture|founder|business|entrepreneur)\b/i.test(segLower);
        const isInvestSeg = /\b(invest|mutual fund|real estate|sip|portfolio|stock|property)\b/i.test(segLower);
        const isCapitalOutlaySeg = isEduSeg || isBootcampSeg || isStartupSeg || isInvestSeg;

        const hasExplicitZeroSalary = /\b(no\s+salary|without\s+salary|zero\s+salary|unpaid|salary\s*(?:is|of|:|=)?\s*0\b|0\s*[kmbtlcr]*\s*salary)\b/i.test(segLower);
        const hasExplicitZeroCost = /\b(no\s+(?:cost|tuition|fee|fees|investment)|without\s+(?:cost|tuition|fee)|zero\s+(?:cost|tuition|fee)|free|(?:cost|tuition|fee)\s*(?:is|of|:|=)?\s*0\b|0\s*[kmbtlcr]*\s*(?:cost|tuition|fee|investment))\b/i.test(segLower);

        const costToken = segTokens.find((t) => t.role === 'cost');
        const salaryToken = segTokens.find((t) => t.role === 'salary');
        const unclassified = segTokens.filter((t) => t.role === 'unclassified');

        let costVal = 0;
        let salaryVal = 0;
        let explicitZeroSalary = hasExplicitZeroSalary;

        if (isCapitalOutlaySeg || costToken) {
          if (hasExplicitZeroCost) {
            costVal = 0;
          } else if (costToken) {
            costVal = costToken.value;
          } else if (unclassified.length > 0) {
            costVal = unclassified.shift().value;
          }

          if (hasExplicitZeroSalary) {
            salaryVal = 0;
            explicitZeroSalary = true;
          } else if (salaryToken) {
            salaryVal = salaryToken.value;
            if (salaryVal === 0) explicitZeroSalary = true;
          } else if (unclassified.length > 0) {
            salaryVal = unclassified.shift().value;
            if (salaryVal === 0) explicitZeroSalary = true;
          } else if (costToken) {
            salaryVal = 0;
            explicitZeroSalary = true;
          } else {
            salaryVal = costVal > 0 ? Math.round(costVal * 1.35) : baseSalary;
          }
        } else {
          costVal = hasExplicitZeroCost ? 0 : (costToken ? costToken.value : 0);
          if (hasExplicitZeroSalary) {
            salaryVal = 0;
            explicitZeroSalary = true;
          } else if (salaryToken) {
            salaryVal = salaryToken.value;
            if (salaryVal === 0) explicitZeroSalary = true;
          } else if (unclassified.length > 0) {
            salaryVal = unclassified[0].value;
            if (salaryVal === 0) explicitZeroSalary = true;
          } else {
            salaryVal = baseSalary;
          }
        }

        const cityMatch = seg.match(/\b(Germany|USA|UK|Canada|Dubai|Singapore|Tokyo|London|Berlin|Bengaluru|Bangalore|Mumbai|Hyderabad|Pune|Delhi|Chennai)\b/i);
        const cleanSegTitle = seg.replace(/^[,\-:;]+|[,\-:;.]+$/g, '').trim();

        parsedOptions.push({
          title: `Option ${String.fromCharCode(65 + idx)}: ${cleanSegTitle}`,
          description: isEduSeg
            ? 'Academic specialization pathway with placement & network leverage'
            : isBootcampSeg
            ? 'Accelerated upskilling cohort while preserving career momentum'
            : isStartupSeg
            ? 'High-upside entrepreneurial venture with equity ownership'
            : 'Direct career & compensation trajectory',
          attributes: assignCostForCategory(costVal, detectedCategory, {
            offeredSalary: salaryVal,
            explicitZeroSalary,
            currency: detectedCurr,
            programDurationMonths: isEduSeg ? 24 : (isBootcampSeg ? 9 : 12),
            expectedRunwayMonths: isStartupSeg ? 15 : 24,
            targetCity: cityMatch ? cityMatch[1] : 'Bengaluru',
            isAccredited: true,
            companyType: isStartupSeg ? 'Startup' : 'MNC',
            workLifeBalanceRating: isStartupSeg ? 5 : (isEduSeg ? 6 : 7)
          })
        });
      });
    } else {
      const valA = allValues[0] || 1600000;
      const valB = allValues[1] || Math.round(valA * 0.75);
      const hasZeroSal = /\b(no\s+salary|without\s+salary|zero\s+salary|unpaid|0\s*[kmbtlcr]*\s*salary)\b/i.test(lower);

      parsedOptions.push(
        {
          title: 'Option A: Primary Strategic Path',
          description: 'Primary strategic option extracted from your prompt',
          attributes: assignCostForCategory(
            ['higher_education', 'entrepreneurship', 'investment_planning', 'skill_investment'].includes(detectedCategory) ? valA : 0,
            detectedCategory,
            {
              offeredSalary: hasZeroSal ? 0 : (['higher_education', 'entrepreneurship', 'skill_investment'].includes(detectedCategory) ? Math.round(valA * 1.35) : valA),
              explicitZeroSalary: hasZeroSal,
              currency: detectedCurr,
              programDurationMonths: 24,
              targetCity: 'Bengaluru',
              isAccredited: true,
              workLifeBalanceRating: 6
            }
          )
        },
        {
          title: 'Option B: Balanced Alternative Path',
          description: 'Lower-volatility comparative benchmark option',
          attributes: assignCostForCategory(0, detectedCategory, {
            offeredSalary: valB,
            explicitZeroSalary: false,
            currency: detectedCurr,
            programDurationMonths: 18,
            targetCity: 'Bengaluru',
            isAccredited: true,
            workLifeBalanceRating: 8
          })
        }
      );
    }

    const maxExtracted = allValues.length > 0 ? Math.max(...allValues) : 1500000;
    const nonZeroSalaries = parsedOptions.map((o) => Number(o.attributes?.offeredSalary) || 0).filter((v) => v > 0);
    const minExtractedSalary = nonZeroSalaries.length > 0 ? Math.min(...nonZeroSalaries) : baseSalary;

    return {
      title: text.length > 68 ? `${text.slice(0, 65).trim()}...` : text,
      category: detectedCategory,
      currency: detectedCurr,
      description: text,
      options: parsedOptions,
      goalWeights: {
        financialGrowth: 30,
        jobSecurity: 20,
        workLifeBalance: 15,
        personalGrowth: 15,
        familyStability: 10,
        locationPreference: 5,
        healthWellBeing: 5
      },
      constraints: {
        maxBudget: Math.max(10000, Math.round(maxExtracted * 1.25)),
        minAcceptableSalary: Math.round(minExtractedSalary * 0.8)
      }
    };
  };

  const applyParsedScenario = (p, sourceText = '') => {
    if (!p) return;
    const detectedCurr = detectCurrencyFromText(sourceText) || p.currency;
    if (detectedCurr && CURRENCY_CONFIG[detectedCurr]) {
      handleCurrencyChange(detectedCurr);
    }
    if (p.category) setCategory(p.category);
    if (p.title) setTitle(p.title);
    if (p.description) setDescription(p.description);
    if (Array.isArray(p.options) && p.options.length >= 2) {
      setOptions(p.options);
    }
    if (p.goalWeights) setGoalWeights(p.goalWeights);
    if (p.constraints) {
      setConstraints((prev) => ({
        ...prev,
        ...p.constraints
      }));
    }
    const catObj = CATEGORIES.find((c) => c.id === p.category);
    const activeCurrCode = detectedCurr || currency;
    const currLabel = CURRENCY_CONFIG[activeCurrCode]?.symbol || '₹';
    setNlFeedback(
      `Auto-built "${p.title}" with ${p.options?.length || 2} tailored options (${catObj?.title || p.category} • Currency: ${currLabel} ${activeCurrCode})! Review below or click Simulate.`
    );
  };

  const handleParseNaturalLanguage = async (customText = null) => {
    const textToParse = (typeof customText === 'string' ? customText : nlPrompt).trim();
    if (!textToParse) return;
    setNlLoading(true);
    setNlFeedback('');
    setError('');
    const localCompiled = compilePromptLocally(textToParse);
    try {
      const res = await api.post('/scenarios/parse-nl', { promptText: textToParse });
      const serverDraft = res.data?.parsedScenario || res.data?.draft;
      // Use localCompiled when server is running an older build that doesn't return explicitZeroSalary/currency
      if (res.data?.success && serverDraft && serverDraft.currency) {
        applyParsedScenario(serverDraft, textToParse);
      } else {
        applyParsedScenario(localCompiled, textToParse);
      }
    } catch (err) {
      applyParsedScenario(localCompiled, textToParse);
    } finally {
      setNlLoading(false);
    }
  };

  const totalWeight = Object.values(goalWeights).reduce((a, b) => Number(a) + Number(b), 0);

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([
      ...options,
      {
        title: `Option ${String.fromCharCode(65 + options.length)}`,
        description: '',
        attributes: assignCostForCategory(0, category, {
          offeredSalary: 1200000,
          explicitZeroSalary: false,
          currency,
          workLifeBalanceRating: 7
        })
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

  const getOptionCost = (opt) => {
    const a = opt?.attributes || {};
    return Number(a.tuitionCost || a.initialInvestment || a.courseCost || 0);
  };

  const handleOptionCostChange = (index, rawCostValue) => {
    const numVal = Math.max(0, Number(rawCostValue) || 0);
    const updated = [...options];
    updated[index].attributes = {
      ...updated[index].attributes,
      ...assignCostForCategory(numVal, category)
    };
    setOptions(updated);
  };

  const handleOptionSalaryChange = (index, rawSalaryValue) => {
    const numVal = Math.max(0, Number(rawSalaryValue) || 0);
    const updated = [...options];
    updated[index].attributes = {
      ...updated[index].attributes,
      offeredSalary: numVal,
      explicitZeroSalary: numVal === 0
    };
    setOptions(updated);
  };

  const handleWeightChange = (key, val) => {
    setGoalWeights((prev) => ({ ...prev, [key]: Number(val) }));
  };

  const handleAutoBalance = () => {
    const currentTotal = Object.values(goalWeights).reduce((a, b) => Number(a) + Number(b), 0);
    if (currentTotal === 0) return;
    const keys = Object.keys(goalWeights);
    let newWeights = {};
    let accumulated = 0;
    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        newWeights[key] = Math.max(0, 100 - accumulated);
      } else {
        const raw = Math.round((goalWeights[key] / currentTotal) * 100);
        newWeights[key] = raw;
        accumulated += raw;
      }
    });
    setGoalWeights(newWeights);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
        try {
          await api.post(`/simulations/run/${scenarioId}`);
        } catch (simErr) {
          console.warn('Simulation auto-run warning:', simErr);
        }
        navigate(`/scenarios/${scenarioId}`);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      if (serverMsg) {
        setError(serverMsg);
      } else if (!err.response || err.message?.includes('Network Error')) {
        setError('Cannot connect to the DecisionTwin backend (Port 5000). Please ensure DecisionTwin-Start.bat is running.');
      } else {
        setError(err.message || 'Failed to create and simulate scenario.');
      }
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
          <span>Decision Modeling Wizard (REQ-8 to REQ-18) • 8 Life & Career Domains</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Create New Decision Scenario</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Define multiple alternative paths, set your weighted personal priorities, and configure hard financial constraints — or describe your dilemma in plain English below.
        </p>
      </div>

      {/* Natural-Language Scenario Architect (Nexus Innovation) */}
      <div className="bg-slate-900 border border-brand-500/30 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-brand-400" />
              Natural-Language Scenario Architect (Instant Auto-Compiler)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Describe your decision in one sentence to extract options, financial figures, and priorities automatically.
            </p>
          </div>

          {/* Active Currency Selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 self-start sm:self-auto">
            {['INR', 'USD', 'EUR', 'JPY', 'GBP'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => handleCurrencyChange(code)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  currency === code
                    ? 'bg-brand-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Display values in ${CURRENCY_CONFIG[code]?.label}`}
              >
                {CURRENCY_CONFIG[code]?.symbol} {code}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={nlPrompt}
            onChange={(e) => setNlPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleParseNaturalLanguage();
              }
            }}
            placeholder="e.g. Deciding between ₹16L Full-Time MBA vs ₹20L Product Manager Offer vs ₹4L Executive AI Bootcamp"
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
          />
          <button
            type="button"
            onClick={() => handleParseNaturalLanguage()}
            disabled={nlLoading || !nlPrompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs hover:bg-brand-400 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Wand2 className="w-4 h-4" />
            <span>{nlLoading ? 'Compiling...' : 'Auto-Build Scenario'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-slate-500 font-semibold">Quick Presets:</span>
          {[
            'Deciding between ₹16L Full-Time MBA vs ₹20L Product Manager Offer vs ₹4L Executive AI Bootcamp',
            'Choosing between Senior Software Engineer at ₹24L vs AI Startup Founding Engineer at ₹18L',
            'Relocating to Germany with €85k offer vs staying in Bengaluru at €30k'
          ].map((sample, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onClick={() => {
                setNlPrompt(sample);
                handleParseNaturalLanguage(sample);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-brand-500/40 hover:text-brand-300 transition-all cursor-pointer"
            >
              {sample.length > 56 ? `${sample.slice(0, 56)}...` : sample}
            </button>
          ))}
        </div>

        {nlFeedback && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{nlFeedback}</span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || Math.round(totalWeight) !== 100}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto cursor-pointer"
              >
                <span>{loading ? 'Simulating...' : 'Simulate Compiled Scenario Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {options.map((o, idx) => {
                const optCost = getOptionCost(o);
                const optSal = Number(o.attributes?.offeredSalary || 0);
                return (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-emerald-500/30 text-slate-200 text-[11px] font-medium"
                  >
                    {o.title} • Salary: {formatINR(optSal, currency)} • Cost: {formatINR(optCost, currency)}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!isTwinComplete && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>
              <strong>Digital Twin Incomplete:</strong> Business Rule BR-1 requires you to complete your profile before running simulations.
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 whitespace-nowrap self-start sm:self-auto"
          >
            Complete Profile &rarr;
          </button>
        </div>
      )}

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
            Select Decision Category (8 Specialized Frameworks)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
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
            {options.map((opt, idx) => {
              const currentCost = getOptionCost(opt);
              const currentSalary = Number(opt.attributes?.offeredSalary ?? 0);
              return (
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

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Upfront Cost / Tuition / Capital ({formatINR(currentCost, currency)})
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={currentCost}
                        onChange={(e) => handleOptionCostChange(idx, e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Offered / Expected Annual Salary ({formatINR(currentSalary, currency)})
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={currentSalary}
                        onChange={(e) => handleOptionSalaryChange(idx, e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    {category === 'relocation' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                          Target City / Country
                        </label>
                        <input
                          type="text"
                          value={opt.attributes.targetCity || ''}
                          onChange={(e) => handleAttributeChange(idx, 'targetCity', e.target.value)}
                          placeholder="e.g. Bengaluru, Germany, USA"
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
              );
            })}
          </div>
        </div>

        {/* 3. Goal Weights & Constraints (REQ-14, REQ-15, REQ-16, BR-3) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center font-mono">3</span>
              Personal Goal Priorities & Weights
            </h2>
            <div className="flex items-center gap-2.5">
              {Math.round(totalWeight) !== 100 && (
                <button
                  type="button"
                  onClick={handleAutoBalance}
                  className="px-3 py-1 text-xs rounded-full bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 transition-all flex items-center gap-1.5 font-semibold"
                  title="Scale all weights proportionally to equal exactly 100%"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Auto-Balance to 100%</span>
                </button>
              )}
              <div className={`text-xs px-3 py-1 rounded-full font-bold font-mono border ${
                Math.round(totalWeight) === 100
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
              }`}>
                Total Weight: {totalWeight}% / 100%
              </div>
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

          {/* All 5 Hard Constraints (REQ-16) */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">5 Hard Decision Constraints (REQ-16 & REQ-17)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Max Acceptable Budget Limit ({formatINR(Number(constraints.maxBudget || 0))})</label>
                <input
                  type="number"
                  step="any"
                  value={constraints.maxBudget}
                  onChange={(e) => setConstraints(c => ({ ...c, maxBudget: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2 bg-slate-850 border border-slate-750 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Minimum Target Salary ({formatINR(Number(constraints.minAcceptableSalary || 0))})</label>
                <input
                  type="number"
                  step="any"
                  value={constraints.minAcceptableSalary}
                  onChange={(e) => setConstraints(c => ({ ...c, minAcceptableSalary: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2 bg-slate-850 border border-slate-750 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Max Acceptable Debt ({formatINR(Number(constraints.maxAcceptableDebt || 0))})</label>
                <input
                  type="number"
                  step="any"
                  value={constraints.maxAcceptableDebt ?? 1000000}
                  onChange={(e) => setConstraints(c => ({ ...c, maxAcceptableDebt: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2 bg-slate-850 border border-slate-750 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Max Duration / Lock-in (Months)</label>
                <input
                  type="number"
                  min={1}
                  value={constraints.maxDurationMonths ?? 36}
                  onChange={(e) => setConstraints(c => ({ ...c, maxDurationMonths: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2 bg-slate-850 border border-slate-750 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Required Location (Optional)</label>
                <input
                  type="text"
                  value={constraints.requiredLocation || ''}
                  onChange={(e) => setConstraints(c => ({ ...c, requiredLocation: e.target.value }))}
                  placeholder="e.g. Bengaluru or leave blank"
                  className="w-full px-3.5 py-2 bg-slate-850 border border-slate-750 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          {Math.round(totalWeight) !== 100 ? (
            <div className="text-xs text-rose-400 flex items-center gap-1.5 font-medium bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Button activates when Total Weight is 100% (currently {totalWeight}%). Adjust sliders or click "Auto-Balance to 100%".</span>
            </div>
          ) : (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Goal priorities equal 100% (BR-3 satisfied). Ready to simulate!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || Math.round(totalWeight) !== 100}
            className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 text-slate-950 font-bold text-sm hover:from-brand-400 hover:to-emerald-400 shadow-xl shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap self-end sm:self-auto"
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
