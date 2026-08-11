"""Test Script for Model 2: CV Classifier"""
import sys
sys.path.insert(0, '.')
from cv_classifier import classify_with_keywords

print("=" * 60)
print("TESTING MODEL 2: CV CLASSIFIER")
print("=" * 60)

# Test 1: Software Engineer CV
print("\n--- Test 1: Software Engineer CV ---")
cv_text = """
Experienced software engineer with 5 years of experience in Python, JavaScript, React, Node.js, and MongoDB. 
Built REST APIs and microservices. Proficient in Docker, AWS, and CI/CD pipelines. 
Strong background in agile development and team collaboration.
"""
result = classify_with_keywords(cv_text)
print(f"Predicted Job: {result['predicted_job']}")
print(f"Confidence: {result['confidence']*100:.1f}%")
print(f"Method: {result['method']}")
print("Top 5 Predictions:")
for p in result.get('top_5', []):
    print(f"  - {p.job_title}: {p.confidence*100:.1f}%")

assert result['predicted_job'] in ['Software Engineer', 'Backend Developer', 'Full Stack Developer'], \
    f"Expected software-related job, got: {result['predicted_job']}"
print("✓ Test 1 PASSED")

# Test 2: Data Scientist CV
print("\n--- Test 2: Data Scientist CV ---")
cv_text2 = """
Data Scientist with expertise in machine learning, deep learning, TensorFlow, PyTorch, and scikit-learn.
Proficient in Python, pandas, numpy, and data visualization with matplotlib and seaborn.
Experience with NLP, computer vision, and statistical modeling.
"""
result2 = classify_with_keywords(cv_text2)
print(f"Predicted Job: {result2['predicted_job']}")
print(f"Confidence: {result2['confidence']*100:.1f}%")

assert result2['predicted_job'] in ['Data Scientist', 'Machine Learning Engineer'], \
    f"Expected data science job, got: {result2['predicted_job']}"
print("✓ Test 2 PASSED")

# Test 3: Frontend Developer CV
print("\n--- Test 3: Frontend Developer CV ---")
cv_text3 = """
Frontend Developer specializing in React, Vue.js, and Angular. Expert in HTML5, CSS3, Sass, and responsive design.
Experience with TypeScript, Next.js, Redux, and Webpack. Strong eye for UI/UX design.
"""
result3 = classify_with_keywords(cv_text3)
print(f"Predicted Job: {result3['predicted_job']}")
print(f"Confidence: {result3['confidence']*100:.1f}%")

assert result3['predicted_job'] in ['Frontend Developer', 'UI/UX Designer', 'Software Engineer'], \
    f"Expected frontend job, got: {result3['predicted_job']}"
print("✓ Test 3 PASSED")

# Test 4: DevOps Engineer CV
print("\n--- Test 4: DevOps Engineer CV ---")
cv_text4 = """
DevOps Engineer with 4 years of experience in Docker, Kubernetes, AWS, and Terraform.
Expert in CI/CD pipelines, Jenkins, and infrastructure automation.
Strong background in Linux administration and monitoring with Prometheus and Grafana.
"""
result4 = classify_with_keywords(cv_text4)
print(f"Predicted Job: {result4['predicted_job']}")
print(f"Confidence: {result4['confidence']*100:.1f}%")

assert result4['predicted_job'] in ['DevOps Engineer', 'Cloud Engineer', 'Software Engineer'], \
    f"Expected DevOps job, got: {result4['predicted_job']}"
print("✓ Test 4 PASSED")

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED FOR MODEL 2 (CV CLASSIFIER)")
print("=" * 60)
