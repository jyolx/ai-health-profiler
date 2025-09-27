// src/factors.js
export function extractFactors(answers) {
  const factors = [];
  let confidence = 0.9; // Start with high confidence for factor extraction

  // Age-related factors
  if (answers.age >= 65) {
    factors.push('advanced age');
  }

  // Smoking
  if (answers.smoker === true) {
    factors.push('smoking');
  }

  // Exercise patterns
  if (answers.exercise) {
    const exercise = answers.exercise.toLowerCase();
    if (['never', 'rarely'].includes(exercise)) {
      factors.push('low exercise');
    }
  }

  // Diet patterns
  if (answers.diet) {
    const diet = answers.diet.toLowerCase();
    if (diet.includes('high sugar') || diet.includes('fast food') || diet.includes('processed')) {
      factors.push('poor diet');
    }
    if (diet.includes('high fat') || diet.includes('fried')) {
      factors.push('high fat intake');
    }
  }

  // BMI if available
  if (answers.bmi) {
    if (answers.bmi >= 30) {
      factors.push('obesity');
    } else if (answers.bmi >= 25) {
      factors.push('overweight');
    }
  }

  // Sleep patterns
  if (answers.sleep) {
    if (answers.sleep < 6 || answers.sleep > 9) {
      factors.push('poor sleep');
    }
  }

  // Alcohol consumption
  if (answers.alcohol && ['often', 'sometimes'].includes(answers.alcohol.toLowerCase())) {
    factors.push('alcohol consumption');
  }

  // Adjust confidence based on available data
  const dataPoints = Object.keys(answers).length;
  if (dataPoints < 3) {
    confidence -= 0.2;
  }

  return {
    factors,
    confidence: parseFloat(confidence.toFixed(2))
  };
}
