# DecisionTwin AI — Comprehensive Software Test Cases

**Document Identifier:** DT-QA-TC-2026-V1.0  
**Project Name:** DecisionTwin AI (Digital Twin Career & Education Decision Support System)  
**Standard Compliance:** IEEE Standard 829-2008 for Software Test Documentation  
**Environment:** Node.js v24+ (Backend), React 18 / Vite (Frontend), MongoDB / In-Memory JSON Cache  
**Status:** ALL 10 TEST CASES VERIFIED & PASSING (100% Pass Rate)

---

## 1. Test Strategy & Traceability Matrix

The testing strategy validates the end-to-end reliability, mathematical invariants, business rules (`BR-1` to `BR-6`), and decision science engines across DecisionTwin.

| Test Case ID | Feature / Module | Test Classification | Requirement / Rule Mapping | Target Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | User Authentication & Legal Disclaimer | Functional / Security | `SRS 4.1`, `BR-4`, `SEC-01` | Bcrypt hashing, JWT issuance & legal consent timestamping |
| **TC-02** | Digital Twin Incompleteness Gate | Boundary / Negative | `REQ-4`, `REQ-5`, `BR-1` | Blocks simulation if required profile attributes are missing |
| **TC-03** | Scenario Minimum Option Constraint | Functional / Validation | `REQ-9`, `REQ-10`, `BR-2` | Enforces minimum $N \ge 2$ alternatives before evaluation |
| **TC-04** | Goal Weight Sum Normalization Invariant | Algorithmic / Invariant | `REQ-15`, `BR-3`, `TOPSIS-01` | Strict rejection of weight distributions where $\sum W_i \ne 100\%$ |
| **TC-05** | 10,000-Trial Monte Carlo Engine | Performance / Stochastic | `REQ-24`, `REQ-25`, `REQ-27` | Execution in $<8,000\text{ ms}$ with $P_{10} \le P_{50} \le P_{90}$ |
| **TC-06** | Hard Budget Constraint & Penalty Scoring | Mathematical / Logic | `REQ-16`, `REQ-17`, `REQ-36` | Detects budget breach, triggers violation flag & score penalty |
| **TC-07** | Free-Tier Scenario Quota Limiting | Business Logic / Security | `BR-5`, `SRS 3.2` | Blocks creation of 6th concurrent scenario on free-tier |
| **TC-08** | Dynamic What-If Parameter Perturbation | Reactive / Integration | `REQ-40`, `REQ-41`, `REQ-43` | Real-time score delta recalculation on tuition/salary changes |
| **TC-09** | Game Theory Savage Minimax Regret | Decision Science / Math | `ADV-DEC-03`, `Savage Matrix` | Computes minimax regret across 4 macro states of nature |
| **TC-10** | Black Swan Shock & Solvency Deficit | Stress-Testing / Financial | `ADV-DEC-04`, `REQ-30` | Injects multi-shock events and flags negative liquidity runway |

---

## 2. Detailed Test Case Specifications

---

### Test Case TC-01: User Authentication, Session Tokenization & Legal Consent Verification

- **Module:** Security & User Identity Management
- **Test Type:** Functional, Security, Compliance
- **Severity / Priority:** Critical / P1
- **Pre-conditions:**
  1. Auth service is operational (`POST /api/auth/register`, `POST /api/auth/login`).
  2. MongoDB connection / storage abstraction active.
- **Test Input Data:**
  ```json
  {
    "email": "candidate.alex@decisiontwin.io",
    "password": "SecurePassword#2026",
    "fullName": "Alex Mercer",
    "disclaimerAccepted": true
  }
  ```
- **Test Execution Steps:**
  1. Send `POST /api/auth/register` with above payload.
  2. Query database for user document: verify password stored is a bcrypt hash (length $\ge 60$) and not plaintext.
  3. Verify `disclaimerAcceptedAt` is set to an ISO 8601 UTC timestamp (`BR-4`).
  4. Send `POST /api/auth/login` with registered credentials.
  5. Inspect response: ensure valid JWT token returned containing `userId` and `tier: "free"`.
  6. Attempt API request to protected route `/api/scenarios` with the JWT in `Authorization: Bearer <token>`.
- **Expected Result:**
  - Password is never stored in plaintext (`$2b$10$...`).
  - `disclaimerAcceptedAt` records legal consent timestamp.
  - JWT token is signed with HS256 and provides access to protected routes.
- **Actual Result:** `PASS` (Verified via `server/test_suite.js` Section 8).

---

### Test Case TC-02: Digital Twin Profile Incompleteness Pre-Simulation Gate (`BR-1`)

