# 🏥 AI Health Risk Profiler

A comprehensive **AI-powered health assessment service** that analyzes lifestyle data from text, JSON, or scanned images to generate personalized health risk profiles and evidence-based recommendations.

## ✨ Features

### 🔍 **Multi-Input Processing**
- **Text Analysis**: Process natural language health descriptions
- **OCR Support**: Extract data from scanned health forms and documents
- **JSON Input**: Accept structured health data
- **Image Processing**: Analyze uploaded health documents (max 10MB)

### 🧠 **Intelligent Analysis**
- **Risk Factor Extraction**: Identify health risk factors from lifestyle data
- **Risk Scoring**: Calculate comprehensive risk scores (0-100 scale)  
- **Confidence Metrics**: Assess data quality and processing confidence
- **Smart Validation**: Robust input validation with detailed error handling

### 📋 **Comprehensive Logging**
- **Module-Specific Logging**: Track activity across different components
- **Multiple Log Levels**: Support for debug, info, warn, and error levels
- **Dual Output**: Console display and file logging with human-readable format
- **Request Tracking**: Log all API requests with metadata

### 🛡️ **Enhanced Error Handling**
- **File Validation**: Prevent non-image uploads and oversized files
- **JSON Parsing**: Graceful handling of malformed JSON requests
- **Graceful Degradation**: Fallback mechanisms for service reliability
- **Detailed Error Responses**: Clear, actionable error messages

## 🏗️ Architecture

```
src/
├── index.js              # Express server with middleware
├── routes.js             # API endpoints with error handling
├── ocr.js               # OCR processing with Tesseract.js
├── factors.js           # Health factor extraction logic
├── risk.js              # Risk calculation and scoring
├── recommendations.js   # Recommendation generation system
├── guardrails.js        # Input validation with Joi
└── utils/
    └── logger.js        # Winston-based logging system
```

## 🚀 Installation & Setup

### 1. **Clone Repository**
```bash
git clone <your-repo-url>
cd AI_health_profiler
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Environment Configuration**
Create a `.env` file:
```env
# Server Configuration
PORT=3000

# Logging Configuration  
LOG_LEVEL=info

# Node Environment
NODE_ENV=development
```

### 4. **Start Development Server**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### 5. **Access Application**
- **API Base URL**: `http://localhost:3000/api`
- **Health Check**: `http://localhost:3000/health`

## 📡 API Endpoints

### 🔬 **Health Risk Analysis**
**POST** `/api/analyze`

Comprehensive health risk analysis with multiple input options.

#### **Text Input Example:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Age: 42, Smoker: yes, Exercise: rarely, Diet: high sugar and processed foods, BMI: 28.5, Sleep: 5 hours, Alcohol: often"
  }'
```

#### **Structured JSON Example:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "age": 35,
      "smoker": false,
      "exercise": "often",
      "diet": "balanced with vegetables",
      "bmi": 24.2,
      "sleep": 7.5,
      "alcohol": "rarely"
    }
  }'
```

#### **Image Upload Example:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "image=@health_survey.jpg" \
  http://localhost:3000/api/analyze
```

#### **Expected Response:**
```json
{
  "answers": {
    "age": 42,
    "smoker": true,
    "exercise": "rarely",
    "diet": "high sugar and processed foods",
    "bmi": 28.5,
    "sleep": 5,
    "alcohol": "often"
  },
  "missing_fields": [],
  "confidence": 0.88,
  "factors": ["smoking", "poor diet", "low exercise", "overweight", "poor sleep", "alcohol consumption"],
  "risk_level": "high",
  "score": 85,
  "rationale": ["smoking", "poor diet", "low exercise"],
  "recommendations": [
    "Quit smoking with professional support",
    "Reduce processed foods and increase fruits, vegetables, and whole grains", 
    "Start with 30 minutes of moderate exercise 3 times per week",
    "Consult healthcare provider for comprehensive health assessment immediately",
    "Practice stress management techniques"
  ],
  "status": "ok"
}
```

### 🔍 **OCR Processing Only**
**POST** `/api/ocr`

Extract and analyze text from images without full risk analysis.

```bash
curl -X POST http://localhost:3000/api/ocr \
  -F "image=@health_form.png" \
  http://localhost:3000/api/ocr
