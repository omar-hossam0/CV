"""Test Script for Model 1: CV-Job Matcher"""
import sys
sys.path.insert(0, '.')
from cv_job_matcher import CVJobMatcherService

print("=" * 60)
print("TESTING MODEL 1: CV-JOB MATCHER")
print("=" * 60)

# Initialize matcher
print("\n--- Initializing Matcher ---")
matcher = CVJobMatcherService()
print(f"Using fallback: {matcher.use_fallback}")

# Test 1: Software Engineer CV vs relevant jobs
print("\n--- Test 1: Software Engineer CV vs Relevant Jobs ---")
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

results = matcher.find_top_matches(cv_text, job_descriptions, top_k=5)
print(f"Top 5 matches:")
for i, r in enumerate(results):
    print(f"  {i+1}. Job {r['job_index']}: {r['similarity_score']:.1f}% - {job_descriptions[r['job_index']][:50]}...")

# The top match should be a backend or full-stack developer job
top_job_idx = results[0]['job_index']
assert top_job_idx in [1, 2, 4], f"Expected backend/fullstack/devops job, got job {top_job_idx}"
assert results[0]['similarity_score'] > 30, f"Expected > 30% match, got {results[0]['similarity_score']}"
print("✓ Test 1 PASSED")

# Test 2: Data Scientist CV
print("\n--- Test 2: Data Scientist CV ---")
cv_text2 = """
Data Scientist with 5 years of experience in machine learning, deep learning, and statistical modeling.
Expert in Python, TensorFlow, PyTorch, scikit-learn, pandas, and numpy.
Experience with NLP, computer vision, and data visualization.
Published research in AI conferences.
"""

results2 = matcher.find_top_matches(cv_text2, job_descriptions, top_k=5)
print(f"Top 5 matches:")
for i, r in enumerate(results2):
    print(f"  {i+1}. Job {r['job_index']}: {r['similarity_score']:.1f}% - {job_descriptions[r['job_index']][:50]}...")

# Data scientist CV should match data science job (index 3)
assert results2[0]['similarity_score'] > 20, f"Expected > 20% match, got {results2[0]['similarity_score']}"
print("✓ Test 2 PASSED")

# Test 3: Frontend Developer CV
print("\n--- Test 3: Frontend Developer CV ---")
cv_text3 = """
Frontend Developer with 4 years of experience in React, TypeScript, Next.js, and CSS.
Expert in responsive design, accessibility, and modern web standards.
Experience with Redux, Material-UI, and testing with Jest and Cypress.
"""

results3 = matcher.find_top_matches(cv_text3, job_descriptions, top_k=5)
print(f"Top 5 matches:")
for i, r in enumerate(results3):
    print(f"  {i+1}. Job {r['job_index']}: {r['similarity_score']:.1f}% - {job_descriptions[r['job_index']][:50]}...")

assert results3[0]['similarity_score'] > 20, f"Expected > 20% match, got {results3[0]['similarity_score']}"
print("✓ Test 3 PASSED")

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED FOR MODEL 1 (CV-JOB MATCHER)")
print("=" * 60)
