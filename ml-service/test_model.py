import pickle
import sys

# Load the model
print("Loading model...")
with open('cv_job_matcher_final.pkl', 'rb') as f:
    model = pickle.load(f)

print(f"Model type: {type(model)}")
print(f"\nModel methods:")
methods = [m for m in dir(model) if not m.startswith('_') and callable(getattr(model, m))]
for m in methods:
    print(f"  - {m}")

# Test data
cv_text = "Python developer with 5 years experience in machine learning and deep learning. Expert in TensorFlow, PyTorch, scikit-learn. Strong background in NLP and computer vision."

job_descriptions = [
    "Looking for Python ML engineer with experience in deep learning frameworks like TensorFlow and PyTorch",
    "Java backend developer needed for enterprise applications",
    "Senior data scientist with NLP expertise required",
    "Frontend React developer wanted",
    "DevOps engineer with AWS experience"
]

print(f"\n{'='*60}")
print("Testing find_top_matches with use_hybrid=True")
print(f"{'='*60}")

if hasattr(model, 'find_top_matches'):
    try:
        result = model.find_top_matches(cv_text, job_descriptions, top_k=5, use_hybrid=True)
        print(f"\nResult type: {type(result)}")
        print(f"Result length: {len(result) if isinstance(result, (list, tuple)) else 'N/A'}")
        print(f"\nResult content:")
        for i, item in enumerate(result):
            print(f"  {i}: {item} (type: {type(item)})")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("Model does not have find_top_matches method")
    
    # Try predict instead
    if hasattr(model, 'predict'):
        print("\nTrying predict method instead...")
        try:
            result = model.predict(cv_text, job_descriptions)
            print(f"\nResult type: {type(result)}")
            print(f"Result content: {result}")
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
