"""
Start Skill Matcher API Service
Port: 5004
"""
import subprocess
import sys
import os

def start_service():
    print("🚀 Starting Skill Matcher API Service...")
    print("📍 Port: 5004")
    print("📁 Working Directory: last-one/")
    print("-" * 50)
    
    # Change to last-one directory
    os.chdir("last-one")
    
    # Start Flask service
    try:
        subprocess.run([sys.executable, "skill_matcher_api.py"], check=True)
    except KeyboardInterrupt:
        print("\n⏹️  Service stopped by user")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    start_service()
