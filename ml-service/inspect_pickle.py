import pickle
import os

MODEL_PATH = "cv_job_matcher_final.pkl"

if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, "rb") as f:
        data = pickle.load(f)
    
    print(f"Type: {type(data)}")
    if isinstance(data, dict):
        print("Keys:", data.keys())
        for k, v in data.items():
            print(f"Key: {k}, Type: {type(v)}")
            if hasattr(v, 'shape'):
                print(f"  Shape: {v.shape}")
else:
    print("Model file not found")
