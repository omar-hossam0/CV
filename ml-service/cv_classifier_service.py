"""
CV Classification Service
يستخدم موديل cv_classifier_merged.keras مع Groq API لتصنيف السير الذاتية
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

# Ensure UTF-8 stdout to avoid Windows encoding errors with logs
sys.stdout.reconfigure(encoding="utf-8")

# استيراد Groq API
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("⚠️ Groq library not available. Will use only Keras model.")

app = FastAPI(title="CV Classification Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# تحميل موديل Keras
MODEL_PATH = "cv_classifier_merged.keras"
model = None
groq_client = None
JOB_CATEGORIES = []  # سيتم تحميلها من ملف JSON


class CVClassificationRequest(BaseModel):
    cv_text: str
    use_groq_analysis: bool = True


class CVClassificationResponse(BaseModel):
    success: bool
    job_title: str
    confidence: float
    decision_method: Optional[str] = None
    ai_analysis: Optional[dict] = None
    keras_prediction: Optional[dict] = None
    error: Optional[str] = None


def load_model():
    """تحميل موديل Keras والفئات"""
    global model, JOB_CATEGORIES
    try:
        # تحميل الفئات من ملف JSON
        classes_path = "job_classes.json"
        if os.path.exists(classes_path):
            with open(classes_path, 'r', encoding='utf-8') as f:
                JOB_CATEGORIES = json.load(f)
            print(f"✅ Loaded {len(JOB_CATEGORIES)} job categories")
        else:
            print(f"⚠️ Classes file not found at {classes_path}")
            # استخدام قائمة افتراضية
            JOB_CATEGORIES = ["Software Engineer", "Data Scientist", "Web Developer"]
        
        # تحميل الموديل
        if os.path.exists(MODEL_PATH):
            model = tf.keras.models.load_model(MODEL_PATH)
            print(f"✅ Keras model loaded successfully from {MODEL_PATH}")
            print(f"   Input shape: {model.input_shape}")
            print(f"   Output shape: {model.output_shape}")
        else:
            # البحث عن الموديل في المجلد الرئيسي
            parent_model_path = os.path.join("..", MODEL_PATH)
            if os.path.exists(parent_model_path):
                model = tf.keras.models.load_model(parent_model_path)
                print(f"✅ Keras model loaded from parent directory: {parent_model_path}")
                print(f"   Input shape: {model.input_shape}")
                print(f"   Output shape: {model.output_shape}")
            else:
                print(f"⚠️ Model file not found at {MODEL_PATH}")
                print(f"⚠️ Also checked: {parent_model_path}")
                model = None
    except Exception as e:
        print(f"❌ Error loading Keras model: {e}")
        model = None


def initialize_groq():
    """تهيئة Groq API"""
    global groq_client
    if not GROQ_AVAILABLE:
        return
    
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        try:
            groq_client = Groq(api_key=api_key)
            print("✅ Groq client initialized successfully")
        except Exception as e:
            print(f"❌ Error initializing Groq: {e}")
            groq_client = None
    else:
        print("⚠️ GROQ_API_KEY not found in environment variables")


@app.on_event("startup")
async def startup_event():
    """تشغيل عند بدء السيرفر"""
    print("🚀 Starting CV Classification Service...")
    load_model()
    initialize_groq()
    print("✅ Service ready!")


def extract_text_features(text: str) -> np.ndarray:
    """
    استخراج features من النص - عمل text padding ل 8000 characters
    الموديل يتوقع CV text بطول محدد (8000)
    
    استخدام TF-IDF أو character-level encoding
    """
    # نظف النص وحوله لأحرف صغيرة
    text = text.lower().strip()
    
    # Pad أو truncate إلى 8000 characters بالضبط
    if len(text) > 8000:
        text = text[:8000]
    elif len(text) < 8000:
        # بدلاً من مجرد spaces، استخدم padding ذكي
        text = text + '\n' * (8000 - len(text))
    
    # تحويل النص إلى character-level features
    features = []
    for char in text:
        # تحويل كل حرف إلى قيمة وتطبيعها
        # استخدم ord() بشكل أفضل
        if char == '\n':
            features.append(0.0)  # newline
        elif char == ' ':
            features.append(0.1)  # space
        else:
            # normalize ASCII value between 0.1 and 1.0
            ascii_val = ord(char)
            if ascii_val < 32:  # control characters
                features.append(0.05)
            else:
                # Map printable characters (32-126) to 0.2-1.0
                features.append(min(max((ascii_val - 32) / (126 - 32) * 0.8 + 0.2, 0.2), 1.0))
    
    # تأكد من أن الحجم بالضبط 8000
    features_array = np.array(features, dtype=np.float32).reshape(1, 8000)
    
    return features_array


def classify_with_keras_model(cv_text: str) -> dict:
    """تصنيف باستخدام موديل Keras"""
    if model is None:
        return {"error": "Model not loaded"}
    
    try:
        # استخراج features
        features = extract_text_features(cv_text)
        print(f"📊 Features shape: {features.shape}")
        
        # التنبؤ
        predictions = model.predict(features, verbose=0)
        print(f"📊 Predictions shape: {predictions.shape}")
        
        # الحصول على أعلى 3 تنبؤات
        top_3_indices = np.argsort(predictions[0])[-3:][::-1]
        top_3_scores = predictions[0][top_3_indices]
        
        # الحصول على أفضل تنبؤ
        predicted_index = int(top_3_indices[0])
        confidence = float(top_3_scores[0])
        
        if predicted_index < len(JOB_CATEGORIES):
            predicted_job = JOB_CATEGORIES[predicted_index]
        else:
            predicted_job = f"Class_{predicted_index}"
        
        # تجهيز top 3
        top_predictions = []
        for idx, score in zip(top_3_indices, top_3_scores):
            job_name = JOB_CATEGORIES[int(idx)] if int(idx) < len(JOB_CATEGORIES) else f"Class_{idx}"
            top_predictions.append({
                "job_title": job_name,
                "confidence": float(score)
            })
        
        return {
            "predicted_job": predicted_job,
            "confidence": confidence,
            "method": "keras_model",
            "top_3_predictions": top_predictions,
            "total_classes": len(JOB_CATEGORIES)
        }
        
    except Exception as e:
        print(f"❌ Error in Keras prediction: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


def detect_domain_role(text_lower: str) -> Optional[str]:
    """اكتشاف دور عام من كلمات نطاق غير تقني مثل الرعاية الصحية"""
    healthcare_terms = [
        'hospital', 'clinic', 'patient', 'healthcare', 'medical', 'doctor', 'nurse',
        'pharmacy', 'pharmacist', 'therapist', 'surgery', 'laboratory', 'radiology'
    ]
    if any(term in text_lower for term in healthcare_terms):
        return "Healthcare Professional"
    return None


def extract_analysis_from_text(cv_text: str) -> dict:
    """استخراج التحليل من النص مباشرة (بدون API)"""
    text_lower = cv_text.lower()
    
    # استخراج المهارات
    all_skills = [
        'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
        'react', 'vue', 'angular', 'nodejs', 'express', 'django', 'flask', 'spring',
        'mongodb', 'postgresql', 'mysql', 'redis', 'docker', 'kubernetes',
        'aws', 'azure', 'gcp', 'git', 'linux', 'html', 'css', 'sql',
        'machine learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'rest api'
    ]
    
    found_skills = [skill for skill in all_skills if skill in text_lower]
    
    # استخراج سنوات الخبرة
    experience_years = 0
    import re
    years_match = re.search(r'(\d+)\s*(?:years?|yrs?|سنة|سنوات)', text_lower)
    if years_match:
        experience_years = int(years_match.group(1))
    
    # استخراج اللغات البرمجية
    languages = []
    lang_keywords = {
        'Python': 'python',
        'JavaScript': 'javascript',
        'Java': 'java',
        'C++': 'c++',
        'C#': 'c#',
        'PHP': 'php',
        'Ruby': 'ruby',
        'Go': 'go',
        'TypeScript': 'typescript'
    }
    
    for lang_name, keyword in lang_keywords.items():
        if keyword in text_lower:
            languages.append(lang_name)

    # تحديد دور عام (مثل الرعاية الصحية) إذا لم تكن مهارات تقنية موجودة
    domain_role = detect_domain_role(text_lower)
    primary_role = domain_role or "Software Developer"
    
    return {
        "primary_role": primary_role,
        "skills": found_skills[:15],  # حد أقصى 15 مهارة
        "experience_years": experience_years,
        "languages": languages,
        "projects": [],
        "recommended_categories": []
    }


def analyze_cv_with_groq(cv_text: str) -> dict:
    """تحليل CV باستخدام Groq API"""
    if not groq_client:
        return {"error": "Groq client not available"}
    
    prompt = f"""
