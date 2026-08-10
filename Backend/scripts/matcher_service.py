"""
Persistent Python Matcher Service
Keeps BERT model loaded in memory for fast matching
"""

import sys
import json
import os

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Add model matching directory to path (go up 2 levels then into model matching)
model_dir = os.path.abspath(os.path.join(script_dir, '..', '..', 'model matching'))
print(f"🐍 Adding to path: {model_dir}", file=sys.stderr, flush=True)
sys.path.insert(0, model_dir)

try:
    from cv_job_matching_model import CVJobMatcher
    print("✅ Successfully imported CVJobMatcher", file=sys.stderr, flush=True)
except ImportError as e:
    print(f"❌ Failed to import CVJobMatcher: {e}", file=sys.stderr, flush=True)
    print(f"   sys.path: {sys.path}", file=sys.stderr, flush=True)
    sys.exit(1)

def main():
    """
    Run as a persistent service that loads model once and handles multiple requests
    """
    print("🐍 Starting Python BERT Matcher Service...", file=sys.stderr, flush=True)
    
    # Load model once at startup
    try:
        matcher = CVJobMatcher()
        
        # Try to load trained model
        model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'model matching', 'cv_job_matcher_final.pkl')
        try:
            matcher.load_model(model_path)
            print(f"✅ Model loaded from: {model_path}", file=sys.stderr, flush=True)
        except FileNotFoundError:
            print("⚠️ Trained model not found. Using embeddings only (hybrid mode).", file=sys.stderr, flush=True)
        
        print("🚀 Service ready! Waiting for requests...", file=sys.stderr, flush=True)
        
        # Listen for requests on stdin
        for line in sys.stdin:
            try:
                line = line.strip()
                if not line:
                    continue
                
                if line == "QUIT":
                    print("👋 Shutting down service...", file=sys.stderr, flush=True)
                    break
                
                # Parse request
                request = json.loads(line)
                cv_text = request.get('cv_text', '')
                job_descriptions = request.get('job_descriptions', [])
                top_k = request.get('top_k', 10)
                
                print(f"📨 Request received: CV={len(cv_text)} chars, Jobs={len(job_descriptions)}", file=sys.stderr, flush=True)
                
                # Perform matching
                matches = matcher.find_top_matches(
                    cv_text, 
                    job_descriptions, 
                    top_k=top_k, 
                    use_hybrid=True
                )
                
                # Send response
                response = {
                    'success': True,
                    'matches': matches
                }
                
                print(json.dumps(response), flush=True)
                print(f"✅ Response sent: {len(matches)} matches", file=sys.stderr, flush=True)
                
            except json.JSONDecodeError as e:
                error_response = {
                    'success': False,
                    'error': f'Invalid JSON: {str(e)}'
                }
                print(json.dumps(error_response), flush=True)
                
            except Exception as e:
                import traceback
                error_response = {
                    'success': False,
                    'error': str(e),
                    'traceback': traceback.format_exc()
                }
                print(json.dumps(error_response), flush=True)
                print(f"❌ Error: {str(e)}", file=sys.stderr, flush=True)
    
    except Exception as e:
        import traceback
        print(f"❌ Fatal error during initialization: {str(e)}", file=sys.stderr, flush=True)
        print(traceback.format_exc(), file=sys.stderr, flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
