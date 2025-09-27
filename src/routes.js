// src/routes.js
import express from 'express';
import multer from 'multer';
import { processHealthProfile } from './ocr.js';
import { validateInput } from './guardrails.js';
import { extractFactors } from './factors.js';
import { calculateRisk } from './risk.js';
import { generateRecommendations } from './recommendations.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only Image files are allowed'), false);
    }
  }
});

// Main endpoint for health risk analysis
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    let parsedData;
    
    // Step 1: OCR/Text Parsing
    if (req.file) {
      // Handle image input
      parsedData = await processHealthProfile(req.file.buffer, 'image');
    } else if (req.body.text || req.body.data) {
      // Handle text input
      const textInput = req.body.text || JSON.stringify(req.body.data);
      parsedData = await processHealthProfile(textInput, 'text');
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide either text data or an image file'
      });
    }

    // Step 1 validation
    const validation = validateInput(parsedData);
    if (!validation.isValid) {
      return res.status(400).json(validation.response);
    }

    // Step 2: Factor Extraction
    const factorData = extractFactors(parsedData.answers);

    // Step 3: Risk Classification
    const riskData = calculateRisk(factorData.factors, parsedData.answers);

    // Step 4: Recommendations
    const recommendations = generateRecommendations(riskData.risk_level, factorData.factors);

    // Combine all results
    const result = {
      ...parsedData,
      ...factorData,
      ...riskData,
      ...recommendations,
      status: 'ok'
    };

    res.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to analyze health profile'
    });
  }
});

// Separate OCR endpoint for testing
router.post('/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an image file'
      });
    }

    const result = await processHealthProfile(req.file.buffer, 'image');
    res.json(result);
    
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process image'
    });
  }
});

export default router;
