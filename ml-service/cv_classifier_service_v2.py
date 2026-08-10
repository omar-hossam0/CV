"""
CV Classification Service - IMPROVED VERSION
Uses cv_classifier_merged.keras + vectorizer + label encoder (same as GUI)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
import os
import re
import sys
from typing import Optional
import json
import joblib

# Ensure UTF-8 stdout
sys.stdout.reconfigure(encoding="utf-8")

app = FastAPI(title="CV Classification Service - TF-IDF")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model components
MODEL_PATH = "cv_classifier_merged.keras"
VECTORIZER_PATH = "vectorizer_merged.pkl"
LABEL_ENCODER_PATH = "label_encoder_merged.pkl"

model = None
vectorizer = None
label_encoder = None
JOB_CATEGORIES = []


class CVClassificationRequest(BaseModel):
    cv_text: str
    use_groq_analysis: bool = False


class CVClassificationResponse(BaseModel):
    success: bool
    job_title: str
    confidence: float
    confidence_status: Optional[str] = None
    decision_method: Optional[str] = None
    top_5_predictions: Optional[list] = None
    error: Optional[str] = None


def clean_text(text: str) -> str:
    """Clean text - same as GUI"""
    if not isinstance(text, str):
        return ""
    
    text = text.lower()
    text = re.sub(r"[^a-zA-Z0-9\s\-\.]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    
    return text


def load_model():
    """Load model components"""
    global model, vectorizer, label_encoder, JOB_CATEGORIES
    
    try:
        # Check both current dir and parent dir
        paths_to_check = [
            (".", MODEL_PATH, VECTORIZER_PATH, LABEL_ENCODER_PATH),
            ("..", MODEL_PATH, VECTORIZER_PATH, LABEL_ENCODER_PATH)
        ]
        
        model_loaded = False
        
        for base_dir, model_file, vec_file, le_file in paths_to_check:
            model_path = os.path.join(base_dir, model_file)
            vec_path = os.path.join(base_dir, vec_file)
            le_path = os.path.join(base_dir, le_file)
            
            if os.path.exists(model_path) and os.path.exists(vec_path) and os.path.exists(le_path):
                # Load model
                model = tf.keras.models.load_model(model_path)
                print(f"✅ Model loaded from: {model_path}")
                print(f"   Input: {model.input_shape}, Output: {model.output_shape}")
                
                # Load vectorizer
                vectorizer = joblib.load(vec_path)
                print(f"✅ Vectorizer loaded from: {vec_path}")
                
                # Load label encoder
                label_encoder = joblib.load(le_path)
                JOB_CATEGORIES = list(label_encoder.classes_)
                print(f"✅ Label Encoder loaded from: {le_path}")
                print(f"   Categories: {len(JOB_CATEGORIES)}")
                
                model_loaded = True
                break
        
        if not model_loaded:
            print("❌ Model files not found!")
            return
        
        # Display some categories
        print(f"\n📊 Sample categories:")
        for i, cat in enumerate(JOB_CATEGORIES[:10], 1):
            print(f"   {i}. {cat}")
        if len(JOB_CATEGORIES) > 10:
            print(f"   ... and {len(JOB_CATEGORIES) - 10} more\n")
            
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        import traceback
        traceback.print_exc()


def initialize_groq():
    """Initialize Groq (optional)"""
    pass  # Not needed for now


@app.on_event("startup")
async def startup_event():
    """Startup handler"""
    print("🚀 Starting CV Classification Service (TF-IDF Version)...")
    load_model()
    initialize_groq()
    print("✅ Service ready!\n")


def classify_with_vectorizer(cv_text: str) -> dict:
    """Classify using TF-IDF Vectorizer + Keras (same as GUI)"""
    
    if model is None or vectorizer is None or label_encoder is None:
        return {"error": "Model components not loaded"}
    
    try:
        # Clean text
        cleaned_text = clean_text(cv_text)
        
        if len(cleaned_text.strip()) < 10:
            return {"error": "Text too short (minimum 10 characters)"}
        
        print(f"📝 Cleaned text: {len(cleaned_text)} chars")
        
        # Vectorize
        X_new = vectorizer.transform([cleaned_text]).toarray()
        print(f"📊 Vector shape: {X_new.shape}")
        
        # Predict
        predictions = model.predict(X_new, verbose=0)
        
        # Top 5
        top_5_indices = np.argsort(predictions[0])[-5:][::-1]
        top_5_scores = predictions[0][top_5_indices]
        
        # Best prediction
        predicted_index = int(top_5_indices[0])
        confidence = float(top_5_scores[0])
        
        # Get category name
        predicted_job = label_encoder.inverse_transform([predicted_index])[0]
        
        # Confidence status
        if confidence >= 0.8:
            status = "HIGH_CONFIDENCE"
        elif confidence >= 0.6:
            status = "MEDIUM_CONFIDENCE"
        else:
            status = "LOW_CONFIDENCE"
        
        # Top 5 list
        top_5_categories = label_encoder.inverse_transform(top_5_indices)
        top_predictions = []
        
        for category, score in zip(top_5_categories, top_5_scores):
            top_predictions.append({
                "job_title": category,
                "confidence": float(score)
            })
        
        return {
            "predicted_job": predicted_job,
            "confidence": confidence,
            "confidence_status": status,
            "method": "tfidf_vectorizer",
            "top_5_predictions": top_predictions
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


@app.post("/classify", response_model=CVClassificationResponse)
async def classify_cv(request: CVClassificationRequest):
    """Classify CV endpoint"""
    
    try:
        cv_text = request.cv_text.strip()
        
        if not cv_text:
            raise HTTPException(status_code=400, detail="CV text required")
        
        print(f"\n{'='*60}")
        print(f"📄 CV Length: {len(cv_text)} chars")
        print(f"{'='*60}\n")
        
        # Classify
        result = classify_with_vectorizer(cv_text)
        
        if "error" in result:
            return CVClassificationResponse(
                success=False,
                job_title="Error",
                confidence=0.0,
                error=result["error"]
            )
        
        print(f"\n✅ Result: {result['predicted_job']} ({result['confidence']*100:.1f}%)")
        print(f"{'='*60}\n")
        
        return CVClassificationResponse(
            success=True,
            job_title=result["predicted_job"],
            confidence=result["confidence"],
            confidence_status=result.get("confidence_status"),
            decision_method=result.get("method"),
            top_5_predictions=result.get("top_5_predictions")
        )
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        
        return CVClassificationResponse(
            success=False,
            job_title="Error",
            confidence=0.0,
            error=str(e)
        )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "CV Classification (TF-IDF)",
        "status": "running",
        "model": "loaded" if model else "not loaded",
        "vectorizer": "loaded" if vectorizer else "not loaded",
        "label_encoder": "loaded" if label_encoder else "not loaded",
        "categories": len(JOB_CATEGORIES)
    }


@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "model_ready": model is not None and vectorizer is not None and label_encoder is not None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)
