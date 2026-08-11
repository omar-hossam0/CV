"""Test Script for Model 4: Chat Model"""
import sys
sys.path.insert(0, '.')
from chat_model import local_chat_response

print("=" * 60)
print("TESTING MODEL 4: CHAT MODEL (Career Assistant)")
print("=" * 60)

# Test 1: Salary question
print("\n--- Test 1: Salary Question ---")
answer1 = local_chat_response("What is the average salary for a software engineer?")
print(f"Question: What is the average salary for a software engineer?")
print(f"Answer preview: {answer1[:100]}...")
assert len(answer1) > 50, "Answer should be substantial"
assert "salary" in answer1.lower() or "compensation" in answer1.lower(), "Should mention salary"
print("✓ Test 1 PASSED")

# Test 2: Interview prep
print("\n--- Test 2: Interview Preparation ---")
answer2 = local_chat_response("How should I prepare for a technical interview?")
print(f"Question: How should I prepare for a technical interview?")
print(f"Answer preview: {answer2[:100]}...")
assert len(answer2) > 50, "Answer should be substantial"
assert "interview" in answer2.lower() or "technical" in answer2.lower(), "Should be relevant"
print("✓ Test 2 PASSED")

# Test 3: Resume advice
print("\n--- Test 3: Resume Advice ---")
answer3 = local_chat_response("How can I improve my resume?")
print(f"Question: How can I improve my resume?")
print(f"Answer preview: {answer3[:100]}...")
assert len(answer3) > 50, "Answer should be substantial"
assert "resume" in answer3.lower() or "cv" in answer3.lower(), "Should mention resume"
print("✓ Test 3 PASSED")

# Test 4: Skills question
print("\n--- Test 4: Skills Question ---")
answer4 = local_chat_response("What skills should I learn in 2024?")
print(f"Question: What skills should I learn in 2024?")
print(f"Answer preview: {answer4[:100]}...")
assert len(answer4) > 50, "Answer should be substantial"
print("✓ Test 4 PASSED")

# Test 5: Career path
print("\n--- Test 5: Career Path ---")
answer5 = local_chat_response("How can I grow in my career?")
print(f"Question: How can I grow in my career?")
print(f"Answer preview: {answer5[:100]}...")
assert len(answer5) > 50, "Answer should be substantial"
print("✓ Test 5 PASSED")

# Test 6: General question
print("\n--- Test 6: General Question ---")
answer6 = local_chat_response("Hello, can you help me?")
print(f"Question: Hello, can you help me?")
print(f"Answer preview: {answer6[:100]}...")
assert len(answer6) > 30, "Answer should not be empty"
print("✓ Test 6 PASSED")

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED FOR MODEL 4 (CHAT MODEL)")
print("=" * 60)
