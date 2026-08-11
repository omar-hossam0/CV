"""Test Script for Model 3: Skill Analyzer"""
import sys
sys.path.insert(0, '.')
from skill_analyzer import analyze_cv_job_match

print("=" * 60)
print("TESTING MODEL 3: SKILL ANALYZER")
print("=" * 60)

# Test 1: Good match
print("\n--- Test 1: Good CV-Job Match ---")
cv_text = """
Software Engineer with 5 years of experience in Python, JavaScript, React, Node.js, and MongoDB.
Proficient in Docker, AWS, Git, and CI/CD pipelines.
"""
job_desc = """
Looking for a Full Stack Developer with experience in React, Node.js, Python, and MongoDB.
Must have Docker and AWS experience. Git knowledge required.
"""
result = analyze_cv_job_match(cv_text, job_desc)
print(f"Match Percentage: {result['match_percentage']}%")
print(f"CV Skills: {result['cv_skills']}")
print(f"Job Skills: {result['job_skills']}")
print(f"Matched Skills: {result['matched_skills']}")
print(f"Missing Skills: {[s['skill'] for s in result['missing_skills']]}")

assert result['match_percentage'] >= 50, f"Expected >= 50% match, got {result['match_percentage']}%"
print("✓ Test 1 PASSED")

# Test 2: Poor match
print("\n--- Test 2: Poor CV-Job Match ---")
cv_text2 = """
Accountant with 10 years of experience in financial reporting, tax preparation, and auditing.
Proficient in QuickBooks, Excel, and GAAP compliance.
"""
job_desc2 = """
Looking for a React Developer with experience in JavaScript, TypeScript, and Node.js.
Must have experience with Redux, Next.js, and PostgreSQL.
"""
result2 = analyze_cv_job_match(cv_text2, job_desc2)
print(f"Match Percentage: {result2['match_percentage']}%")
print(f"Missing Skills: {[s['skill'] for s in result2['missing_skills']]}")

assert result2['match_percentage'] < 50, f"Expected < 50% match, got {result2['match_percentage']}%"
print("✓ Test 2 PASSED")

# Test 3: Partial match
print("\n--- Test 3: Partial Match ---")
cv_text3 = """
Junior Developer with 1 year experience in HTML, CSS, and basic JavaScript.
Learning React and Node.js.
"""
job_desc3 = """
Senior Full Stack Developer needed. Requirements:
- 5+ years JavaScript, TypeScript
- Expert in React, Next.js, Node.js
- PostgreSQL, MongoDB experience
- Docker, Kubernetes, AWS
- CI/CD pipelines
"""
result3 = analyze_cv_job_match(cv_text3, job_desc3)
print(f"Match Percentage: {result3['match_percentage']}%")
print(f"Matched Skills: {result3['matched_skills']}")
print(f"Missing Skills: {[s['skill'] for s in result3['missing_skills']]}")

assert 0 <= result3['match_percentage'] <= 100, f"Percentage should be 0-100, got {result3['match_percentage']}%"
print("✓ Test 3 PASSED")

# Test 4: Exact match
print("\n--- Test 4: High Match ---")
cv_text4 = """
Senior DevOps Engineer with expertise in Docker, Kubernetes, AWS, Terraform, Jenkins, and CI/CD.
Linux administration and monitoring with Prometheus and Grafana.
"""
job_desc4 = """
DevOps Engineer required:
- Docker and Kubernetes experience
- AWS or Azure cloud experience
- Terraform for infrastructure
- CI/CD with Jenkins
- Linux administration
"""
result4 = analyze_cv_job_match(cv_text4, job_desc4)
print(f"Match Percentage: {result4['match_percentage']}%")
print(f"Matched Skills: {result4['matched_skills']}")

assert result4['match_percentage'] >= 60, f"Expected >= 60% match, got {result4['match_percentage']}%"
print("✓ Test 4 PASSED")

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED FOR MODEL 3 (SKILL ANALYZER)")
print("=" * 60)
