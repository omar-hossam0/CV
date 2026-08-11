"""
Model 2: CV Classifier Model
Classifies CVs into job categories using keyword matching + optional Groq AI
Port: 5002
"""

import sys
import os
import json
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import uvicorn

sys.stdout.reconfigure(encoding="utf-8")

app = FastAPI(title="CV Classifier Model")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Job categories with keywords
JOB_KEYWORDS = {
    "Software Engineer": [
        "software", "engineer", "developer", "programming", "coding",
        "algorithms", "data structures", "object-oriented", "design patterns",
        "unit testing", "code review", "git", "agile"
    ],
    "Frontend Developer": [
        "react", "angular", "vue", "javascript", "typescript", "html", "css",
        "sass", "scss", "webpack", "vite", "nextjs", "next.js", "ui", "ux",
        "responsive", "accessibility", "browser", "dom", "frontend"
    ],
    "Backend Developer": [
        "node", "nodejs", "express", "django", "flask", "fastapi", "spring",
        "api", "rest", "graphql", "database", "sql", "nosql", "mongodb",
        "postgresql", "mysql", "redis", "server", "backend"
    ],
    "Full Stack Developer": [
        "full stack", "fullstack", "full-stack", "mern", "mean", "lamp",
        "frontend", "backend", "database", "api", "deployment"
    ],
    "Data Scientist": [
        "data science", "machine learning", "deep learning", "statistics",
        "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras",
        "data analysis", "visualization", "jupyter", "notebook", "r programming",
        "regression", "classification", "clustering", "neural network"
    ],
    "Machine Learning Engineer": [
        "machine learning", "deep learning", "ai", "artificial intelligence",
        "neural network", "tensorflow", "pytorch", "keras", "model",
        "training", "inference", "deployment", "mlops", "gpu", "cuda"
    ],
    "DevOps Engineer": [
        "docker", "kubernetes", "k8s", "jenkins", "ci/cd", "terraform",
        "ansible", "aws", "azure", "gcp", "cloud", "infrastructure",
        "monitoring", "logging", "devops", "sre", "automation"
    ],
    "Mobile Developer": [
        "android", "ios", "react native", "flutter", "swift", "kotlin",
        "mobile", "app", "xcode", "android studio", "react-native"
    ],
    "UI/UX Designer": [
        "ui", "ux", "design", "figma", "sketch", "adobe xd", "photoshop",
        "illustrator", "wireframe", "prototype", "user research", "usability",
        "interaction design", "visual design", "typography"
    ],
    "QA Engineer": [
        "testing", "qa", "quality assurance", "automation", "selenium",
        "jest", "mocha", "cypress", "playwright", "test cases", "bug",
        "regression", "integration testing", "unit testing"
    ],
    "Cloud Engineer": [
        "aws", "azure", "gcp", "cloud", "ec2", "s3", "lambda", "serverless",
        "kubernetes", "docker", "terraform", "cloudformation", "devops"
    ],
    "Cybersecurity Engineer": [
        "security", "cybersecurity", "penetration testing", "vulnerability",
        "firewall", "siem", "encryption", "owasp", "network security",
        "incident response", "compliance", "audit"
    ],
    "Project Manager": [
        "project management", "agile", "scrum", "kanban", "jira",
        "stakeholder", "timeline", "budget", "risk management", "leadership"
    ],
    "Database Administrator": [
        "database", "sql", "mysql", "postgresql", "oracle", "mongodb",
        "backup", "replication", "performance tuning", "dba", "schema"
    ],
    "Accountant": [
        "accounting", "finance", "tax", "audit", "bookkeeping", "quickbooks",
        "financial", "budget", "revenue", "ledger", "gaap", "ifrs"
    ],
    "HR Manager": [
        "human resources", "hr", "recruitment", "hiring", "onboarding",
        "payroll", "benefits", "employee relations", "performance review"
    ],
    "Marketing Manager": [
        "marketing", "seo", "sem", "social media", "content", "brand",
        "advertising", "campaign", "analytics", "google ads", "facebook ads"
    ],
    "Sales Representative": [
        "sales", "crm", "lead", "prospecting", "pipeline", "quota",
        "revenue", "negotiation", "cold calling", "closing"
    ],
    "Healthcare Professional": [
        "medical", "healthcare", "patient", "clinical", "hospital",
        "nursing", "pharmacy", "diagnosis", "treatment", "doctor"
    ],
    "Teacher": [
        "teaching", "education", "curriculum", "student", "classroom",
        "lesson plan", "pedagogy", "assessment", "learning"
    ],
}


