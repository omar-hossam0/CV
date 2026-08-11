"""
Test the BERT-based CV Classifier
Run this to verify the classifier is working correctly
"""

import requests
import json
import sys
import os

# Fix Windows console encoding
if sys.platform == 'win32':
    os.system('chcp 65001 >nul 2>&1')
    sys.stdout.reconfigure(encoding='utf-8')

# Test cases with expected classifications
TEST_CASES = [
    {
        "name": "Frontend Developer CV",
        "cv_text": """
John Smith - Frontend Developer

EXPERIENCE:
- 3 years as Frontend Developer at Tech Corp
- Built responsive web applications using React.js and TypeScript
- Implemented UI components with HTML5, CSS3, and SCSS
- Used webpack and vite for build tools
- Experience with Next.js for server-side rendering
- Created mobile-first responsive designs
- Used Figma for UI/UX design collaboration

SKILLS:
- React.js, JavaScript, TypeScript
- HTML5, CSS3, SCSS, Tailwind CSS
- Next.js, Redux, Context API
- Webpack, Vite, Babel
- Git, GitHub, GitLab
- REST APIs, GraphQL
- Responsive Design, Mobile-First

EDUCATION:
Bachelor of Science in Computer Science
""",
        "expected": "Frontend Developer"
    },
    {
        "name": "Backend Developer CV",
        "cv_text": """
Jane Doe - Backend Developer

EXPERIENCE:
- 4 years as Backend Developer
- Built RESTful APIs using Node.js and Express.js
- Implemented authentication with JWT and OAuth
- Designed database schemas in PostgreSQL and MongoDB
- Created microservices architecture
- Used Redis for caching
- Implemented GraphQL APIs

SKILLS:
- Node.js, Express.js, Python, Django, FastAPI
- PostgreSQL, MongoDB, MySQL, Redis
- REST API, GraphQL, gRPC
- Docker, Kubernetes
- AWS (EC2, S3, Lambda)
- JWT, OAuth, Authentication
- Microservices, Serverless

EDUCATION:
Bachelor of Science in Software Engineering
""",
        "expected": "Backend Developer"
    },
    {
        "name": "Data Scientist CV",
        "cv_text": """
Dr. Alex Chen - Data Scientist

EXPERIENCE:
- 5 years as Data Scientist
- Built machine learning models using TensorFlow and PyTorch
- Performed data analysis with pandas and numpy
- Created data visualizations with matplotlib and seaborn
- Implemented deep learning neural networks
- Experience with scikit-learn for traditional ML
- Published research in NLP and computer vision

SKILLS:
- Python, R, SQL
- TensorFlow, PyTorch, Keras
- Pandas, NumPy, Scikit-learn
- Machine Learning, Deep Learning
- NLP, Computer Vision
- Jupyter Notebook, Git
- Statistics, Data Visualization
- Spark, Hadoop

EDUCATION:
PhD in Computer Science (Machine Learning)
""",
        "expected": "Data Scientist"
    },
    {
        "name": "DevOps Engineer CV",
        "cv_text": """
Mike Johnson - DevOps Engineer

EXPERIENCE:
- 5 years as DevOps Engineer
- Managed CI/CD pipelines using Jenkins and GitHub Actions
- Containerized applications with Docker and Kubernetes
- Infrastructure as Code using Terraform and Ansible
- Cloud infrastructure on AWS and Azure
- Monitoring with Prometheus and Grafana
- Automated deployments and scaling

SKILLS:
- Docker, Kubernetes, Helm
- Jenkins, GitHub Actions, GitLab CI
- Terraform, Ansible, CloudFormation
- AWS, Azure, GCP
- Linux, Bash, Python
- Prometheus, Grafana, ELK Stack
- Nginx, HAProxy

EDUCATION:
Bachelor of Science in Computer Engineering
""",
        "expected": "DevOps Engineer"
    },
    {
        "name": "Mobile Developer CV",
        "cv_text": """
Sarah Williams - Mobile Developer

EXPERIENCE:
- 3 years as Mobile Developer
- Built cross-platform apps using React Native
- Developed iOS apps with Swift and Xcode
- Created Android apps with Kotlin
- Implemented push notifications and deep linking
- Published apps on App Store and Play Store
- Used Firebase for backend services

SKILLS:
- React Native, Flutter
- Swift, Objective-C (iOS)
- Kotlin, Java (Android)
- Xcode, Android Studio
- Redux, Context API
- Firebase, AWS Amplify
- REST APIs, GraphQL

EDUCATION:
Bachelor of Science in Computer Science
""",
        "expected": "Mobile Developer"
    }
]


def test_classifier():
    """Test the classifier service"""
    print("=" * 60)
    print("[TEST] Testing BERT CV Classifier")
    print("=" * 60)
    
    url = "http://localhost:5002/classify"
    
    # Check if service is running
    try:
        health_response = requests.get("http://localhost:5002/health", timeout=5)
        health = health_response.json()
        print(f"[OK] Service is running!")
        print(f"   Method: {health.get('classification_method', 'unknown')}")
        print(f"   BERT Available: {health.get('bert_available', False)}")
        print()
    except requests.exceptions.ConnectionError:
        print("[ERROR] Service is not running!")
        print("   Start it with: python ml-service/cv_classifier_service.py")
        return
    
    # Run tests
    passed = 0
    failed = 0
    
    for test in TEST_CASES:
        print(f"[TEST] {test['name']}")
        print(f"   Expected: {test['expected']}")
        
        try:
            response = requests.post(
                url,
                json={"cv_text": test["cv_text"], "use_groq_analysis": False},
                timeout=30
            )
            
            result = response.json()
            
            if result["success"]:
                predicted = result["job_title"]
                confidence = result["confidence"]
                method = result.get("decision_method", "unknown")
                
                is_correct = predicted.lower() == test["expected"].lower()
                
                if is_correct:
                    print(f"   [PASS] {predicted} ({confidence*100:.1f}%) [{method}]")
                    passed += 1
                else:
                    print(f"   [FAIL] Got {predicted}, expected {test['expected']} ({confidence*100:.1f}%) [{method}]")
                    failed += 1
                
                # Show top 3 predictions
                top_3 = result.get("top_5_predictions", [])[:3]
                if top_3:
                    print(f"   Top 3: {', '.join([p['job_title'] + ' (' + str(round(p['confidence']*100, 0)) + '%)' for p in top_3])}")
            else:
                print(f"   [ERROR] {result.get('error', 'Unknown error')}")
                failed += 1
                
        except Exception as e:
            print(f"   [EXCEPTION] {e}")
            failed += 1
        
        print()
    
    # Summary
    print("=" * 60)
    print(f"[SUMMARY] {passed} passed, {failed} failed out of {len(TEST_CASES)} tests")
    print("=" * 60)
    
    return failed == 0


if __name__ == "__main__":
    success = test_classifier()
    sys.exit(0 if success else 1)
