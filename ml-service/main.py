from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import pickle
import io
import os

from typing import Optional

# Import the CVJobMatcher class
try:
    from cv_job_matching_model import CVJobMatcher
    HAS_MATCHER_CLASS = True
except ImportError:
    HAS_MATCHER_CLASS = False
    print("⚠️ Warning: cv_job_matching_model not found. Will try to load pkl file.")

# Optional libraries for document parsing
try:
    import pdfminer.high_level as pdfminer_high_level
except Exception:
    pdfminer_high_level = None

try:
    import docx  # python-docx
except Exception:
    docx = None

app = FastAPI(title="CV Job Matcher ML Service")

MODEL_PATH = os.getenv("MODEL_PATH", "cv_job_matcher_final.pkl")


class PredictResponse(BaseModel):
    success: bool
    match: Optional[str] = None
    score: Optional[float] = None
    details: Optional[dict] = None


class JobDescription(BaseModel):
    id: str
    description: str


class MatchJobsRequest(BaseModel):
    cv_text: str
    job_descriptions: list[JobDescription]


class MatchedJob(BaseModel):
    job_id: str
    score: float


class MatchJobsResponse(BaseModel):
    success: bool
    matched_jobs: list[MatchedJob]


# Load model at startup
@app.on_event("startup")
def load_model():
    global model
    
    # Try to initialize CVJobMatcher class if available
    if HAS_MATCHER_CLASS:
        try:
            print("🔄 Initializing CVJobMatcher...")
            model = CVJobMatcher()
            
            # Try to load trained weights if pkl file exists
            if os.path.exists(MODEL_PATH):
                try:
                    model.load_model(MODEL_PATH)
                    print(f"✅ CVJobMatcher loaded with trained model from {MODEL_PATH}")
                except Exception as e:
                    print(f"⚠️ Could not load pkl file into CVJobMatcher: {e}")
                    print("   Using CVJobMatcher with default BERT embeddings (this is fine!)")
            else:
                print("⚠️ No pkl file found, using CVJobMatcher with default BERT embeddings")
            
            print(f"📊 Model type: {type(model).__name__}")
            print(f"📊 Has find_top_matches: {hasattr(model, 'find_top_matches')}")
            
            if hasattr(model, 'find_top_matches'):
                print("✅ Model is ready for hybrid matching!")
            return
            
        except Exception as e:
            print(f"❌ Failed to initialize CVJobMatcher: {e}")
            print("   Falling back to pkl file loading...")
    
    # Fallback: load pkl file directly (legacy mode)
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Model file not found at '{MODEL_PATH}'")
    
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    
    print(f"✅ Model loaded from {MODEL_PATH}")
    print(f"📊 Model type: {type(model).__name__}")
    print(f"📊 Model class: {type(model)}")
    
    # Check for required methods
    has_find_top_matches = hasattr(model, 'find_top_matches')
    has_predict = hasattr(model, 'predict')
    
    print(f"📊 Has find_top_matches: {has_find_top_matches}")
    print(f"📊 Has predict: {has_predict}")
    
    if has_find_top_matches:
        import inspect
        try:
            sig = inspect.signature(model.find_top_matches)
            print(f"📊 find_top_matches signature: {sig}")
        except:
            pass
    
    # List all callable methods
    methods = [m for m in dir(model) if not m.startswith('_') and callable(getattr(model, m))]
    print(f"📊 Available methods: {', '.join(methods[:10])}")
    if len(methods) > 10:
        print(f"   ... and {len(methods) - 10} more")


# Endpoint to reload model without restarting service
@app.post("/reload-model")
async def reload_model():
    """Reload the ML model from disk (useful after updating the .pkl file)"""
    global model
    try:
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(f"Model file not found at '{MODEL_PATH}'")

        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)

        return {
            "success": True,
            "message": f"Model reloaded successfully from {MODEL_PATH}",
            "timestamp": os.path.getmtime(MODEL_PATH)
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )


