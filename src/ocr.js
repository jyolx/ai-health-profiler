// src/ocr.js
import Tesseract from 'tesseract.js';

export async function processHealthProfile(input, type) {
  let text = '';
  
  if (type === 'image') {
    // Extract text from image using OCR
    const result = await Tesseract.recognize(input, 'eng', {
      logger: m => console.log(m) // Optional: log OCR progress
    });
    text = result.data.text;
  } else {
    // Handle direct text input
    text = input;
  }

  // Parse the text to extract survey fields
  const answers = parseHealthSurvey(text);
  const missingFields = findMissingFields(answers);
  const confidence = calculateConfidence(answers, text, type);

  return {
    answers,
    missing_fields: missingFields,
    confidence: parseFloat(confidence.toFixed(2))
  };
}

function parseHealthSurvey(text) {
  const answers = {};
  
  try {
    // First, try to parse as JSON
    if (text.trim().startsWith('{')) {
      return JSON.parse(text);
    }
  } catch (e) {
    // Not JSON, continue with text parsing
  }

  // Age extraction
  const ageMatch = text.match(/age[:\s]*(\d+)/i);
  if (ageMatch) {
    answers.age = parseInt(ageMatch[1]);
  }

  // Smoker extraction
  const smokerMatch = text.match(/smok(?:er|ing)[:\s]*(yes|no|true|false)/i);
  if (smokerMatch) {
    answers.smoker = ['yes', 'true'].includes(smokerMatch[1].toLowerCase());
  }

  // Exercise extraction
  const exerciseMatch = text.match(/exercise[:\s]*(never|rarely|sometimes|often|daily|[\w\s]+)/i);
  if (exerciseMatch) {
    answers.exercise = exerciseMatch[1].toLowerCase().trim();
  }

  // Diet extraction
  const dietMatch = text.match(/diet[:\s]*([\w\s]+?)(?:\n|$|[A-Z][a-z]+:)/i);
  if (dietMatch) {
    answers.diet = dietMatch[1].trim();
  }

  // BMI extraction
  const bmiMatch = text.match(/bmi[:\s]*(\d+(?:\.\d+)?)/i);
  if (bmiMatch) {
    answers.bmi = parseFloat(bmiMatch[1]);
  }

  // Sleep extraction
  const sleepMatch = text.match(/sleep[:\s]*(\d+(?:\.\d+)?)/i);
  if (sleepMatch) {
    answers.sleep = parseFloat(sleepMatch[1]);
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
  }

  return answers;
}

function findMissingFields(answers) {
  const requiredFields = ['age', 'smoker', 'exercise', 'diet'];
  return requiredFields.filter(field => !(field in answers) || answers[field] === undefined || answers[field] === '');
}

function calculateConfidence(answers, originalText, type) {
  let confidence = 0.5; // Base confidence
  
  // Boost confidence based on number of extracted fields
  const extractedFields = Object.keys(answers).length;
  confidence += extractedFields * 0.1;
  
  // Penalize for missing required fields
  const missingFields = findMissingFields(answers);
  confidence -= missingFields.length * 0.15;
  
  // Adjust based on input type
  if (type === 'text') {
    confidence += 0.2; // Text input is more reliable
  }
  
  // Ensure confidence is between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}