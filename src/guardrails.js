import Joi from 'joi';
import { createLogger } from './utils/logger.js';

const logger = createLogger('guardrails');

export function validateInput(parsedData) {
  logger.info('Starting input validation', {
    hasAnswers: !!parsedData.answers,
    confidence: parsedData.confidence,
    missingFieldsCount: parsedData.missing_fields?.length || 0
  });

  const totalRequiredFields = 4; // age, smoker, exercise, diet
  const missingCount = parsedData.missing_fields.length;
  const missingPercentage = (missingCount / totalRequiredFields) * 100;
  
  logger.debug('Checking missing fields threshold', {
    missingCount: missingCount,
    totalRequired: totalRequiredFields,
    missingPercentage: missingPercentage.toFixed(1)
  });
  
  if (missingPercentage > 50) {
    logger.warn('Validation failed: Too many missing fields', {
      missingPercentage: missingPercentage.toFixed(1),
      missingFields: parsedData.missing_fields
    });
    return {
      isValid: false,
      response: {
        status: 'incomplete_profile',
        reason: '>50% fields missing',
        missing_fields: parsedData.missing_fields,
        confidence: parsedData.confidence
      }
    };
  }
  logger.debug('Checking confidence threshold', { confidence: parsedData.confidence });
  if (parsedData.confidence < 0.3) {
    logger.warn('Validation failed: Low confidence score', { 
      confidence: parsedData.confidence,
      threshold: 0.3 
    });
    return {
      isValid: false,
      response: {
        status: 'low_confidence',
        reason: 'OCR confidence too low',
        confidence: parsedData.confidence
      }
    };
  }

  logger.debug('Starting Joi schema validation', {
    fieldsToValidate: Object.keys(parsedData.answers || {})
  });
  
  const schema = Joi.object({
    age: Joi.number().integer().min(1).max(120),
    smoker: Joi.boolean(),
    exercise: Joi.string().valid('never', 'rarely', 'sometimes', 'often', 'daily'),
    diet: Joi.string().min(1),
    bmi: Joi.number().min(10).max(50).optional(),
    sleep: Joi.number().min(0).max(24).optional(),
    alcohol: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('never', 'rarely', 'sometimes', 'often', 'no')
    ).optional()
  });

  const { error } = schema.validate(parsedData.answers);
  if (error) {
    logger.warn('Joi validation failed', {
      field: error.details[0].path[0],
      value: error.details[0].context?.value,
      errorMessage: error.details[0].message
    });
    return {
      isValid: false,
      response: {
        status: 'invalid_data',
        reason: error.details[0].message,
        field: error.details[0].path[0]
      }
    };
  }

  logger.info('Input validation completed successfully', {
    confidence: parsedData.confidence,
    missingFields: parsedData.missing_fields?.length || 0,
    validatedFields: Object.keys(parsedData.answers || {})
  });

  return { isValid: true };
}