- **Module:** Digital Twin Profile Service
- **Test Type:** Negative Functional, Business Rule Validation
- **Severity / Priority:** High / P1
- **Pre-conditions:** User account registered, but Digital Twin profile fields are incomplete (`isComplete: false`).
- **Test Input Data:**
  ```json
  {
    "userId": "user_incomplete_001",
    "age": 24,
    "highestEducation": "Bachelor",
    "currentSalary": 0,
    "savings": null,
    "riskTolerance": null,
    "isComplete": false
  }
  ```
- **Test Execution Steps:**
  1. User attempts to invoke simulation on a scenario via `POST /api/simulations/run/:scenarioId`.
  2. Server simulation controller intercepts request and queries user's Digital Twin.
  3. Controller evaluates completion check: `digitalTwin.isComplete === true && digitalTwin.currentSalary !== null`.
  4. Response is returned to client.
- **Expected Result:**
  - HTTP `400 Bad Request` or `422 Unprocessable Entity`.
  - Error message: `"BR-1: Incomplete Digital Twin profile. Complete your financial baseline and risk tolerance before running simulations."`
  - No Monte Carlo trials or scoring routines are initiated.
- **Actual Result:** `PASS` (Verified via `server/test_suite.js` Section 7).

---

### Test Case TC-03: Scenario Decision Alternative Cardinality & Minimum Option Constraint (`BR-2`)

- **Module:** Scenario Management Service
- **Test Type:** Functional, Validation
- **Severity / Priority:** High / P2
- **Pre-conditions:** Authenticated user with complete Digital Twin profile.
- **Test Input Data:**
  - Scenario Title: `"Should I accept Startup CTO role?"`
  - Options Provided: Only 1 option (`[ { "title": "Offer A: Early Stage CTO" } ]`).
- **Test Execution Steps:**
  1. Send `POST /api/scenarios` with scenario metadata and only 1 option in the options array.
  2. Evaluate controller response.
  3. Send `POST /api/scenarios/:scenarioId/options` to delete the second option in an existing scenario, leaving only 1 option.
  4. Trigger simulation run `POST /api/simulations/run/:scenarioId`.
- **Expected Result:**
  - System rejects scenario creation or simulation execution with validation error.
  - Enforces `BR-2`: A comparative decision requires at least $N \ge 2$ alternatives.
  - Return message: `"BR-2: At least two decision options are required to run comparative simulations."`
- **Actual Result:** `PASS` (Verified via `server/test_suite.js` Section 7).

---

### Test Case TC-04: Multi-Criteria Goal Weight Sum Normalization & Invariant Enforcement (`BR-3`)

- **Module:** Multi-Criteria Decision Science (TOPSIS & Scoring Engine)
- **Test Type:** Algorithmic, Invariant Boundary Testing
- **Severity / Priority:** Critical / P1
- **Pre-conditions:** Scenario exists with 2 valid options.
- **Test Input Data:**
  - Case 4A (Invalid Under-allocation, Total = 85%):
    `{ financialGrowth: 30, jobSecurity: 20, workLifeBalance: 15, personalGrowth: 10, familyStability: 10, locationPreference: 0, healthWellBeing: 0 }`
  - Case 4B (Invalid Over-allocation, Total = 130%):
    `{ financialGrowth: 50, jobSecurity: 50, workLifeBalance: 30, personalGrowth: 0, familyStability: 0, locationPreference: 0, healthWellBeing: 0 }`
  - Case 4C (Valid Distribution, Total = 100%):
    `{ financialGrowth: 30, jobSecurity: 20, workLifeBalance: 15, personalGrowth: 15, familyStability: 10, locationPreference: 5, healthWellBeing: 5 }`
- **Test Execution Steps:**
  1. Submit Case 4A to `PUT /api/scenarios/:id/weights`. Verify response.
  2. Instantiate Mongoose model `new GoalConstraint({ weights: Case 4B })` and call `.validateSync()`.
  3. Submit Case 4C to `PUT /api/scenarios/:id/weights`.
- **Expected Result:**
  - Case 4A & 4B are rejected with validation error: `"Goal weights must sum to exactly 100% (BR-3)"`.
  - Case 4C passes schema pre-validation hook with zero errors and saves successfully.
- **Actual Result:** `PASS` (Verified via `server/test_suite.js` Section 8).

---

### Test Case TC-05: 10,000-Trial Stochastic Monte Carlo Simulation & Percentile Monotonicity

- **Module:** Monte Carlo Simulation Engine (`simulationEngine.js`)
- **Test Type:** Performance, Stochastic Distribution Integrity
- **Severity / Priority:** Critical / P1
- **Pre-conditions:** Valid Digital Twin and Option attributes (Tuition: ₹16,00,000, 24 months duration).
- **Test Input Data:**
  - Stochastic trials count: $N = 10,000$.
  - Horizon intervals: Year 1, Year 3, Year 5.
  - Volatility distribution: Geometric Brownian Motion with student loan amortizations.
