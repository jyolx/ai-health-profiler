// src/risk.js
import { createLogger } from './utils/logger.js';

const logger = createLogger('risk');

function calculateRisk(factors, answers) {
  logger.info('Starting risk calculation', {
    factorsCount: factors.length,
    factors: factors,
    hasAgeData: !!answers.age,
    age: answers.age
  });

  let score = 0;
  const rationale = [];

  // Risk scoring weights
  const riskWeights = {
    'smoking': 25,
    'poor diet': 15,
    'low exercise': 15,
    'obesity': 20,
    'overweight': 10,
    'underweight': 12,
    'advanced age': 15,
    'poor sleep': 10,
    'high fat intake': 12,
    'alcohol consumption': 8
  };

  // Calculate base score from factors
  logger.debug('Calculating base score from risk factors');
  factors.forEach(factor => {
    const weight = riskWeights[factor] || 5;
    score += weight;
    rationale.push(factor);
    logger.debug('Applied risk factor to score', {
      factor: factor,
      weight: weight,
      runningScore: score
    });
  });

  logger.debug('Base score calculation completed', {
    baseScore: score,
    factorsApplied: factors.length
  });

  // Age adjustment
  if (answers.age) {
    logger.debug('Applying age adjustment to risk score', { age: answers.age });
    if (answers.age > 50) {
      const ageBonus = Math.floor((answers.age - 50) / 5) * 2;
      score += ageBonus;
      logger.info('Age adjustment applied', {
        age: answers.age,
        ageBonus: ageBonus,
        scoreAfterAgeAdjustment: score
      });
    } else {
      logger.debug('No age adjustment needed - age under 50', { age: answers.age });
    }
  } else {
    logger.debug('Age data not available for age adjustment');
  }

  // Ensure score is within bounds
  const originalScore = score;
  score = Math.min(100, Math.max(0, score));
  
  if (originalScore !== score) {
    logger.debug('Risk score clamped to bounds', {
      originalScore: originalScore,
      clampedScore: score,
      reason: originalScore > 100 ? 'exceeded maximum' : 'below minimum'
    });
  } else {
    logger.debug('Risk score within valid bounds', { finalScore: score });
  }

  // Determine risk level
  logger.info('Determining risk level from score', { score: score });
  let riskLevel;
  if (score <= 30) {
    riskLevel = 'low';
  } else if (score <= 60) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  logger.debug('Risk level determined', {
    score: score,
    riskLevel: riskLevel,
    threshold: score <= 30 ? '≤30 (low)' : score <= 60 ? '31-60 (medium)' : '>60 (high)'
  });

  const result = {
    risk_level: riskLevel,
    score,
    rationale: rationale.slice(0, 3) // Limit to top 3 factors
  };

  logger.info('Risk calculation completed', {
    finalRiskLevel: result.risk_level,
    finalScore: result.score,
    topFactors: result.rationale,
    totalFactorsConsidered: factors.length
  });

  return result;
}

export {
  calculateRisk
};