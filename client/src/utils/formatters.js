// Currency and data formatters (SRS Section 6.2 - INR ₹ default formatting)

export const formatINR = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 10000000) {
    return `${amount < 0 ? '-' : ''}₹${(absAmount / 10000000).toFixed(2)} Cr`;
  }
  if (absAmount >= 100000) {
    return `${amount < 0 ? '-' : ''}₹${(absAmount / 100000).toFixed(2)} Lakh`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
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
