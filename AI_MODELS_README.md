# 🤖 AI Models Documentation

## Overview

This project contains **4 AI Models** that provide intelligent features for the CV-Job Matching Platform. Each model is organized in its own separate folder and can run independently.

---

## 📁 Model Structure

```
CV/
├── model-1-cv-matcher/          # CV-Job Matching Model (Port 5001)
│   ├── cv_job_matcher.py        # Main service
│   ├── test_model.py            # Test script
│   └── requirements.txt         # Dependencies
│
├── model-2-cv-classifier/       # CV Classification Model (Port 5002)
│   ├── cv_classifier.py         # Main service
│   ├── test_model.py            # Test script
│   └── requirements.txt         # Dependencies
│
├── model-3-skill-analyzer/      # Skill Analysis Model (Port 5003)
│   ├── skill_analyzer.py        # Main service
│   ├── test_model.py            # Test script
│   └── requirements.txt         # Dependencies
│
├── model-4-chat-model/          # Career Assistant Chat Model (Port 5004)
│   ├── chat_model.py            # Main service
│   ├── test_model.py            # Test script
│   └── requirements.txt         # Dependencies
│
└── start_all_models.py          # Startup script for all models
```

---

## 🎯 Model 1: CV-Job Matching Model

**Port:** 5001  
**Purpose:** Matches CVs against job descriptions using hybrid approach (Semantic + Keywords)

### Features
- BERT Sentence Transformers for semantic similarity
- TF-IDF fallback when BERT is unavailable
- Keyword matching for technical skills
- Hybrid scoring: 50% Semantic + 50% Keywords

### API Endpoints

#### POST `/match-jobs`
Match a CV against job descriptions.

**Request:**
```json
{
  "cv_text": "Your CV text here...",
  "job_descriptions": ["Job 1 description", "Job 2 description"],
  "top_k": 10
}
```

**Response:**
```json
{
  "success": true,
  "matches": [
    {"job_index": 0, "similarity_score": 85.5},
    {"job_index": 2, "similarity_score": 72.3}
  ],
  "method": "bert_hybrid"
}
```

#### GET `/health`
Health check endpoint.

### Test Results
```
Test 1: Software Engineer CV → Backend Developer (57.0%) ✓
Test 2: Data Scientist CV → Data Scientist (70.6%) ✓
Test 3: Frontend Developer CV → Frontend Developer (60.1%) ✓
```

---

## 🎯 Model 2: CV Classifier Model

**Port:** 5002  
**Purpose:** Classifies CVs into job categories (20+ categories)

### Features
- Keyword-based classification
- Supports 20+ job categories
- Returns top 5 predictions with confidence scores
- Fast inference (< 100ms)

### Supported Categories
- Software Engineer
- Frontend Developer
- Backend Developer
- Full Stack Developer
- Data Scientist
- Machine Learning Engineer
- DevOps Engineer
- Mobile Developer
- UI/UX Designer
- QA Engineer
- Cloud Engineer
- Cybersecurity Engineer
- Project Manager
- Database Administrator
- Accountant
- HR Manager
- Marketing Manager
- Sales Representative
- Healthcare Professional
- Teacher

### API Endpoints

#### POST `/classify`
Classify a CV into a job category.

**Request:**
```json
{
  "cv_text": "Your CV text here..."
}
```

**Response:**
```json
{
  "success": true,
  "job_title": "Software Engineer",
  "confidence": 0.75,
  "decision_method": "keyword_matching",
  "top_5_predictions": [
    {"job_title": "Software Engineer", "confidence": 0.75},
    {"job_title": "Backend Developer", "confidence": 0.65}
  ]
}
```

#### GET `/health`
Health check endpoint.

### Test Results
```
Test 1: Software Engineer CV → Backend Developer (50.0%) ✓
Test 2: Data Scientist CV → Data Scientist (50.0%) ✓
Test 3: Frontend Developer CV → Frontend Developer (65.0%) ✓
Test 4: DevOps Engineer CV → DevOps Engineer (50.0%) ✓
```

---

## 🎯 Model 3: Skill Analyzer Model

**Port:** 5003  
**Purpose:** Analyzes CV-Job skill matches and identifies missing skills

### Features
- Extracts skills from CV and Job Description
- Calculates match percentage
- Identifies missing skills with priority (HIGH/MEDIUM/LOW)
- Provides YouTube tutorial links for missing skills
- Supports 200+ technical skills

### Skill Categories
- Programming Languages (Python, JavaScript, Java, etc.)
- Frontend (React, Vue, Angular, etc.)
- Backend (Node.js, Django, Flask, etc.)
- Databases (MySQL, PostgreSQL, MongoDB, etc.)
- DevOps (Docker, Kubernetes, AWS, etc.)
- Data Science (ML, TensorFlow, PyTorch, etc.)
- Testing (Jest, Cypress, Selenium, etc.)
- And many more...

### API Endpoints

#### POST `/analyze`
Analyze CV-Job skill match.

