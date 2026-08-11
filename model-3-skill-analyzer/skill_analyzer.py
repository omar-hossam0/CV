"""
Model 3: Skill Analyzer Model
Analyzes CV-Job skill matches using keyword extraction + scoring
Port: 5003
"""

import sys
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from urllib.parse import quote

sys.stdout.reconfigure(encoding="utf-8")

app = Flask(__name__)
CORS(app)

# Comprehensive skills database
SKILLS_DATABASE = {
    "languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "php", "ruby",
        "go", "rust", "swift", "kotlin", "scala", "r", "matlab", "perl", "lua",
        "dart", "objective-c", "html", "css", "sass", "scss", "less"
    ],
    "frontend": [
        "react", "reactjs", "angular", "angularjs", "vue", "vuejs", "vue.js",
        "nextjs", "next.js", "nuxt", "svelte", "jquery", "bootstrap", "tailwind",
        "tailwindcss", "material-ui", "redux", "mobx", "zustand", "webpack", "vite"
    ],
    "backend": [
        "nodejs", "node.js", "express", "expressjs", "fastify", "nestjs",
        "django", "flask", "fastapi", "spring", "springboot", "laravel",
        "rails", "ruby on rails", "asp.net", "dotnet", ".net"
    ],
    "databases": [
        "mysql", "postgresql", "postgres", "mongodb", "redis", "elasticsearch",
        "sqlite", "oracle", "mssql", "sql server", "mariadb", "cassandra",
        "dynamodb", "firebase", "supabase", "prisma", "sequelize", "mongoose",
        "sql", "nosql", "graphql"
    ],
    "devops": [
        "aws", "amazon web services", "azure", "gcp", "google cloud",
        "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins",
        "gitlab ci", "github actions", "circleci", "nginx", "apache",
        "linux", "ubuntu", "bash", "shell", "ci/cd", "cicd", "devops",
        "prometheus", "grafana", "elk", "datadog"
    ],
    "mobile": [
        "react native", "flutter", "swift", "swiftui", "kotlin", "android",
        "ios", "xcode", "android studio", "ionic", "cordova", "xamarin"
    ],
    "datascience": [
        "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
        "scikit-learn", "sklearn", "pandas", "numpy", "scipy", "matplotlib",
        "nlp", "natural language processing", "computer vision", "opencv",
        "neural network", "ai", "artificial intelligence", "data science",
        "data analysis", "data engineering", "spark", "hadoop", "tableau",
        "power bi", "jupyter"
    ],
    "testing": [
        "jest", "mocha", "chai", "jasmine", "cypress", "selenium", "playwright",
        "pytest", "unittest", "junit", "testing", "unit testing", "e2e",
        "integration testing", "tdd", "bdd"
    ],
    "tools": [
        "git", "github", "gitlab", "bitbucket", "jira", "confluence",
        "trello", "slack", "figma", "postman", "swagger", "api", "rest",
        "restful", "soap", "grpc", "websocket"
    ],
    "methodologies": [
        "agile", "scrum", "kanban", "waterfall", "lean", "microservices",
        "monolithic", "serverless", "event-driven", "oop", "design patterns", "solid"
    ],
    "security": [
        "oauth", "jwt", "authentication", "authorization", "security",
        "encryption", "ssl", "tls", "https", "owasp", "penetration testing",
        "cybersecurity"
    ],
    "soft_skills": [
        "communication", "leadership", "teamwork", "problem solving",
        "critical thinking", "time management", "adaptability", "creativity"
    ],
    "business": [
        "project management", "product management", "business analysis",
        "requirements gathering", "stakeholder management", "budgeting",
        "forecasting", "strategic planning", "process improvement"
    ],
    "marketing": [
        "seo", "sem", "social media", "content marketing", "email marketing",
        "google ads", "facebook ads", "analytics", "brand management",
        "copywriting", "public relations", "marketing strategy"
    ]
}

# Flatten all skills
ALL_SKILLS = []
for category_skills in SKILLS_DATABASE.values():
    ALL_SKILLS.extend(category_skills)
ALL_SKILLS = list(set(ALL_SKILLS))


def extract_skills_from_text(text, skills_list):
    """Extract skills mentioned in text"""
    text_lower = text.lower()
    found_skills = []
    for skill in skills_list:
        if skill.lower() in text_lower:
            found_skills.append(skill)
    return found_skills


def analyze_cv_job_match(cv_text, job_desc):
    """Analyze CV and Job match, return missing skills"""
    cv_skills = extract_skills_from_text(cv_text, ALL_SKILLS)
    job_skills = extract_skills_from_text(job_desc, ALL_SKILLS)

    # Find missing skills (in job but not in CV)
    missing_skills = []
    matched_skills = []

    for skill in job_skills:
        if skill in cv_skills:
            matched_skills.append(skill)
        else:
            # Determine priority based on skill importance
            priority = "MEDIUM"
            high_priority_skills = [
                "python", "javascript", "java", "react", "node.js", "sql",
                "aws", "docker", "kubernetes", "git", "machine learning"
            ]
            if skill.lower() in [s.lower() for s in high_priority_skills]:
                priority = "HIGH"
            elif skill.lower() in ["figma", "photoshop", "jira", "slack"]:
                priority = "LOW"

            missing_skills.append({
                'skill': skill,
                'confidence': 0.7 if priority == "HIGH" else 0.5,
                'priority': priority,
                'youtube': f"https://www.youtube.com/results?search_query={quote(f'{skill} tutorial')}"
            })

    # Sort by priority
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    missing_skills.sort(key=lambda x: priority_order.get(x['priority'], 1))

    # Limit to top 15
    missing_skills = missing_skills[:15]

    # Calculate match percentage
    if len(job_skills) > 0:
        match_percentage = ((len(job_skills) - len(missing_skills)) / len(job_skills)) * 100
    else:
        match_percentage = 0

    return {
        'cv_skills': cv_skills,
        'job_skills': job_skills,
        'missing_skills': missing_skills,
        'matched_skills': matched_skills,
        'match_percentage': round(match_percentage, 2)
    }


@app.route('/analyze', methods=['POST'])
def analyze():
    """API endpoint to analyze CV and Job match"""
    try:
        data = request.get_json()

        cv_text = data.get('cv_text', '')
        job_desc = data.get('job_desc', '')

        if not cv_text or not job_desc:
            return jsonify({
                'success': False,
                'message': 'cv_text and job_desc are required'
            }), 400

        print(f"📄 Analyzing CV ({len(cv_text)} chars) against Job ({len(job_desc)} chars)")

        result = analyze_cv_job_match(cv_text, job_desc)

        print(f"✅ Match: {result['match_percentage']}%")
        print(f"   Matched: {len(result['matched_skills'])} skills")
        print(f"   Missing: {len(result['missing_skills'])} skills")

        return jsonify({
            'success': True,
            'data': result
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Skill Analyzer Service is running',
        'skills_count': len(ALL_SKILLS),
        'service': 'Skill Analyzer Model'
    })


@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'service': 'Skill Analyzer Model',
        'version': '1.0',
        'skills_count': len(ALL_SKILLS),
        'endpoints': {
            'analyze': '/analyze (POST)',
            'health': '/health (GET)'
        }
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5003))
    print(f"🚀 Starting Skill Analyzer Service on port {port}...")
    print(f"📊 Loaded {len(ALL_SKILLS)} skills")
    app.run(host='0.0.0.0', port=port, debug=False)
