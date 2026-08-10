"""
Test script for CV Classification Service
اختبار سريع لخدمة تصنيف السير الذاتية
"""

import requests
import json

# Test CV text
test_cv = """
John Doe
Full Stack Web Developer

EXPERIENCE:
- 3 years of experience in web development
- Proficient in React.js, Node.js, and MongoDB
- Built multiple e-commerce websites using MERN stack
- Experience with RESTful APIs and GraphQL
- Worked with Docker and AWS for deployment

SKILLS:
- Frontend: React, Vue.js, HTML5, CSS3, JavaScript, TypeScript
- Backend: Node.js, Express.js, Python, Django
- Database: MongoDB, PostgreSQL, MySQL
- DevOps: Docker, Kubernetes, AWS, CI/CD
- Tools: Git, VS Code, Postman

EDUCATION:
Bachelor of Computer Science

PROJECTS:
1. E-commerce Platform - Built with React and Node.js
2. Social Media Dashboard - Vue.js and Firebase
3. Blog CMS - Django and PostgreSQL
"""

def test_service():
    """Test the CV classifier service"""
    
    url = "http://localhost:5002/classify"
    
    print("🧪 Testing CV Classification Service...")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1️⃣ Testing health endpoint...")
    try:
        response = requests.get("http://localhost:5002/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print("\n⚠️  Make sure the service is running:")
        print("   cd ml-service")
        print("   python cv_classifier_service.py")
        return
    
    # Test 2: Classification with Groq
    print("\n2️⃣ Testing classification with Groq AI...")
    try:
        payload = {
            "cv_text": test_cv,
            "use_groq_analysis": True
        }
        
        response = requests.post(url, json=payload, timeout=30)
        result = response.json()
        
        print(f"   Status: {response.status_code}")
        print(f"\n   ✅ Classification Result:")
        print(f"      Job Title: {result.get('job_title')}")
        print(f"      Confidence: {result.get('confidence', 0) * 100:.1f}%")
        
        if result.get('ai_analysis'):
            ai = result['ai_analysis']
            print(f"\n   🤖 AI Analysis:")
            print(f"      Primary Role: {ai.get('primary_role')}")
            print(f"      Skills: {', '.join(ai.get('skills', [])[:5])}")
            print(f"      Experience: {ai.get('experience_years')} years")
        
        if result.get('keras_prediction'):
            keras = result['keras_prediction']
            print(f"\n   🧠 Keras Prediction:")
            print(f"      Job: {keras.get('predicted_job')}")
            print(f"      Confidence: {keras.get('confidence', 0) * 100:.1f}%")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Classification without Groq
    print("\n3️⃣ Testing classification without Groq (Keras only)...")
    try:
        payload = {
            "cv_text": test_cv,
            "use_groq_analysis": False
        }
        
        response = requests.post(url, json=payload, timeout=30)
        result = response.json()
        
        print(f"   Status: {response.status_code}")
        print(f"   Job Title: {result.get('job_title')}")
        print(f"   Confidence: {result.get('confidence', 0) * 100:.1f}%")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Tests completed!")
    print("\nNext steps:")
    print("1. Make sure Backend is running: cd Backend && npm start")
    print("2. Make sure Frontend is running: cd my-react-app && npm run dev")
    print("3. Open browser: http://localhost:5174/employee/profile")
    print("4. Upload a CV and click 'Classify Job Role' button")

if __name__ == "__main__":
    test_service()
