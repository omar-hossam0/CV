"""
Model 1: CV-Job Matching Model
Uses BERT Sentence Transformers + Hybrid Matching (Semantic + Keywords)
Port: 5001
"""

import sys
import os
import numpy as np
import pickle
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

# Ensure UTF-8
sys.stdout.reconfigure(encoding="utf-8")

app = FastAPI(title="CV-Job Matching Model")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model
matcher = None

class MatchRequest(BaseModel):
    cv_text: str
    job_descriptions: List[str]
    top_k: int = 10

class MatchResult(BaseModel):
    job_index: int
    similarity_score: float

class MatchResponse(BaseModel):
    success: bool
    matches: List[MatchResult]
    method: str

# Tech keywords for matching
TECH_KEYWORDS = [
    'python', 'java', 'javascript', 'typescript', 'react', 'node', 'nodejs',
    'express', 'django', 'flask', 'fastapi', 'mongodb', 'mysql', 'postgresql',
    'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'linux',
    'html', 'css', 'sql', 'machine learning', 'tensorflow', 'pytorch', 'pandas',
    'numpy', 'rest', 'api', 'graphql', 'microservices', 'ci/cd', 'jenkins',
    'angular', 'vue', 'nextjs', 'next.js', 'tailwind', 'bootstrap',
    'c#', 'c++', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
    'sass', 'scss', 'webpack', 'vite', 'babel', 'eslint',
    'jest', 'mocha', 'cypress', 'selenium', 'pytest',
    'agile', 'scrum', 'kanban', 'jira', 'confluence',
    'oauth', 'jwt', 'authentication', 'authorization', 'security',
    'figma', 'photoshop', 'illustrator', 'ui', 'ux', 'ui/ux',
    'seo', 'marketing', 'google ads', 'social media',
    'project management', 'leadership', 'communication', 'teamwork',
    'data analysis', 'power bi', 'tableau', 'excel',
    'deep learning', 'nlp', 'computer vision', 'opencv', 'keras',
    'scikit-learn', 'sklearn', 'spark', 'hadoop', 'etl',
    'terraform', 'ansible', 'prometheus', 'grafana', 'nginx',
    'react native', 'flutter', 'android', 'ios', 'xcode',
    'node.js', 'express.js', 'vue.js', 'angular.js',
]


class CVJobMatcherService:
    def __init__(self):
        self.embedder = None
        self.use_fallback = False
        self._load_embedder()

    def _load_embedder(self):
        """Try to load SentenceTransformer, fallback to TF-IDF if not available"""
        try:
            from sentence_transformers import SentenceTransformer
            cache_dir = os.path.join(os.path.dirname(__file__), 'bert-cache')
            os.environ.setdefault('HF_HOME', cache_dir)
            os.environ.setdefault('SENTENCE_TRANSFORMERS_HOME', cache_dir)
            os.environ.setdefault('TRANSFORMERS_OFFLINE', '1')
            os.environ.setdefault('HF_HUB_OFFLINE', '1')

            print("Loading BERT model (all-MiniLM-L6-v2)...")
            self.embedder = SentenceTransformer('all-MiniLM-L6-v2', cache_folder=cache_dir)
            self.embedding_dim = self.embedder.get_sentence_embedding_dimension()
            print(f"✅ BERT model loaded. Embedding dim: {self.embedding_dim}")
        except Exception as e:
            print(f"⚠️ Could not load BERT: {e}")
            print("   Falling back to TF-IDF matching...")
            self.use_fallback = True
            self._load_tfidf()

    def _load_tfidf(self):
        """Fallback: TF-IDF based matching"""
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        self.tfidf = TfidfVectorizer(max_features=10000, stop_words='english')
        print("✅ TF-IDF fallback loaded")

    def encode_texts(self, texts):
        """Encode texts to embeddings"""
        if self.use_fallback:
            return texts  # Return raw texts for TF-IDF
        return self.embedder.encode(texts, convert_to_numpy=True)

    def calculate_keyword_match(self, cv_text, job_text):
        """Calculate keyword matching score"""
        cv_lower = cv_text.lower()
        job_lower = job_text.lower()

        matched = 0
        total = 0

        for keyword in TECH_KEYWORDS:
            if keyword in job_lower:
                total += 1
                if keyword in cv_lower:
                    matched += 1

        if total > 0:
            score = (matched / total) * 100
            if score >= 70:
                score = min(score * 1.1, 100)
            return score
        return 50  # neutral

    def find_top_matches(self, cv_text, job_descriptions, top_k=10):
        """Find top matching jobs for a CV"""
        matches = []

        if self.use_fallback:
            # TF-IDF based matching
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity

            all_texts = [cv_text] + job_descriptions
            tfidf_matrix = self.tfidf.fit_transform(all_texts)

            cv_vec = tfidf_matrix[0:1]
            job_vecs = tfidf_matrix[1:]

            similarities = cosine_similarity(cv_vec, job_vecs)[0]

            for idx, sim in enumerate(similarities):
                semantic_score = sim * 100
                keyword_score = self.calculate_keyword_match(cv_text, job_descriptions[idx])
                final_score = (semantic_score * 0.5) + (keyword_score * 0.5)
                matches.append({
                    'job_index': idx,
                    'similarity_score': min(final_score, 100)
                })
        else:
            # BERT based matching
            from sentence_transformers import util

            cv_embedding = self.embedder.encode([cv_text], convert_to_numpy=True)
            job_embeddings = self.embedder.encode(job_descriptions, convert_to_numpy=True)

            for idx, job_emb in enumerate(job_embeddings):
                cos_sim = util.cos_sim(cv_embedding[0], job_emb).item()
                semantic_score = ((cos_sim + 1) / 2) * 100
                keyword_score = self.calculate_keyword_match(cv_text, job_descriptions[idx])
                final_score = (semantic_score * 0.5) + (keyword_score * 0.5)
                matches.append({
                    'job_index': idx,
                    'similarity_score': min(final_score, 100)
                })

        matches.sort(key=lambda x: x['similarity_score'], reverse=True)
        return matches[:top_k]


@app.on_event("startup")
async def startup():
    global matcher
    print("🚀 Starting CV-Job Matching Model...")
    matcher = CVJobMatcherService()
    print("✅ CV-Job Matching Model ready!")


@app.post("/match-jobs", response_model=MatchResponse)
async def match_jobs(request: MatchRequest):
    """Match a CV against job descriptions"""
    try:
        if not request.cv_text.strip():
            raise HTTPException(status_code=400, detail="CV text is required")
        if not request.job_descriptions:
            raise HTTPException(status_code=400, detail="Job descriptions required")

        print(f"📄 Matching CV ({len(request.cv_text)} chars) against {len(request.job_descriptions)} jobs")

        matches = matcher.find_top_matches(
            request.cv_text,
            request.job_descriptions,
            request.top_k
        )

        method = "tfidf_hybrid" if matcher.use_fallback else "bert_hybrid"
        print(f"✅ Found {len(matches)} matches using {method}")

        return MatchResponse(
            success=True,
            matches=[MatchResult(**m) for m in matches],
            method=method
        )
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model": "tfidf" if matcher and matcher.use_fallback else "bert",
        "service": "CV-Job Matching Model"
    }


@app.get("/")
async def root():
    return {
        "service": "CV-Job Matching Model",
        "version": "1.0",
        "endpoints": {
            "match": "/match-jobs (POST)",
            "health": "/health (GET)"
        }
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)