Analyze this CV and provide detailed information about the candidate's profile:

CV Text:
{cv_text}

Please provide:
1. Primary job role/title that best fits this candidate
2. Key technical skills mentioned
3. Years of experience (estimate if not explicitly stated)
4. Main programming languages
5. Notable projects or achievements
6. Recommended job categories (from: Frontend Developer, Backend Developer, Full Stack Developer, Mobile Developer, DevOps Engineer, Data Scientist, Machine Learning Engineer, UI/UX Designer, Software Engineer, Quality Assurance Engineer)

Format your response as JSON with these fields:
{{
    "primary_role": "...",
    "skills": ["skill1", "skill2", ...],
    "experience_years": number,
    "languages": ["lang1", "lang2", ...],
    "projects": ["project1", "project2", ...],
    "recommended_categories": ["category1", "category2", ...]
}}
"""
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama3-8b-8192",  # أو أي موديل متاح
            temperature=0.3,
            max_tokens=1024,
        )
        
        response_text = chat_completion.choices[0].message.content
        
        # محاولة استخراج JSON من الرد
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            analysis = json.loads(json_match.group())
            return analysis
        else:
            return {"raw_response": response_text}
            
    except Exception as e:
        return {"error": str(e)}


def classify_with_keywords(cv_text: str) -> dict:
    """تصنيف بسيط باستخدام keyword matching"""
    text_lower = cv_text.lower()
    
    # تعريف keywords لكل فئة
    job_keywords = {
        "Frontend Developer": ['react', 'vue', 'angular', 'javascript', 'html', 'css', 'frontend', 'ui', 'typescript', 'next.js'],
        "Backend Developer": ['node', 'python', 'java', 'django', 'flask', 'spring', 'backend', 'api', 'express', 'fastapi'],
        "Full Stack Developer": ['full stack', 'fullstack', 'mern', 'mean', 'full-stack', 'lamp'],
        "Mobile Developer": ['android', 'ios', 'react native', 'flutter', 'swift', 'kotlin', 'mobile', 'app'],
        "DevOps Engineer": ['docker', 'kubernetes', 'aws', 'azure', 'devops', 'ci/cd', 'jenkins', 'terraform'],
        "Data Scientist": ['data science', 'machine learning', 'pandas', 'numpy', 'python', 'tensorflow', 'pytorch'],
        "Machine Learning Engineer": ['machine learning', 'deep learning', 'ai', 'neural', 'tensorflow', 'pytorch', 'keras'],
    }
    
    # احسب score لكل فئة
    scores = {}
    for job_title, keywords in job_keywords.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        scores[job_title] = score
    
    # احصل على الفئة الأعلى
    best_job = max(scores, key=scores.get)
    best_score = scores[best_job]
    
    # حول score إلى confidence (normalized)
    max_possible_score = max(len(kw) for kw in job_keywords.values())
    confidence = min(best_score / max_possible_score * 100, 100) / 100
    confidence = max(confidence, 0.5)  # حد أدنى 50% إذا وجدنا أي keywords
    
    if best_score == 0:
        confidence = 0.0
    
    return {
        "predicted_job": best_job,
        "confidence": confidence,
        "method": "keyword_matching",
        "scores": scores
    }


@app.post("/classify", response_model=CVClassificationResponse)
async def classify_cv(request: CVClassificationRequest):
    """
    تصنيف CV باستخدام Hybrid Approach: Keras Model + Keyword Matching + AI Analysis
    """
    try:
        cv_text = request.cv_text.strip()
        
        if not cv_text:
            print("❌ CV text is empty")
            raise HTTPException(status_code=400, detail="CV text is required")
        
        print(f"\n{'='*60}")
        print(f"📄 CV Text Length: {len(cv_text)} characters")
        print(f"📚 First 200 chars: {cv_text[:200]}")
        print(f"{'='*60}\n")
        
        # 1. استخدام Keyword Matching أولاً (baseline)
        print("🔎 Step 1: Keyword Matching...")
        keyword_result = classify_with_keywords(cv_text)
        keyword_job = keyword_result.get("predicted_job", "Unknown")
        keyword_confidence = keyword_result.get("confidence", 0.0)
        keyword_scores = keyword_result.get("scores", {})
        max_keyword_score = max(keyword_scores.values()) if keyword_scores else 0
        print(f"   📊 Keyword: {keyword_job} ({keyword_confidence*100:.1f}%) | score={max_keyword_score}")
        
        # 2. استخدام Keras Model (إذا متاح)
        keras_result = None
        keras_job = None
        keras_confidence = 0.0
        
        if model is not None:
            print("🧠 Step 2: Keras Model Classification...")
            keras_result = classify_with_keras_model(cv_text)
            
            if "error" not in keras_result:
                keras_job = keras_result.get("predicted_job", "Unknown")
                keras_confidence = keras_result.get("confidence", 0.0)
                print(f"   📊 Keras: {keras_job} ({keras_confidence*100:.1f}%)")
            else:
                print(f"   ❌ Keras error: {keras_result['error']}")
        
        # 3. دمج النتائج بذكاء (Ensemble)
        print("\n🔄 Step 3: Ensemble Decision...")
        final_job_title = "Unknown"
        final_confidence = 0.0
        decision_method = "keyword_primary"
        
        # استخدم Keywords كأساس (لأن الموديل غير موثوق)
        final_job_title = keyword_job
        final_confidence = keyword_confidence
        
        # حالة 1: Keyword matching قوي (>= 3 matches) - استخدمه مباشرة
        if max_keyword_score >= 3:
            decision_method = "keyword_strong"
            # زيادة الثقة قليلاً إذا كانت Keywords قوية
            final_confidence = min(keyword_confidence * 1.1, 0.95)
            print(f"   ✅ Strong keyword match ({max_keyword_score} matches)")
        
        # حالة 2: Keyword matching متوسط (1-2 matches)
        elif max_keyword_score >= 1:
            decision_method = "keyword_moderate"
            print(f"   ✓ Moderate keyword match ({max_keyword_score} matches)")
            
            # إذا كان Keras يتفق مع Keywords، زد الثقة
            if keras_job and keras_job == keyword_job:
                final_confidence = min((keyword_confidence + keras_confidence) / 2.0 * 1.15, 0.90)
                decision_method = "keyword_keras_agreement"
                print(f"   ✅ Keras agrees with keywords!")
        
        # حالة 3: لا توجد keywords واضحة (0 matches)
        else:
            print(f"   ⚠️ No keyword matches found")
            decision_method = "text_analysis"
            
            # استخدم Text Analysis
            ai_analysis_temp = extract_analysis_from_text(cv_text)
            if ai_analysis_temp and "primary_role" in ai_analysis_temp:
                final_job_title = ai_analysis_temp["primary_role"]
                final_confidence = 0.65
                decision_method = "text_analysis_fallback"
                print(f"   → Using text analysis: {final_job_title}")
            else:
                # آخر محاولة: استخدم Keras
                if keras_job:
                    final_job_title = keras_job
                    final_confidence = min(keras_confidence * 0.7, 0.70)  # خفض الثقة
                    decision_method = "keras_last_resort"
                    print(f"   → Using Keras as last resort")
                else:
                    final_job_title = "Software Engineer"  # default
                    final_confidence = 0.50
                    decision_method = "default"
                    print(f"   → Using default")
        
        # 4. اختياري: AI Analysis للتحسين
        ai_analysis = None
        if request.use_groq_analysis or final_confidence < 0.50:
            print("\n🤖 Step 4: AI Analysis...")
            if groq_client:
                ai_analysis = analyze_cv_with_groq(cv_text)
            else:
                ai_analysis = extract_analysis_from_text(cv_text)
            
            if ai_analysis and "primary_role" in ai_analysis:
                ai_role = ai_analysis.get("primary_role")
                print(f"   📊 AI: {ai_role}")
                
                # استخدم AI فقط إذا كانت الثقة منخفضة جداً
                if final_confidence < 0.50:
                    final_job_title = ai_role
                    final_confidence = 0.70
                    decision_method = "ai_low_confidence"
                    print(f"   ✅ Using AI (low confidence)")
        
        print(f"\n{'='*60}")
        print(f"✅ FINAL: {final_job_title} ({final_confidence*100:.1f}%) [{decision_method}]")
        print(f"{'='*60}\n")
        
        # إعداد الاستجابة
        response_data = {
            "job_title": final_job_title,
            "confidence": final_confidence,
            "decision_method": decision_method,
            "ai_analysis": ai_analysis,
            "keras_prediction": keras_result if keras_result else keyword_result
        }
        
        return CVClassificationResponse(
            success=True,
            **response_data
        )
        
    except Exception as e:
        print(f"❌ Error in classify_cv: {e}")
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
    """صفحة الرئيسية"""
    return {
        "service": "CV Classification Service",
        "status": "running",
        "keras_model": "loaded" if model else "not loaded",
        "groq_api": "available" if groq_client else "not available",
        "endpoints": {
            "classify": "/classify (POST)",
            "health": "/health (GET)"
        }
    }


@app.get("/health")
async def health():
    """فحص حالة السيرفر"""
    return {
        "status": "healthy",
        "keras_model": model is not None,
        "groq_api": groq_client is not None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)
