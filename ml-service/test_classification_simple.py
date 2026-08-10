"""
Test CV Classification with actual CV text
"""
import requests
import json

# Test data - different CV types
test_cases = [
    {
        "name": "Software Developer",
        "cv": "Software Developer with 5 years experience Python Django Flask REST API PostgreSQL MongoDB Redis Docker Kubernetes AWS"
    },
    {
        "name": "Accountant",
        "cv": "Senior Accountant CPA certification financial reporting tax preparation auditing QuickBooks SAP Excel balance sheets"
    },
    {
        "name": "Chef",
        "cv": "Executive Chef French cuisine kitchen management menu planning food safety Michelin star culinary arts"
    }
]

url = "http://localhost:5002/classify"

print("=" * 80)
print("Testing CV Classification")
print("=" * 80)

for test in test_cases:
    print(f"\nTest: {test['name']}")
    print(f"CV: {test['cv'][:50]}...")
    
    try:
        response = requests.post(
            url,
            json={"cv_text": test['cv'], "use_groq_analysis": False},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Result: {result['job_title']}")
            print(f"   Confidence: {result['confidence']:.1%}")
            if result.get('top_3_predictions'):
                print("   Top 3:")
                for p in result['top_3_predictions']:
                    print(f"      - {p['job_title']}: {p['confidence']:.1%}")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

print("\n" + "=" * 80)
