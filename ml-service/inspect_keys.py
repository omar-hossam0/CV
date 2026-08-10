import pickle
import os

MODEL_PATH = "cv_job_matcher_final.pkl"

if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, "rb") as f:
        data = pickle.load(f)
    
    if isinstance(data, dict) and 'matching_model_state' in data:
        state = data['matching_model_state']
        print("Model State Keys:", list(state.keys())[:20]) # Print first 20 keys
    else:
        print("No matching_model_state found")
