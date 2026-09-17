// Curated Reference Market Data (Version 1.0 - 2026 Edition)
// Used when real-time external APIs are not connected or as fallback
module.exports = {
  version: '1.0.2026',
  effectiveDate: '2026-01-01',
  currency: 'INR',
  
  macroEconomics: {
    baseInflationRate: 0.055, // 5.5% annual
    averageSalaryGrowthRate: 0.085, // 8.5% annual
    marketVolatilityIndex: 0.12 // 12% standard deviation
  },

  salaryBenchmarksByRole: {
    'Software Engineer': { junior: 600000, mid: 1400000, senior: 2800000, lead: 4500000 },
    'Data Scientist': { junior: 700000, mid: 1600000, senior: 3000000, lead: 5000000 },
    'Product Manager': { junior: 800000, mid: 1800000, senior: 3500000, lead: 6000000 },
    'AI/ML Engineer': { junior: 850000, mid: 1900000, senior: 3600000, lead: 5800000 },
    'Business Analyst': { junior: 500000, mid: 1100000, senior: 2200000, lead: 3500000 },
    'Marketing Manager': { junior: 450000, mid: 1000000, senior: 2000000, lead: 3200000 },
    'Financial Analyst': { junior: 550000, mid: 1200000, senior: 2400000, lead: 3800000 },
    'Default': { junior: 450000, mid: 950000, senior: 1800000, lead: 3000000 }
  },

  costOfLivingIndexByCity: {
    'Bengaluru': { colIndex: 115, avgMonthlyRent: 25000 },
    'Mumbai': { colIndex: 135, avgMonthlyRent: 38000 },
    'Delhi NCR': { colIndex: 120, avgMonthlyRent: 28000 },
    'Hyderabad': { colIndex: 105, avgMonthlyRent: 20000 },
    'Chennai': { colIndex: 102, avgMonthlyRent: 19000 },
    'Pune': { colIndex: 104, avgMonthlyRent: 21000 },
    'Tier-2 / Others': { colIndex: 80, avgMonthlyRent: 12000 }
  }
};
