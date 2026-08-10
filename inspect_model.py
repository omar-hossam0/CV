"""
فحص موديل cv_classifier_merged.keras
"""
import tensorflow as tf

model = tf.keras.models.load_model('cv_classifier_merged.keras')

print("=" * 80)
print("🧠 Model Architecture:")
print("=" * 80)
model.summary()

print("\n" + "=" * 80)
print("📊 Model Info:")
print("=" * 80)
print(f"Input shape: {model.input_shape}")
print(f"Output shape: {model.output_shape}")
print(f"Number of layers: {len(model.layers)}")
