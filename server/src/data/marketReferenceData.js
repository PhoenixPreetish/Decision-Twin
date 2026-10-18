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
  },

  degreeRoiBenchmarks: [
    { program: 'Tier-1 Executive MBA (IIM / ISB)', avgCostINR: 2800000, avgStartingSalaryINR: 3200000, avgBreakEvenYears: 2.4, employmentRate: 0.98 },
    { program: 'Top US STEM MS in Computer Science', avgCostINR: 5200000, avgStartingSalaryINR: 9600000, avgBreakEvenYears: 1.8, employmentRate: 0.91 },
    { program: 'Domestic Tier-1 M.Tech / MS (IIT / IISc)', avgCostINR: 450000, avgStartingSalaryINR: 2100000, avgBreakEvenYears: 0.8, employmentRate: 0.96 },
    { program: 'Executive Weekend / Part-Time Masters', avgCostINR: 900000, avgStartingSalaryINR: 2400000, avgBreakEvenYears: 1.2, employmentRate: 0.89 },
    { program: 'Advanced AI/ML Professional Nanodegree', avgCostINR: 150000, avgStartingSalaryINR: 1750000, avgBreakEvenYears: 0.4, employmentRate: 0.84 }
  ],

  startupBenchmarks: {
    b2bSaaS: { medianTimeToRevenueMonths: 8, seedSuccessRate: 0.32, expectedEquityDilutionPerRound: 0.20 },
    aiAgentPlatform: { medianTimeToRevenueMonths: 5, seedSuccessRate: 0.41, expectedEquityDilutionPerRound: 0.18 },
    d2cConsumer: { medianTimeToRevenueMonths: 11, seedSuccessRate: 0.22, expectedEquityDilutionPerRound: 0.25 }
  },

  stressTestingProfiles: {
    recession: {
      name: 'Tech Recession & Hiring Freeze (2026-2027)',
      description: 'Simulates a 25% drop in lateral tech hiring, hiring freezes at tier-1 firms, and +15% salary dispersion.',
      growthMultiplier: 0.65,
      volatilityMultiplier: 1.45,
      riskPenalty: 18
    },
    high_inflation: {
      name: 'Persistent Stagflation & Loan Rate Surge',
      description: 'Inflation stays elevated at 8.2% annually, increasing living expenses and educational debt service costs by 22%.',
      inflationRate: 0.082,
      debtCostMultiplier: 1.22,
      riskPenalty: 14
    },
    ai_boom: {
      name: 'AI Productivity Supercycle & Startup Boom',
      description: 'Massive venture capital inflow and premium salary multipliers for technical and AI-native skillsets.',
      growthMultiplier: 1.40,
      volatilityMultiplier: 1.15,
      riskPenalty: -8
    },
    emergency_shock: {
      name: 'Black Swan Emergency Liquidity Event',
      description: 'Simulates an unexpected personal, medical, or family emergency requiring immediate liquid draw of ₹3,50,000.',
      immediateCashShock: 350000,
      riskPenalty: 15
    }
  },

  pppAndTaxByCountry: {
    'India': { effectiveTaxRate: 0.15, pppMultiplier: 1.00, visaRiskPenalty: 0 },
    'USA': { effectiveTaxRate: 0.28, pppMultiplier: 0.38, visaRiskPenalty: 22 },
    'Germany': { effectiveTaxRate: 0.34, pppMultiplier: 0.45, visaRiskPenalty: 12 },
    'UK': { effectiveTaxRate: 0.29, pppMultiplier: 0.42, visaRiskPenalty: 16 },
    'Singapore': { effectiveTaxRate: 0.14, pppMultiplier: 0.48, visaRiskPenalty: 14 },
    'Canada': { effectiveTaxRate: 0.30, pppMultiplier: 0.46, visaRiskPenalty: 15 },
    'UAE': { effectiveTaxRate: 0.00, pppMultiplier: 0.55, visaRiskPenalty: 10 }
  },

  skillOptionalityGraph: {
    'higher_education': {
      requiredSkills: ['Research', 'Analytical Thinking', 'Domain Depth', 'Quantitative Modeling'],
      unlockedAdjacentRoles: 6,
      optionalityScore: 88,
      automationResilience: 91,
      halfLifeYears: 6.5
    },
    'job_selection': {
      requiredSkills: ['System Design', 'Execution', 'Stakeholder Management'],
      unlockedAdjacentRoles: 4,
      optionalityScore: 76,
      automationResilience: 82,
      halfLifeYears: 4.5
    },
    'career_change': {
      requiredSkills: ['Machine Learning', 'Product Strategy', 'Cross-Functional Leadership', 'AI Engineering'],
      unlockedAdjacentRoles: 7,
      optionalityScore: 92,
      automationResilience: 94,
      halfLifeYears: 5.5
    },
    'entrepreneurship': {
      requiredSkills: ['Full-Stack Execution', 'Sales & GTM', 'Capital Allocation', 'Product Discovery'],
      unlockedAdjacentRoles: 8,
      optionalityScore: 95,
      automationResilience: 96,
      halfLifeYears: 8.0
    },
    'investment_planning': {
      requiredSkills: ['Portfolio Risk Management', 'Asset Allocation', 'Tax Optimization'],
      unlockedAdjacentRoles: 3,
      optionalityScore: 72,
      automationResilience: 85,
      halfLifeYears: 10.0
    },
    'relocation': {
      requiredSkills: ['Cross-Cultural Adaptability', 'Global Networking'],
      unlockedAdjacentRoles: 5,
      optionalityScore: 80,
      automationResilience: 84,
      halfLifeYears: 7.0
    },
    'skill_investment': {
      requiredSkills: ['Applied AI/ML', 'Cloud Architecture', 'System Engineering'],
      unlockedAdjacentRoles: 6,
      optionalityScore: 89,
      automationResilience: 93,
      halfLifeYears: 4.0
    },
    'custom_decision': {
      requiredSkills: ['Strategic Planning', 'Risk Management', 'Adaptability'],
      unlockedAdjacentRoles: 4,
      optionalityScore: 78,
      automationResilience: 85,
      halfLifeYears: 5.0
    }
  }
};

