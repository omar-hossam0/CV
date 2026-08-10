"""
Hybrid CV Classification Service
Uses Groq AI for intelligent analysis + keyword matching as fallback
No dependency on poorly-trained model
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import re
import sys
from typing import Optional, List
from collections import Counter

# Ensure UTF-8 stdout
sys.stdout.reconfigure(encoding="utf-8")

# Try to import Groq
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

app = FastAPI(title="CV Classification Service - Hybrid AI")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
groq_client = None

# Comprehensive job categories with keyword patterns - ALL FIELDS
JOB_CATEGORIES_PATTERNS = {
    # Technical Roles
    "Machine Learning Engineer": {
        "keywords": ["machine learning", "ml", "deep learning", "neural network", "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "model training", "supervised learning", "unsupervised learning", "reinforcement learning", "computer vision", "nlp"],
        "weight": 3
    },
    "Data Scientist": {
        "keywords": ["data scien", "data analysis", "statistical", "pandas", "numpy", "data mining", "predictive model", "analytics", "r programming", "jupyter", "visualization", "insights", "regression", "classification"],
        "weight": 2.5
    },
    "AI Engineer": {
        "keywords": ["artificial intelligence", "ai", "computer vision", "nlp", "natural language", "chatbot", "transformers", "bert", "gpt", "llm", "ai model"],
        "weight": 3
    },
    "Software Engineer": {
        "keywords": ["software engineer", "software develop", "programming", "coding", "algorithms", "data structures", "oop", "object-oriented", "software design", "java", "python", "c++", "c#", "golang", "rust"],
        "weight": 2
    },
    "Full Stack Developer": {
        "keywords": ["full stack", "fullstack", "frontend", "backend", "mern", "mean", "lamp", "web application", "full-stack", "react", "node.js", "mongodb"],
        "weight": 2.5
    },
    "Frontend Developer": {
        "keywords": ["frontend", "front-end", "react", "angular", "vue", "html", "css", "javascript", "typescript", "ui developer", "responsive", "web design", "next.js", "tailwind"],
        "weight": 2.5
    },
    "Backend Developer": {
        "keywords": ["backend", "back-end", "api", "rest", "graphql", "node", "express", "microservices", "server", "database", "django", "flask", "spring boot", "laravel"],
        "weight": 2.5
    },
    "DevOps Engineer": {
        "keywords": ["devops", "docker", "kubernetes", "k8s", "ci/cd", "jenkins", "terraform", "ansible", "deployment", "infrastructure", "automation"],
        "weight": 2.5
    },
    "Data Engineer": {
        "keywords": ["data engineer", "etl", "data pipeline", "spark", "hadoop", "airflow", "kafka", "data warehouse", "snowflake", "bigquery", "data integration"],
        "weight": 2.5
    },
    "Mobile Developer": {
        "keywords": ["mobile", "ios", "android", "react native", "flutter", "swift", "kotlin", "app development", "mobile app"],
        "weight": 2.5
    },
    "Cloud Engineer": {
        "keywords": ["aws", "azure", "gcp", "cloud", "ec2", "s3", "lambda", "cloud architecture", "cloud computing"],
        "weight": 2.5
    },
    "QA Engineer": {
        "keywords": ["qa", "quality assurance", "testing", "test automation", "selenium", "pytest", "test cases", "bug", "quality control"],
        "weight": 2
    },
    "Database Administrator": {
        "keywords": ["database admin", "dba", "mysql", "postgresql", "oracle", "sql server", "database management", "sql"],
        "weight": 2
    },
    "Cybersecurity Analyst": {
        "keywords": ["security", "cybersecurity", "penetration test", "vulnerability", "encryption", "firewall", "security analyst", "infosec", "threat"],
        "weight": 2.5
    },
    
    # Business & Management Roles
    "Project Manager": {
        "keywords": ["project manag", "pmp", "agile", "scrum", "project planning", "stakeholder", "timeline", "budget", "resource management", "coordination"],
        "weight": 2.5
    },
    "Product Manager": {
        "keywords": ["product manag", "product owner", "roadmap", "feature", "product strategy", "user story", "backlog", "product development"],
        "weight": 2.5
    },
    "Business Analyst": {
        "keywords": ["business analyst", "requirements", "stakeholder", "process improvement", "business process", "analysis", "documentation", "workflow"],
        "weight": 2
    },
    "Operations Manager": {
        "keywords": ["operations manag", "process optimization", "supply chain", "logistics", "inventory", "operational excellence", "efficiency"],
        "weight": 2
    },
    "Human Resources Manager": {
        "keywords": ["human resources", "hr manager", "recruitment", "talent acquisition", "employee relations", "hiring", "onboarding", "hr"],
        "weight": 2
    },
    "Sales Manager": {
        "keywords": ["sales manag", "business development", "client acquisition", "revenue", "sales strategy", "account management", "sales target"],
        "weight": 2
    },
    "Marketing Manager": {
        "keywords": ["marketing manag", "digital marketing", "brand", "campaign", "market research", "marketing strategy", "seo", "sem", "social media marketing"],
        "weight": 2
    },
    "Public Relations Specialist": {
        "keywords": ["public relations", "pr specialist", "pr manager", "pr coordinator", "media relations", "press release", "communications specialist", "publicity", "corporate communications", "media outreach", "press", "journalist relations", "public image", "reputation management", "crisis communications", "spokesperson", "media coverage", "pr campaign", "press conference", "media strategy", "external relations", "public affairs"],
        "weight": 3.5
    },
    "Communications Manager": {
        "keywords": ["communications", "corporate communication", "internal communication", "external communication", "media", "public affairs", "messaging", "communication strategy"],
        "weight": 2.5
    },
    "Social Media Manager": {
        "keywords": ["social media", "instagram", "facebook", "twitter", "linkedin", "tiktok", "content calendar", "engagement", "social strategy", "community management", "influencer"],
        "weight": 2.5
    },
    
    # Engineering (Non-Software)
    "Civil Engineer": {
        "keywords": ["civil engineer", "structural", "construction", "building", "infrastructure", "autocad", "surveying", "concrete", "foundations", "bridges", "roads", "civil engineering"],
        "weight": 3
    },
    "Mechanical Engineer": {
        "keywords": ["mechanical engineer", "mechanical engineering", "cad", "solidworks", "manufacturing", "hvac", "thermodynamics", "machinery", "automotive", "mechanical design"],
        "weight": 3
    },
    "Electrical Engineer": {
        "keywords": ["electrical engineer", "electrical engineering", "circuit", "power systems", "electronics", "plc", "control systems", "wiring", "electrical design"],
        "weight": 3
    },
    "Chemical Engineer": {
        "keywords": ["chemical engineer", "chemical engineering", "process engineering", "refinery", "petrochemical", "pharmaceuticals", "chemical processes"],
        "weight": 3
    },
    "Industrial Engineer": {
        "keywords": ["industrial engineer", "industrial engineering", "process improvement", "lean", "six sigma", "manufacturing optimization", "production planning"],
        "weight": 2.5
    },
    "Architect": {
        "keywords": ["architect", "architecture", "building design", "autocad", "revit", "3ds max", "architectural design", "blueprints", "urban planning", "interior design"],
        "weight": 3
    },
    
    # Research & Science
    "Research Scientist": {
        "keywords": ["research scientist", "researcher", "laboratory", "lab", "experiment", "scientific research", "phd", "publications", "research methodology"],
        "weight": 2.5
    },
    "Biomedical Engineer": {
        "keywords": ["biomedical", "biomedical engineering", "medical devices", "biomechanics", "prosthetics", "healthcare technology"],
        "weight": 3
    },
    
    # Media & Journalism
    "Journalist": {
        "keywords": ["journalist", "journalism", "reporter", "news", "article", "editor", "newsroom", "investigative", "interview", "press"],
        "weight": 2.5
    },
    "Video Editor": {
        "keywords": ["video editor", "video editing", "premiere", "after effects", "final cut", "video production", "editing", "motion graphics"],
        "weight": 2.5
    },
    "Photographer": {
        "keywords": ["photographer", "photography", "photoshoot", "lightroom", "camera", "portrait", "commercial photography", "studio"],
        "weight": 2.5
    },
    
    # Hospitality & Tourism
    "Hotel Manager": {
        "keywords": ["hotel manager", "hospitality", "hotel operations", "guest services", "front desk", "hotel management"],
        "weight": 2
    },
    "Event Coordinator": {
        "keywords": ["event coordinator", "event planning", "event management", "conferences", "weddings", "corporate events", "venue"],
        "weight": 2
    },
    "Chef": {
        "keywords": ["chef", "culinary", "kitchen", "cooking", "menu", "food preparation", "sous chef", "head chef", "cuisine"],
        "weight": 2.5
    },
    
    # Real Estate
    "Real Estate Agent": {
        "keywords": ["real estate", "property", "realtor", "sales", "listings", "broker", "property management", "commercial real estate"],
        "weight": 2
    },
    
    # Supply Chain & Logistics
    "Supply Chain Manager": {
        "keywords": ["supply chain", "logistics", "procurement", "inventory", "warehouse", "distribution", "shipping", "freight", "vendor management"],
        "weight": 2.5
    },
    "Procurement Specialist": {
        "keywords": ["procurement", "purchasing", "vendor", "supplier", "sourcing", "contracts", "negotiation", "buying"],
        "weight": 2
    },
    
    # Social Services
    "Social Worker": {
        "keywords": ["social worker", "social work", "case management", "counseling", "community services", "child welfare", "family services"],
        "weight": 2.5
    },
    "Psychologist": {
        "keywords": ["psychologist", "psychology", "therapy", "counseling", "mental health", "behavioral", "clinical psychology"],
        "weight": 2.5
    },
    
    # Translation & Languages
    "Translator": {
        "keywords": ["translator", "translation", "interpreter", "bilingual", "multilingual", "localization", "language services"],
        "weight": 2.5
    },
    
    # Consulting
    "Management Consultant": {
        "keywords": ["management consultant", "consulting", "strategy consultant", "business consulting", "advisory", "mckinsey", "bcg", "deloitte"],
        "weight": 2.5
    },
    "IT Consultant": {
        "keywords": ["it consultant", "technology consulting", "systems integration", "digital transformation", "technical consultant"],
        "weight": 2.5
    },
    
    # Manufacturing
    "Production Manager": {
        "keywords": ["production manager", "manufacturing", "factory", "assembly", "production planning", "quality control", "shift supervisor"],
        "weight": 2
    },
    "Quality Control Inspector": {
        "keywords": ["quality control", "qc", "inspection", "quality assurance", "testing", "iso", "compliance testing"],
        "weight": 2
    },
    
    # Finance & Accounting
    "Financial Analyst": {
        "keywords": ["financial analyst", "finance", "financial modeling", "investment", "budgeting", "forecasting", "excel", "financial planning"],
        "weight": 2
    },
    "Accountant": {
        "keywords": ["accountant", "accounting", "bookkeeping", "financial reporting", "audit", "tax", "general ledger", "accounts payable", "accounts receivable", "cpa", "chartered accountant", "gaap", "ifrs"],
        "weight": 2.5
    },
    "Investment Analyst": {
        "keywords": ["investment", "portfolio", "equity", "valuation", "financial markets", "trading", "stock", "bonds", "hedge fund", "asset management", "investment banking"],
        "weight": 2.5
    },
    "Auditor": {
        "keywords": ["auditor", "audit", "internal audit", "external audit", "financial audit", "compliance audit", "audit report"],
        "weight": 2.5
    },
    "Tax Specialist": {
        "keywords": ["tax", "taxation", "tax planning", "tax compliance", "tax returns", "vat", "corporate tax", "income tax"],
        "weight": 2.5
    },
    
    # Healthcare & Medical
    "Medical Doctor": {
        "keywords": ["medical doctor", "physician", "md", "clinical", "patient care", "diagnosis", "treatment", "medicine", "healthcare"],
        "weight": 3
    },
    "Nurse": {
        "keywords": ["nurse", "nursing", "patient care", "rn", "registered nurse", "healthcare", "clinical care"],
        "weight": 2.5
    },
    "Pharmacist": {
        "keywords": ["pharmacist", "pharmacy", "medication", "pharmaceutical", "drug", "prescription"],
        "weight": 2.5
    },
    
    # Education & Training
    "Teacher": {
        "keywords": ["teacher", "teaching", "education", "curriculum", "classroom", "student", "lesson plan", "educator"],
        "weight": 2
    },
    "Training Specialist": {
        "keywords": ["training", "instructor", "learning", "course development", "e-learning", "facilitation", "workshop"],
        "weight": 2
    },
    
    # Design & Creative
    "Graphic Designer": {
        "keywords": ["graphic design", "photoshop", "illustrator", "creative", "visual design", "branding", "typography", "layout"],
        "weight": 2
    },
    "UI/UX Designer": {
        "keywords": ["ui", "ux", "user experience", "user interface", "figma", "sketch", "wireframe", "prototype", "design thinking", "adobe xd", "usability", "interaction design", "user research"],
        "weight": 2.5
    },
    "Content Writer": {
        "keywords": ["content writ", "copywriting", "blog", "article", "content creation", "seo writing", "technical writing", "content marketing", "content strategist", "writer"],
        "weight": 2
    },
    "Graphic Designer": {
        "keywords": ["graphic design", "photoshop", "illustrator", "creative", "visual design", "branding", "typography", "layout", "indesign", "logo design", "print design"],
        "weight": 2.5
    },
    
    # Legal & Compliance
    "Lawyer": {
        "keywords": ["lawyer", "attorney", "legal", "law", "litigation", "contract", "legal counsel", "legal advice"],
        "weight": 2.5
    },
    "Compliance Officer": {
        "keywords": ["compliance", "regulatory", "audit", "policy", "risk management", "governance"],
        "weight": 2
    },
    
    # Customer Service & Support
    "Customer Service Representative": {
        "keywords": ["customer service", "customer support", "call center", "client support", "help desk", "customer care"],
        "weight": 1.5
    },
    "Technical Support Specialist": {
        "keywords": ["technical support", "it support", "troubleshooting", "help desk", "tech support", "user support"],
        "weight": 2
    },
    
    # Administrative
    "Administrative Assistant": {
        "keywords": ["administrative", "office management", "scheduling", "coordination", "clerical", "admin", "receptionist"],
        "weight": 1.5
    },
    "Executive Assistant": {
        "keywords": ["executive assistant", "c-level support", "executive support", "calendar management", "travel coordination"],
        "weight": 2
    }
}


class CVClassificationRequest(BaseModel):
    cv_text: str
    use_groq_analysis: bool = True


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


def extract_keywords_score(cv_text: str) -> dict:
    """Calculate weighted scores for each job category"""
    cv_lower = cv_text.lower()
    
    scores = {}
    
    for job_title, pattern_data in JOB_CATEGORIES_PATTERNS.items():
        keywords = pattern_data["keywords"]
        weight = pattern_data["weight"]
        
        score = 0
        matches_found = []
        
        for keyword in keywords:
            # Use word boundaries for accurate matching
            pattern = r'\b' + re.escape(keyword)
            matches = re.findall(pattern, cv_lower, re.IGNORECASE)
            if matches:
                # Bonus for exact job title match in CV
                if keyword.lower() in job_title.lower():
                    score += len(matches) * weight * 2  # Double weight for title keywords
                else:
                    score += len(matches) * weight
                matches_found.append(keyword)
        
        # Bonus if multiple keywords matched (better confidence)
        if len(matches_found) >= 3:
            score *= 1.5
        elif len(matches_found) >= 5:
            score *= 2
        
        if score > 0:
            scores[job_title] = {
                "score": score,
                "matches": matches_found,
                "match_count": len(matches_found)
            }
    
    return scores


def detect_field_from_education(cv_text: str) -> Optional[str]:
    """Detect field from education/degree mentions"""
    cv_lower = cv_text.lower()
    
    education_patterns = {
        # Engineering
        "Civil Engineer": ["civil engineering", "bachelor of civil", "b.sc civil", "bsc civil"],
        "Mechanical Engineer": ["mechanical engineering", "bachelor of mechanical", "b.sc mechanical"],
        "Electrical Engineer": ["electrical engineering", "bachelor of electrical", "b.sc electrical"],
        "Chemical Engineer": ["chemical engineering", "bachelor of chemical"],
        "Software Engineer": ["computer science", "software engineering", "computer engineering", "information technology", "b.sc computer", "bsc computer", "cs degree"],
        
        # Business
        "Accountant": ["accounting", "bachelor of accounting", "b.com", "bcom", "chartered accountant"],
        "Financial Analyst": ["finance", "bachelor of finance", "mba finance", "financial management"],
        "Business Analyst": ["business administration", "mba", "bba", "business management"],
        "Marketing Manager": ["marketing", "bachelor of marketing", "mba marketing"],
        
        # Healthcare
        "Medical Doctor": ["medicine", "mbbs", "md", "doctor of medicine", "medical degree"],
        "Nurse": ["nursing", "bachelor of nursing", "bsn", "registered nurse"],
        "Pharmacist": ["pharmacy", "b.pharm", "bpharm", "doctor of pharmacy"],
        
        # Law
        "Lawyer": ["law", "llb", "jd", "juris doctor", "bachelor of law", "legal studies"],
        
        # Design
        "Architect": ["architecture", "bachelor of architecture", "b.arch"],
        "Graphic Designer": ["graphic design", "visual design", "design degree"],
        
        # Education
        "Teacher": ["education", "b.ed", "bed", "bachelor of education", "teaching degree"],
        
        # Psychology/Social
        "Psychologist": ["psychology", "bachelor of psychology", "clinical psychology"],
        "Social Worker": ["social work", "bachelor of social work", "bsw"],
        
        # Media
        "Journalist": ["journalism", "mass communication", "media studies"],
    }
    
    for job_title, patterns in education_patterns.items():
        for pattern in patterns:
            if pattern in cv_lower:
                return job_title
    
    return None


def detect_job_title_from_experience(cv_text: str) -> Optional[str]:
    """Detect job title from experience section"""
    cv_lower = cv_text.lower()
    
    # Common job title patterns in experience sections
    experience_patterns = [
        # Format: "worked as [title]", "position: [title]", "[title] at [company]"
        r'(?:worked as|working as|position[:\s]+|role[:\s]+|job title[:\s]+|designation[:\s]+)\s*([a-zA-Z\s]+?)(?:\s+at|\s+in|\s*,|\s*\.|$)',
        r'(?:currently|presently)\s+(?:working|employed)\s+as\s+([a-zA-Z\s]+?)(?:\s+at|\s+in|\s*,|\s*\.|$)',
        r'^([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Designer|Specialist|Consultant|Director|Coordinator|Assistant|Officer))',
    ]
    
    for pattern in experience_patterns:
        matches = re.findall(pattern, cv_lower, re.IGNORECASE | re.MULTILINE)
        if matches:
            found_title = matches[0].strip()
            # Check if it matches any of our categories
            for job_title in JOB_CATEGORIES_PATTERNS.keys():
                if job_title.lower() in found_title.lower() or found_title.lower() in job_title.lower():
                    return job_title
    
    return None


def classify_with_keywords(cv_text: str) -> dict:
    """Keyword-based classification with weighted scoring"""
    
    # First, try to detect from explicit job title in experience
    explicit_title = detect_job_title_from_experience(cv_text)
    
    # Second, try to detect from education
    education_title = detect_field_from_education(cv_text)
    
    # Third, keyword scoring
    scores = extract_keywords_score(cv_text)
    
    # If explicit title found, boost its score significantly
    if explicit_title and explicit_title in scores:
        scores[explicit_title]["score"] *= 3
    elif explicit_title:
        scores[explicit_title] = {"score": 50, "matches": ["explicit job title"], "match_count": 1}
    
    # If education field matches, boost that score
    if education_title and education_title in scores:
        scores[education_title]["score"] *= 1.5
    elif education_title and not explicit_title:
        scores[education_title] = {"score": 30, "matches": ["education match"], "match_count": 1}
    
    if not scores:
        return {
            "job_title": "General Professional",
            "confidence": 0.3,
            "method": "default",
            "top_5": []
        }
    
    # Sort by score
    sorted_jobs = sorted(scores.items(), key=lambda x: x[1]["score"], reverse=True)
    
    best_job = sorted_jobs[0][0]
    best_score = sorted_jobs[0][1]["score"]
    
    # Calculate confidence based on score difference
    total_score = sum(job[1]["score"] for job in sorted_jobs)
    
    # If top score is much higher than second, high confidence
    if len(sorted_jobs) > 1:
        second_score = sorted_jobs[1][1]["score"]
        score_ratio = best_score / max(second_score, 1)
        if score_ratio > 3:
            confidence = min(0.95, 0.85 + (score_ratio - 3) * 0.02)
        elif score_ratio > 2:
            confidence = 0.75 + (score_ratio - 2) * 0.1
        else:
            confidence = 0.5 + score_ratio * 0.1
    else:
        confidence = min(0.95, best_score / max(total_score, 1))
    
    confidence = min(0.95, max(0.3, confidence))
    
    # Get top 5
    top_5 = []
    for job, data in sorted_jobs[:5]:
        job_confidence = data["score"] / max(total_score, 1)
        top_5.append({
            "job_title": job,
            "confidence": round(min(0.99, job_confidence), 3)
        })
    
    return {
        "job_title": best_job,
        "confidence": confidence,
        "method": "keyword_weighted",
        "top_5": top_5,
        "matches": sorted_jobs[0][1]["matches"][:5]
    }


def classify_with_groq(cv_text: str) -> dict:
    """Use Groq AI for intelligent classification"""
    
    if not groq_client or not GROQ_AVAILABLE:
        return None
    
    try:
        # All available job categories
        all_jobs = list(JOB_CATEGORIES_PATTERNS.keys())
        job_list = ", ".join(all_jobs[:20])  # Show first 20
        
        prompt = f"""You are an expert career counselor and HR specialist. Analyze this CV/Resume carefully and determine the MOST SUITABLE job title.

