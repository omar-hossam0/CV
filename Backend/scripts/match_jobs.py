"""
Quick job matching script using the actual CVJobMatcher model
Called from Node.js backend via subprocess
"""

import sys
import json
import os
import warnings
warnings.filterwarnings('ignore')

# Add model matching directory to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
model_dir = os.path.join(project_root, 'model matching')
sys.path.insert(0, model_dir)

try:
    from cv_job_matching_model import CVJobMatcher
    
    def main():
        # Read input from stdin (JSON format)
        input_str = sys.stdin.read()
        input_data = json.loads(input_str)
        
        cv_text = input_data['cv_text']
        job_descriptions = input_data['job_descriptions']  # List of strings
        top_k = input_data.get('top_k', 10)
        
        # Log to stderr (won't interfere with JSON output)
        print(f"🔍 Python Matcher: Processing CV ({len(cv_text)} chars) and {len(job_descriptions)} jobs", file=sys.stderr)
        
        # Initialize matcher
        matcher = CVJobMatcher()
        
        # Try to load trained model
        model_path = os.path.join(model_dir, 'cv_job_matcher_final.pkl')
        if os.path.exists(model_path):
            try:
                matcher.load_model(model_path)
                print(f"✅ Model loaded from: {model_path}", file=sys.stderr)
            except Exception as e:
                print(f"⚠️  Could not load model: {e}", file=sys.stderr)
                print("   Using BERT embeddings only (this is fine!)", file=sys.stderr)
        else:
            print(f"⚠️  Model file not found: {model_path}", file=sys.stderr)
            print("   Using BERT embeddings only", file=sys.stderr)
        
        # Find matches using hybrid mode (70% Semantic BERT + 30% Keywords)
        print(f"🚀 Running hybrid matching (70% BERT Semantic + 30% Keywords)...", file=sys.stderr)
        matches = matcher.find_top_matches(cv_text, job_descriptions, top_k=top_k, use_hybrid=True)
        
        # Log top matches to stderr
        print(f"✅ Matching complete! Top {len(matches)} results:", file=sys.stderr)
        for i, match in enumerate(matches[:5], 1):
            print(f"   {i}. Job #{match['job_index']}: {match['similarity_score']:.2f}%", file=sys.stderr)
        
        # Output results as JSON to stdout
        print(json.dumps({
            'success': True,
            'matches': matches
        }))
    
    if __name__ == '__main__':
        main()
        
except Exception as e:
    import traceback
    print(json.dumps({
        'success': False,
        'error': str(e),
        'traceback': traceback.format_exc()
    }))
    sys.exit(1)