class CVClassificationRequest(BaseModel):
    cv_text: str
    use_groq_analysis: bool = False


class PredictionItem(BaseModel):
    job_title: str
    confidence: float


class CVClassificationResponse(BaseModel):
    success: bool
    job_title: str
    confidence: float
    decision_method: Optional[str] = None
    top_5_predictions: List[PredictionItem] = []
    error: Optional[str] = None


def classify_with_keywords(cv_text: str) -> dict:
    """Classify CV using keyword matching"""
    text_lower = cv_text.lower()

    scores = {}
    for job_title, keywords in JOB_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        scores[job_title] = score

    # Sort by score
    sorted_jobs = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    if sorted_jobs[0][1] == 0:
        return {
            "predicted_job": "Software Engineer",
            "confidence": 0.5,
            "method": "default",
            "scores": scores
        }

    best_job = sorted_jobs[0][0]
    best_score = sorted_jobs[0][1]
    max_possible = max(len(kw) for kw in JOB_KEYWORDS.values())
    confidence = min(best_score / max_possible * 100, 100) / 100
    confidence = max(confidence, 0.5)

    top_5 = []
    for job, score in sorted_jobs[:5]:
        if score > 0:
            conf = min(score / max_possible * 100, 100) / 100
            conf = max(conf, 0.3)
            top_5.append(PredictionItem(job_title=job, confidence=round(conf, 3)))

    return {
        "predicted_job": best_job,
        "confidence": round(confidence, 3),
        "method": "keyword_matching",
        "top_5": top_5,
        "scores": scores
    }


def extract_skills_from_text(text: str) -> list:
    """Extract skills from CV text"""
    text_lower = text.lower()
    all_skills = [
        'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
        'react', 'vue', 'angular', 'nodejs', 'express', 'django', 'flask', 'spring',
        'mongodb', 'postgresql', 'mysql', 'redis', 'docker', 'kubernetes',
        'aws', 'azure', 'gcp', 'git', 'linux', 'html', 'css', 'sql',
        'machine learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'rest api'
    ]
    return [skill for skill in all_skills if skill in text_lower]


@app.post("/classify", response_model=CVClassificationResponse)
async def classify_cv(request: CVClassificationRequest):
    """Classify CV to determine job title"""
    try:
        cv_text = request.cv_text.strip()
        if not cv_text:
            raise HTTPException(status_code=400, detail="CV text is required")

        print(f"📄 Classifying CV ({len(cv_text)} chars)")

        result = classify_with_keywords(cv_text)

        print(f"✅ Classification: {result['predicted_job']} ({result['confidence']*100:.1f}%)")

        return CVClassificationResponse(
            success=True,
            job_title=result["predicted_job"],
            confidence=result["confidence"],
            decision_method=result["method"],
            top_5_predictions=result.get("top_5", [])
        )
    except Exception as e:
        print(f"❌ Error: {e}")
        return CVClassificationResponse(
            success=False,
            job_title="Error",
            confidence=0.0,
            error=str(e)
        )


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "categories": len(JOB_KEYWORDS),
        "service": "CV Classifier Model"
    }


@app.get("/")
async def root():
    return {
        "service": "CV Classifier Model",
        "version": "1.0",
        "categories": list(JOB_KEYWORDS.keys()),
        "endpoints": {
            "classify": "/classify (POST)",
            "health": "/health (GET)"
        }
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5002)
