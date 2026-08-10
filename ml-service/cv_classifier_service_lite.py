"""
CV Classification Service - Lightweight Version (No TensorFlow Required)
Uses keyword-based classification + optional Groq API for analysis
This is a fallback service when the Keras model is not available
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import re
import sys
from typing import Optional

# Ensure UTF-8 stdout
sys.stdout.reconfigure(encoding="utf-8")

# Try to import Groq
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

app = FastAPI(title="CV Classification Service - Lightweight")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Job categories with keywords
JOB_CATEGORIES = {
    "Software Engineer": [
        "software engineer", "developer", "full stack", "backend", "frontend",
        "python", "javascript", "java", "c++", "react", "node", "express",
        "api", "rest", "microservices", "database", "sql", "mongodb"
    ],
    "Data Scientist": [
        "data scientist", "machine learning", "ml", "deep learning", "ai",
        "tensorflow", "pytorch", "sklearn", "pandas", "numpy", "analytics",
        "data analysis", "python", "nlp", "computer vision", "predictive"
    ],
    "DevOps Engineer": [
        "devops", "docker", "kubernetes", "ci/cd", "jenkins", "ansible",
        "terraform", "infrastructure", "cloud", "aws", "azure", "gcp",
        "linux", "deployment", "monitoring"
    ],
    "Data Engineer": [
        "data engineer", "etl", "data pipeline", "spark", "hadoop", "hive",
        "kafka", "data warehouse", "bigquery", "snowflake", "airflow",
        "data integration", "database design"
    ],
    "QA Engineer": [
        "qa", "quality assurance", "testing", "automation", "selenium",
        "pytest", "test case", "bug", "qc", "performance testing",
        "security testing", "manual testing"
    ],
    "Mobile Developer": [
        "mobile", "ios", "android", "react native", "flutter", "swift",
        "kotlin", "xamarin", "app development", "cross-platform"
    ],
    "Cloud Architect": [
        "cloud architect", "aws", "azure", "gcp", "infrastructure",
        "architecture", "scaling", "high availability", "disaster recovery",
        "security"
    ],
    "Business Analyst": [
        "business analyst", "requirements", "analysis", "documentation",
        "stakeholder", "process improvement", "workflow", "reporting"
    ],
    "Product Manager": [
        "product manager", "product owner", "roadmap", "strategy",
        "feature development", "release", "agile", "scrum", "jira"
    ],
}

class CVClassificationRequest(BaseModel):
    cv_text: str
    use_groq_analysis: bool = False

class CVClassificationResponse(BaseModel):
    success: bool
    job_title: str
    confidence: float
    decision_method: str
    ai_analysis: Optional[str] = None
    keras_prediction: Optional[str] = None

# Initialize Groq client
groq_client = None
if GROQ_AVAILABLE:
    try:
        groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        print("✅ Groq API initialized")
    except Exception as e:
        print(f"⚠️  Groq API not available: {e}")


def extract_keywords_from_cv(cv_text: str) -> dict:
    """Extract keywords and their frequencies from CV"""
    cv_lower = cv_text.lower()
    
    keyword_counts = {}
    for job_category, keywords in JOB_CATEGORIES.items():
        count = 0
        for keyword in keywords:
            # Use word boundaries for more accurate matching
            pattern = r'\b' + re.escape(keyword) + r'\b'
            matches = re.findall(pattern, cv_lower, re.IGNORECASE)
            count += len(matches)
        
        if count > 0:
            keyword_counts[job_category] = count
    
    return keyword_counts


def classify_cv_keywords(cv_text: str) -> tuple:
    """Classify CV based on keyword matching"""
    keyword_counts = extract_keywords_from_cv(cv_text)
    
    if not keyword_counts:
        # Default classification
        return "Software Engineer", 0.5, "default"
    
    # Find the category with the most keywords
    best_category = max(keyword_counts, key=keyword_counts.get)
    max_count = keyword_counts[best_category]
    
    # Calculate confidence (0.0 to 1.0)
    total_keywords = sum(keyword_counts.values())
    confidence = min(1.0, max_count / max(10, total_keywords / len(JOB_CATEGORIES)))
    
    return best_category, confidence, "keyword_matching"


def analyze_cv_with_groq(cv_text: str, predicted_job: str) -> str:
    """Use Groq API to analyze CV and provide insights"""
    if not groq_client:
        return None
    
    try:
        prompt = f"""Analyze this CV and provide a brief assessment (2-3 sentences) about the candidate's fit for a {predicted_job} role.

CV Content:
{cv_text[:2000]}  # Limit to first 2000 chars

Provide a concise analysis focusing on:
1. Key relevant experience
2. Skill alignment
3. Areas for growth"""

        message = groq_client.messages.create(
            model="mixtral-8x7b-32768",
            max_tokens=200,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return message.content[0].text
    except Exception as e:
        print(f"⚠️  Groq analysis failed: {e}")
        return None


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "CV Classification Service (Lightweight)",
        "groq_available": GROQ_AVAILABLE
    }


@app.post("/classify", response_model=CVClassificationResponse)
async def classify(request: CVClassificationRequest):
    """Classify CV to determine job title"""
    try:
        if not request.cv_text or len(request.cv_text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="CV text is too short or empty"
            )
        
        # Keyword-based classification
        job_title, confidence, method = classify_cv_keywords(request.cv_text)
        
        # Groq-based analysis (optional)
        ai_analysis = None
        if request.use_groq_analysis and GROQ_AVAILABLE:
            ai_analysis = analyze_cv_with_groq(request.cv_text, job_title)
        
        return CVClassificationResponse(
            success=True,
            job_title=job_title,
            confidence=confidence,
            decision_method=method,
            ai_analysis=ai_analysis,
            keras_prediction=None  # No TensorFlow model
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error classifying CV: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CV Classification Service is running",
        "endpoints": {
            "health": "/health",
            "classify": "/classify (POST)"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    port = 5002
    print(f"\n🚀 CV Classifier Service (Lightweight) starting on port {port}...")
    print(f"📝 Health check: http://localhost:{port}/health")
    print(f"🔬 Classification: POST http://localhost:{port}/classify")
    print(f"📚 Categories: {len(JOB_CATEGORIES)} job types")
    print(f"🤖 Groq AI: {'Enabled' if GROQ_AVAILABLE else 'Disabled'}")
    print("\nPress Ctrl+C to stop\n")
    
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
