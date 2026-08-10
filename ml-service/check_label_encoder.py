import joblib
import numpy as np

# Load label encoder
label_encoder = joblib.load('../label_encoder_merged.pkl')

print("=" * 80)
print("Label Encoder Analysis")
print("=" * 80)
print(f"Total classes: {len(label_encoder.classes_)}")
print(f"\nAll classes:")
for i, cls in enumerate(label_encoder.classes_):
    print(f"  {i}: {cls}")

# Check which index is "Other"
if "Other" in label_encoder.classes_:
    other_index = np.where(label_encoder.classes_ == "Other")[0][0]
    print(f"\n'Other' is at index: {other_index}")
else:
    print("\n'Other' not found in classes")
