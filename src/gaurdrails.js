// src/guardrails.js
import Joi from 'joi';

export function validateInput(parsedData) {
  // Check if too many fields are missing
  const totalRequiredFields = 4; // age, smoker, exercise, diet
  const missingCount = parsedData.missing_fields.length;
  const missingPercentage = (missingCount / totalRequiredFields) * 100;
  
  if (missingPercentage > 50) {
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

  // Check confidence threshold
  if (parsedData.confidence < 0.3) {
    return {
      isValid: false,
      response: {
        status: 'low_confidence',
        reason: 'OCR confidence too low',
        confidence: parsedData.confidence
      }
    };
  }

  // Validate individual field values
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
    return {
      isValid: false,
      response: {
        status: 'invalid_data',
        reason: error.details[0].message,
        field: error.details[0].path[0]
      }
    };
  }

  return { isValid: true };
}

export function sanitizeInput(data) {
  // Remove any potential harmful content
  if (typeof data === 'string') {
    return data.replace(/[<>]/g, '').trim();
  }
  return data;
}