// src/risk.js
function calculateRisk(factors, answers) {
  let score = 0;
  const rationale = [];

  // Risk scoring weights
  const riskWeights = {
    'smoking': 25,
    'poor diet': 15,
    'low exercise': 15,
    'obesity': 20,
    'overweight': 10,
    'advanced age': 15,
    'poor sleep': 10,
    'high fat intake': 12,
    'alcohol consumption': 8
  };

  // Calculate base score from factors
  factors.forEach(factor => {
    const weight = riskWeights[factor] || 5;
    score += weight;
    rationale.push(factor);
  });

  // Age adjustment
  if (answers.age) {
    if (answers.age > 50) {
      score += Math.floor((answers.age - 50) / 5) * 2;
    }
  }

  // Ensure score is within bounds
  score = Math.min(100, Math.max(0, score));

  // Determine risk level
  let riskLevel;
  if (score <= 30) {
    riskLevel = 'low';
  } else if (score <= 60) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return {
    risk_level: riskLevel,
    score,
    rationale: rationale.slice(0, 3) // Limit to top 3 factors
  };
}

module.exports = {
  calculateRisk
};