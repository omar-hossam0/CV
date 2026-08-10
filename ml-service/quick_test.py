"""
Quick test to check if model has find_top_matches method
"""
import pickle

# Load model
with open('cv_job_matcher_final.pkl', 'rb') as f:
    model = pickle.load(f)

print("Model type:", type(model).__name__)
print("\nChecking for methods:")
print("- has find_top_matches:", hasattr(model, 'find_top_matches'))
print("- has predict:", hasattr(model, 'predict'))

print("\nAll callable methods:")
methods = [m for m in dir(model) if not m.startswith('_') and callable(getattr(model, m))]
for m in methods:
    print(f"  - {m}")
