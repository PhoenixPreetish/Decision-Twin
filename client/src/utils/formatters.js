// Currency, multiplier (k, M, B, T, Lakh, Cr), and data formatters

export const CURRENCY_CONFIG = {
  INR: { code: 'INR', symbol: '₹', label: '₹ INR (Rupees)', locale: 'en-IN', useIndianGrouping: true },
  USD: { code: 'USD', symbol: '$', label: '$ USD (Dollars)', locale: 'en-US', useIndianGrouping: false },
  EUR: { code: 'EUR', symbol: '€', label: '€ EUR (Euros)', locale: 'de-DE', useIndianGrouping: false },
  JPY: { code: 'JPY', symbol: '¥', label: '¥ JPY (Yen)', locale: 'ja-JP', useIndianGrouping: false },
  GBP: { code: 'GBP', symbol: '£', label: '£ GBP (Pounds)', locale: 'en-GB', useIndianGrouping: false },
  AED: { code: 'AED', symbol: 'AED ', label: 'AED (Dirhams)', locale: 'en-AE', useIndianGrouping: false },
  SGD: { code: 'SGD', symbol: 'S$', label: 'S$ SGD (Singapore)', locale: 'en-SG', useIndianGrouping: false },
  CAD: { code: 'CAD', symbol: 'C$', label: 'C$ CAD (Canadian)', locale: 'en-CA', useIndianGrouping: false },
  AUD: { code: 'AUD', symbol: 'A$', label: 'A$ AUD (Australian)', locale: 'en-AU', useIndianGrouping: false }
};

export const getActiveCurrency = () => {
  try {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('dt_currency') : null;
    if (saved && CURRENCY_CONFIG[saved]) return saved;
  } catch (_) {
    // ignore storage errors
  }
  return 'INR';
};

export const setActiveCurrency = (currencyCode) => {
  const code = (currencyCode || 'INR').toUpperCase();
  if (!CURRENCY_CONFIG[code]) return 'INR';
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dt_currency', code);
      window.dispatchEvent(new CustomEvent('dt-currency-change', { detail: code }));
    }
  } catch (_) {
    // ignore storage errors
  }
  return code;
};

export const detectCurrencyFromText = (text = '') => {
  const s = String(text || '');
  if (/€|\beuros?\b|\beur\b/i.test(s)) return 'EUR';
  if (/¥|\byen\b|\bjpy\b/i.test(s)) return 'JPY';
  if (/£|\bpounds?\b|\bgbp\b|\bsterling\b/i.test(s)) return 'GBP';
  if (/\baed\b|\bdirhams?\b/i.test(s)) return 'AED';
  if (/\bsgd\b|\bs\$/i.test(s)) return 'SGD';
  if (/\bcad\b|\bc\$/i.test(s)) return 'CAD';
  if (/\baud\b|\ba\$/i.test(s)) return 'AUD';
  if (/\$|\bdollars?\b|\busd\b|\bbucks?\b/i.test(s)) return 'USD';
  if (/₹|\brupees?\b|\binr\b|\brs\.?\b|\blakhs?\b|\blpa\b|\bcrores?\b/i.test(s)) return 'INR';
  return null;
};

/**
 * Multipliers supported:
 *   k / thousand / grand  -> 1e3
 *   l / lakh / lpa        -> 1e5
 *   m / mn / mil / million-> 1e6
 *   cr / crore            -> 1e7
 *   b / bn / bil / billion-> 1e9
 *   t / tn / trillion     -> 1e12
 */
export const getUnitMultiplier = (unitStr = '') => {
  const u = String(unitStr || '').trim().toLowerCase();
  if (!u) return 1;
  if (/^(t|tn|trillions?)$/.test(u)) return 1e12;
  if (/^(b|bn|bil|billions?)$/.test(u)) return 1e9;
  if (/^(cr|crores?)$/.test(u)) return 1e7;
  if (/^(m|mn|mil|mill|millions?)$/.test(u)) return 1e6;
  if (/^(l|lac|lacs|lakh|lakhs|lpa)$/.test(u)) return 1e5;
  if (/^(k|thousands?|grand)$/.test(u)) return 1e3;
  if (/^(h|hundreds?)$/.test(u)) return 1e2;
  return 1;
};

export const parseShorthandAmount = (input) => {
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0;
  const raw = String(input ?? '').trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/,/g, '').replace(/^[^\d\-+.]+/, '');
  const match = cleaned.match(/^([+-]?\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  if (!Number.isFinite(num)) return 0;
  const mult = getUnitMultiplier(match[2] || '');
  return Math.round(num * mult);
};

export const formatINR = (amount, currencyOverride = null) => {
  const code = (currencyOverride || getActiveCurrency() || 'INR').toUpperCase();
  const cfg = CURRENCY_CONFIG[code] || CURRENCY_CONFIG.INR;
  const sym = cfg.symbol;

  if (amount === undefined || amount === null || isNaN(amount)) return `${sym}0`;
  const num = Number(amount);
  const absAmount = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  // Trillions & Billions apply universally
  if (absAmount >= 1e12) {
    return `${sign}${sym}${(absAmount / 1e12).toFixed(2)}T`;
  }
  if (absAmount >= 1e9) {
    return `${sign}${sym}${(absAmount / 1e9).toFixed(2)}B`;
  }

  if (cfg.useIndianGrouping) {
    if (absAmount >= 1e7) {
      return `${sign}${sym}${(absAmount / 1e7).toFixed(2)} Cr`;
    }
    if (absAmount >= 1e5) {
      return `${sign}${sym}${(absAmount / 1e5).toFixed(2)} Lakh`;
    }
    return `${sign}${sym}${Math.round(absAmount).toLocaleString('en-IN')}`;
  }

  // International grouping (USD $, EUR €, JPY ¥, GBP £, etc.)
  if (absAmount >= 1e6) {
    return `${sign}${sym}${(absAmount / 1e6).toFixed(2)}M`;
  }
  return `${sign}${sym}${Math.round(absAmount).toLocaleString('en-US')}`;
};

export const formatPercent = (val) => {
  if (val === undefined || val === null) return '0%';
  return `${Number(val).toFixed(1)}%`;
};

export const getRiskColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'low':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'medium':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'high':
      return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    default:
      return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  }
};

