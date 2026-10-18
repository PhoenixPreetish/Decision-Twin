module.exports = [
  {
    id: 'mba_vs_swe',
    category: 'higher_education',
    title: 'Tier-1 MBA (IIM/ISB) vs Senior SWE Promotion',
    description: 'Compare full-time executive MBA management transition against technical IC promotion track at a product company.',
    tags: ['Career Pivot', 'Management', 'ROI Analysis'],
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
      maxBudget: 3500000,
      minAcceptableSalary: 2500000,
      maxAcceptableDebt: 2500000
    },
    options: [
      {
        title: 'Tier-1 1-Year Executive MBA (IIM/ISB)',
        description: 'Full-time intensive general management program with leadership placement pipeline.',
        attributes: {
          tuitionCost: 2800000,
          programDurationMonths: 12,
          offeredSalary: 3400000,
          institutionName: 'IIM / ISB',
          isAccredited: true,
          workLifeBalanceRating: 5
        }
      },
      {
        title: 'Stay at Current Tech Firm + Senior SWE Track',
        description: 'Decline MBA, retain active income, and push for Senior/Lead Engineer promotion within 14 months.',
        attributes: {
          tuitionCost: 0,
          offeredSalary: 2200000,
          companyType: 'MNC',
          workLifeBalanceRating: 8
        }
      },
      {
        title: 'Weekend Hybrid Executive Diploma + Continued Job',
        description: 'Earn credentials while maintaining 100% active salary and emergency savings reserves.',
        attributes: {
          tuitionCost: 900000,
          programDurationMonths: 18,
          offeredSalary: 2500000,
          workLifeBalanceRating: 6
        }
      }
    ]
  },
  {
    id: 'startup_vs_mnc',
    category: 'entrepreneurship',
    title: 'Fintech AI Startup Co-founder vs Big Tech Staff Engineer',
    description: 'High-risk high-reward startup founder equity pathway vs high-cash compensation stability in global MNC.',
    tags: ['Entrepreneurship', 'Equity vs Cash', 'High Stakes'],
    goalWeights: {
      financialGrowth: 35,
      jobSecurity: 15,
      workLifeBalance: 10,
      personalGrowth: 25,
      familyStability: 5,
      locationPreference: 5,
      healthWellBeing: 5
    },
    constraints: {
      maxBudget: 1500000,
      minAcceptableSalary: 1200000,
      maxAcceptableDebt: 800000
    },
    options: [
      {
        title: 'Bootstrap B2B Fintech SaaS as Technical Co-founder',
        description: 'Commit ₹8L seed capital with 18-month runway, building autonomous finance AI agents.',
        attributes: {
          initialInvestment: 800000,
          offeredSalary: 900000,
          expectedRunwayMonths: 18,
          workLifeBalanceRating: 4
        }
      },
      {
        title: 'Staff Software Engineer at US Big Tech (India Hub)',
        description: 'Lead distributed systems architecture with guaranteed quarterly RSU vesting schedule.',
        attributes: {
          initialInvestment: 0,
          offeredSalary: 4200000,
          companyType: 'MNC',
          workLifeBalanceRating: 7
        }
      },
      {
        title: 'Series-A Funded Startup Head of Engineering (1.5% Equity)',
        description: 'Balanced risk profile with competitive cash component plus early equity stake.',
        attributes: {
          initialInvestment: 0,
          offeredSalary: 2800000,
          companyType: 'Startup',
          workLifeBalanceRating: 6
        }
      }
    ]
  },
  {
    id: 'ms_us_vs_india',
    category: 'higher_education',
    title: 'US Masters in AI (STEM) vs Tech Lead in India',
    description: 'International study debt and dollar salary upside vs domestic rapid promotion and local cost-of-living comfort.',
    tags: ['Global Mobility', 'Currency Arbitrage', 'Student Loan'],
    goalWeights: {
      financialGrowth: 30,
      jobSecurity: 20,
      workLifeBalance: 10,
      personalGrowth: 20,
      familyStability: 10,
      locationPreference: 5,
      healthWellBeing: 5
    },
    constraints: {
      maxBudget: 6000000,
      minAcceptableSalary: 2000000,
      maxAcceptableDebt: 5000000
    },
    options: [
      {
        title: 'Top-25 US University MS in Computer Science (AI Track)',
        description: '2-year STEM degree with 3-year OPT work authorization and Silicon Valley tech recruiting.',
        attributes: {
          tuitionCost: 4800000,
          relocationCost: 600000,
          programDurationMonths: 24,
          offeredSalary: 9500000,
          isAccredited: true,
          workLifeBalanceRating: 5
        }
      },
      {
        title: 'Accelerate to Principal Engineer at Global R&D Centre in India',
        description: 'Zero educational debt, immediate home purchase capacity, and close proximity to family.',
        attributes: {
          tuitionCost: 0,
          relocationCost: 0,
          offeredSalary: 3200000,
          companyType: 'MNC',
          workLifeBalanceRating: 8
        }
      }
    ]
  },
  {
    id: 'relocation_bangalore_remote',
    category: 'relocation',
    title: 'Bengaluru Tech Hub Relocation vs Tier-2 Remote Lifestyle',
    description: 'In-person networking and higher base compensation in Bengaluru vs lower cost of living and high savings in Tier-2.',
    tags: ['Cost of Living', 'Relocation', 'Work Life Balance'],
    goalWeights: {
      financialGrowth: 25,
      jobSecurity: 15,
      workLifeBalance: 25,
      personalGrowth: 15,
      familyStability: 10,
      locationPreference: 5,
      healthWellBeing: 5
    },
    constraints: {
      maxBudget: 500000,
      minAcceptableSalary: 1500000
    },
    options: [
      {
        title: 'Relocate to Bengaluru (Onsite / Hybrid Tier-1 Tech Firm)',
        description: 'Work near Outer Ring Road tech parks, access active offline startup community and meetups.',
        attributes: {
          relocationCost: 150000,
          offeredSalary: 2600000,
          targetCity: 'Bengaluru',
          costOfLivingIndex: 115,
          workLifeBalanceRating: 6
        }
      },
      {
        title: 'Permanent Remote Work from Tier-2 City (Home Base)',
        description: 'Retain high savings margin with zero commute, minimal rent, and maximal family proximity.',
        attributes: {
          relocationCost: 0,
          offeredSalary: 1900000,
          targetCity: 'Tier-2 / Others',
          costOfLivingIndex: 80,
          workLifeBalanceRating: 9
        }
      }
    ]
  }
];