def _read_pdf(file_bytes: bytes) -> str:
    if pdfminer_high_level is None:
        raise RuntimeError(
            "pdfminer.six not installed. Install it to read PDFs.")
    with io.BytesIO(file_bytes) as fh:
        text = pdfminer_high_level.extract_text(fh) or ""
    return text


def _read_docx(file_bytes: bytes) -> str:
    if docx is None:
        raise RuntimeError(
            "python-docx not installed. Install it to read DOCX.")
    with io.BytesIO(file_bytes) as fh:
        document = docx.Document(fh)
        return "\n".join([p.text for p in document.paragraphs])


def _read_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1", errors="ignore")


def extract_text(filename: str, file_bytes: bytes) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        return _read_pdf(file_bytes)
    if name.endswith(".docx"):
        return _read_docx(file_bytes)
    if name.endswith(".txt"):
        return _read_txt(file_bytes)
    # Fallback: try as text
    return _read_txt(file_bytes)


@app.post("/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)):
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file uploaded")

        cv_text = extract_text(file.filename, content)
        if not cv_text.strip():
            raise HTTPException(
                status_code=400, detail="Unable to extract text from file")

        # Example model interface: model.predict(cv_text) -> {match, score, details}
        # Adjust this according to your actual model
        if hasattr(model, "predict"):
            result = model.predict(cv_text)
            if isinstance(result, dict):
                return PredictResponse(success=True, **result)
            # If returns (match, score)
            if isinstance(result, (list, tuple)) and len(result) >= 2:
                return PredictResponse(success=True, match=result[0], score=float(result[1]))
            # If returns just match string
            return PredictResponse(success=True, match=str(result))
        else:
            # Dummy example if model is a vectorizer/classifier pipeline
            # Replace this with your actual inference
            return PredictResponse(success=True, match="Unknown", score=0.0, details={"note": "Model has no predict method"})

    except HTTPException as he:
        raise he
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@app.post("/match-jobs", response_model=MatchJobsResponse)
async def match_jobs(request: MatchJobsRequest):
    """
    Match CV with job descriptions using the ML model.

    Input:
    - cv_text: The candidate's CV as text
    - job_descriptions: List of dicts with 'id' and 'description'

    Output:
    - top 10 matched job IDs with scores
    """
    try:
        cv_text = request.cv_text
        job_descriptions = [{"id": job.id, "description": job.description} for job in request.job_descriptions]
        
        print(f"\n{'='*60}")
        print(f"🔍 NEW MATCH REQUEST RECEIVED")
        print(f"📄 CV Text Length: {len(cv_text)} characters")
        print(f"📄 CV Preview: {cv_text[:100]}...")
        print(f"💼 Number of Jobs: {len(job_descriptions)}")

        if not cv_text or not cv_text.strip():
            raise HTTPException(status_code=400, detail="CV text is required")

        if not job_descriptions or len(job_descriptions) == 0:
            raise HTTPException(
                status_code=400, detail="Job descriptions are required")

        # Limit to 20 jobs as per model specification
        jobs_to_match = job_descriptions[:20]

        # Extract just the descriptions for the model
        descriptions = [job.get('description', '') for job in jobs_to_match]
        
        print(f"💼 Job Descriptions being matched:")
        for idx, desc in enumerate(descriptions[:5]):  # Show first 5
            print(f"   Job {idx + 1}: {desc[:80]}...")
        if len(descriptions) > 5:
            print(f"   ... and {len(descriptions) - 5} more jobs")

        # Call the model's find_top_matches method with hybrid matching
        # Hybrid matching: 70% Semantic Similarity + 30% Keyword Matching
        print(
            f"🤖 Calling model.find_top_matches() with {len(descriptions)} job descriptions...")
        print(f"   Using HYBRID matching: 70% Semantic + 30% Keyword")

        # Try find_top_matches first (preferred method with hybrid matching)
        if hasattr(model, 'find_top_matches'):
            try:
                # Call with hybrid matching enabled
                result = model.find_top_matches(
                    cv_text, 
                    descriptions, 
                    top_k=10, 
                    use_hybrid=True
                )
                print(
                    f"✅ Model returned result: {type(result)}, length: {len(result) if isinstance(result, (list, tuple)) else 'N/A'}")

                # Result should be list of dicts with 'job_index' and 'similarity_score'
                matched_jobs = []

                if isinstance(result, (list, tuple)):
                    print(f"📊 Processing {len(result)} results from model...")
                    for idx, item in enumerate(result[:10]):
                        # Expected format: {'job_index': int, 'similarity_score': float}
                        if isinstance(item, dict):
                            job_idx = item.get('job_index')
                            score = item.get('similarity_score', 0)
                            
                            print(f"   Result {idx}: job_index={job_idx}, similarity_score={score}")
                            
                            if job_idx is not None and job_idx < len(jobs_to_match):
                                final_score = float(score) / 100.0  # Convert percentage to 0-1 range
                                matched_jobs.append({
                                    "job_id": jobs_to_match[job_idx].get('id'),
                                    "score": final_score
                                })
                                print(f"      → Mapped to job_id={jobs_to_match[job_idx].get('id')}, final_score={final_score}")
                        # Fallback: if item is (index, score) tuple
                        elif isinstance(item, (list, tuple)) and len(item) >= 2:
                            job_idx, score = item[0], item[1]
                            print(f"   Result {idx}: tuple format - job_idx={job_idx}, score={score}")
                            if job_idx < len(jobs_to_match):
                                final_score = float(score) / 100.0 if score > 1 else float(score)
                                matched_jobs.append({
                                    "job_id": jobs_to_match[job_idx].get('id'),
                                    "score": final_score
                                })
                                print(f"      → Mapped to job_id={jobs_to_match[job_idx].get('id')}, final_score={final_score}")

                print(f"✅ Matched {len(matched_jobs)} jobs with hybrid matching")
                print(f"📊 Final matched jobs:")
                for mj in matched_jobs:
                    print(f"   - job_id={mj['job_id']}, score={mj['score']}")
                return {
                    "success": True,
                    "matched_jobs": matched_jobs
                }
            except Exception as e:
                print(f"⚠️ find_top_matches failed: {str(e)}")
                print(f"   Error type: {type(e).__name__}")
                import traceback
                traceback.print_exc()
                print(f"   Falling back to predict method...")
        else:
            print(f"⚠️ Model does not have find_top_matches method")
            print(f"   Available methods: {[m for m in dir(model) if not m.startswith('_') and callable(getattr(model, m))]}")
        
        # Fallback to predict method if find_top_matches not available
        if hasattr(model, 'predict'):
            result = model.predict(cv_text, descriptions)
            print(
                f"✅ Model returned result: {type(result)}, length: {len(result) if isinstance(result, (list, tuple)) else 'N/A'}")

            # Result should be list of indices (0-19) for top 10 matches
            # Convert indices to job IDs with scores
            matched_jobs = []

            if isinstance(result, (list, tuple)):
                for idx, item in enumerate(result[:10]):
                    # If item is just an index
                    if isinstance(item, int) and item < len(jobs_to_match):
                        matched_jobs.append({
                            "job_id": jobs_to_match[item].get('id'),
                            "score": (100 - idx * 5) / 100  # Decreasing score
                        })
                    # If item is (index, score) tuple
                    elif isinstance(item, (list, tuple)) and len(item) >= 2:
                        job_idx, score = item[0], item[1]
                        if job_idx < len(jobs_to_match):
                            matched_jobs.append({
                                "job_id": jobs_to_match[job_idx].get('id'),
                                "score": float(score)
                            })

            return {
                "success": True,
                "matched_jobs": matched_jobs
            }
        else:
            raise HTTPException(
                status_code=500, detail="Model does not have predict or find_top_matches method")

    except HTTPException as he:
        raise he
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=5001, reload=True)