```

### ❤️ **Health Check**
**GET** `/health`

Service status and configuration information.

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-09-27T20:30:00.000Z"
}
```

## ⚡ Error Handling & Validation

### **File Upload Errors**

#### **Invalid File Type:**
```json
{
  "status": "error",
  "type": "file_validation_error",
  "message": "Invalid file type: application/pdf. Only image files are allowed."
}
```

#### **File Size Exceeded:**
```json
{
  "status": "error", 
  "type": "upload_error",
  "message": "File size too large. Maximum allowed size is 10MB.",
  "code": "LIMIT_FILE_SIZE"
}
```

### **JSON Parsing Errors**

#### **Malformed JSON:**
```json
{
  "status": "error",
  "type": "invalid_json",
  "message": "Invalid JSON format in request body. Please check your JSON syntax."
}
```

### **Data Validation Errors**

#### **Incomplete Profile:**
```json
{
  "status": "incomplete_profile",
  "reason": ">50% fields missing",
  "missing_fields": ["age", "smoker", "diet"],
  "confidence": 0.35
}
```

#### **Low OCR Confidence:**
```json
{
  "status": "low_confidence", 
  "reason": "OCR confidence too low",
  "confidence": 0.25
}
```

#### **Invalid Field Values:**
```json
{
  "status": "invalid_data",
  "reason": "age must be less than or equal to 120",
  "field": "age"
}
```

## 🔄 Data Processing Pipeline

```mermaid
graph LR
    A[Input Data] --> B{Input Type}
    B -->|Text| C[Text Processing]
    B -->|JSON| D[JSON Parsing] 
    B -->|Image| E[OCR Processing]
    C --> F[Data Validation]
    D --> F
    E --> F
    F --> G[Factor Extraction]
    G --> H[Risk Calculation] 
    H --> I[Recommendations]
    I --> J[Response]
```

### **Processing Steps:**
1. **Input Processing** → Handle text, JSON, or image inputs
2. **Data Extraction** → Parse health information from various formats
3. **Validation** → Check completeness, confidence, and data quality
4. **Factor Analysis** → Identify specific health risk factors
5. **Risk Scoring** → Calculate numerical risk score and categorization
6. **Recommendations** → Generate personalized health advice

## 📊 Supported Health Data Fields

| Field | Type | Range | Required | Description |
|-------|------|-------|----------|-------------|
| `age` | Integer | 1-120 | ✅ | Person's age in years |
| `smoker` | Boolean | true/false | ✅ | Smoking status |
| `exercise` | String | never/rarely/sometimes/often/daily | ✅ | Exercise frequency |
| `diet` | String | Descriptive text | ✅ | Dietary habits description |
| `bmi` | Float | 10.0-50.0 | ❌ | Body Mass Index |
| `sleep` | Float | 0-24 | ❌ | Hours of sleep per night |
| `alcohol` | String/Boolean | never/rarely/sometimes/often | ❌ | Alcohol consumption |

## 🎯 Risk Assessment System

### **Risk Levels:**
- 🟢 **Low Risk**: 0-30 points
- 🟡 **Medium Risk**: 31-60 points  
- 🔴 **High Risk**: 61-100 points

### **Risk Factor Weights:**
| Factor | Points | Criteria |
|--------|--------|----------|
| Smoking | 25 | Current smoker |
| Obesity | 20 | BMI ≥ 30 |
| Poor Diet | 15 | High sugar/processed foods |
| Low Exercise | 15 | Never/rarely exercises |
| Advanced Age | 15 | Age ≥ 65 |
| High Fat Intake | 12 | High fat/fried foods |
| Underweight | 12 | BMI < 18.5 |
| Overweight | 10 | BMI 25-29.9 |
| Poor Sleep | 10 | < 6 or > 9 hours |
| Alcohol | 8 | Often/sometimes drinks |

### **Age Adjustment:**
Additional 2 points per 5-year increment above age 50.

## 🧪 Testing with Postman

### **Setup Collection:**

