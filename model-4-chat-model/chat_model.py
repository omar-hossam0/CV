"""
Model 4: Chat Model (Career Assistant)
Uses Groq API for intelligent career assistant chatbot
Port: 5004
"""

import sys
import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

sys.stdout.reconfigure(encoding="utf-8")

app = FastAPI(title="Career Assistant Chat Model")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq client
groq_client = None

class ChatRequest(BaseModel):
    question: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    success: bool
    answer: str
    source: str = "local"


def init_groq():
    """Initialize Groq API client"""
    global groq_client
    try:
        from groq import Groq
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            groq_client = Groq(api_key=api_key)
            print("✅ Groq API client initialized")
            return True
        else:
            print("⚠️ GROQ_API_KEY not found, using local fallback")
            return False
    except ImportError:
        print("⚠️ Groq library not installed, using local fallback")
        return False
    except Exception as e:
        print(f"⚠️ Error initializing Groq: {e}")
        return False


def local_chat_response(question: str, context: Optional[str] = None) -> str:
    """Local fallback response when Groq API is not available"""
    question_lower = question.lower()

    # Career-related responses
    if any(word in question_lower for word in ['salary', 'pay', 'compensation']):
        return """Salary depends on many factors:
- Location (city/country)
- Years of experience
- Specific skills and expertise
- Company size and industry
- Education level

For tech roles, typical ranges:
- Junior: $40,000 - $70,000
- Mid-level: $70,000 - $110,000
- Senior: $110,000 - $180,000+
- Lead/Principal: $150,000 - $250,000+

Would you like advice on salary negotiation?"""

    elif any(word in question_lower for word in ['interview', 'prepare', 'questions']):
        return """Here are common interview preparation tips:

1. **Technical Questions:**
   - Review data structures and algorithms
   - Practice system design
   - Know your resume projects deeply

2. **Behavioral Questions:**
   - Use STAR method (Situation, Task, Action, Result)
   - Prepare examples of teamwork, leadership, problem-solving

3. **Questions to Ask:**
   - "What does a typical day look like?"
   - "What are the team's current challenges?"
   - "How do you measure success in this role?"

4. **Final Tips:**
   - Research the company thoroughly
   - Dress professionally
   - Follow up with a thank-you email"""

    elif any(word in question_lower for word in ['resume', 'cv', 'improve']):
        return """Resume improvement tips:

1. **Format:**
   - Keep it clean and professional
   - Use consistent formatting
   - 1-2 pages maximum

2. **Content:**
   - Start with strong action verbs
   - Quantify achievements (numbers, percentages)
   - Tailor to the job description

3. **Skills Section:**
   - List relevant technical skills
   - Include soft skills
   - Mention certifications

4. **Common Mistakes:**
   - Typos and grammatical errors
   - Generic objective statements
   - Irrelevant experience
   - Missing contact information"""

    elif any(word in question_lower for word in ['skill', 'learn', 'technology']):
        return """In-demand skills for 2024-2025:

**Programming:**
- Python, JavaScript/TypeScript
- React, Next.js, Node.js
- SQL, GraphQL

**Cloud & DevOps:**
- AWS, Azure, GCP
- Docker, Kubernetes
- CI/CD pipelines

**AI/ML:**
- Machine Learning
- TensorFlow/PyTorch
- Data Analysis

**Soft Skills:**
- Communication
- Problem-solving
- Team collaboration

Which area would you like to learn more about?"""

    elif any(word in question_lower for word in ['career', 'path', 'growth']):
        return """Career growth advice:

1. **Continuous Learning:**
   - Take online courses
   - Attend workshops/webinars
   - Get certifications

2. **Networking:**
   - Join professional communities
   - Attend industry events
   - Connect on LinkedIn

3. **Visibility:**
   - Share knowledge (blog, talks)
   - Contribute to open source
   - Mentor others

4. **Goal Setting:**
   - Set clear 1-year, 3-year, 5-year goals
   - Review and adjust regularly
   - Seek feedback regularly"""

    else:
        return f"""Thank you for your question: "{question}"

I'm your career assistant chatbot. I can help you with:
- **Resume/CV tips** - How to improve your resume
- **Interview prep** - Common questions and answers
- **Career paths** - Growth opportunities
- **Skills** - What to learn next
- **Salary** - Compensation guidance

Please ask me anything about your career development!"""


@app.on_event("startup")
async def startup():
    print("🚀 Starting Career Assistant Chat Model...")
    init_groq()
    print("✅ Chat Model ready!")


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with career assistant"""
    try:
        question = request.question.strip()
        if not question:
            raise HTTPException(status_code=400, detail="Question is required")

        print(f"💬 Question: {question[:100]}...")

        # Try Groq API first
        if groq_client:
            try:
                system_prompt = request.context or """You are a professional career assistant chatbot. 
Help users with career advice, resume tips, interview preparation, skill development, and salary guidance.
Be helpful, professional, and provide actionable advice."""

                chat_completion = groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": question}
                    ],
                    model="llama-3.3-70b-versatile",
                    temperature=0.3,
                    max_tokens=1024,
                )

                answer = chat_completion.choices[0].message.content
                print(f"✅ Groq API response received")
                return ChatResponse(success=True, answer=answer, source="groq_api")
            except Exception as e:
                print(f"⚠️ Groq API error: {e}, falling back to local")

        # Local fallback
        answer = local_chat_response(question, request.context)
        print(f"✅ Local response generated")
        return ChatResponse(success=True, answer=answer, source="local_fallback")

    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "groq_api": groq_client is not None,
        "service": "Career Assistant Chat Model"
    }


@app.get("/")
async def root():
    return {
        "service": "Career Assistant Chat Model",
        "version": "1.0",
        "groq_api": groq_client is not None,
        "endpoints": {
            "chat": "/chat (POST)",
            "health": "/health (GET)"
        }
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5004)
