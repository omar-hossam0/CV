"""
Startup Script for All 4 AI Models
Starts all models in the correct order with proper ports
"""

import subprocess
import sys
import os
import time
import signal

# Model configurations
MODELS = [
    {
        "name": "Model 1: CV-Job Matcher",
        "path": "model-1-cv-matcher",
        "script": "cv_job_matcher.py",
        "port": 5001,
        "type": "fastapi"
    },
    {
        "name": "Model 2: CV Classifier",
        "path": "model-2-cv-classifier",
        "script": "cv_classifier.py",
        "port": 5002,
        "type": "fastapi"
    },
    {
        "name": "Model 3: Skill Analyzer",
        "path": "model-3-skill-analyzer",
        "script": "skill_analyzer.py",
        "port": 5003,
        "type": "flask"
    },
    {
        "name": "Model 4: Chat Model",
        "path": "model-4-chat-model",
        "script": "chat_model.py",
        "port": 5004,
        "type": "fastapi"
    }
]

processes = []

def signal_handler(sig, frame):
    print("\n🛑 Shutting down all models...")
    for p in processes:
        try:
            p.terminate()
            p.wait(timeout=5)
        except:
            p.kill()
    print("✅ All models stopped.")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def start_model(model):
    """Start a single model service"""
    print(f"\n🚀 Starting {model['name']} on port {model['port']}...")
    
    script_path = os.path.join(model['path'], model['script'])
    
    if not os.path.exists(script_path):
        print(f"❌ Script not found: {script_path}")
        return None
    
    try:
        # Set working directory
        cwd = os.path.abspath(model['path'])
        
        # Start the process
        proc = subprocess.Popen(
            [sys.executable, model['script']],
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        
        processes.append(proc)
        print(f"✅ {model['name']} started (PID: {proc.pid})")
        return proc
        
    except Exception as e:
        print(f"❌ Failed to start {model['name']}: {e}")
        return None

def check_port(port):
    """Check if a port is in use"""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    return result == 0

def main():
    print("=" * 60)
    print("🤖 STARTING ALL 4 AI MODELS")
    print("=" * 60)
    
    # Check which ports are already in use
    print("\n📋 Checking ports...")
    for model in MODELS:
        if check_port(model['port']):
            print(f"   ⚠️ Port {model['port']} already in use ({model['name']})")
        else:
            print(f"   ✅ Port {model['port']} available ({model['name']})")
    
    # Start all models
    print("\n🚀 Starting all models...")
    for model in MODELS:
        if not check_port(model['port']):
            start_model(model)
            time.sleep(2)  # Give each model time to start
        else:
            print(f"   ⏭️ Skipping {model['name']} (port {model['port']} in use)")
    
    print("\n" + "=" * 60)
    print("✅ ALL MODELS STARTED!")
    print("=" * 60)
    
    print("\n📊 Model Status:")
    for model in MODELS:
        status = "RUNNING" if check_port(model['port']) else "STOPPED"
        print(f"   {model['name']}: {status} (port {model['port']})")
    
    print("\n🔗 API Endpoints:")
    print("   Model 1 (CV-Job Matcher): http://127.0.0.1:5001/match-jobs")
    print("   Model 2 (CV Classifier): http://127.0.0.1:5002/classify")
    print("   Model 3 (Skill Analyzer): http://127.0.0.1:5003/analyze")
    print("   Model 4 (Chat Model): http://127.0.0.1:5004/chat")
    
    print("\n💡 Press Ctrl+C to stop all models")
    
    # Wait for all processes
    try:
        while True:
            # Check if any process died
            for i, proc in enumerate(processes):
                if proc.poll() is not None:
                    print(f"\n⚠️ Model {MODELS[i]['name']} stopped (exit code: {proc.returncode})")
            
            time.sleep(5)
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
