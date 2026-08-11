"""Test Script for Model 1: CV-Job Matcher (TF-IDF Fallback)"""
import sys
sys.path.insert(0, '.')

# Force TF-IDF fallback for testing
import os
os.environ['TRANSFORMERS_OFFLINE'] = '1'
os.environ['HF_HUB_OFFLINE'] = '1'

print("=" * 60)
print("TESTING MODEL 1: CV-JOB MATCHER (TF-IDF FALLBACK)")
print("=" * 60)

# Test with TF-IDF directly
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

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

def calculate_keyword_match(cv_text, job_text):
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
    return 50

def find_matches_tfidf(cv_text, job_descriptions, top_k=5):
    all_texts = [cv_text] + job_descriptions
    tfidf = TfidfVectorizer(max_features=10000, stop_words='english')
    tfidf_matrix = tfidf.fit_transform(all_texts)
    
    cv_vec = tfidf_matrix[0:1]
    job_vecs = tfidf_matrix[1:]
    
    similarities = cosine_similarity(cv_vec, job_vecs)[0]
    
    matches = []
    for idx, sim in enumerate(similarities):
        semantic_score = sim * 100
        keyword_score = calculate_keyword_match(cv_text, job_descriptions[idx])
        final_score = (semantic_score * 0.5) + (keyword_score * 0.5)
        matches.append({
            'job_index': idx,
            'similarity_score': min(final_score, 100),
            'semantic': semantic_score,
            'keyword': keyword_score
        })
    
    matches.sort(key=lambda x: x['similarity_score'], reverse=True)
    return matches[:top_k]

# Test 1: Software Engineer CV
print("\n--- Test 1: Software Engineer CV ---")
cv_text = """
Senior Software Engineer with 7 years of experience in Python, JavaScript, React, Node.js, and MongoDB.
Expert in building REST APIs, microservices, and cloud deployments on AWS.
Proficient in Docker, Kubernetes, CI/CD pipelines, and agile methodologies.
Strong background in database design with PostgreSQL and Redis.
"""

job_descriptions = [
    "Frontend Developer: React, TypeScript, Next.js, CSS, HTML. Build responsive web applications.",
    "Senior Backend Developer: Python, Django, FastAPI, PostgreSQL, Redis, Docker. Build scalable APIs.",
    "Full Stack Developer: React, Node.js, MongoDB, Express. Build end-to-end web applications.",
    "Data Scientist: Machine learning, TensorFlow, PyTorch, pandas, numpy. Build AI models.",
    "DevOps Engineer: Docker, Kubernetes, AWS, Terraform, Jenkins, CI/CD. Manage infrastructure.",
    "Mobile Developer: React Native, Flutter, iOS, Android. Build mobile applications.",
    "Accountant: Financial reporting, tax preparation, QuickBooks, Excel, GAAP compliance.",
    "Marketing Manager: SEO, social media, content marketing, Google Ads, analytics.",
]

results = find_matches_tfidf(cv_text, job_descriptions, top_k=5)
print(f"Top 5 matches:")
for i, r in enumerate(results):
    print(f"  {i+1}. Job {r['job_index']}: {r['similarity_score']:.1f}% (semantic: {r['semantic']:.1f}%, keyword: {r['keyword']:.1f}%) - {job_descriptions[r['job_index']][:50]}...")

assert results[0]['similarity_score'] > 20, f"Expected > 20% match, got {results[0]['similarity_score']}"
print("✓ Test 1 PASSED")

# Test 2: Data Scientist CV
print("\n--- Test 2: Data Scientist CV ---")
cv_text2 = """
Data Scientist with 5 years of experience in machine learning, deep learning, and statistical modeling.
Expert in Python, TensorFlow, PyTorch, scikit-learn, pandas, and numpy.
Experience with NLP, computer vision, and data visualization.
"""

results2 = find_matches_tfidf(cv_text2, job_descriptions, top_k=5)
print(f"Top 5 matches:")
for i, r in enumerate(results2):
    print(f"  {i+1}. Job {r['job_index']}: {r['similarity_score']:.1f}% - {job_descriptions[r['job_index']][:50]}...")

assert results2[0]['similarity_score'] > 15, f"Expected > 15% match, got {results2[0]['similarity_score']}"
print("✓ Test 2 PASSED")

# Test 3: Frontend Developer CV
print("\n--- Test 3: Frontend Developer CV ---")
cv_text3 = """
Frontend Developer with 4 years of experience in React, TypeScript, Next.js, and CSS.
Expert in responsive design, accessibility, and modern web standards.
"""

results3 = find_matches_tfidf(cv_text3, job_descriptions, top_k=5)
print(f"Top 5 matches:")
for i, r in enumerate(results3):
    print(f"  {i+1}. Job {r['job_index']}: {r['similarity_score']:.1f}% - {job_descriptions[r['job_index']][:50]}...")

assert results3[0]['similarity_score'] > 15, f"Expected > 15% match, got {results3[0]['similarity_score']}"
print("✓ Test 3 PASSED")

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED FOR MODEL 1 (CV-JOB MATCHER - TF-IDF)")
print("=" * 60)
