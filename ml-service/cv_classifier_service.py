"""
CV Classification Service - BERT Semantic Analysis
Uses BERT embeddings for accurate semantic CV classification
Port: 5002

Flow:
1. Receive CV text
2. Encode using BERT (Sentence Transformers)
3. Compare against job category descriptions
4. Return most accurate classification with confidence
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import os
import re
import sys
import json
from typing import Optional, List, Dict

sys.stdout.reconfigure(encoding="utf-8")

app = FastAPI(title="CV Classification Service - BERT")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# RICH JOB CATEGORIES WITH DESCRIPTIONS (for semantic matching)
# ============================================================
JOB_CATEGORIES = {
    "Frontend Developer": {
        "description": "Frontend developer building user interfaces and client-side web applications using HTML, CSS, JavaScript, React, Angular, Vue.js, TypeScript, responsive design, browser APIs, DOM manipulation, UI components, and modern frontend frameworks",
        "keywords": ["react", "angular", "vue", "javascript", "typescript", "html", "css", "scss", "sass", "webpack", "vite", "nextjs", "next.js", "frontend", "ui", "ux", "responsive", "tailwind", "bootstrap", "dom", "browser", "figma", "component", "jsx", "tsx"]
    },
    "Backend Developer": {
        "description": "Backend developer responsible for server-side logic, APIs, database management, authentication, and scalable web services using Node.js, Express, Python, Django, Flask, FastAPI, Java, Spring, REST APIs, GraphQL, MongoDB, PostgreSQL, MySQL, Redis, microservices",
        "keywords": ["node", "nodejs", "express", "django", "flask", "fastapi", "spring", "java", "python", "api", "rest", "graphql", "database", "sql", "nosql", "mongodb", "postgresql", "mysql", "redis", "server", "backend", "microservices", "authentication", "jwt"]
    },
    "Full Stack Developer": {
        "description": "Full stack developer working on both frontend and backend, capable of building complete web applications end-to-end using MERN, MEAN, or LAMP stack technologies, handling UI, APIs, databases, and deployment",
        "keywords": ["full stack", "fullstack", "full-stack", "mern", "mean", "lamp", "frontend", "backend", "database", "api", "deployment", "react", "node", "mongodb"]
    },
    "Mobile Developer": {
        "description": "Mobile application developer building iOS and Android apps using React Native, Flutter, Swift, Kotlin, Java, mobile UI/UX, app stores, push notifications, and cross-platform development",
        "keywords": ["android", "ios", "react native", "flutter", "swift", "kotlin", "mobile", "app", "xcode", "android studio", "react-native", "dart", "objective-c", "mobile development"]
    },
    "DevOps Engineer": {
        "description": "DevOps engineer managing infrastructure, CI/CD pipelines, containerization, cloud services, automation, monitoring, and ensuring reliable software deployment using Docker, Kubernetes, Jenkins, Terraform, AWS, Azure, GCP",
        "keywords": ["docker", "kubernetes", "k8s", "jenkins", "ci/cd", "terraform", "ansible", "aws", "azure", "gcp", "cloud", "infrastructure", "monitoring", "logging", "devops", "sre", "automation", "pipeline"]
    },
    "Data Scientist": {
        "description": "Data scientist analyzing complex data, building statistical models, performing machine learning, data visualization, and extracting insights using Python, R, pandas, numpy, scikit-learn, TensorFlow, PyTorch, SQL, Jupyter",
        "keywords": ["data science", "machine learning", "deep learning", "statistics", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "data analysis", "visualization", "jupyter", "notebook", "r programming", "regression", "classification", "clustering", "neural network"]
    },
    "Machine Learning Engineer": {
        "description": "Machine learning engineer building, training, and deploying ML models, working on deep learning, neural networks, model optimization, MLOps, and production ML systems using TensorFlow, PyTorch, CUDA, GPU acceleration",
        "keywords": ["machine learning", "deep learning", "ai", "artificial intelligence", "neural network", "tensorflow", "pytorch", "keras", "model", "training", "inference", "deployment", "mlops", "gpu", "cuda", "transformer", "bert", "nlp"]
    },
    "UI/UX Designer": {
        "description": "UI/UX designer creating user-centered designs, wireframes, prototypes, user research, usability testing, and visual design using Figma, Sketch, Adobe XD, Photoshop, Illustrator, design systems",
        "keywords": ["ui", "ux", "design", "figma", "sketch", "adobe xd", "photoshop", "illustrator", "wireframe", "prototype", "user research", "usability", "interaction design", "visual design", "typography", "design system"]
    },
    "QA Engineer": {
        "description": "Quality assurance engineer testing software, writing test cases, automating tests, finding bugs, ensuring quality using Selenium, Jest, Mocha, Cypress, Playwright, manual and automated testing",
        "keywords": ["testing", "qa", "quality assurance", "automation", "selenium", "jest", "mocha", "cypress", "playwright", "test cases", "bug", "regression", "integration testing", "unit testing", "test framework"]
    },
    "Cloud Engineer": {
        "description": "Cloud engineer designing, implementing, and managing cloud infrastructure on AWS, Azure, or GCP, including serverless, containers, networking, security, and cost optimization",
        "keywords": ["aws", "azure", "gcp", "cloud", "ec2", "s3", "lambda", "serverless", "kubernetes", "docker", "terraform", "cloudformation", "devops", "cloud architecture"]
    },
    "Cybersecurity Engineer": {
        "description": "Cybersecurity engineer protecting systems from threats, conducting penetration testing, vulnerability assessments, implementing security policies, and incident response",
        "keywords": ["security", "cybersecurity", "penetration testing", "vulnerability", "firewall", "siem", "encryption", "owasp", "network security", "incident response", "compliance", "audit"]
    },
    "Data Engineer": {
        "description": "Data engineer building and maintaining data pipelines, ETL processes, data warehouses, and ensuring data quality and availability using Spark, Hadoop, Airflow, SQL, and big data technologies",
        "keywords": ["data engineer", "etl", "data pipeline", "spark", "hadoop", "airflow", "data warehouse", "big data", "kafka", "data lake", "sql", "data modeling"]
    },
    "Software Engineer": {
        "description": "Software engineer designing, developing, and maintaining software systems, writing clean code, algorithms, data structures, design patterns, object-oriented programming, and version control",
        "keywords": ["software", "engineer", "developer", "programming", "coding", "algorithms", "data structures", "object-oriented", "design patterns", "unit testing", "code review", "git", "agile"]
    },
    "Project Manager": {
        "description": "Project manager planning, executing, and closing projects, managing teams, timelines, budgets, stakeholder communication using Agile, Scrum, Kanban, Jira methodologies",
        "keywords": ["project management", "agile", "scrum", "kanban", "jira", "stakeholder", "timeline", "budget", "risk management", "leadership", "team management"]
    },
    "Database Administrator": {
        "description": "Database administrator managing, securing, and optimizing databases, ensuring data integrity, backup, recovery, and performance tuning using SQL, MySQL, PostgreSQL, Oracle, MongoDB",
        "keywords": ["database", "sql", "mysql", "postgresql", "oracle", "mongodb", "backup", "replication", "performance tuning", "dba", "schema", "database management"]
    },
    "Accountant": {
        "description": "Accountant managing financial records, tax preparation, auditing, bookkeeping, and financial reporting using accounting principles, GAAP, IFRS, QuickBooks",
        "keywords": ["accounting", "finance", "tax", "audit", "bookkeeping", "quickbooks", "financial", "budget", "revenue", "ledger", "gaap", "ifrs"]
    },
    "HR Manager": {
        "description": "HR manager handling recruitment, employee relations, onboarding, payroll, benefits administration, performance reviews, and workforce planning",
        "keywords": ["human resources", "hr", "recruitment", "hiring", "onboarding", "payroll", "benefits", "employee relations", "performance review", "talent acquisition"]
    },
    "Marketing Manager": {
        "description": "Marketing manager developing marketing strategies, managing campaigns, SEO/SEM, social media marketing, content marketing, brand management, and analytics",
        "keywords": ["marketing", "seo", "sem", "social media", "content", "brand", "advertising", "campaign", "analytics", "google ads", "facebook ads", "digital marketing"]
    },
    "Sales Representative": {
        "description": "Sales representative generating leads, managing client relationships, closing deals, meeting quotas, and driving revenue growth",
        "keywords": ["sales", "crm", "lead", "prospecting", "pipeline", "quota", "revenue", "negotiation", "cold calling", "closing", "b2b", "b2c"]
    },
    "Healthcare Professional": {
        "description": "Healthcare professional providing medical care, patient treatment, clinical services in hospitals, clinics, pharmacies, or other healthcare facilities",
        "keywords": ["medical", "healthcare", "patient", "clinical", "hospital", "nursing", "pharmacy", "diagnosis", "treatment", "doctor", "nurse", "therapist"]
    },
    "Teacher": {
        "description": "Teacher educating students, developing curriculum, creating lesson plans, assessing student progress, and facilitating learning in educational institutions",
        "keywords": ["teaching", "education", "curriculum", "student", "classroom", "lesson plan", "pedagogy", "assessment", "learning", "instructor", "professor"]
    },
    "Product Manager": {
        "description": "Product manager defining product vision, strategy, roadmap, gathering requirements, working with cross-functional teams, and driving product development",
        "keywords": ["product management", "product owner", "roadmap", "user stories", "requirements", "backlog", "sprint", "agile", "stakeholder", "market research"]
    },
    "Business Analyst": {
        "description": "Business analyst analyzing business processes, gathering requirements, creating documentation, data analysis, and bridging business and technology teams",
        "keywords": ["business analysis", "requirements", "documentation", "process improvement", "data analysis", "use cases", "stakeholder", "gap analysis", "workflow"]
    },
    "Network Engineer": {
        "description": "Network engineer designing, implementing, and managing computer networks, ensuring connectivity, security, and performance",
        "keywords": ["network", "cisco", "routing", "switching", "firewall", "vpn", "tcp/ip", "dns", "dhcp", "lan", "wan", "networking"]
    },
    "Systems Administrator": {
        "description": "Systems administrator managing and maintaining computer systems, servers, user accounts, security policies, and ensuring system reliability",
        "keywords": ["system admin", "linux", "windows server", "active directory", "dns", "backup", "monitoring", "patches", "user management", "system maintenance"]
    },
    "Web Developer": {
        "description": "Web developer building and maintaining websites and web applications using HTML, CSS, JavaScript, PHP, WordPress, and various web technologies",
        "keywords": ["web", "website", "wordpress", "php", "html", "css", "javascript", "web development", "web application", "cms"]
    },
    "Graphics Designer": {
        "description": "Graphics designer creating visual content, logos, branding materials, illustrations, and marketing graphics using design tools",
        "keywords": ["graphic design", "logo", "branding", "illustration", "photoshop", "illustrator", "indesign", "creative", "visual", "print design"]
    },
    "Operations Manager": {
        "description": "Operations manager overseeing daily business operations, process optimization, supply chain management, and team coordination",
        "keywords": ["operations", "supply chain", "logistics", "process improvement", "lean", "six sigma", "inventory", "procurement", "vendor management"]
    },
    "Content Writer": {
        "description": "Content writer creating written content for websites, blogs, marketing materials, and social media with strong communication skills",
        "keywords": ["content", "writing", "blog", "copywriting", "seo writing", "creative writing", "editorial", "content marketing", "copywriter"]
    },
    "Technical Writer": {
        "description": "Technical writer creating documentation, user guides, API documentation, and technical manuals for software and hardware products",
        "keywords": ["technical writing", "documentation", "api docs", "user guide", "manual", "technical documentation", "specifications"]
    },
    "Artificial Intelligence Engineer": {
        "description": "AI engineer developing intelligent systems, chatbots, recommendation engines, computer vision, and natural language processing applications",
        "keywords": ["artificial intelligence", "ai", "chatbot", "recommendation", "computer vision", "nlp", "natural language", "gpt", "llm", "generative ai"]
    },
    "Blockchain Developer": {
        "description": "Blockchain developer building decentralized applications, smart contracts, and blockchain-based solutions using Solidity, Web3, and cryptocurrency technologies",
        "keywords": ["blockchain", "ethereum", "solidity", "web3", "smart contract", "crypto", "defi", "nft", "decentralized"]
    },
    "Game Developer": {
        "description": "Game developer creating video games, game mechanics, graphics, physics, and interactive experiences using Unity, Unreal Engine, or custom engines",
        "keywords": ["game", "unity", "unreal", "gamedev", "3d", "animation", "physics", "shader", "game design", "c#"]
    },
    "Robotics Engineer": {
        "description": "Robotics engineer designing and building robots, robotic systems, control algorithms, and automation solutions",
        "keywords": ["robotics", "robot", "ros", "c++", "control systems", "sensors", "actuators", "autonomous", "automation"]
    }
}


class CVClassificationRequest(BaseModel):
    cv_text: str
    use_groq_analysis: bool = False


class CVClassificationResponse(BaseModel):
    success: bool
    job_title: str
    confidence: float
    decision_method: Optional[str] = None
    top_5_predictions: Optional[List[dict]] = None
    ai_analysis: Optional[dict] = None
    error: Optional[str] = None


# ============================================================
# BERT CLASSIFIER
# ============================================================

class BERTClassifier:
    """BERT-based semantic CV classifier"""
    
    def __init__(self):
        self.embedder = None
        self.category_embeddings = {}
        self.category_keywords = {}
        self.use_fallback = False
        self._load_embedder()
        self._precompute_category_embeddings()
    
    def _load_embedder(self):
        """Load SentenceTransformer BERT model"""
        try:
            from sentence_transformers import SentenceTransformer
            
            # Try multiple cache locations
            cache_dirs = [
                os.path.join(os.path.dirname(__file__), '..', 'model-1-cv-matcher', 'bert-cache'),
                os.path.join(os.path.dirname(__file__), 'bert-cache'),
                os.path.join(os.path.dirname(__file__), '..', 'bert-cache'),
            ]
            
            cache_dir = None
            for d in cache_dirs:
                if os.path.exists(d):
                    cache_dir = d
                    break
            
            if cache_dir is None:
                cache_dir = cache_dirs[0]
            
            os.environ.setdefault('HF_HOME', cache_dir)
            os.environ.setdefault('SENTENCE_TRANSFORMERS_HOME', cache_dir)
            os.environ.setdefault('TRANSFORMERS_OFFLINE', '1')
            os.environ.setdefault('HF_HUB_OFFLINE', '1')
            
            print("🧠 Loading BERT model (all-MiniLM-L6-v2)...")
            self.embedder = SentenceTransformer(
                'all-MiniLM-L6-v2', 
                cache_folder=cache_dir
            )
            print(f"✅ BERT model loaded. Embedding dim: {self.embedder.get_sentence_embedding_dimension()}")
        except Exception as e:
            print(f"⚠️ Could not load BERT: {e}")
            print("   Falling back to keyword matching...")
            self.use_fallback = True
    
    def _precompute_category_embeddings(self):
        """Pre-encode all job category descriptions for fast matching"""
        if self.use_fallback or self.embedder is None:
            print("⚠️ Using keyword fallback (BERT not available)")
            return
        
        print("📊 Pre-computing job category embeddings...")
        categories = list(JOB_CATEGORIES.keys())
        
        # Create rich descriptions combining description + keywords
        descriptions = []
        for cat in categories:
            desc = JOB_CATEGORIES[cat]["description"]
            keywords_text = " ".join(JOB_CATEGORIES[cat]["keywords"][:15])
            descriptions.append(desc + " Key skills: " + keywords_text)
        
        # Encode all descriptions
        embeddings = self.embedder.encode(descriptions, convert_to_numpy=True, show_progress_bar=False)
        
        for i, cat in enumerate(categories):
            self.category_embeddings[cat] = embeddings[i]
            self.category_keywords[cat] = JOB_CATEGORIES[cat]["keywords"]
        
        print(f"✅ Pre-computed embeddings for {len(categories)} job categories")
    
    def classify(self, cv_text: str, top_k: int = 5) -> dict:
        """Classify a CV using BERT semantic similarity"""
        
        if self.use_fallback or self.embedder is None:
            return self._classify_keywords(cv_text, top_k)
        
        try:
            # Encode the CV text
            cv_embedding = self.embedder.encode([cv_text], convert_to_numpy=True)[0]
            
            # Calculate similarity with each category
            similarities = {}
            for category, cat_embedding in self.category_embeddings.items():
                # Cosine similarity
                cos_sim = np.dot(cv_embedding, cat_embedding) / (
                    np.linalg.norm(cv_embedding) * np.linalg.norm(cat_embedding) + 1e-8
                )
                # Normalize to 0-1 range
                similarities[category] = max(0, (cos_sim + 1) / 2)
            
            # Sort by similarity
            sorted_categories = sorted(
                similarities.items(), 
                key=lambda x: x[1], 
                reverse=True
            )
            
            # Get top predictions
            top_predictions = []
            for cat, score in sorted_categories[:top_k]:
                # Convert numpy types to Python float for JSON serialization
                score_float = float(score)
                top_predictions.append({
                    "job_title": cat,
                    "confidence": round(score_float, 3)
                })
            
            best_category = sorted_categories[0][0]
            best_score = float(sorted_categories[0][1])
            
            # Apply keyword boost for higher confidence
            keyword_boost = self._calculate_keyword_boost(cv_text, best_category)
            boosted_score = min(best_score * (1 + keyword_boost), 0.99)
            
            return {
                "predicted_job": best_category,
                "confidence": round(float(boosted_score), 3),
                "method": "bert_semantic",
                "top_predictions": top_predictions,
                "raw_similarity": round(float(best_score), 3),
                "keyword_boost": round(float(keyword_boost), 3)
            }
            
        except Exception as e:
            print(f"❌ BERT classification error: {e}")
            import traceback
            traceback.print_exc()
            return self._classify_keywords(cv_text, top_k)
    
    def _calculate_keyword_boost(self, cv_text: str, category: str) -> float:
        """Calculate additional confidence boost based on keyword matching"""
        if category not in JOB_CATEGORIES:
            return 0.0
        
        cv_lower = cv_text.lower()
        keywords = JOB_CATEGORIES[category]["keywords"]
        
        matches = sum(1 for kw in keywords if kw.lower() in cv_lower)
        match_ratio = matches / len(keywords) if keywords else 0
        
        # Small boost (0-20%) based on keyword matches
        return min(match_ratio * 0.2, 0.2)
    
    def _classify_keywords(self, cv_text: str, top_k: int = 5) -> dict:
        """Fallback: keyword-based classification"""
        cv_lower = cv_text.lower()
        
        scores = {}
        for category, data in JOB_CATEGORIES.items():
            keywords = data["keywords"]
            matches = sum(1 for kw in keywords if kw.lower() in cv_lower)
            scores[category] = matches
        
        sorted_categories = sorted(
            scores.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        top_predictions = []
        for cat, score in sorted_categories[:top_k]:
            confidence = min(score / 10, 0.95) if score > 0 else 0.3
            top_predictions.append({
                "job_title": cat,
                "confidence": round(confidence, 3)
            })
        
        best_category = sorted_categories[0][0]
        best_score = sorted_categories[0][1]
        confidence = min(best_score / 10, 0.95) if best_score > 0 else 0.3
        
        return {
            "predicted_job": best_category,
            "confidence": round(confidence, 3),
            "method": "keyword_fallback",
            "top_predictions": top_predictions
        }


# Global classifier instance
classifier = None


def initialize_classifier():
    """Initialize the BERT classifier"""
    global classifier
    if classifier is None:
        print("🚀 Initializing CV Classification Service...")
        classifier = BERTClassifier()
        method = "keyword_fallback" if classifier.use_fallback else "bert_semantic"
        print(f"✅ Classifier ready! Method: {method}")
    return classifier


# Initialize on module load
initialize_classifier()


@app.on_event("startup")
async def startup_event():
    """Ensure classifier is initialized on startup"""
    initialize_classifier()


@app.post("/classify", response_model=CVClassificationResponse)
async def classify_cv(request: CVClassificationRequest):
    """
    Classify CV to determine job title using BERT semantic analysis.
    
    Flow:
    1. Receive CV text
    2. Encode using BERT embeddings
    3. Compare against all job category descriptions
    4. Return most accurate match with confidence
    """
    try:
        cv_text = request.cv_text.strip()
        
        if not cv_text:
            print("❌ CV text is empty")
            raise HTTPException(status_code=400, detail="CV text is required")
        
        print(f"\n{'='*60}")
        print(f"📄 Classifying CV ({len(cv_text)} chars)")
        print(f"{'='*60}")
        
        # Classify using BERT
        result = classifier.classify(cv_text)
        
        print(f"✅ Classification: {result['predicted_job']} ({result['confidence']*100:.1f}%)")
        print(f"   Method: {result['method']}")
        if 'raw_similarity' in result:
            print(f"   Raw Similarity: {result['raw_similarity']}")
        
        # Build response
        response_data = {
            "job_title": result["predicted_job"],
            "confidence": result["confidence"],
            "decision_method": result["method"],
            "top_5_predictions": result.get("top_predictions", []),
        }
        
        return CVClassificationResponse(
            success=True,
            **response_data
        )
        
    except HTTPException:
        raise
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
    """Service info"""
    return {
        "service": "CV Classification Service - BERT",
        "status": "running",
        "classification_method": "keyword_fallback" if classifier and classifier.use_fallback else "bert_semantic",
        "categories_count": len(JOB_CATEGORIES),
        "endpoints": {
            "classify": "/classify (POST)",
            "health": "/health (GET)"
        }
    }


@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "bert_available": classifier is not None and not (classifier.use_fallback if classifier else True),
        "classification_method": "keyword_fallback" if classifier and classifier.use_fallback else "bert_semantic",
        "categories_count": len(JOB_CATEGORIES)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)
