import logging
import os
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import boto3
from botocore.config import Config
from supabase import create_client, Client
import google.generativeai as genai

load_dotenv() # Load environment variables from .env file

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "equihire-secure")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found. AI features will fail.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# Initialize R2 Client
r2_client = None
if R2_ACCOUNT_ID and R2_ACCESS_KEY and R2_SECRET_KEY:
    try:
        r2_client = boto3.client(
            's3',
            endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            config=Config(signature_version='s3v4')
        )
        logger.info("R2 Client Initialized")
    except Exception as e:
        logger.error(f"Failed to initialize R2 Client: {e}")
else:
    logger.warning("R2 Credentials missing. Secure View will not work.")

# Initialize Supabase Client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase_client: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase Client Initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase Client: {e}")
else:
    logger.warning("Supabase Credentials missing. DB updates will fail.")

app = FastAPI(title="EquiHire Intelligence Engine (Gemini Powered)")

# --- Data Models ---

class CVParseRequest(BaseModel):
    candidate_id: str
    r2_object_key: str
    job_id: Optional[str] = None
    required_skills: Optional[List[str]] = []

class EvaluationRequest(BaseModel):
    candidate_answer: str
    question: str
    model_answer: str
    experience_level: Optional[str] = "Junior" # From CV context
    strictness: Optional[str] = "Moderate"

class EvaluationResponse(BaseModel):
    redacted_answer: str
    score: float
    feedback: str
    pii_detected: bool

class RevealResponse(BaseModel):
    url: Optional[str]
    status: str

# --- Helper Functions ---

def get_gemini_model():
    return genai.GenerativeModel('gemini-1.5-flash')

# --- Endpoints ---

@app.get("/")
async def root():
    return {"status": "online", "service": "EquiHire Intelligence Engine", "mode": "Gemini-1.5-Flash"}

@app.post("/parse/cv")
async def parse_cv(payload: CVParseRequest):
    """
    Analyzes CV to determine experience level and skills using Gemini.
    """
    logger.info(f"Parsing CV for {payload.candidate_id}")
    
    # In a real implementation, we would download the PDF from R2 here.
    # For this prototype, we will simulate the extraction or use a dummy text
    # if we cannot actually read the file content easily without a library like PyPDF2.
    # Assuming we extracted text:
    extracted_text = "Experienced software engineer with 5 years in Python and AWS..." # Mock

    # Call Gemini to analyze
    try:
        model = get_gemini_model()
        prompt = f"""
        Analyze the following CV text and extract:
        1. Experience Level (Junior, Mid, Senior)
        2. Key Technical Skills (List)
        
        CV Text:
        {extracted_text}
        
        Return JSON Code Block:
        ```json
        {{ "experience_level": "...", "skills": [...] }}
        ```
        """
        response = model.generate_content(prompt)
        # Parse JSON from response (simplified for brevity)
        # In prod, use robust parsing or structured output mode
        result_text = response.text.replace("```json", "").replace("```", "").strip()
        analysis = json.loads(result_text)
        
        experience_level = analysis.get("experience_level", "Junior")
        skills = analysis.get("skills", [])
        
        logger.info(f"Gemini Analysis: {experience_level}, Skills: {len(skills)}")
        
        # Update Database
        if supabase_client:
            data = {
                "skills": skills,
                "status": "categorized", # custom status
                # Store experience level if DB has column, else just log
            }
            supabase_client.table("anonymous_profiles").update(data).eq("candidate_id", payload.candidate_id).execute()

        return {"status": "processed", "analysis": analysis}

    except Exception as e:
        logger.error(f"Gemini CV Parse Error: {e}")
        # Fallback
        return {"status": "error", "message": str(e)}

@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_answer(payload: EvaluationRequest):
    """
    Combined Endpoint for:
    1. Privacy Redaction (PII Removal)
    2. Adaptive Scoring (0-10)
    3. Feedback Generation
    """
    logger.info("Processing Evaluation Request via Gemini...")
    
    try:
        model = get_gemini_model()
        
        prompt = f"""
        You are an expert technical interviewer. Perform the following 3 tasks on the candidate's answer:

        Task 1: Privacy Redaction
        Identify and redact ANY personally identifiable information (Names, Universities, Locations, Phone Numbers) from the 'Candidate Answer'. Replace them with generic placeholders like [Candidate Name], [University], etc.

        Task 2: Adaptive Scoring
        Compare the 'Candidate Answer' against the 'Model Answer'.
        Assign a Technical Score from 0 to 10.
        - Experience Level: {payload.experience_level}
        - Strictness: {payload.strictness}
        (For Senior levels, be stricter on optimization and edge cases. For Juniors, focus on logic correctness).

        Task 3: Feedback Generation
        Generate specific, constructive feedback explaining the score and gaps in knowledge. "Growth Report".

        Data:
        Question: {payload.question}
        Model Answer: {payload.model_answer}
        Candidate Answer: {payload.candidate_answer}

        Output must be purely JSON:
        {{
            "redacted_answer": "...",
            "score": 8.5,
            "feedback": "...",
            "pii_detected": true/false
        }}
        """
        
        response = model.generate_content(prompt)
        
        # Cleanup JSON
        clean_json = response.text.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]
            
        result = json.loads(clean_json)
        
        return EvaluationResponse(
            redacted_answer=result.get("redacted_answer", payload.candidate_answer),
            score=float(result.get("score", 0)),
            feedback=result.get("feedback", "Error generating feedback"),
            pii_detected=result.get("pii_detected", False)
        )

    except Exception as e:
        logger.error(f"Gemini Evaluation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reveal/{candidate_id}", response_model=RevealResponse)
async def reveal_candidate(candidate_id: str):
    """
    Generates a secure Presigned URL for the recruiter to view the original PDF.
    Valid for 5 minutes.
    """
    if not r2_client:
        raise HTTPException(status_code=503, detail="Secure Setup Not Configured")
    
    object_key = f"candidates/{candidate_id}/resume.pdf"
    
    try:
        url = r2_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': R2_BUCKET_NAME, 'Key': object_key},
            ExpiresIn=300 # 5 minutes
        )
        return RevealResponse(url=url, status="generated")
        
    except Exception as e:
        logger.error(f"Failed to generate link: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate secure link")
