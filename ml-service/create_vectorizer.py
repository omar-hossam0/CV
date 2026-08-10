"""
Create Vectorizer and Label Encoder from existing model
"""
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
import json
import os

print("🔄 Creating Vectorizer and Label Encoder...")

# Load categories from job_classes.json
with open('job_classes.json', 'r', encoding='utf-8') as f:
    categories = json.load(f)

print(f"✅ Loaded {len(categories)} categories")

# Create Label Encoder
label_encoder = LabelEncoder()
label_encoder.fit(categories)

print(f"✅ Label Encoder created with {len(label_encoder.classes_)} classes")

# Create TF-IDF Vectorizer with same settings as training
vectorizer = TfidfVectorizer(
    max_features=5000,  # Adjust based on your model's input
    ngram_range=(1, 2),  # Unigrams and bigrams
    min_df=2,
    max_df=0.8,
    stop_words='english'
)

# Fit vectorizer with dummy data (we'll use it for transform only)
# In production, this should be the same vectorizer used during training
dummy_texts = [
    "software engineer python javascript developer",
    "data scientist machine learning tensorflow",
    "frontend developer react vue angular",
    "backend developer nodejs express api",
    "full stack developer mern stack",
] * 10  # Multiply to have enough samples

vectorizer.fit(dummy_texts)

print(f"✅ Vectorizer created with {len(vectorizer.get_feature_names_out())} features")

# Save both files
joblib.dump(vectorizer, 'vectorizer_merged.pkl')
joblib.dump(label_encoder, 'label_encoder_merged.pkl')

print("\n✅ Files saved:")
print("   - vectorizer_merged.pkl")
print("   - label_encoder_merged.pkl")

print("\n⚠️  IMPORTANT NOTE:")
print("This is a DUMMY vectorizer created for testing.")
print("For production, you should use the ACTUAL vectorizer used during model training!")
print("If you have the original training data, retrain the vectorizer properly.")
