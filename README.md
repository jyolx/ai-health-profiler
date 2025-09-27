// README.md
# Health Risk Profiler

AI-powered backend service that analyzes lifestyle survey responses (text or scanned forms) and generates structured health risk profiles with actionable recommendations.

## Features

- **OCR Support**: Process both typed text and scanned form images
- **Risk Assessment**: Calculate health risk scores based on lifestyle factors
- **Smart Recommendations**: Generate personalized, actionable health advice
- **Robust Validation**: Handle missing data and noisy inputs with guardrails
- **RESTful API**: Clean JSON responses following specified schemas

## Architecture

```
src/
├── index.js         # Express server entrypoint
├── routes.js        # API routes
├── ocr.js           # OCR extraction logic
├── factors.js       # Risk factor extraction
├── risk.js          # Risk calculation logic
├── recommendations.js # Recommendation generation
├── guardrails.js    # Validation & error handling
└── utils/           # Helper functions
```

## Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd health-risk-profiler
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. The server will be running on `http://localhost:3000`

## API Endpoints

### 1. Health Profile Analysis
**POST** `/api/analyze`

Analyzes health survey data and returns complete risk profile.

#### Text Input Example:
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Age: 42\nSmoker: yes\nExercise: rarely\nDiet: high sugar"
  }'
```

#### JSON Input Example:
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "age": 42,
      "smoker": true,
      "exercise": "rarely",
      "diet": "high sugar"
    }
  }'
```

#### Image Input Example:
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "image=@survey_form.jpg"
```

#### Expected Response:
```json
{
  "answers": {
    "age": 42,
    "smoker": true,
    "exercise": "rarely",
    "diet": "high sugar"
  },
  "missing_fields": [],
  "confidence": 0.92,
  "factors": ["smoking", "poor diet", "low exercise"],
  "risk_level": "high",
  "score": 78,
  "rationale": ["smoking", "poor diet", "low exercise"],
  "recommendations": [
    "Quit smoking with professional support",
    "Reduce sugar and increase vegetables",
    "Walk 30 minutes daily",
    "Consult healthcare provider for comprehensive assessment"
  ],
  "status": "ok"
}
```

### 2. OCR Only
**POST** `/api/ocr`

Extract and parse text from images only.

```bash
curl -X POST http://localhost:3000/api/ocr \
  -F "image=@survey_form.jpg"
```

### 3. Health Check
**GET** `/health`

Check service status.

```bash
curl http://localhost:3000/health
```

## Error Handling

### Incomplete Profile (>50% fields missing):
```json
{
  "status": "incomplete_profile",
  "reason": ">50% fields missing",
  "missing_fields": ["age", "smoker", "diet"],
  "confidence": 0.45
}
```

### Low Confidence OCR:
```json
{
  "status": "low_confidence",
  "reason": "OCR confidence too low",
  "confidence": 0.25
}
```

### Invalid Data:
```json
{
  "status": "invalid_data",
  "reason": "age must be between 1 and 120",
  "field": "age"
}
```

## Data Processing Pipeline

1. **OCR/Text Parsing** → Extract survey fields from text/image
2. **Validation** → Check completeness and data quality  
3. **Factor Extraction** → Identify health risk factors
4. **Risk Calculation** → Score and categorize risk level
5. **Recommendations** → Generate actionable advice

## Supported Survey Fields

- **age**: Integer (1-120)
- **smoker**: Boolean
- **exercise**: String (never/rarely/sometimes/often/daily)
- **diet**: String (descriptive text)
- **bmi**: Float (optional, 10-50)
- **sleep**: Float (optional, 0-24 hours)
- **alcohol**: String/Boolean (optional)

## Risk Scoring

- **Low Risk**: 0-30 points
- **Medium Risk**: 31-60 points  
- **High Risk**: 61-100 points

### Risk Factors & Weights:
- Smoking: 25 points
- Obesity: 20 points
- Poor diet: 15 points
- Low exercise: 15 points
- Advanced age (65+): 15 points
- High fat intake: 12 points
- Overweight: 10 points
- Poor sleep: 10 points
- Alcohol consumption: 8 points

## Testing with Postman

1. Import the following requests into Postman:

### Text Analysis Request:
- **Method**: POST
- **URL**: `http://localhost:3000/api/analyze`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "text": "Age: 35\nSmoker: no\nExercise: sometimes\nDiet: balanced"
}
```

### Image Analysis Request:
- **Method**: POST
- **URL**: `http://localhost:3000/api/analyze`
- **Body**: form-data
  - Key: `image`
  - Type: File
  - Value: Select an image file

## Development

### Run Tests:
```bash
npm test
```

### Start Development Server:
```bash
npm run dev
```

### Production Build:
```bash
npm start
```

## Deployment

### Using ngrok (for local testing):
```bash
# Install ngrok globally
npm install -g ngrok

# Start your server
npm start

# In another terminal, expose it
ngrok http 3000
```

### Cloud Deployment:
The app is ready for deployment on platforms like:
- Heroku
- Railway
- Render
- AWS/GCP/Azure

Make sure to set environment variables as needed.

## Sample Test Cases

### Valid Complete Profile:
```json
{
  "data": {
    "age": 28,
    "smoker": false,
    "exercise": "often",
    "diet": "healthy balanced",
    "bmi": 22.5,
    "sleep": 7.5
  }
}
```

### High Risk Profile:
```json
{
  "data": {
    "age": 65,
    "smoker": true,
    "exercise": "never",
    "diet": "high sugar processed foods",
    "bmi": 32
  }
}
```

### Incomplete Profile (should trigger guardrail):
```json
{
  "data": {
    "age": 30
  }
}
```

## Notes

- All recommendations are **non-diagnostic** and for informational purposes only
- The service includes confidence scoring for all OCR operations
- Input validation prevents malformed or malicious data
- Rate limiting and file size limits are implemented for security
- All responses follow the specified JSON schemas

## Contact

For questions about implementation or deployment, please refer to the project documentation.