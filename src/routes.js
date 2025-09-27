import express from 'express';
import multer, { MulterError } from 'multer';
import { processHealthProfile } from './ocr.js';
import { validateInput } from './guardrails.js';
import { extractFactors } from './factors.js';
import { calculateRisk } from './risk.js';
import { generateRecommendations } from './recommendations.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('routes');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow 1 file
  },
  fileFilter: (req, file, cb) => {
    logger.debug('Validating uploaded file', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (file.mimetype.startsWith('image/')) {
      logger.info('File validation passed - image type accepted');
      cb(null, true);
    } else {
      logger.warn('File validation failed - invalid file type', {
        mimetype: file.mimetype,
        filename: file.originalname
      });
      cb(new Error(`Invalid file type: ${file.mimetype}. Only image files are allowed.`), false);
    }
  }
});

const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    logger.error('Multer validation error', {
      code: error.code,
      message: error.message,
      field: error.field
    });
    
    let message;
    let status = 400;
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large. Maximum allowed size is 10MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded. Only 1 file is allowed.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field. Please use "image" field name.';
        break;
      default:
        message = `Upload error: ${error.message}`;
    }
    
    return res.status(status).json({
      status: 'error',
      type: 'upload_error',
      message: message,
      code: error.code
    });
  } else if (error.message.includes('Invalid file type') || error.message.includes('Only')) {
    
    logger.error('File type validation error', { message: error.message });
    return res.status(400).json({
      status: 'error',
      type: 'file_validation_error',
      message: error.message
    });
  }
  
  next(error);
};

// Main endpoint for health risk analysis
router.post('/analyze', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, async (req, res) => {
  try {
    logger.info('Starting health risk analysis', {
      hasFile: !!req.file,
      hasTextData: !!(req.body.text || req.body.data)
    });
    
    let parsedData;
    
    // Step 1: OCR/Text Parsing
    if (req.file) {
      parsedData = await processHealthProfile(req.file.buffer, 'image');
    } else if (req.body.text || req.body.data) {
      // Handle text input with better error handling
      logger.info('Processing text input');
      let textInput;
      
      try {
        textInput = req.body.text || JSON.stringify(req.body.data);
      } catch (jsonError) {
        logger.warn('Failed to process input data', { 
          error: jsonError.message,
          hasText: !!req.body.text,
          hasData: !!req.body.data 
        });
        return res.status(400).json({
          status: 'error',
          type: 'invalid_input',
          message: 'Invalid input data format. Unable to process the provided data.'
        });
      }
      
      parsedData = await processHealthProfile(textInput, 'text');
    } else {
      logger.warn('No input data provided');
      return res.status(400).json({
        status: 'error',
        message: 'Please provide either text data or an image file'
      });
    }

    // Step 2 validation
    const validation = validateInput(parsedData);
    if (!validation.isValid) {
      logger.error('Input validation failed', { 
        errors: validation.response 
      });
      return res.status(400).json(validation.response);
    }

    // Step 3: Factor Extraction
    const factorData = extractFactors(parsedData.answers);

    // Step 4: Risk Classification
    const riskData = calculateRisk(factorData.factors, parsedData.answers);

    // Step 5: Recommendations
    logger.info('Generating AI-powered recommendations', { 
      riskLevel: riskData.risk_level,
      factorsCount: factorData.factors.length 
    });
    const recommendations = await generateRecommendations(
      riskData.risk_level, 
      factorData.factors, 
      parsedData.answers
    );    // Combine all results
    const result = {
      ...parsedData,
      ...factorData,
      ...riskData,
      ...recommendations,
      status: 'ok'
    };

    logger.info('Health analysis completed successfully', {
      riskLevel: result.risk_level,
      factorsCount: result.factors?.length || 0
    });

    res.json(result);

  } catch (error) {
    logger.error('Analysis error occurred', {
      error: error.message,
      stack: error.stack,
      hasFile: !!req.file,
      hasTextData: !!(req.body.text || req.body.data)
    });
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to analyze health profile'
    });
  }
});

// Separate OCR endpoint for testing
router.post('/ocr', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, async (req, res) => {
  try {
    logger.info('OCR testing endpoint called', {
      hasFile: !!req.file
    });

    if (!req.file) {
      logger.warn('No image file provided for OCR test');
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an image file'
      });
    }

    logger.info('Processing OCR for image', {
      filename: req.file.originalname,
      size: req.file.size
    });

    const result = await processHealthProfile(req.file.buffer, 'image');
    
    logger.info('OCR processing completed successfully');
    res.json(result);
    
  } catch (error) {
    logger.error('OCR processing failed', {
      error: error.message,
      stack: error.stack,
      filename: req.file?.originalname
    });
    res.status(500).json({
      status: 'error',
      message: 'Failed to process image'
    });
  }
});

export default router;