CV/Resume Content:
{cv_text[:3000]}

Available Job Categories (and similar roles):
{job_list}, and many more including healthcare, finance, education, design, legal, administrative, and management roles.

IMPORTANT INSTRUCTIONS:
1. Read the ENTIRE CV carefully
2. Consider: skills, experience, education, certifications, achievements
3. Choose the job title that BEST matches the candidate's PRIMARY expertise
4. Be specific and accurate - don't default to generic titles
5. Consider non-technical roles (business, finance, healthcare, etc.)

Respond with ONLY a JSON object:
{{
  "job_title": "Most Accurate Job Title",
  "confidence": 0.85,
  "reasoning": "Brief explanation based on CV content"
}}

The job title MUST be one that accurately represents the candidate's main professional identity."""

        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert HR recruiter with 20+ years of experience in career counseling across ALL industries (tech, healthcare, finance, education, legal, etc.). You provide accurate, specific job title classifications based on CV analysis."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2,  # Lower temperature for more accurate results
            max_tokens=250
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        
        # Try to parse JSON response
        import json
        
        # Extract JSON if wrapped in markdown
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        
        return {
            "job_title": result.get("job_title", "Software Engineer"),
            "confidence": float(result.get("confidence", 0.7)),
            "method": "groq_ai",
            "reasoning": result.get("reasoning", "AI analysis")
        }
        
    except Exception as e:
        print(f"⚠️  Groq classification failed: {e}")
        return None


