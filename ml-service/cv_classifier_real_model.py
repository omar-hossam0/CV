"""
CV Classification Service - Real Model Version
Uses mlp_cv_model.h5 with proper tokenizer and 108 job categories
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
import pickle
import os
import sys
from typing import Optional, List

# Ensure UTF-8 stdout
sys.stdout.reconfigure(encoding="utf-8")

app = FastAPI(title="CV Classification Service - Real Model")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
model = None
tokenizer = None
job_categories = []

# 108 Job Categories - comprehensive list
JOB_CATEGORIES_108 = [
    "Software Engineer", "Data Scientist", "Machine Learning Engineer",
    "Full Stack Developer", "Frontend Developer", "Backend Developer",
    "DevOps Engineer", "Cloud Architect", "Data Engineer",
    "AI Engineer", "Python Developer", "Java Developer",
    "JavaScript Developer", "Mobile Developer", "iOS Developer",
    "Android Developer", "React Developer", "Angular Developer",
    "Node.js Developer", "PHP Developer", "Ruby Developer",
    "C++ Developer", "C# Developer", "Go Developer",
    "Kotlin Developer", "Swift Developer", "Flutter Developer",
    "Database Administrator", "SQL Developer", "MongoDB Developer",
    "PostgreSQL Developer", "Oracle Developer", "MySQL Developer",
    "System Administrator", "Network Engineer", "Security Engineer",
    "Cybersecurity Analyst", "Penetration Tester", "Security Architect",
    "QA Engineer", "Test Automation Engineer", "QA Analyst",
    "Software Tester", "Performance Tester", "Manual Tester",
    "Product Manager", "Project Manager", "Scrum Master",
    "Agile Coach", "Business Analyst", "Data Analyst",
    "Business Intelligence Analyst", "Analytics Engineer", "ETL Developer",
    "UI/UX Designer", "UI Designer", "UX Designer",
    "Graphic Designer", "Product Designer", "Interaction Designer",
    "Web Designer", "Visual Designer", "Motion Designer",
    "Technical Writer", "Content Writer", "Technical Documentation Specialist",
    "Site Reliability Engineer", "Platform Engineer", "Infrastructure Engineer",
    "Kubernetes Engineer", "Docker Specialist", "CI/CD Engineer",
    "Release Manager", "Build Engineer", "Configuration Manager",
    "Blockchain Developer", "Solidity Developer", "Web3 Developer",
    "Smart Contract Developer", "Cryptocurrency Developer", "DApp Developer",
    "Game Developer", "Unity Developer", "Unreal Engine Developer",
    "Game Designer", "Game Programmer", "Graphics Programmer",
    "Embedded Systems Engineer", "Firmware Engineer", "IoT Developer",
    "Hardware Engineer", "FPGA Engineer", "ASIC Engineer",
    "Computer Vision Engineer", "NLP Engineer", "Deep Learning Engineer",
    "Research Scientist", "Applied Scientist", "AI Researcher",
    "Robotics Engineer", "Automation Engineer", "Control Systems Engineer",
    "SAP Developer", "Salesforce Developer", "ServiceNow Developer",
    "SharePoint Developer", "Power BI Developer", "Tableau Developer",
    "ERP Developer", "CRM Developer", "Workday Developer",
    "Solutions Architect", "Enterprise Architect", "Technical Architect",
    "Integration Architect", "API Developer", "Microservices Architect"
]


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
    decision_method: str
    top_5_predictions: List[PredictionItem]
    ai_analysis: Optional[str] = None
    keras_prediction: Optional[str] = None


def load_components():
    """Load model and tokenizer"""
    global model, tokenizer, job_categories
    
    print("\n" + "=" * 60)
    print("🚀 Loading CV Classification Components...")
    print("=" * 60)
    
    try:
        # Load model - check multiple paths
        model_paths = [
            "../MYYYYY/MYYYYY/mlp_cv_model.h5",
            "MYYYYY/MYYYYY/mlp_cv_model.h5",
            "mlp_cv_model.h5"
        ]
        
        model_loaded = False
        for model_path in model_paths:
            if os.path.exists(model_path):
                print(f"\n📦 Loading model from: {model_path}")
                model = tf.keras.models.load_model(model_path)
                print(f"✅ Model loaded!")
                print(f"   Input shape: {model.input_shape}")
                print(f"   Output shape: {model.output_shape}")
                model_loaded = True
                break
        
        if not model_loaded:
            raise FileNotFoundError("Model file not found in any expected location")
        
        # Load tokenizer
        tokenizer_paths = [
            "../last-one/tokenizer.pkl",
            "last-one/tokenizer.pkl",
            "tokenizer.pkl"
        ]
        
        tokenizer_loaded = False
        for tok_path in tokenizer_paths:
            if os.path.exists(tok_path):
                print(f"\n📦 Loading tokenizer from: {tok_path}")
                with open(tok_path, "rb") as f:
                    tokenizer = pickle.load(f)
                print(f"✅ Tokenizer loaded!")
                print(f"   Vocabulary size: {len(tokenizer.word_index)}")
                tokenizer_loaded = True
                break
        
        if not tokenizer_loaded:
            raise FileNotFoundError("Tokenizer file not found")
        
        # Set job categories
        job_categories = JOB_CATEGORIES_108
        print(f"\n✅ Job categories loaded: {len(job_categories)} categories")
        print(f"   Sample: {job_categories[:5]}")
        
        print("\n" + "=" * 60)
        print("✅ All components loaded successfully!")
        print("=" * 60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error loading components: {e}")
        import traceback
        traceback.print_exc()
        raise


def classify_cv(cv_text: str) -> dict:
    """Classify CV using the real model"""
    
    if model is None or tokenizer is None:
        return {"error": "Model not loaded"}
    
    try:
        # Preprocess text
        print(f"\n📄 Processing CV ({len(cv_text)} chars)...")
        
        # Tokenize
        sequences = tokenizer.texts_to_sequences([cv_text])
        print(f"   Tokenized sequence length: {len(sequences[0])}")
        
        # Pad to 3000 (model input size)
        padded = pad_sequences(sequences, maxlen=3000, padding='post')
        print(f"   Padded shape: {padded.shape}")
        
        # Predict
        print(f"   Running prediction...")
        predictions = model.predict(padded, verbose=0)
        
        # Get top 5 predictions
        top_5_indices = np.argsort(predictions[0])[-5:][::-1]
        top_5_scores = predictions[0][top_5_indices]
        
        # Best prediction
        best_idx = int(top_5_indices[0])
        best_score = float(top_5_scores[0])
        
        # Map to job category
        if best_idx < len(job_categories):
            predicted_job = job_categories[best_idx]
        else:
            predicted_job = f"Category_{best_idx}"
        
        print(f"\n✅ Prediction: {predicted_job} ({best_score*100:.1f}%)")
        
        # Build top 5 list
        top_predictions = []
        for idx, score in zip(top_5_indices, top_5_scores):
            if idx < len(job_categories):
                job_name = job_categories[idx]
            else:
                job_name = f"Category_{idx}"
            
            top_predictions.append({
                "job_title": job_name,
                "confidence": float(score)
            })
        
        return {
            "predicted_job": predicted_job,
            "confidence": best_score,
            "top_5_predictions": top_predictions,
            "method": "keras_mlp_model"
        }
        
    except Exception as e:
        print(f"\n❌ Classification error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    load_components()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "CV Classification - Real Model",
        "status": "running",
        "model_loaded": model is not None,
        "tokenizer_loaded": tokenizer is not None,
        "job_categories": len(job_categories)
    }


@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "model_ready": model is not None and tokenizer is not None,
        "categories_count": len(job_categories)
    }


@app.post("/classify", response_model=CVClassificationResponse)
async def classify_endpoint(request: CVClassificationRequest):
    """Classify CV endpoint"""
    
    try:
        cv_text = request.cv_text.strip()
        
        if not cv_text or len(cv_text) < 50:
            raise HTTPException(
                status_code=400,
                detail="CV text is too short (minimum 50 characters)"
            )
        
        # Classify
        result = classify_cv(cv_text)
        
        if "error" in result:
            return CVClassificationResponse(
                success=False,
                job_title="Error",
                confidence=0.0,
                decision_method="error",
                top_5_predictions=[],
                keras_prediction=result["error"]
            )
        
        return CVClassificationResponse(
            success=True,
            job_title=result["predicted_job"],
            confidence=result["confidence"],
            decision_method=result["method"],
            top_5_predictions=result["top_5_predictions"],
            keras_prediction=result["predicted_job"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Endpoint error: {e}")
        import traceback
        traceback.print_exc()
        
        return CVClassificationResponse(
            success=False,
            job_title="Error",
            confidence=0.0,
            decision_method="error",
            top_5_predictions=[],
            keras_prediction=str(e)
        )


if __name__ == "__main__":
    import uvicorn
    
    port = 5002
    print(f"\n🚀 Starting CV Classification Service on port {port}...")
    print(f"📝 Health: http://localhost:{port}/health")
    print(f"🔬 Classify: POST http://localhost:{port}/classify")
    print("\nPress Ctrl+C to stop\n")
    
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
