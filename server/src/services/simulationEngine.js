// Monte Carlo Simulation Engine (REQ-24, REQ-25, REQ-26, REQ-27)
// Runs 10,000 randomized stochastic trials per option

// Box-Muller transform for generating standard normal random numbers
function randomNormal(mean = 0, stdev = 1) {
  let u1 = 1 - Math.random();
  let u2 = 1 - Math.random();
  let randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdev * randStdNormal;
}

/**
 * Runs 10,000 Monte Carlo trials for an option
 * @param {Object} digitalTwin User profile
 * @param {Object} option Option details and attributes
 * @param {String} category Scenario category
 * @param {Number} trials Count (default 10,000)
 */
function runMonteCarloSimulation(digitalTwin, option, category, trials = 10000) {
  const baseSalary = option.attributes?.offeredSalary || digitalTwin.currentSalary || 500000;
  const initialCost = (option.attributes?.tuitionCost || 0) + 
                      (option.attributes?.initialInvestment || 0) + 
                      (option.attributes?.relocationCost || 0);

  // Growth rate baseline & volatility depending on risk tolerance & role
  let meanGrowth = 0.09; // 9% average
  let volatility = 0.12; // 12% standard deviation

  if (category === 'entrepreneurship') {
    meanGrowth = 0.18;
    volatility = 0.35;
  } else if (category === 'investment_planning') {
    meanGrowth = 0.13;
    volatility = 0.18;
  } else if (category === 'higher_education') {
    meanGrowth = 0.15; // post graduation jump
    volatility = 0.10;
  }

  const simulatedOutcomes = new Float64Array(trials);
  const year1Trials = new Float64Array(trials);
  const year3Trials = new Float64Array(trials);
  const year5Trials = new Float64Array(trials);

  for (let i = 0; i < trials; i++) {
    // Sample annual shock and inflation
    let inflation = Math.max(0.02, randomNormal(0.055, 0.015));
    let y1Growth = randomNormal(meanGrowth, volatility);
    let y2Growth = randomNormal(meanGrowth, volatility);
    let y3Growth = randomNormal(meanGrowth, volatility);
    let y4Growth = randomNormal(meanGrowth, volatility);
    let y5Growth = randomNormal(meanGrowth, volatility);

    // Year 1 cumulative net value
    let y1Val = baseSalary * (1 + y1Growth - inflation) - (initialCost * 0.4);
    // Year 3 cumulative value
    let y3Val = y1Val * (1 + y2Growth - inflation) * (1 + y3Growth - inflation) - (initialCost * 0.6);
    // Year 5 cumulative value
    let y5Val = y3Val * (1 + y4Growth - inflation) * (1 + y5Growth - inflation);

    year1Trials[i] = y1Val;
    year3Trials[i] = y3Val;
    year5Trials[i] = y5Val;
    simulatedOutcomes[i] = y5Val;
  }

  // Sort array to compute percentiles
  simulatedOutcomes.sort();
  year1Trials.sort();
  year3Trials.sort();
  year5Trials.sort();

  const getPercentile = (arr, p) => {
    const idx = Math.floor(arr.length * (p / 100));
    return Math.round(arr[idx]);
  };

  const p10 = getPercentile(simulatedOutcomes, 10);
  const p50 = getPercentile(simulatedOutcomes, 50);
  const p90 = getPercentile(simulatedOutcomes, 90);

  // Compute Standard Deviation
  let sum = 0;
  for (let i = 0; i < trials; i++) sum += simulatedOutcomes[i];
  let mean = sum / trials;
  let variance = 0;
  for (let i = 0; i < trials; i++) variance += Math.pow(simulatedOutcomes[i] - mean, 2);
  let standardDeviation = Math.round(Math.sqrt(variance / trials));

  // Projected timeline
  const timeline = [
    { year: 1, p10: getPercentile(year1Trials, 10), p50: getPercentile(year1Trials, 50), p90: getPercentile(year1Trials, 90) },
    { year: 3, p10: getPercentile(year3Trials, 10), p50: getPercentile(year3Trials, 50), p90: getPercentile(year3Trials, 90) },
    { year: 5, p10, p50, p90 }
  ];

  // Distribution bins (10 bins for chart visualization)
  const minVal = simulatedOutcomes[0];
  const maxVal = simulatedOutcomes[trials - 1];
  const binSize = (maxVal - minVal) / 10;
  const distributionBins = [];

  for (let b = 0; b < 10; b++) {
    const startRange = minVal + b * binSize;
    const endRange = startRange + binSize;
    let count = 0;
    for (let i = 0; i < trials; i++) {
      if (simulatedOutcomes[i] >= startRange && (b === 9 ? simulatedOutcomes[i] <= endRange : simulatedOutcomes[i] < endRange)) {
        count++;
      }
    }
    distributionBins.push({
      rangeLabel: `₹${(startRange / 100000).toFixed(1)}L - ₹${(endRange / 100000).toFixed(1)}L`,
      count,
      probability: Number((count / trials).toFixed(4))
    });
  }

  return {
    trialsCount: trials,
    percentiles: {
      p10WorstCase: p10,
      p50MedianCase: p50,
      p90BestCase: p90,
      standardDeviation
    },
    timeline,
    distributionBins
  };
}

module.exports = { runMonteCarloSimulation };