@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    global groq_client
    
    print("\n" + "=" * 60)
    print("🚀 CV Classification Service - Hybrid AI")
    print("=" * 60)
    
    # Try to initialize Groq
    if GROQ_AVAILABLE:
        try:
            api_key = os.getenv("GROQ_API_KEY")
            if api_key:
                groq_client = Groq(api_key=api_key)
                print("✅ Groq AI enabled")
            else:
                print("⚠️  GROQ_API_KEY not set - Groq disabled")
        except Exception as e:
            print(f"⚠️  Groq initialization failed: {e}")
    else:
        print("⚠️  Groq library not installed - using keyword matching only")
    
    print(f"✅ Loaded {len(JOB_CATEGORIES_PATTERNS)} job categories")
    print("=" * 60 + "\n")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "CV Classification - Hybrid AI",
        "status": "running",
        "groq_enabled": groq_client is not None,
        "job_categories": len(JOB_CATEGORIES_PATTERNS),
        "method": "groq_ai + keyword_matching"
    }


@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "groq_available": groq_client is not None,
        "categories_count": len(JOB_CATEGORIES_PATTERNS)
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
        
        print(f"\n{'='*60}")
        print(f"📄 Classifying CV ({len(cv_text)} chars)")
        print(f"{'='*60}")
        
        # Try Groq AI first if enabled
        groq_result = None
        if request.use_groq_analysis and groq_client:
            print("🤖 Using Groq AI for classification...")
            groq_result = classify_with_groq(cv_text)
        
        # Keyword-based classification
        print("🔍 Running keyword analysis...")
        keyword_result = classify_with_keywords(cv_text)
        
        # Decide which result to use
        if groq_result and groq_result.get("confidence", 0) > 0.6:
            # Use Groq result
            final_job = groq_result["job_title"]
            final_confidence = groq_result["confidence"]
            final_method = "groq_ai"
            ai_analysis = groq_result.get("reasoning", "")
            
            # Get keyword top 5 for additional context
            top_5 = keyword_result["top_5"]
            
        else:
            # Use keyword result
            final_job = keyword_result["job_title"]
            final_confidence = keyword_result["confidence"]
            final_method = keyword_result["method"]
            ai_analysis = f"Matched keywords: {', '.join(keyword_result.get('matches', []))}"
            top_5 = keyword_result["top_5"]
        
        print(f"\n✅ Result: {final_job} ({final_confidence*100:.1f}%)")
        print(f"   Method: {final_method}")
        print(f"{'='*60}\n")
        
        return CVClassificationResponse(
            success=True,
            job_title=final_job,
            confidence=final_confidence,
            decision_method=final_method,
            top_5_predictions=top_5,
            ai_analysis=ai_analysis,
            keras_prediction=None
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
            decision_method="error",
            top_5_predictions=[],
            keras_prediction=str(e)
        )


if __name__ == "__main__":
    import uvicorn
    
    port = 5002
    print(f"\n🚀 Starting Hybrid CV Classification Service on port {port}...")
    print(f"📝 Health: http://localhost:{port}/health")
    print(f"🔬 Classify: POST http://localhost:{port}/classify")
    print("\nPress Ctrl+C to stop\n")
    
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
