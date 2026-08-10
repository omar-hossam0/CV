"""
فحص الـ vectorizer والـ label encoder من MYYYYY
"""
import joblib
import pickle

# تحميل الملفات
vectorizer = joblib.load('vectorizer_merged.pkl')
label_encoder = joblib.load('label_encoder_merged.pkl')

print("=" * 80)
print("📊 Vectorizer Info:")
print("=" * 80)
print(f"Type: {type(vectorizer)}")
print(f"Max features: {vectorizer.max_features}")
print(f"Vocabulary size: {len(vectorizer.vocabulary_)}")
print(f"N-gram range: {vectorizer.ngram_range}")

print("\n" + "=" * 80)
print("🏷️ Label Encoder Info:")
print("=" * 80)
print(f"Number of classes: {len(label_encoder.classes_)}")
print(f"Classes: {list(label_encoder.classes_)}")

# اختبار تحويل نص
test_text = "senior full stack developer python django react nodejs aws"
X_test = vectorizer.transform([test_text]).toarray()
print("\n" + "=" * 80)
print("✅ Test Transform:")
print("=" * 80)
print(f"Input text: {test_text}")
print(f"Output shape: {X_test.shape}")
print(f"First 10 features: {X_test[0][:10]}")
