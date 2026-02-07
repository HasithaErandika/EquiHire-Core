
import requests
import json
import os

# Note: This script assumes the Python service is running on port 8000
BASE_URL = "http://localhost:8000"

def test_evaluate():
    print("\n--- Testing /evaluate ---")
    payload = {
        "candidate_answer": "My name is Hasitha from Malabe. I used a loop to check each number.",
        "question": "How do you find if a number is prime?",
        "model_answer": "Iterate from 2 to sqrt(n). If any divides n, it is not prime.",
        "experience_level": "Junior",
        "strictness": "Moderate"
    }
    
    try:
        # Since I can't start the server in this environment easily without blocking,
        # I'm writing this script for the USER to run or for me to run if I can start background processes.
        # However, in this constrained agent environment, I might not be able to "curl" localhost if the service isn't running.
        # I will assume the user or a separate process starts it.
        # But wait, I CAN start background processes using `run_command`.
        
        response = requests.post(f"{BASE_URL}/evaluate", json=payload)
        if response.status_code == 200:
            print("Success!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_evaluate()