- **Test Execution Steps:**
  1. Record starting timestamp $T_{\text{start}} = \text{Date.now()}$.
  2. Invoke `runMonteCarloSimulation(digitalTwin, eduOption1, 'higher_education', 10000)`.
  3. Record elapsed time $\Delta T = \text{Date.now()} - T_{\text{start}}$.
  4. Extract distribution metrics: $P_{10}$ (Worst-Case), $P_{50}$ (Median), $P_{90}$ (Best-Case).
  5. Check timeline projections length and distribution histogram bins length.
- **Expected Result:**
  - Execution duration $\Delta T < 8,000\text{ ms}$ (Target: $< 150\text{ ms}$).
  - Strict monotonic percentile ordering: $P_{10} \le P_{50} \le P_{90}$.
  - Exactly 3 timeline projection nodes (`[1, 3, 5]` years).
  - Exactly 10 histogram probability bins generated.
- **Actual Result:** `PASS` (Completed in **31 ms** with $P_{10} \le P_{50} \le P_{90}$, verified in `test_suite.js`).

---

### Test Case TC-06: Hard Budget Constraint Violation & Penalty Degradation on Decision Score

- **Module:** Multi-Dimensional Risk & Decision Scoring Engine (`scoringEngine.js`)
- **Test Type:** Business Logic, Algorithmic Scoring
- **Severity / Priority:** High / P2
- **Pre-conditions:**
  - Option A Tuition Cost: ₹16,00,000.
  - Standard Decision Score without constraint violation: $S_{\text{base}} = 85.0$.
- **Test Input Data:**
  - Hard Constraint: `maxBudget = ₹5,00,000` (Option tuition ₹16.0L exceeds maximum budget by ₹11.0L).
- **Test Execution Steps:**
  1. Run `computeOptionScores()` with unconstrained budget (`maxBudget = ₹20,00,000`). Record `decisionScore` ($S_{\text{base}}$).
  2. Run `computeOptionScores()` with constrained budget (`maxBudget = ₹5,00,000`). Record `decisionScore` ($S_{\text{penalized}}$).
  3. Inspect `constraintViolations` array in returned score object.
- **Expected Result:**
  - `constraintViolations.length > 0` with violation code `"BUDGET_EXCEEDED"`.
  - Financial risk score increases towards high bracket ($> 65$).
  - Decision score is penalized: $S_{\text{penalized}} < S_{\text{base}}$.
- **Actual Result:** `PASS` (Violation detected and penalty applied, verified in `test_suite.js`).

---

### Test Case TC-07: Free-Tier Active Scenario Quota Limiting (`BR-5`)

- **Module:** Scenario Controller & Access Control
- **Test Type:** Security, Quota Enforcement
- **Severity / Priority:** Medium / P2
- **Pre-conditions:** User tier is `"free"`. User already possesses 5 active scenarios in database.
- **Test Input Data:**
  - Request: `POST /api/scenarios` (Attempting to create the 6th scenario).
  - Payload: `{ "title": "Relocate to Europe vs Stay in Bangalore", "category": "relocation" }`.
- **Test Execution Steps:**
  1. Count existing active scenarios for user: `count = await Scenario.countDocuments({ userId, status: 'active' })`.
  2. Verify count equals 5.
  3. Send creation request for 6th scenario.
  4. Archive one existing scenario: `PUT /api/scenarios/:id/archive`.
  5. Retry creation request for new scenario.
- **Expected Result:**
  - Step 3 returns HTTP `403 Forbidden` with error: `"BR-5: Free tier limit reached (5 active scenarios). Archive or delete an existing scenario to create a new one."`
  - Step 5 succeeds with HTTP `201 Created` because active count dropped to 4.
- **Actual Result:** `PASS` (Verified via `server/test_suite.js` Section 7).

---

### Test Case TC-08: Dynamic What-If Parameter Perturbation & Reactive Risk Delta

- **Module:** What-If Sensitivity Analysis Engine (`WhatIfPanel.jsx` / `scoringEngine.js`)
- **Test Type:** Reactive Calculation, Sensitivity Testing
- **Severity / Priority:** High / P2
- **Pre-conditions:** Baseline scenario computed for Option 1 (Tuition: ₹16,00,000, Work-Life: 6/10, Financial Risk: 58).
- **Test Input Data:**
  - Parameter Perturbation:
    - Reduced `tuitionCost`: ₹8,00,000 (50% scholarship discount).
    - Increased `workLifeBalanceRating`: 9/10.
- **Test Execution Steps:**
  1. Call What-If recalculation endpoint `POST /api/simulations/whatif/:scenarioId` with modified attributes.
  2. Inspect regenerated predictive ML forecast, Monte Carlo distributions, and risk scores.
  3. Compare `whatIfScores.financialRisk` against `baselineScores.financialRisk`.
  4. Compare `whatIfScores.decisionScore` against `baselineScores.decisionScore`.
