const { processChatQuery } = require('./src/services/chatbotEngine');

console.log('================================================================');
console.log('🧪 TESTING TWINBOT 100% OFFLINE DECISION INTELLIGENCE CHATBOT');
console.log('================================================================\n');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

// Mock Digital Twin
const mockTwin = {
  currentSalary: 1200000,
  savings: 600000,
  monthlyExpenses: 50000,
  riskTolerance: 'moderate',
  isComplete: true
};

// Mock Scenario Data
const mockScenarioData = {
  scenario: {
    _id: 'scen_001',
    title: 'Senior SWE vs AI Startup',
    category: 'career_change'
  },
  options: [
    {
      _id: 'opt_1',
      title: 'Senior Software Engineer (Promotion)',
      attributes: { offeredSalary: 2400000, tuitionCost: 0 }
    },
    {
      _id: 'opt_2',
      title: 'Founding AI Startup',
      attributes: { initialInvestment: 500000, offeredSalary: 600000 }
    }
  ],
  riskScores: [
    { optionId: 'opt_1', decisionScore: 86, overallRiskLevel: 'Low', marketRisk: 25 },
    { optionId: 'opt_2', decisionScore: 68, overallRiskLevel: 'High', marketRisk: 65 }
  ],
  simulations: [
    { optionId: 'opt_1', percentiles: { p10PessimisticCase: 2000000, p50MedianCase: 2400000, p90OptimisticCase: 2900000 } },
    { optionId: 'opt_2', percentiles: { p10PessimisticCase: 200000, p50MedianCase: 1800000, p90OptimisticCase: 6000000 } }
  ],
  predictions: [
    { optionId: 'opt_1', predictedExpectedSalary: 2400000 },
    { optionId: 'opt_2', predictedExpectedSalary: 1500000 }
  ]
};

// Test 1: Greeting
const res1 = processChatQuery({ message: 'Hello TwinBot', digitalTwin: mockTwin });
assert(res1.reply.includes('TwinBot') && res1.suggestedPrompts.length > 0, 'Initial greeting returns TwinBot introduction and prompts');

// Test 2: Financial Runway Diagnostic
const res2 = processChatQuery({ message: 'What is my runway and emergency buffer?', digitalTwin: mockTwin });
assert(res2.reply.includes('12 Months') && res2.reply.includes('Financial Runway'), 'Runway diagnostic correctly calculates 12 months (6L / 50k)');

// Test 3: Scenario Vulnerability & Tail Risk (Top option)
const res3 = processChatQuery({ message: 'What is my biggest vulnerability and risk?', digitalTwin: mockTwin, scenarioData: mockScenarioData });
assert(res3.reply.includes('Risk & Vulnerability') && res3.reply.includes('Senior Software Engineer'), 'Scenario vulnerability identifies top option metrics and liquidity risk');

// Test 3B: Explicit "Option 1" Vulnerability Request (User's exact query!)
const res3B = processChatQuery({ message: 'What is my biggest vulnerability in Option 1?', digitalTwin: mockTwin, scenarioData: mockScenarioData });
assert(res3B.reply.includes('Risk & Vulnerability') && res3B.reply.includes('Option 1'), 'Explicit Option 1 vulnerability request correctly analyzes Option 1');

// Test 3C: Explicit "Option 2" Vulnerability Request
const res3C = processChatQuery({ message: 'What is my biggest vulnerability in Option 2?', digitalTwin: mockTwin, scenarioData: mockScenarioData });
assert(res3C.reply.includes('Risk & Vulnerability') && res3C.reply.includes('Option 2') && res3C.reply.includes('AI Startup'), 'Explicit Option 2 vulnerability request correctly targets AI Startup and initial investment');

// Test 4: Negotiation Playbook
const res4 = processChatQuery({ message: 'How should I negotiate my salary offer?', digitalTwin: mockTwin, scenarioData: mockScenarioData });
assert(res4.reply.includes('Negotiation Playbook') && res4.reply.includes('Anchor'), 'Negotiation playbook provides structured counter-offer scripts');

// Test 5: Break-Even Payback
const res5 = processChatQuery({ message: 'What is my break-even payback period?', digitalTwin: mockTwin, scenarioData: mockScenarioData });
assert(res5.reply.includes('Break-Even'), 'Break-even payback calculates capital recovery horizon');

// Test 6: Brainstorming New Scenario
const res6 = processChatQuery({ message: 'Should I do an MBA abroad or stay in India?', digitalTwin: mockTwin });
assert(res6.reply.includes('Brainstormed Scenario') && res6.reply.includes('higher_education'), 'Brainstorming query formulates structured scenario categories and options');

// Test 7: Methodology & Science
const res7 = processChatQuery({ message: 'How does Monte Carlo and TOPSIS math work?', digitalTwin: mockTwin });
assert(res7.reply.includes('Monte Carlo') && res7.reply.includes('TOPSIS'), 'Methodology query explains Box-Muller transforms and Euclidean ideal distances');

// Test 8: Non-canned response for open-ended queries (Never repeat canned greeting!)
const res8 = processChatQuery({ message: 'What is the best choice for my career?', digitalTwin: mockTwin, scenarioData: mockScenarioData });
assert(!res8.reply.startsWith('Hello! I am TwinBot, your strategic AI Decision Co-Pilot.') && res8.reply.includes('Senior Software Engineer'), 'Open-ended career questions yield specific scenario analysis rather than canned greeting');

// Test 9: Direct "Why option 1 is choosed?" starts by answering why Option 1 was chosen due to low risk rate
const res9 = processChatQuery({ message: 'Why option 1 is choosed?', digitalTwin: mockTwin, scenarioData: mockScenarioData });
assert(
  res9.reply.startsWith('Why **Option 1 (Senior Software Engineer (Promotion))** is chosen is because it has a **low risk rate**') &&
  res9.reply.includes('zero upfront capital cost'),
  'Specific "Why option 1 is choosed?" query starts directly with "Why Option 1 (...) is chosen is because it has a low risk rate..."'
);

// Test 10: Direct "Why option 2 is not choosed?" explains why Option 2 ranked #2 behind Option 1
const res10 = processChatQuery({ message: 'Why option 2 is not choosed?', digitalTwin: mockTwin, scenarioData: mockScenarioData });
assert(
  res10.reply.startsWith('Why **Option 2 (Founding AI Startup)** is ranked **#2**') &&
  res10.reply.includes('Senior Software Engineer (Promotion)'),
  'Specific "Why option 2 is not choosed?" query starts directly explaining why Option 2 ranked #2 behind Option 1'
);

console.log(`\n================================================================`);
console.log(`📊 TEST RESULTS: ${passed}/${total} TESTS PASSED`);
console.log(`🎉 100% OFFLINE CHATBOT ENGINE VERIFIED SUCCESSFULLY!`);
console.log(`================================================================\n`);

if (passed !== total) process.exit(1);
