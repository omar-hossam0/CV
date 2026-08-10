"""
Check tokenizer.pkl and mlb.pkl from last-one folder
"""
import pickle
import numpy as np

print("=" * 60)
print("Checking tokenizer and label encoder from last-one/")
print("=" * 60)

try:
    # Load tokenizer
    with open("../last-one/tokenizer.pkl", "rb") as f:
        tokenizer = pickle.load(f)
    
    print("\n✅ Tokenizer loaded!")
    print(f"   Type: {type(tokenizer)}")
    
    # Check if it's Keras Tokenizer
    if hasattr(tokenizer, 'word_index'):
        print(f"   Vocabulary size: {len(tokenizer.word_index)}")
        print(f"   Sample words: {list(tokenizer.word_index.keys())[:10]}")
    
    # Test tokenizer
    test_text = "python developer with 5 years experience in machine learning and data science"
    try:
        if hasattr(tokenizer, 'texts_to_sequences'):
            sequences = tokenizer.texts_to_sequences([test_text])
            print(f"\n   Test text: '{test_text}'")
            print(f"   Sequence length: {len(sequences[0])}")
            print(f"   Sequence: {sequences[0][:20]}...")
            
            # Check if we can pad to 3000
            from tensorflow.keras.preprocessing.sequence import pad_sequences
            padded = pad_sequences(sequences, maxlen=3000, padding='post')
            print(f"   Padded shape: {padded.shape}")
            print(f"   ✓ Can produce 3000-dim vectors!")
        else:
            # Might be TfidfVectorizer or CountVectorizer
            if hasattr(tokenizer, 'transform'):
                vector = tokenizer.transform([test_text])
                print(f"   Vector shape: {vector.shape}")
                print(f"   Vector type: {type(vector)}")
                if vector.shape[1] == 3000:
                    print(f"   ✓ Perfect! Produces 3000-dim vectors!")
                else:
                    print(f"   ⚠️  Dimension mismatch: {vector.shape[1]} != 3000")
    except Exception as e:
        print(f"   ⚠️  Test failed: {e}")
    
except FileNotFoundError:
    print("❌ tokenizer.pkl not found")
except Exception as e:
    print(f"❌ Error loading tokenizer: {e}")

print("\n" + "=" * 60)

try:
    # Load MLB (MultiLabelBinarizer or LabelEncoder)
    with open("../last-one/mlb.pkl", "rb") as f:
        mlb = pickle.load(f)
    
    print("\n✅ MLB/Label Encoder loaded!")
    print(f"   Type: {type(mlb)}")
    
    if hasattr(mlb, 'classes_'):
        print(f"   Number of classes: {len(mlb.classes_)}")
        print(f"   Sample classes (first 10):")
        for i, cls in enumerate(mlb.classes_[:10], 1):
            print(f"      {i}. {cls}")
        
        if len(mlb.classes_) == 108:
            print(f"\n   ✓ Perfect! Has 108 classes matching model output!")
        else:
            print(f"\n   ⚠️  Class count mismatch: {len(mlb.classes_)} != 108")
    
except FileNotFoundError:
    print("❌ mlb.pkl not found")
except Exception as e:
    print(f"❌ Error loading mlb: {e}")

print("\n" + "=" * 60)
print("Summary:")
print("=" * 60)
print("Next: Create CV classifier service using these components")