**Request:**
```json
{
  "cv_text": "Your CV text here...",
  "job_desc": "Job description here..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cv_skills": ["python", "react", "docker"],
    "job_skills": ["python", "react", "kubernetes", "aws"],
    "matched_skills": ["python", "react"],
    "missing_skills": [
      {
        "skill": "kubernetes",
        "confidence": 0.7,
        "priority": "HIGH",
        "youtube": "https://www.youtube.com/results?search_query=kubernetes tutorial"
      }
    ],
    "match_percentage": 50.0
  }
}
```

#### GET `/health`
Health check endpoint.

### Test Results
```
Test 1: Good Match → 100.0% ✓
Test 2: Poor Match → 9.09% ✓
Test 3: Partial Match → 31.25% ✓
Test 4: High Match → 90.0% ✓
```

---

## 🎯 Model 4: Career Assistant Chat Model

**Port:** 5004  
**Purpose:** AI-powered career assistant chatbot

### Features
- Groq API integration (Llama 3.3 70B)
- Local fallback responses
- Career advice (salary, interview, resume, skills)
- Professional and helpful responses

### Topics Supported
- Salary guidance
- Interview preparation
- Resume/CV improvement
- Skill recommendations
- Career path advice
- General career questions

### API Endpoints

#### POST `/chat`
Chat with the career assistant.

**Request:**
```json
{
  "question": "How should I prepare for a technical interview?",
  "context": "Optional context about the user"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Here are common interview preparation tips...",
  "source": "groq_api"
}
```

#### GET `/health`
Health check endpoint.

### Test Results
```
Test 1: Salary Question ✓
Test 2: Interview Preparation ✓
Test 3: Resume Advice ✓
Test 4: Skills Question ✓
Test 5: Career Path ✓
Test 6: General Question ✓
```

---

## 🚀 Quick Start

### Start All Models
```bash
python start_all_models.py
```

### Start Individual Models
```bash
# Model 1: CV-Job Matcher
cd model-1-cv-matcher
python cv_job_matcher.py

# Model 2: CV Classifier
cd model-2-cv-classifier
python cv_classifier.py

# Model 3: Skill Analyzer
cd model-3-skill-analyzer
python skill_analyzer.py

# Model 4: Chat Model
cd model-4-chat-model
python chat_model.py
```

### Install Dependencies
```bash
# Model 1
cd model-1-cv-matcher && pip install -r requirements.txt

# Model 2
cd model-2-cv-classifier && pip install -r requirements.txt

# Model 3
cd model-3-skill-analyzer && pip install -r requirements.txt

# Model 4
cd model-4-chat-model && pip install -r requirements.txt
```

---

## 🔗 Backend Integration

The models are integrated with the backend via the following endpoints:

| Model | Backend Endpoint | Port |
|-------|------------------|------|
| CV-Job Matcher | `/api/ml/match-jobs` | 5001 |
| CV Classifier | `/api/ml/classify-cv` | 5002 |
| Skill Analyzer | `/api/ml/analyze-job/:jobId` | 5003 |
| Chat Model | `/api/ml/chat` | 5004 |

### Backend Configuration
```javascript
// Backend/controllers/mlController.js
// Uses environment variables with fallback defaults
const ML_SERVICE_URL = process.env.ML_HOST || "http://localhost:5001";           // Model 1: CV-Job Matcher
const CV_CLASSIFIER_URL = process.env.CV_CLASSIFIER_URL || "http://localhost:5002"; // Model 2: CV Classifier
const SKILL_MATCHER_URL = process.env.SKILL_MATCHER_URL || "http://localhost:5003"; // Model 3: Skill Analyzer
const CHAT_MODEL_URL = process.env.CHAT_MODEL_URL || "http://localhost:5004";       // Model 4: Chat Model
```

---

## 🧪 Testing

### Run All Tests
```bash
# Test Model 1
cd model-1-cv-matcher && python test_model.py

# Test Model 2
cd model-2-cv-classifier && python test_model.py

# Test Model 3
cd model-3-skill-analyzer && python test_model.py

# Test Model 4
cd model-4-chat-model && python test_model.py
```

### Test Results Summary
```
✅ Model 1 (CV-Job Matcher): 3/3 tests passed
✅ Model 2 (CV Classifier): 4/4 tests passed
✅ Model 3 (Skill Analyzer): 4/4 tests passed
✅ Model 4 (Chat Model): 6/6 tests passed

Total: 17/17 tests passed
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    (React Application)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│                  (Node.js/Express)                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              mlController.js                        │   │
│  │  - matchJobs() → Model 1                            │   │
│  │  - classifyCV() → Model 2                           │   │
│  │  - analyzeJobForUser() → Model 3                    │   │
│  │  - chatModel() → Model 4                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Model 1       │ │   Model 2       │ │   Model 3       │
│   CV-Job        │ │   CV            │ │   Skill         │
│   Matcher       │ │   Classifier    │ │   Analyzer      │
│   (Port 5001)   │ │   (Port 5002)   │ │   (Port 5003)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │               │               │
          ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                               │
│                   (MongoDB)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5001
kill <PID>
```

### Model Not Starting
1. Check Python version (3.8+ required)
2. Install dependencies: `pip install -r requirements.txt`
3. Check if port is available

### Backend Connection Issues
1. Ensure all models are running
2. Check firewall settings
3. Verify port configuration in `mlController.js`

---

## 📝 License

This project is part of the CV-Job Matching Platform.