#### **1. Text Analysis Request**
- **Method**: `POST`
- **URL**: `{{base_url}}/api/analyze`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "text": "Age: 28, Smoker: no, Exercise: daily, Diet: mediterranean, BMI: 22.1, Sleep: 8 hours, Alcohol: no"
}
```

#### **2. Image Upload Request**
- **Method**: `POST` 
- **URL**: `{{base_url}}/api/analyze`
- **Body**: `form-data`
  - Key: `image`
  - Type: `File`
  - Value: Select image file

#### **3. Error Testing Request**
- **Method**: `POST`
- **URL**: `{{base_url}}/api/analyze` 
- **Headers**: `Content-Type: application/json`
- **Body** (malformed JSON):
```json
{"text": "Age: 35" // Missing closing brace
```

### **Environment Variables:**
Set `base_url` to `http://localhost:3000`

## 📝 Logging & Monitoring

### **Log Levels:**
- `debug`: Detailed diagnostic information
- `info`: General operational messages  
- `warn`: Warning conditions
- `error`: Error conditions requiring attention

### **Log Locations:**
- **Console**: Colorized, real-time output during development
- **File**: `logs/app.log` with structured, persistent logging

### **Sample Log Output:**
```
2025-09-27 20:30:00 [info][server]: 🚀 Health Risk Profiler server running on port 3000
2025-09-27 20:30:05 [info][routes]: Starting health risk analysis {"hasFile":true,"hasTextData":false}
2025-09-27 20:30:05 [info][ocr]: Starting health profile processing {"inputType":"image","inputSize":245760}
2025-09-27 20:30:06 [info][factors]: Starting factor extraction {"inputFields":["age","smoker","exercise"],"dataPointsCount":3}
2025-09-27 20:30:06 [info][risk]: Starting risk calculation {"factorsCount":2,"factors":["smoking","poor diet"],"hasAgeData":true,"age":42}
2025-09-27 20:30:06 [info][recommendations]: Starting recommendation generation {"riskLevel":"high","factorsCount":2,"factors":["smoking","poor diet"]}
```

## 🔧 Development

### **Available Scripts:**
```bash
# Development with auto-reload
npm run dev

# Production server
npm start

# Run tests (when available)
npm test
```

### **Development Tools:**
- **Nodemon**: Auto-restart on file changes during development
- **Winston**: Comprehensive logging system
- **Joi**: Schema validation for robust input handling
- **Multer**: File upload handling with validation
- **Tesseract.js**: OCR processing capabilities

## 🚀 Deployment

### **Environment Variables for Production:**
```env
PORT=3000
LOG_LEVEL=warn
NODE_ENV=production
```

### **Platform Support:**
- ✅ **Heroku**: Ready for deployment
- ✅ **Railway**: Compatible
- ✅ **Render**: Supported
- ✅ **AWS/GCP/Azure**: Docker-ready

### **Local Testing with ngrok:**
```bash
# Install ngrok
npm install -g ngrok

# Start server
npm start

# Expose publicly
ngrok http 3000
```

## 📖 Sample Test Cases

### **Low Risk Profile:**
```json
{
  "data": {
    "age": 25,
    "smoker": false,
    "exercise": "daily",
    "diet": "balanced with lots of vegetables",
    "bmi": 21.5,
    "sleep": 8,
    "alcohol": "never"
  }
}
```

### **High Risk Profile:**
```json
{
  "data": {
    "age": 68,
    "smoker": true,
    "exercise": "never", 
    "diet": "high sugar processed foods and fried meals",
    "bmi": 34.2,
    "sleep": 4,
    "alcohol": "often"
  }
}
```

### **Edge Cases:**
```json
{
  "data": {
    "age": 150,  // Should trigger validation error
    "smoker": "maybe"  // Should trigger validation error
  }
}
```

## ⚠️ Important Notes

- 🏥 **Medical Disclaimer**: All recommendations are for informational purposes only and not a substitute for professional medical advice
- 🔒 **Privacy**: No user data is stored permanently; all processing is stateless
- 📊 **Accuracy**: OCR confidence scores help assess data reliability  
- 🛡️ **Security**: Input validation prevents malicious data injection
- ⚡ **Performance**: File size limits and request validation ensure service stability

## 📞 Support

For technical issues, feature requests, or deployment questions:
- Check the logs in `logs/app.log` for detailed error information
- Ensure all environment variables are correctly configured
- Verify file upload limits and supported formats
- Review API endpoint documentation for proper request formatting

---

**Built with ❤️ for better health insights through AI-powered analysis.**