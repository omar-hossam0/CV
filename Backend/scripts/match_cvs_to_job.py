"""
Job-to-CVs Matching System
Finds best matching CVs for a given job description using BERT (same as employee matching)
Uses CVJobMatcher for consistent matching across the platform
"""

import sys
import json
import os

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Add model matching directory to path
model_dir = os.path.abspath(os.path.join(script_dir, '..', '..', 'model matching'))
sys.path.insert(0, model_dir)

# Try to import BERT matcher
USE_BERT = False
try:
    from cv_job_matching_model import CVJobMatcher
    USE_BERT = True
    print("✅ Using BERT CVJobMatcher for matching", file=sys.stderr, flush=True)
except ImportError as e:
    print(f"⚠️ BERT matcher not available, falling back to TF-IDF: {e}", file=sys.stderr, flush=True)

import re
from collections import Counter
import math

def tokenize(text):
    """Tokenize and clean text"""
    # Convert to lowercase
    text = text.lower()
    # Extract words (alphanumeric + some special chars)
    words = re.findall(r'\b[\w\+\#]+\b', text)
    
    # Remove very common words (stop words)
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
        'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
        'would', 'should', 'could', 'can', 'may', 'might', 'must', 'this',
        'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
        'am', 'your', 'my', 'our', 'their'
    }
    
    return [w for w in words if w not in stop_words and len(w) > 2]


def calculate_tf_idf(documents):
    """
    Calculate TF-IDF for documents
    Returns: list of dictionaries {term: tfidf_score}
    """
    n_docs = len(documents)
    
    # Calculate document frequency for each term
    df = {}
    for doc in documents:
        tokens = tokenize(doc)
        unique_tokens = set(tokens)
        for token in unique_tokens:
            df[token] = df.get(token, 0) + 1
    
    # Calculate TF-IDF for each document
    tfidf_docs = []
    for doc in documents:
        tokens = tokenize(doc)
        token_counts = Counter(tokens)
        doc_length = len(tokens)
        
        tfidf = {}
        for token, count in token_counts.items():
            # TF: term frequency
            tf = count / doc_length if doc_length > 0 else 0
            # IDF: inverse document frequency
            idf = math.log(n_docs / df[token]) if df[token] > 0 else 0
            tfidf[token] = tf * idf
        
        tfidf_docs.append(tfidf)
    
    return tfidf_docs


def cosine_similarity_simple(text1, text2):
    """Calculate cosine similarity using term frequencies"""
    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)
    
    if not tokens1 or not tokens2:
        return 0.0
    
    # Count term frequencies  
    freq1 = Counter(tokens1)
    freq2 = Counter(tokens2)
    
    # Get all unique terms
    all_terms = set(freq1.keys()) | set(freq2.keys())
    
    # Calculate dot product and magnitudes
    dot_product = sum(freq1.get(term, 0) * freq2.get(term, 0) for term in all_terms)
    magnitude1 = math.sqrt(sum(val**2 for val in freq1.values()))
    magnitude2 = math.sqrt(sum(val**2 for val in freq2.values()))
    
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    
    return dot_product / (magnitude1 * magnitude2)


def match_cv_to_job(cv_text, job_text):
    """
    Match a CV to a job description using cosine similarity
    Returns similarity score (0-100 range to match BERT model output)
    """
    similarity = cosine_similarity_simple(cv_text, job_text)
    return similarity * 100  # Convert to 0-100 to match BERT model output


def main():
    """
    Main execution: read job + CVs from stdin, return top matches as JSON
    Uses BERT matcher (same as employee matching) for consistency
    """
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        job_description = input_data.get('job_description', '')
        cv_texts = input_data.get('cv_texts', [])
        top_k = input_data.get('top_k', 10)
        
        if not job_description:
            raise ValueError("Missing job_description")
        
        if not cv_texts:
            raise ValueError("Missing cv_texts")
        
        all_matches = []
        
        # Use BERT matcher if available (same as employee matching)
        if USE_BERT:
            print(f"🔍 Matching {len(cv_texts)} CVs to job using BERT (same as employee)...", file=sys.stderr, flush=True)
            
            try:
                matcher = CVJobMatcher()
                
                # Try to load trained model
                model_path = os.path.join(script_dir, '..', '..', 'model matching', 'cv_job_matcher_final.pkl')
                try:
                    matcher.load_model(model_path)
                    print(f"✅ BERT Model loaded from: {model_path}", file=sys.stderr, flush=True)
                except FileNotFoundError:
                    print("⚠️ Trained model not found. Using embeddings only (hybrid mode).", file=sys.stderr, flush=True)
                
                # For each CV, calculate match score against the job description
                # We use the same method as employee matching but inverted
                # (matching job to multiple CVs instead of CV to multiple jobs)
                for cv_index, cv_text in enumerate(cv_texts):
                    if not cv_text or len(cv_text.strip()) < 10:
                        continue
                    
                    # Use BERT to match this CV against the job description
                    # We pass the CV as the "query" and job as single "document"
                    matches = matcher.find_top_matches(
                        cv_text,           # CV text (like employee's CV)
                        [job_description], # Single job description
                        top_k=1,
                        use_hybrid=True
                    )
                    
                    if matches and len(matches) > 0:
                        score = matches[0].get('similarity_score', 0)  # Already 0-100 from BERT model
                    else:
                        score = 0
                    
                    all_matches.append({
                        'job_index': cv_index,  # Named for compatibility with backend
                        'cv_index': cv_index,
                        'similarity_score': round(score, 2)  # Already 0-100
                    })
                
                print(f"✅ BERT matching complete for {len(all_matches)} CVs", file=sys.stderr, flush=True)
                
            except Exception as bert_error:
                print(f"⚠️ BERT matching failed, falling back to TF-IDF: {bert_error}", file=sys.stderr, flush=True)
                # Fall through to TF-IDF matching below
                all_matches = []
        
        # Fallback to TF-IDF if BERT not available or failed
        if not all_matches:
            print(f"🔍 Matching {len(cv_texts)} CVs to job using TF-IDF...", file=sys.stderr, flush=True)
            
            for cv_index, cv_text in enumerate(cv_texts):
                if not cv_text or len(cv_text.strip()) < 10:
                    continue
                
                score = match_cv_to_job(cv_text, job_description)
                
                all_matches.append({
                    'job_index': cv_index,
                    'cv_index': cv_index,
                    'similarity_score': round(score, 2)
                })
        
        # Sort by score descending
        all_matches = sorted(all_matches, key=lambda x: x['similarity_score'], reverse=True)
        
        # Take top K
        top_matches = all_matches[:top_k]
        
        if top_matches:
            top_scores = [f"{m['similarity_score']:.1f}%" for m in top_matches[:3]]
            print(f"✅ Top 3 matches: {', '.join(top_scores)}", file=sys.stderr, flush=True)
        
        # Return results as JSON to stdout
        result = {
            'success': True,
            'matches': top_matches,
            'total_cvs': len(cv_texts),
            'matched_cvs': len(all_matches),
            'method': 'BERT' if USE_BERT else 'TF-IDF'
        }
        
        print(json.dumps(result), flush=True)
        
    except json.JSONDecodeError as e:
        error_response = {
            'success': False,
            'error': f'Invalid JSON input: {str(e)}'
        }
        print(json.dumps(error_response), flush=True)
        sys.exit(1)
        
    except Exception as e:
        import traceback
        error_response = {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(json.dumps(error_response), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
