// src/recommendations.js
function generateRecommendations(riskLevel, factors) {
  const recommendations = [];

  // Factor-specific recommendations
  const factorRecommendations = {
    'smoking': 'Quit smoking with professional support',
    'poor diet': 'Reduce sugar and increase vegetables',
    'low exercise': 'Walk 30 minutes daily',
    'obesity': 'Consult healthcare provider for weight management',
    'overweight': 'Aim for gradual weight loss through diet and exercise',
    'advanced age': 'Regular health checkups and screenings',
    'poor sleep': 'Maintain consistent sleep schedule (7-8 hours)',
    'high fat intake': 'Choose lean proteins and healthy fats',
    'alcohol consumption': 'Limit alcohol intake to recommended guidelines'
  };

  // Add factor-specific recommendations
  factors.forEach(factor => {
    if (factorRecommendations[factor]) {
      recommendations.push(factorRecommendations[factor]);
    }
  });

  // Add general recommendations based on risk level
  if (riskLevel === 'high') {
    if (!recommendations.some(rec => rec.includes('healthcare'))) {
      recommendations.push('Consult healthcare provider for comprehensive assessment');
    }
  }

  if (riskLevel === 'medium' || riskLevel === 'high') {
    if (!recommendations.some(rec => rec.includes('stress'))) {
      recommendations.push('Practice stress management techniques');
    }
  }

  // Always include hydration if not many recommendations
  if (recommendations.length < 3) {
    recommendations.push('Stay hydrated with 8 glasses of water daily');
  }

  return {
    risk_level: riskLevel,
    factors,
    recommendations: recommendations.slice(0, 5) // Limit to 5 recommendations
  };
}

module.exports = {
  generateRecommendations
};