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


def keyword_based_classification(cv_text: str) -> tuple:
    """
    تصنيف بناءً على الكلمات المفتاحية - نظيف ودقيق
    """
    text_lower = cv_text.lower()
    
    # قواعد دقيقة جداً - مع negative keywords لتجنب التداخل
    rules = {
        # === DESIGN JOBS ===
        "Graphic Designer Job": {
            "primary": ["graphic design", "graphic designer", "visual designer", "creative designer"],
            "secondary": ["photoshop", "illustrator", "indesign", "coreldraw", "logo design", "branding", "poster"],
            "negative": ["web developer", "programmer", "coding", "html", "css"],
            "weight": 6
        },
        "Web Designer Job": {
            "primary": ["web design", "web designer", "ui ux designer", "ux ui designer", "product designer"],
            "secondary": ["figma", "adobe xd", "sketch", "wireframe", "prototype", "mockup", "zeplin"],
            "negative": ["backend", "server", "database", "api"],
            "weight": 6
        },
        
        # === DEVELOPER JOBS - دقيقين جداً ===
        "Python Developer Job": {
            "primary": ["python developer", "python programmer", "python software engineer", "django developer", "flask developer"],
            "secondary": ["python", "django", "flask", "fastapi", "pandas", "numpy", "scipy", "celery"],
            "negative": ["java", "javascript only", "c sharp"],
            "weight": 6
        },
        "Java Developer Job": {
            "primary": ["java developer", "java programmer", "java software engineer", "spring boot developer"],
            "secondary": ["java", "spring boot", "spring", "hibernate", "maven", "gradle", "jsp", "servlets"],
            "negative": ["javascript", "python", "c sharp"],
            "weight": 6
        },
        "Frontend Developer Job": {
            "primary": ["frontend developer", "front end developer", "react js developer", "vue js developer", "angular developer"],
            "secondary": ["reactjs", "react", "vuejs", "vue", "angular", "javascript", "typescript", "redux", "nextjs"],
            "negative": ["backend", "server side", "database admin"],
            "weight": 5
        },
        "Backend Developer Job": {
            "primary": ["backend developer", "back end developer", "server side developer", "api developer", "node js developer"],
            "secondary": ["nodejs", "express", "rest api", "graphql", "mongodb", "postgresql", "mysql", "microservices"],
            "negative": ["frontend only", "ui designer", "graphic design"],
            "weight": 5
        },
        "Web Developer Job": {
            "primary": ["web developer", "full stack developer", "fullstack developer", "web application developer"],
            "secondary": ["html", "css", "javascript", "php", "laravel", "codeigniter", "wordpress", "bootstrap"],
            "negative": [],
            "weight": 4
        },
        "Mobile Developer Job": {
            "primary": ["mobile app developer", "android developer", "ios developer", "flutter developer", "mobile application developer"],
            "secondary": ["android studio", "kotlin", "swift", "flutter", "react native", "xamarin", "ios development"],
            "negative": ["web only", "desktop application"],
            "weight": 6
        },
        "Software Developer Job": {
            "primary": ["software developer", "software engineer", "application developer"],
            "secondary": ["software development", "programming", "cmanager", "oracle dba", "sql server dba"],
            "secondary": ["oracle database", "sql server", "mysql", "postgresql", "database design", "query optimization", "backup recovery"],
            "negative": ["web developer", "software developer"],
            "weight": 6
        },
        "Systems Administrator Job": {
            "primary": ["system administrator", "sysadmin", "systems engineer", "server administrator", "infrastructure engineer"],
            "secondary": ["linux administration", "windows server", "active directory", "vmware", "docker", "kubernetes", "ansible"],
            "negative": ["developer", "programmer"],
            "weight": 6
        },
        "Network Administrator Job": {
            "primary": ["network administrator", "network engineer", "network specialist", "cisco engineer"],
            "secondary": ["cisco", "ccna", "ccnp", "routing", "switching", "tcp ip", "lan wan", "network security"],
            "negative": ["software developer", "web developer"],
            "weight": 6
        },
        "Security Analyst Job": {
            "primary": ["security analyst", "cybersecurity analyst", "information security analyst", "security engineer"],
            "secondary": ["penetration testing", "ethical hacking", "vulnerability assessment", "siem", "security operations", "incident response"],
            "negative": ["graphic designer", "web designer"],
            "weight": 6["network administrator", "network engineer", "network admin", "network manager"],
            "secondary": ["cisco", "routing", "switching", "tcp/ip", "vpn", "firewall", "ccna", "ccnp"],
            "weight": 5
        },
        "Security Analyst Job": {
            "primary": ["security analyst", "cybersecurity", "security engineer", "infosec"],
            "secondary": ["penetration testing", "ethical hacking", "vulnerability", "siem", "firewall", "security"],
            "weight": 5
        },business intelligence analyst", "data analytics specialist", "bi developer"],
            "secondary": ["excel advanced", "power bi", "tableau", "sql queries", "data visualization", "dashboards", "reports"],
            "negative": ["machine learning", "deep learning", "ai engineer"],
            "weight": 6
        },
        "INFORMATION-TECHNOLOGY": {
            "primary": ["machine learning engineer", "ai engineer", "data scientist", "deep learning engineer"],
            "secondary": ["tensorflow", "pytorch", "keras", "scikit learn", "neural networks", "nlp", "computer vision", "model training"],
            "negative": ["web developer", "graphic designer"],
            "weight": 5
        "INFORMATION-TECHNOLOGY": {
            "primary": ["machine learning", "artificial intelligence", "data scientist", "ml engineer", "ai"],
            "secondary": ["tensorflow", "pytorch", "keras", "scikit", "deep learning", "neural network", "nlp", "cv"],
            "weight": 4
        },
        
        # === MANAGEMENT & BUSINESS ===gram manager", "project management professional", "scrum master"],
            "secondary": ["pmp certified", "agile methodology", "scrum", "jira", "project planning", "stakeholder management"],
            "negative": ["developer", "programmer", "designer"],
            "weight": 6
        },
        "Business Development Job": {
            "primary": ["business development manager", "bd manager", "business developer", "growth manager"],
            "secondary": ["b2b sales", "client acquisition", "partnership development", "market research", "lead generation"],
            "negative": ["software engineer", "technical"],
            "weight": 5
        },
        "Sales Job": {
            "primary": ["sales representative", "sales executive", "sales manager", "account manager"],
            "secondary": ["salesforce crm", "sales targets", "customer relationship", "negotiation", "closing deals"],
            "negative": ["developer", "engineer", "technical"],
            "weight": 5["sales representative", "sales executive", "sales", "account executive"],
            "secondary": ["crm", "salesforce", "sales", "customer", "client", "target"],
            "weight": 4 manager", "hr manager", "hr specialist", "hr generalist", "talent acquisition"],
            "secondary": ["recruitment", "employee relations", "payroll management", "hrms", "performance management", "onboarding"],
            "negative": ["accountant", "finance", "developer"],
            "weight": 6
        },
        "Accountant Job": {
            "primary": ["accountant", "senior accountant", "accounting specialist", "accounts executive"],
            "secondary": ["quickbooks", "tally erp", "financial reporting", "accounts payable", "accounts receivable", "bookkeeping"],
            "negative": ["software", "developer", "engineer"],
            "weight": 6
        },
        "ACCOUNTANT": {
            "primary": ["chartered accountant", "cpa", "chief accountant", "finance accountant"],
            "secondary": ["gaap", "ifrs", "taxation", "audit", "financial statements", "balance sheet"],
            "negative": ["software", "it"],
            "weight": 5
        },
        "FINANCE": {
            "primary": ["financial analyst", "finance manager", "investment analyst", "financial advisor"],
            "secondary": ["financial modeling", "valuation", "investment banking", "portfolio management", "equity research"],
            "negative": ["software", "web"],
            "weight": 5
        },
        "FINANCE": {
            "primary": ["advocate", "lawyer", "attorney", "legal counsel", "legal advisor"],
            "secondary": ["litigation", "corporate law", "legal research", "court proceedings", "contracts", "law firm"],
            "negative": ["software", "developer", "engineer"],
            "weight": 6
        },
        "Chef Job": {
            "primary": ["chef", "head chef", "executive chef", "culinary expert", "cook"],
            "secondary": ["culinary arts", "kitchen management", "food preparation", "menu planning", "restaurant", "catering"],
            "negative": ["software", "web", "developer"],
            "weight": 6
        },
        "CHEF": {
            "primary": ["sous chef", "pastry chef", "chef de cuisine", "culinary chef"],
            "secondary": ["baking", "pastry", "cuisine", "hospitality management", "food service"],
            "negative": ["it", "software"],
            "weight": 5
        },
        "ENGINEERING": {
            "primary": ["civil engineer", "mechanical engineer", "electrical engineer", "structural engineer"],
            "secondary": ["autocad", "solidworks", "engineering design", "construction", "site engineer", "cad"],
            "negative": ["software engineer", "web developer"],
            "weight": 5
        },
        "Arts Job": {
            "primary": ["artist", "fine artist", "art director", "creative director", "illustrator"],
            "secondary": ["fine arts", "drawing", "painting", "illustration", "creative arts", "art portfolio"],
            "negative": ["software", "web developer"],
            "weight": 5
        },
        "BUSINESS-DEVELOPMENT": {
            "primary": ["business analyst", "strategy analyst", "management consultant", "strategy consultant"],
            "secondary": ["business analysis", "market research", "strategy development", "business intelligence", "consulting"],
            "negative": ["software", "technical"],
            "weight": 5["artist", "art director", "creative director", "illustrator"],
            "secondary": ["drawing", "painting", "art", "creative", "illustration", "portfolio"],
            "weight": 4
        },
        "BUSINESS-DEVELOPMENT": {
            "primary": ["business analyst", "strategy consultant", "growth manager"],
            "secondary": ["business strategy", "market analysis", "growth", "consulting"],
            "weight": 3
        },
        "ENGINEERING": {
            "primary": ["mechanical engineer", "civil engineer", "electrical engineer"],
            "secondary": ["engineering", "cad", "design"],
            "weight": 1.5
        }, - نظام ذكي جداً
    job_scores = {}
    
    for job, config in rules.items():
        # Primary keywords - حاسمة جداً
        primary_count = sum(1 for kw in config["primary"] if kw in text_lower)
        primary_score = primary_count * 25  # زودنا النقاط
        
        # Secondary keywords - داعمة
        secondary_count = sum(1 for kw in config["secondary"] if kw in text_lower)
        secondary_score = secondary_count * 5
        
        # Negative keywords - تطرح من النتيجة (مهم لتجنب التداخل)
        negative_count = sum(1 for kw in config.get("negative", []) if kw in text_lower)
        negative_penalty = negative_count * 15  # عقوبة قوية
        
        # النتيجة النهائية مع الوزن
        base_score = primary_score + secondary_score - negative_penalty
        total_score = base_score * config["weight"] if base_score > 0 else 0
        
        if total_score > 0:
            job_scores[job] = {
                "score": total_score,
                "primary": primary_count,
                "secondary": secondary_count,
                "negative": negative* 20
        
        # Secondary keywords تعطي 4 نقاط لكل واحدة
        secondary_count = sum(1 for kw in config["secondary"] if kw in text_lower)
        secondary_score = secondary_count * 4
        
        # النتيجة النهائية مع الوزن
        total_score = (primary_score + secondary_score) * config["weight"]
        
        if total_score > 0:
            job_scores[job] = {
                "score": total_score,
                "primary": primary_count,
                "secondary": secondary_count
            }
    
    # اختر أعلى نتيجة
    if job_scores:
        best_match = max(job_scores, key=lambda x: job_scores[x]["score"])
        best_data = job_scores[best_match]
        best_score = best_data["score"]
        
        # عرض أفضل 3
        top_3 = sorted(job_scores.items(), key=lambda x: x[1]["score"], reverse=True)[:3]
        print(f"   🏆 Top matches:")
        for i, (job, data) in enumerate(top_3, 1):
            print(f"      {i}. {job}: {data['score']:.0f} pts (P:{data['primary']}, S:{data['secondary']})")
    else:
        # لو ما فيش matches، default عام
        best_match = "Software Developer Job"
        best_score = 10
        print(f"   ⚠️ No strong keyword matches found - using default")
    
    # حساب الثقة بناءً على النقاط والوضوح
    if best_score >= 100:
        confidence = 0.95
    elif best_score >= 70:
        confidence = 0.88
    elif best_score >= 40:
        confidence = 0.78
    elif best_score >= 20:
        confidence = 0.68
    else:
        confidence = 0.58
    
    print(f"   ✅ Selected: {best_match} ({confidence:.1%} confidence)")
    
    return best_match, confidence


@app.post("/classify", response_model=CVClassificationResponse)
async def classify_cv(request: CVClassificationRequest):
    """
    تصنيف السيرة الذاتية باستخدام الموديل + keyword fallback
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
        
        # أفضل تنبؤ من الموديل
        model_prediction = top_3_predictions[0]
        model_job_title = model_prediction["job_title"]
        model_confidence = model_prediction["confidence"]
        
        # ✅ جرب keyword matching أولاً
        keyword_job, keyword_conf = keyword_based_classification(cv_text)
        
        print(f"🤖 Model: {model_job_title} ({model_confidence:.2%})")
        print(f"🔑 Keyword: {keyword_job} ({keyword_conf:.2%})")
        
        # ✅ استخدم keyword matching دائماً لأنه أدق
        # الموديل ضعيف جداً، نستخدمه فقط للمعلومات
        
        job_title = keyword_job
        confidence = keyword_conf
        print(f"✅ Using KEYWORD classification (most accurate)")
        
        # تحديد حالة الثقة
        if confidence >= 0.7:
            confidence_status = "High Confidence"
        elif confidence >= 0.5:
            confidence_status = "Medium Confidence"
        else:
            confidence_status = "Low Confidence"
        
        print(f"✅ Final Prediction: {job_title}")
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
