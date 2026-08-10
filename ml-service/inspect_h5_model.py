"""
Quick inspection of mlp_cv_model.h5 to understand its structure
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import tensorflow as tf
    import numpy as np
    
    model_path = "../MYYYYY/MYYYYY/mlp_cv_model.h5"
    
    print("=" * 60)
    print("Loading model from:", model_path)
    print("=" * 60)
    
    # Load model
    model = tf.keras.models.load_model(model_path)
    
    print("\n✅ Model loaded successfully!\n")
    
    # Print summary
    print("Model Summary:")
    print("-" * 60)
    model.summary()
    
    print("\n" + "=" * 60)
    print("Model Details:")
    print("=" * 60)
    print(f"Input shape: {model.input_shape}")
    print(f"Output shape: {model.output_shape}")
    print(f"Number of layers: {len(model.layers)}")
    print(f"Number of classes (output): {model.output_shape[-1]}")
    
    # Test with dummy input
    print("\n" + "=" * 60)
    print("Testing with dummy input...")
    print("=" * 60)
    
    input_dim = model.input_shape[1]
    dummy_input = np.random.rand(1, input_dim)
    
    try:
        prediction = model.predict(dummy_input, verbose=0)
        print(f"✅ Prediction works!")
        print(f"   Output shape: {prediction.shape}")
        print(f"   Sample probabilities (first 5): {prediction[0][:5]}")
        print(f"   Max probability: {np.max(prediction[0]):.4f}")
        print(f"   Predicted class index: {np.argmax(prediction[0])}")
    except Exception as e:
        print(f"❌ Error during prediction: {e}")
    
    print("\n" + "=" * 60)
    print("Conclusion:")
    print("=" * 60)
    print(f"✓ Model expects input vector of size: {input_dim}")
    print(f"✓ Model outputs probabilities for {model.output_shape[-1]} classes")
    print(f"✓ We need a vectorizer/tokenizer that produces {input_dim}-dimensional vectors")
    print(f"✓ We need a label encoder with {model.output_shape[-1]} job categories")
    
except ImportError as e:
    print(f"❌ Error: TensorFlow not installed")
    print(f"   Run: pip install tensorflow")
    sys.exit(1)
except FileNotFoundError:
    print(f"❌ Error: Model file not found at {model_path}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
