import { createLogger } from './utils/logger.js';

const logger = createLogger('factors');

export function extractFactors(answers) {
  logger.info('Starting factor extraction', {
    inputFields: Object.keys(answers),
    dataPointsCount: Object.keys(answers).length
  });

  const factors = [];
  let confidence = 0.9; // Start with high confidence for factor extraction

  // Age-related factors
  if (answers.age >= 65) {
    factors.push('advanced age');
    logger.debug('Risk factor identified: Advanced age', { age: answers.age });
  } else if (answers.age) {
    logger.debug('Age assessed - no advanced age risk', { age: answers.age });
  }

  // Smoking
  if (answers.smoker === true) {
    factors.push('smoking');
    logger.debug('Risk factor identified: Smoking');
  } else if (answers.smoker === false) {
    logger.debug('Smoking status assessed - non-smoker');
  }

  // Exercise patterns
  if (answers.exercise) {
    const exercise = answers.exercise.toLowerCase();
    if (['never', 'rarely'].includes(exercise)) {
      factors.push('low exercise');
      logger.debug('Risk factor identified: Low exercise', { exerciseLevel: exercise });
    } else {
      logger.debug('Exercise level assessed - adequate activity', { exerciseLevel: exercise });
    }
  } else {
    logger.debug('Exercise data not available for assessment');
  }

  // Diet patterns
  if (answers.diet) {
    const diet = answers.diet.toLowerCase();
    
    if (diet.includes('high sugar') || diet.includes('fast food') || diet.includes('processed')) {
      factors.push('poor diet');
      logger.debug('Risk factor identified: Poor diet', { dietIndicators: 'high sugar/fast food/processed' });
    }
    if (diet.includes('high fat') || diet.includes('fried')) {
      factors.push('high fat intake');
      logger.debug('Risk factor identified: High fat intake', { dietIndicators: 'high fat/fried foods' });
    }
    
    if (!factors.some(f => f.includes('diet') || f.includes('fat'))) {
      logger.debug('Diet assessed - no significant dietary risk factors identified');
    }
  } else {
    logger.debug('Diet data not available for assessment');
  }

  // BMI
  if (answers.bmi) {
    logger.debug('Assessing BMI category', { bmi: answers.bmi });
    if (answers.bmi >= 30) {
      factors.push('obesity');
      logger.debug('Risk factor identified: Obesity', { bmi: answers.bmi, category: 'obese' });
    } else if (answers.bmi >= 25) {
      factors.push('overweight');
      logger.info('Risk factor identified: Overweight', { bmi: answers.bmi, category: 'overweight' });
    } else if (answers.bmi < 18.5) {
      factors.push('underweight');
      logger.info('Risk factor identified: Underweight', { bmi: answers.bmi, category: 'underweight' });
    } else {
      logger.info('BMI assessed - normal weight range', { bmi: answers.bmi, category: 'normal' });
    }
  } else {
    logger.warn('BMI data not available for assessment');
  }

  // Sleep patterns
  if (answers.sleep) {
    logger.debug('Assessing sleep patterns', { sleepHours: answers.sleep });
    if (answers.sleep < 6 || answers.sleep > 9) {
      factors.push('poor sleep');
      logger.debug('Risk factor identified: Poor sleep', { 
        sleepHours: answers.sleep, 
        issue: answers.sleep < 6 ? 'insufficient sleep' : 'excessive sleep' 
      });
    } else {
      logger.debug('Sleep patterns assessed - adequate sleep duration', { sleepHours: answers.sleep });
    }
  } else {
    logger.debug('Sleep data not available for assessment');
  }

  // Alcohol consumption
  if (answers.alcohol && ['often', 'sometimes'].includes(answers.alcohol.toLowerCase())) {
    factors.push('alcohol consumption');
    logger.debug('Risk factor identified: Alcohol consumption', { 
      alcoholLevel: answers.alcohol.toLowerCase() 
    });
  } else if (answers.alcohol) {
    logger.debug('Alcohol consumption assessed - low/no risk level', { 
      alcoholLevel: answers.alcohol.toLowerCase() 
    });
  } else {
    logger.debug('Alcohol consumption data not available for assessment');
  }

  // Adjust confidence based on available data
  const dataPoints = Object.keys(answers).length;
  logger.debug('Calculating confidence adjustment', { 
    dataPoints: dataPoints,
    originalConfidence: confidence 
  });
  
  if (dataPoints < 3) {
    confidence -= 0.2;
    logger.debug('Confidence reduced due to limited data points', { 
      dataPoints: dataPoints,
      confidenceReduction: 0.2,
      newConfidence: confidence 
    });
  } else {
    logger.debug('Sufficient data points available for confident analysis', { dataPoints: dataPoints });
  }

  const finalResult = {
    factors,
    confidence: parseFloat(confidence.toFixed(2))
  };

  logger.info('Factor extraction completed', {
    totalFactorsIdentified: factors.length,
    identifiedFactors: factors,
    finalConfidence: finalResult.confidence,
    dataPointsUsed: dataPoints
  });

  return finalResult;
}
