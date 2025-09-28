import { createLogger } from './utils/logger.js';
import {GoogleGenAI} from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const logger = createLogger('recommendations');
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function generateRecommendations(riskLevel, factors) {
  logger.info('Starting AI recommendation generation', {
    riskLevel: riskLevel,
    factorsCount: factors.length,
    factors: factors
  });

  try {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn('GEMINI_API_KEY not found, falling back to static recommendations');
      return generateStaticRecommendations(riskLevel, factors);
    }
    
    const prompt = `You are a healthcare AI assistant. Based on the following health information, provide less than 5 specific, actionable health recommendations.

Risk Level: ${riskLevel}
Health Factors: ${factors.join(', ')}

Please provide recommendations that are:
1. Short, Specific and actionable
2. Appropriate for the given risk level
3. Tailored to the given health factors
4. Professional and medically sound
5. Formatted as a simple numbered list

Return only less than 5 recommendations, and nothing else.`;

    logger.debug('Sending prompt to Gemini AI', {
      promptLength: prompt.length,
      riskLevel: riskLevel,
      factorsCount: factors.length
    });

    const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
  });
    const aiRecommendations = response.text;
    
    logger.debug('Received AI response', {
      responseLength: aiRecommendations.length
    });

    // Parse the AI response into an array
    const recommendationsArray = aiRecommendations
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);

    logger.info('AI recommendation generation completed', {
      riskLevel: riskLevel,
      totalFactors: factors.length,
      totalRecommendations: recommendationsArray.length,
      recommendations: recommendationsArray
    });

    return {
      risk_level: riskLevel,
      factors,
      recommendations: recommendationsArray,
      source: 'gemini-ai'
    };

  } catch (error) {
    logger.error('Error generating AI recommendations, falling back to static', {
      error: error.message,
      stack: error.stack,
      riskLevel: riskLevel,
      factors: factors
    });

    // Fallback to static recommendations if AI fails
    return generateStaticRecommendations(riskLevel, factors);
  }
}

// Fallback function for static recommendations
function generateStaticRecommendations(riskLevel, factors) {
  logger.info('Starting recommendation generation', {
    riskLevel: riskLevel,
    factorsCount: factors.length,
    factors: factors
  });

  const recommendations = [];

  // Factor-specific recommendations
  const factorRecommendations = {
    'smoking': 'Quit smoking with professional support',
    'poor diet': 'Reduce sugar and increase vegetables',
    'low exercise': 'Walk 30 minutes daily',
    'obesity': 'Consult healthcare provider for weight management',
    'overweight': 'Aim for gradual weight loss through diet and exercise',
    'underweight': 'Increase calorie intake with nutrient-dense foods',
    'advanced age': 'Regular health checkups and screenings',
    'poor sleep': 'Maintain consistent sleep schedule (7-8 hours)',
    'high fat intake': 'Choose lean proteins and healthy fats',
    'alcohol consumption': 'Limit alcohol intake to recommended guidelines'
  };

  // Add factor-specific recommendations
  logger.debug('Processing factor-specific recommendations');
  factors.forEach(factor => {
    if (factorRecommendations[factor]) {
      recommendations.push(factorRecommendations[factor]);
      logger.debug('Added factor-specific recommendation', {
        factor: factor,
        recommendation: factorRecommendations[factor]
      });
    } else {
      logger.warn('No recommendation found for factor', { factor: factor });
    }
  });

  logger.debug('Factor-specific recommendations completed', {
    recommendationsAdded: recommendations.length
  });

  // Add general recommendations based on risk level
  logger.debug('Adding risk-level specific recommendations', { riskLevel: riskLevel });
  
  if (riskLevel === 'high') {
    if (!recommendations.some(rec => rec.includes('healthcare'))) {
      const healthcareRec = 'Consult healthcare provider for comprehensive assessment';
      recommendations.push(healthcareRec);
      logger.debug('Added high-risk healthcare recommendation', {
        recommendation: healthcareRec
      });
    } else {
      logger.debug('Healthcare recommendation already present, skipping duplicate');
    }
  }

  if (riskLevel === 'medium' || riskLevel === 'high') {
    if (!recommendations.some(rec => rec.includes('stress'))) {
      const stressRec = 'Practice stress management techniques';
      recommendations.push(stressRec);
      logger.debug('Added stress management recommendation', {
        riskLevel: riskLevel,
        recommendation: stressRec
      });
    } else {
      logger.debug('Stress management recommendation already present, skipping duplicate');
    }
  }

  // Always include hydration if not many recommendations
  logger.debug('Checking if additional recommendations needed', {
    currentCount: recommendations.length,
    threshold: 3
  });
  
  if (recommendations.length < 3) {
    const hydrationRec = 'Stay hydrated with 8 glasses of water daily';
    recommendations.push(hydrationRec);
    logger.debug('Added hydration recommendation due to low count', {
      recommendation: hydrationRec,
      newCount: recommendations.length
    });
  } else {
    logger.debug('Sufficient recommendations available, no hydration recommendation needed');
  }

  const finalRecommendations = recommendations.slice(0, 5);
  const result = {
    risk_level: riskLevel,
    factors,
    recommendations: finalRecommendations,
    source: 'static'
  };

  logger.info('Recommendation generation completed', {
    riskLevel: result.risk_level,
    totalFactors: result.factors.length,
    totalRecommendations: result.recommendations.length,
    finalRecommendations: result.recommendations,
    truncated: recommendations.length > 5
  });

  return result;
}

export {
  generateRecommendations
};