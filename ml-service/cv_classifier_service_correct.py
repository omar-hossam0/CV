"""
CV Classification Service - CORRECT VERSION
يستخدم موديل mlp_cv_model_improved.keras مع TF-IDF vectorizer
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
import joblib
import os
import re
import sys
from typing import Optional
import json

# Ensure UTF-8 stdout to avoid Windows encoding errors with logs
sys.stdout.reconfigure(encoding="utf-8")

app = FastAPI(title="CV Classification Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# المسارات
MODEL_PATH = "../cv_classifier_merged.keras"
VECTORIZER_PATH = "../vectorizer_merged.pkl"
LABEL_ENCODER_PATH = "../label_encoder_merged.pkl"

# المتغيرات العامة
model = None
vectorizer = None
label_encoder = None


class CVClassificationRequest(BaseModel):
    cv_text: str
    use_groq_analysis: bool = False  # لن نستخدمه حالياً


class CVClassificationResponse(BaseModel):
    success: bool
    job_title: str
    confidence: float
    confidence_status: str
    top_3_predictions: Optional[list] = None
    error: Optional[str] = None


def clean_text(text: str) -> str:
    """تنظيف النص بنفس طريقة التدريب"""
    if not text or text.strip() == "":
        return ""
    
    text = str(text).lower()
    # إزالة الرموز الخاصة، بقاء المسافات والأحرف والأرقام
    text = re.sub(r'[^a-z\s]', ' ', text)
    # إزالة المسافات الزائدة
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def load_model():
    """تحميل الموديل والـ vectorizer والـ label encoder"""
    global model, vectorizer, label_encoder
    
    try:
        print("=" * 80)
        print("🚀 Loading CV Classification Model...")
        print("=" * 80)
        
        # تحميل الـ vectorizer
        if os.path.exists(VECTORIZER_PATH):
            vectorizer = joblib.load(VECTORIZER_PATH)
            print(f"✅ Vectorizer loaded: {len(vectorizer.vocabulary_)} features")
        else:
            print(f"❌ Vectorizer not found at {VECTORIZER_PATH}")
            return False
        
        # تحميل الـ label encoder
        if os.path.exists(LABEL_ENCODER_PATH):
            label_encoder = joblib.load(LABEL_ENCODER_PATH)
            print(f"✅ Label Encoder loaded: {len(label_encoder.classes_)} classes")
            print(f"   Classes: {list(label_encoder.classes_)}")
        else:
            print(f"❌ Label Encoder not found at {LABEL_ENCODER_PATH}")
            return False
        
        # تحميل الموديل
        if os.path.exists(MODEL_PATH):
            model = tf.keras.models.load_model(MODEL_PATH)
            print(f"✅ Model loaded successfully")
            print(f"   Input shape: {model.input_shape}")
            print(f"   Output shape: {model.output_shape}")
        else:
            print(f"❌ Model not found at {MODEL_PATH}")
            return False
        
        print("=" * 80)
        print("✅ All components loaded successfully!")
        print("=" * 80)
        return True
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        import traceback
        traceback.print_exc()
        return False


@app.on_event("startup")
async def startup_event():
    """تشغيل عند بدء السيرفر"""
    success = load_model()
    if not success:
        print("⚠️ Warning: Model loading failed. Service may not work properly.")


@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "running",
        "service": "CV Classification",
        "model_loaded": model is not None,
        "vectorizer_loaded": vectorizer is not None,
        "label_encoder_loaded": label_encoder is not None
    }


@app.post("/classify", response_model=CVClassificationResponse)
async def classify_cv(request: CVClassificationRequest):
    """
    تصنيف السيرة الذاتية باستخدام الموديل
    """
    try:
        # التحقق من تحميل الموديل
        if model is None or vectorizer is None or label_encoder is None:
            raise HTTPException(status_code=500, detail="Model not loaded")
        
        # تنظيف النص
        cv_text = request.cv_text
        if not cv_text or cv_text.strip() == "":
            raise HTTPException(status_code=400, detail="CV text is empty")
        
        cleaned_text = clean_text(cv_text)
        
        print("=" * 80)
        print(f"📄 CV Length: {len(cv_text)} chars")
        print("=" * 80)
        
        # تحويل النص إلى features باستخدام الـ vectorizer
        X_new = vectorizer.transform([cleaned_text]).toarray()
        print(f"📝 Cleaned text: {len(cleaned_text)} chars")
        print(f"📊 Vector shape: {X_new.shape}")
        
        # التنبؤ
        predictions = model.predict(X_new, verbose=0)
        predicted_probs = predictions[0]
        
        # الحصول على أعلى 3 تنبؤات
        top_3_indices = np.argsort(predicted_probs)[-3:][::-1]
        top_3_predictions = []
        
        for idx in top_3_indices:
            job_class = label_encoder.inverse_transform([idx])[0]
            confidence = float(predicted_probs[idx])
            top_3_predictions.append({
                "job_title": job_class,
                "confidence": confidence
            })
        
        # أفضل تنبؤ
        best_prediction = top_3_predictions[0]
        job_title = best_prediction["job_title"]
        confidence = best_prediction["confidence"]
        
        # تحديد حالة الثقة
        if confidence >= 0.7:
            confidence_status = "High Confidence"
        elif confidence >= 0.5:
            confidence_status = "Medium Confidence"
        else:
            confidence_status = "Low Confidence"
        
        print(f"✅ Prediction: {job_title}")
        print(f"📊 Confidence: {confidence:.2%}")
        print(f"📈 Top 3: {[p['job_title'] for p in top_3_predictions]}")
        print("=" * 80)
        
        return CVClassificationResponse(
            success=True,
            job_title=job_title,
            confidence=confidence,
            confidence_status=confidence_status,
            top_3_predictions=top_3_predictions,
            error=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return CVClassificationResponse(
            success=False,
            job_title="Error",
            confidence=0.0,
            confidence_status="",
            error=str(e)
        )


if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting CV Classification Service on port 5002...")
    print("✅ Using MYYYYY model with TF-IDF vectorizer")
    print("📊 26 job categories supported")
    uvicorn.run(app, host="0.0.0.0", port=5002)
