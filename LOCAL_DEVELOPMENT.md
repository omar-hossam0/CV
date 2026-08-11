# Local Development Guide

## Overview

This document provides instructions for setting up and running the CV/Resume Matching Platform locally for development and testing.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (v5.0 or higher)

## Project Structure

```
CV/
├── Backend/              # Node.js/Express API server
├── Frontend/             # React/Vite application
├── model-1-cv-matcher/   # ML Model 1: CV-Job Matching
├── model-2-cv-classifier/# ML Model 2: CV Classification
├── model-3-skill-analyzer/# ML Model 3: Skill Analysis
└── model-4-chat-model/   # ML Model 4: Career Chat
```

## Port Configuration

| Service       | Port | Description                    |
|---------------|------|--------------------------------|
| Frontend      | 5174 | React/Vite development server  |
| Backend       | 5000 | Node.js/Express API server     |
| Model 1       | 5001 | CV-Job Matching Service        |
| Model 2       | 5002 | CV Classification Service      |
| Model 3       | 5003 | Skill Analysis Service         |
| Model 4       | 5004 | Career Chat Service            |
| MongoDB       | 27017| MongoDB database               |

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd CV

# Install Backend dependencies
cd Backend
npm install

# Install Frontend dependencies
cd ../Frontend
npm install

# Return to root
cd ..
```

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp Backend/.env.example Backend/.env

# Edit Backend/.env and set:
# - JWT_SECRET (required)
# - MONGODB_URI (optional, defaults to localhost)
# - ML service URLs (optional, have defaults)
```

**Important**: You must set a secure `JWT_SECRET` in `Backend/.env`. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Start MongoDB

Ensure MongoDB is running on port 27017:

```bash
# Windows
mongod

# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 4. Start Services

#### Option A: Use Startup Scripts

```bash
# Windows (PowerShell)
.\START_LOCAL.ps1

# Windows (Batch)
START_LOCAL.bat
```

#### Option B: Manual Startup

Open separate terminal windows for each service:

```bash
# Terminal 1: Backend
cd Backend
npm run dev

# Terminal 2: Model 1 (CV-Job Matcher)
cd model-1-cv-matcher
python cv_job_matcher.py

# Terminal 3: Model 2 (CV Classifier)
cd model-2-cv-classifier
python cv_classifier.py

# Terminal 4: Model 3 (Skill Analyzer)
cd model-3-skill-analyzer
python skill_analyzer.py

# Terminal 5: Model 4 (Chat Model)
cd model-4-chat-model
python chat_model.py

# Terminal 6: Frontend
cd Frontend
npm run dev
```

### 5. Verify Services

After starting all services, verify they are running:

- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:5000
- **Model 1 Health**: http://localhost:5001/health
- **Model 2 Health**: http://localhost:5002/health
- **Model 3 Health**: http://localhost:5003/health
- **Model 4 Health**: http://localhost:5004/health

## API Endpoints

### Authentication

| Method | Endpoint              | Description       | Auth Required |
|--------|-----------------------|-------------------|---------------|
| POST   | /api/auth/register    | Register new user | No            |
| POST   | /api/auth/login       | Login user        | No            |
| GET    | /api/auth/me          | Get profile       | Yes           |
| PUT    | /api/auth/me          | Update profile    | Yes           |

### Jobs

| Method | Endpoint              | Description       | Auth Required |
|--------|-----------------------|-------------------|---------------|
| GET    | /api/jobs             | Get all jobs      | Yes           |
| GET    | /api/jobs/:id         | Get job details   | Yes           |
| POST   | /api/jobs             | Create job        | Yes (HR)      |
| PUT    | /api/jobs/:id         | Update job        | Yes (HR)      |
| DELETE | /api/jobs/:id         | Delete job        | Yes (HR)      |

### ML Services

| Method | Endpoint                    | Description           | Auth Required |
|--------|-----------------------------|-----------------------|---------------|
| POST   | /api/ml/match-jobs          | Match jobs to CV      | Yes           |
| POST   | /api/ml/classify-cv         | Classify CV           | Yes           |
| POST   | /api/ml/analyze-job/:jobId  | Analyze job match     | Yes           |
| POST   | /api/ml/chat                | Career chat           | Yes           |

## ML Services Architecture

```
Frontend → Backend → Model 1 (CV-Job Matcher)
                   → Model 2 (CV Classifier)
                   → Model 3 (Skill Analyzer)
                   → Model 4 (Chat Model)
```

Each ML service runs independently and communicates with the backend via HTTP.

### Model 1: CV-Job Matching (Port 5001)

- **Endpoint**: POST `/match-jobs`
- **Input**: CV text + job descriptions
- **Output**: Matched jobs with scores
- **Technology**: BERT Sentence Transformers + Hybrid Matching

### Model 2: CV Classification (Port 5002)

- **Endpoint**: POST `/classify`
- **Input**: CV text
- **Output**: Predicted job title + confidence
- **Technology**: Keyword matching + optional Groq AI

### Model 3: Skill Analysis (Port 5003)

- **Endpoint**: POST `/analyze`
- **Input**: CV text + job description
- **Output**: Matched/missing skills + match percentage
- **Technology**: Keyword extraction + scoring

### Model 4: Career Chat (Port 5004)

- **Endpoint**: POST `/chat`
- **Input**: Question + context
- **Output**: Career advice response
- **Technology**: Groq API or local fallback

## Troubleshooting

### Backend Won't Start

1. Check if MongoDB is running
2. Verify `JWT_SECRET` is set in `Backend/.env`
3. Check if port 5000 is already in use

### ML Service Won't Start

1. Ensure Python dependencies are installed:
   ```bash
   cd model-1-cv-matcher
   pip install -r requirements.txt
   ```
2. Check if the required port is available
3. Check Python version (3.8+ required)

### Frontend Build Fails

1. Clear node_modules and reinstall:
   ```bash
   cd Frontend
   rm -rf node_modules
   npm install
   ```
2. Check Node.js version (18+ required)

### CORS Errors

The backend is configured to allow requests from `http://localhost:5174` in development. If you're using a different port, update `CORS_ORIGIN` in `Backend/.env`.

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload in development mode
2. **API Testing**: Use the home route `http://localhost:5000` to see available endpoints
3. **Logs**: Check terminal windows for service logs
4. **Database**: Use MongoDB Compass to inspect the database

## Next Steps

After verifying local development works:

1. Run end-to-end tests
2. Test all ML service integrations
3. Prepare for Docker containerization
