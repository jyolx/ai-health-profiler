import Tesseract from 'tesseract.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('ocr');

export async function processHealthProfile(input, type) {
  
  let text = '';
  
  if (type === 'image') {
    logger.info('Beginning OCR text extraction from image');

    const result = await Tesseract.recognize(input, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          logger.info(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    text = result.data.text;
    logger.info('OCR text extraction completed', { 
      textLength: text.length,
      confidence: result.data.confidence 
    });
  } else {
    text = input;
    logger.info('Processing direct text input', { textLength: text.length });
  }

  // Parsing
  const answers = parseHealthSurvey(text);
  const missingFields = findMissingFields(answers);
  const confidence = calculateConfidence(answers,missingFields, text, type);

  logger.debug('Health profile processing completed', {
    extractedFields: Object.keys(answers).length,
    missingFields: missingFields.length,
    confidence: confidence,
    fieldsFound: Object.keys(answers)
  });

  return {
    answers,
    missing_fields: missingFields,
    confidence: parseFloat(confidence.toFixed(2))
  };
}

function parseHealthSurvey(text) {
  logger.info('Starting text parsing for health survey fields');
  logger.debug('Raw input text', { snippet: text.slice(0, 100) + (text.length > 100 ? '...' : '') });
  const answers = {};
  
  try {

    if (text.trim().startsWith('{')) {
      logger.debug('Attempting to parse input as JSON');
      const jsonData = JSON.parse(text);
      logger.info('Successfully parsed JSON input', { fields: Object.keys(jsonData) });
      return jsonData;
    }
  } catch (e) {
    logger.warn('Input is not JSON, proceeding with text pattern matching');
  }

  // Age extraction
  const ageMatch = text.match(/age[:\s]*(\d+)/i);
  if (ageMatch) {
    answers.age = parseInt(ageMatch[1]);
    logger.debug('Extracted age field', { age: answers.age });
  }

  // Smoker extraction
  const smokerMatch = text.match(/smok(?:er|ing)[:\s]*(yes|no|true|false)/i);
  if (smokerMatch) {
    answers.smoker = ['yes', 'true'].includes(smokerMatch[1].toLowerCase());
    logger.debug('Extracted smoker field', { smoker: answers.smoker });
  }

  // Exercise extraction
  const exerciseMatch = text.match(/exercise[:\s]*(never|rarely|sometimes|often|daily|[\w\s]+)/i);
  if (exerciseMatch) {
    answers.exercise = exerciseMatch[1].toLowerCase().trim();
    logger.debug('Extracted exercise field', { exercise: answers.exercise });
  }

  // Diet extraction
  const dietMatch = text.match(/diet[:\s]*([\w\s]+?)(?:\n|$|[A-Z][a-z]+:)/i);
  if (dietMatch) {
    answers.diet = dietMatch[1].trim();
    logger.debug('Extracted diet field', { diet: answers.diet });
  }

  // BMI extraction
  const bmiMatch = text.match(/bmi[:\s]*(\d+(?:\.\d+)?)/i);
  if (bmiMatch) {
    answers.bmi = parseFloat(bmiMatch[1]);
    logger.debug('Extracted BMI field', { bmi: answers.bmi });
  }

  // Sleep extraction
  const sleepMatch = text.match(/sleep[:\s]*(\d+(?:\.\d+)?)/i);
  if (sleepMatch) {
    answers.sleep = parseFloat(sleepMatch[1]);
    logger.debug('Extracted sleep field', { sleep: answers.sleep });
  }

  // Alcohol extraction
  const alcoholMatch = text.match(/alcohol[:\s]*(yes|no|true|false|never|rarely|sometimes|often)/i);
  if (alcoholMatch) {
    const value = alcoholMatch[1].toLowerCase();
    if (['yes', 'true', 'often', 'sometimes'].includes(value)) {
      answers.alcohol = value;
    } else {
      answers.alcohol = 'no';
    }
    logger.debug('Extracted alcohol field', { alcohol: answers.alcohol });
  }

  logger.info('Text parsing completed', { 
    totalFieldsExtracted: Object.keys(answers).length,
    extractedFields: Object.keys(answers)
  });

  return answers;
}

function findMissingFields(answers) {
  const requiredFields = ['age', 'smoker', 'exercise', 'diet'];
  const missing = requiredFields.filter(field => !(field in answers) || answers[field] === undefined || answers[field] === '');
  
  if (missing.length > 0) {
    logger.warn('Missing required fields detected', { 
      missingFields: missing,
      totalRequired: requiredFields.length,
      foundFields: Object.keys(answers)
    });
  } else {
    logger.debug('All required fields found');
  }
  
  return missing;
}

function calculateConfidence(answers, missingFields, originalText, type) {
  let confidence = 0.5; // Base confidence
  
  // Boost confidence based on number of extracted fields
  const extractedFields = Object.keys(answers).length;
  confidence += extractedFields * 0.5;
  
  // Penalize for missing required fields
  confidence -= missingFields.length * 0.15;
  
  if (type === 'text') {
    confidence += 0.2; // Text input is more reliable
  }
  
  const finalConfidence = Math.max(0, Math.min(1, confidence));
  
  logger.debug('Confidence calculation completed', {
    baseConfidence: 0.5,
    extractedFields: extractedFields,
    missingFields: missingFields.length,
    inputType: type,
    finalConfidence: finalConfidence.toFixed(2)
  });
  
  return finalConfidence;
}