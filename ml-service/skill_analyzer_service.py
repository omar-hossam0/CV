"""
Skill Analyzer Service - Uses trained CV-Job Matcher Model
Based on test_model.py
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import numpy as np
import pickle
import json
import os
from tensorflow import keras
from tensorflow.keras import layers, Model
from tensorflow.keras.regularizers import l2
from urllib.parse import quote
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Global variables for model and artifacts
tokenizer = None
skills_list = None
model = None
MAX_WORDS = 5000
MAX_LEN = 128

def load_model():
    """Load model artifacts and rebuild architecture"""
    global tokenizer, skills_list, model
    
    print("=" * 80)
    print("🚀 Loading CV-Job Matcher Model...")
    print("=" * 80)
    
    # Get paths (look in last-one directory)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(base_dir)
    model_dir = os.path.join(parent_dir, 'last-one')
    
    # Load tokenizer
    tokenizer_path = os.path.join(model_dir, 'tokenizer.pkl')
    with open(tokenizer_path, 'rb') as f:
        tokenizer = pickle.load(f)
    print(f"✅ Tokenizer loaded from {tokenizer_path}")
    
    # Load skills list
    skills_path = os.path.join(model_dir, 'skills_list.json')
    with open(skills_path, 'r', encoding='utf-8') as f:
        skills_list = json.load(f)
    print(f"✅ Skills list loaded ({len(skills_list)} skills)")
    
    # Rebuild model architecture
    print("🔧 Rebuilding model architecture...")
    cv_input = layers.Input(shape=(MAX_LEN,), name='cv_input')
    cv_embed = layers.Embedding(MAX_WORDS, 64, mask_zero=True)(cv_input)
    cv_lstm = layers.Bidirectional(layers.LSTM(64, dropout=0.3))(cv_embed)
    
    job_input = layers.Input(shape=(MAX_LEN,), name='job_input')
    job_embed = layers.Embedding(MAX_WORDS, 64, mask_zero=True)(job_input)
    job_lstm = layers.Bidirectional(layers.LSTM(64, dropout=0.3))(job_embed)
    
    concat = layers.Concatenate()([cv_lstm, job_lstm])
    dense1 = layers.Dense(256, activation='relu', kernel_regularizer=l2(0.001))(concat)
    dense1 = layers.Dropout(0.4)(dense1)
    dense2 = layers.Dense(128, activation='relu', kernel_regularizer=l2(0.001))(dense1)
    dense2 = layers.Dropout(0.3)(dense2)
    output = layers.Dense(len(skills_list), activation='sigmoid')(dense2)
    
    model = Model(inputs=[cv_input, job_input], outputs=output)
    
    # Load weights
    weights_path = os.path.join(model_dir, 'cv_job_matcher_model.h5')
    model.load_weights(weights_path)
    print(f"✅ Model weights loaded from {weights_path}")
    
    print("=" * 80)
    print("✅ Model ready!")
    print("=" * 80)

def extract_skills_from_text(text, skills_list):
    """Extract skills that are actually mentioned in text"""
    text_lower = text.lower()
    found_skills = []
    
    for skill in skills_list:
        skill_lower = skill.lower()
        # Check if skill is mentioned in text
        if skill_lower in text_lower:
            found_skills.append(skill)
    
    return found_skills

def analyze_cv_job_match(cv_text, job_desc):
    """Analyze CV and Job match, return missing skills"""
    
    # Get skills directly from job and CV
    cv_skills = extract_skills_from_text(cv_text, skills_list)
    job_skills = extract_skills_from_text(job_desc, skills_list)
    
    # Tokenize for neural network prediction
    cv_seq = tokenizer.texts_to_sequences([cv_text])
    job_seq = tokenizer.texts_to_sequences([job_desc])
    
    cv_padded = keras.preprocessing.sequence.pad_sequences(
        cv_seq, maxlen=MAX_LEN, padding='post', truncating='post'
    )
    job_padded = keras.preprocessing.sequence.pad_sequences(
        job_seq, maxlen=MAX_LEN, padding='post', truncating='post'
    )
    
    # Get neural network predictions
    predictions = model.predict([cv_padded, job_padded], verbose=0)[0]
    
    # Find missing skills (in job but not in CV)
    missing_skills = []
    for skill in job_skills:
        if skill not in cv_skills:
            # Use neural network prediction as confidence
            skill_idx = skills_list.index(skill) if skill in skills_list else -1
            if skill_idx >= 0:
                confidence = float(predictions[skill_idx]) if skill_idx < len(predictions) else 0.5
            else:
                confidence = 0.5
            
            # Determine priority
            if confidence >= 0.7:
                priority = "HIGH"
            elif confidence >= 0.4:
                priority = "MEDIUM"
            else:
                priority = "LOW"
            
            missing_skills.append({
                'skill': skill,
                'confidence': confidence,
                'priority': priority,
                'youtube': f"https://www.youtube.com/results?search_query={quote(f'{skill} tutorial')}"
            })
    
    # Sort by confidence and limit to top 15
    missing_skills = sorted(missing_skills, key=lambda x: x['confidence'], reverse=True)[:15]
    
    # Calculate overall match percentage
    if len(job_skills) > 0:
        match_percentage = ((len(job_skills) - len(missing_skills)) / len(job_skills)) * 100
    else:
        match_percentage = 0
    
    return {
        'cv_skills': cv_skills,
        'job_skills': job_skills,
        'missing_skills': missing_skills,
        'matched_skills': [s for s in job_skills if s in cv_skills],
        'match_percentage': round(match_percentage, 2)
    }

@app.route('/analyze', methods=['POST'])
def analyze():
    """API endpoint to analyze CV and Job match"""
    try:
        data = request.get_json()
        
        cv_text = data.get('cv_text', '')
        job_desc = data.get('job_desc', '')
        
        if not cv_text or not job_desc:
            return jsonify({
                'success': False,
                'message': 'cv_text and job_desc are required'
            }), 400
        
        # Analyze
        result = analyze_cv_job_match(cv_text, job_desc)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        print(f"❌ Error in analyze endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Skill Analyzer Service is running',
        'model_loaded': model is not None,
        'skills_count': len(skills_list) if skills_list else 0
    })

if __name__ == '__main__':
    # Load model on startup
    load_model()
    
    # Start Flask server
    port = int(os.environ.get('PORT', 5003))
    print(f"\n🚀 Starting Skill Analyzer Service on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