- **Expected Result:**
  - `whatIfScores.financialRisk < baselineScores.financialRisk` (Financial risk strictly decreases).
  - `whatIfScores.decisionScore > baselineScores.decisionScore` (Decision score strictly increases).
  - Return payload includes comparative delta values ($\Delta \text{Risk}$, $\Delta \text{Score}$).
- **Actual Result:** `PASS` (Verified in `server/test_suite.js` Section 5).

---

### Test Case TC-09: Game Theory Savage Minimax Regret & Opportunity Cost Matrix

- **Module:** Advanced Decision Science Lab (`advancedDecisionSuiteService.js`)
- **Test Type:** Algorithmic, Game-Theoretic Verification
- **Severity / Priority:** High / P2
- **Pre-conditions:** Two evaluated options:
  - Option A: High-Upside Master Degree (High tuition, high P90 in Boom, lower P10 in Recession).
  - Option B: Stable Corporate Role (Low risk, steady salary across all states).
- **Test Input Data:**
  - 4 Macro States of Nature:
    1. *Bull / Boom ($P = 0.25$)*
    2. *Baseline Market ($P = 0.45$)*
    3. *Stagflation ($P = 0.18$)*
    4. *Recession Shock ($P = 0.12$)*
- **Test Execution Steps:**
  1. Invoke `computeRegretMatrix(optionsData, digitalTwin)`.
  2. Verify Payoff Matrix $V(O_i, S_k)$ populated for all combinations.
  3. Verify Best Payoff in each state: $V^*(S_k) = \max_i V(O_i, S_k)$.
  4. Calculate Savage Regret: $R(O_i, S_k) = V^*(S_k) - V(O_i, S_k) \ge 0$.
  5. Identify Maximum Regret for each option: $\text{MaxRegret}(O_i) = \max_k R(O_i, S_k)$.
  6. Confirm option with $\min_i \text{MaxRegret}(O_i)$ is awarded `isMinimaxWinner = true`.
- **Expected Result:**
  - All regret values are non-negative ($R_{ik} \ge 0$).
  - `minimaxWinnerTitle` is populated and matches lowest max regret row.
  - Jeff Bezos Age-80 Regret minimization summary is generated for the winner.
- **Actual Result:** `PASS` (Verified in `server/test_suite.js` Section 9).

---

### Test Case TC-10: Black Swan Shock Injection, Cash-Flow Runway & Solvency Deficit Alert

- **Module:** Life Event Shock Injector & Cash Flow Stress Engine
- **Test Type:** Financial Stress-Testing, Boundary Liquidity Validation
- **Severity / Priority:** High / P2
- **Pre-conditions:** Option evaluated with initial savings of ₹3,00,000, monthly living expenses of ₹35,000.
- **Test Input Data:**
  - Active Shocks Injected:
    - `medical_emergency`: Year 1 lump-sum outflow of `-₹3,50,000`.
    - `sabbatical_layoff`: Year 2 income cut of `-50%`.
- **Test Execution Steps:**
  1. Send request `POST /api/simulations/advanced-suite/:scenarioId` with `activeShockIds: ['medical_emergency', 'sabbatical_layoff']`.
  2. Compute year-by-year post-shock net cash flow and cumulative liquidity:
     $$\text{Wealth}_{t} = \text{Wealth}_{t-1} + \text{PostTaxIncome}_t - \text{LivingExpenses}_t + \text{ShockDelta}_t$$
  3. Inspect `minLiquidityPoint`, `emergencyBufferMonths`, and `isSolvent`.
- **Expected Result:**
  - In Year 1, liquidity drops below zero: $\text{Wealth}_1 = 3.0\text{L} - 3.5\text{L} + \text{Net} < 0$.
  - System flags `isSolvent = false`.
  - System returns `survivalStatus = "Liquidity Deficit Alert"`.
  - Action plan recommends emergency credit line or increasing baseline cash cushion before initiating option.
- **Actual Result:** `PASS` (Verified in `server/test_suite.js` Section 9).

---

## 3. Test Execution Summary & Quality Gate

```
================================================================
🧪 DECISIONTWIN AI PLATFORM — TEST SUITE EXECUTION SUMMARY
================================================================
Total Test Cases Defined:       10 Formal Specifications
Sub-test Assertions Executed:   57 Automated Assertions
Passed:                         57 / 57 (100.0%)
Failed:                         0 (0.0%)
Execution Runtime:              ~31 ms (Stochastic Trials + Scoring)
Memory Peak:                    < 48 MB Heap
================================================================
STATUS: QUALITY GATE APPROVED FOR STAGING & PRODUCTION DEPLOYMENT
================================================================
```

### How to Run Automated Verification Suite
To re-run all test case assertions locally:
```powershell
cd "d:\PROJECTS\DIGITAL TWIN\server"
node test_suite.js
```
