import logging
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
import json

import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

import boto3
from botocore.config import Config
from supabase import create_client, Client

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "equihire-secure")

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

app = FastAPI(title="EquiHire Intelligence Engine")

# --- Data Models ---

class TextPayload(BaseModel):
    text: str
    context: Optional[str] = "interview"

class Redaction(BaseModel):
    entity: str
    label: str
    score: float

class CVParseRequest(BaseModel):
    candidate_id: str
    r2_object_key: str
    job_id: Optional[str] = None
    required_skills: Optional[List[str]] = []

class RevealResponse(BaseModel):
    url: Optional[str]
    status: str

class SanitizedResponse(BaseModel):
    original_text_length: int
    sanitized_text: str
    pii_detected: bool
    redactions: List[Redaction]
    # Future: technical_score: float

# --- Mock AI Models (BERT Firewall) ---

def mock_redact_pii(text: str):
    """
    Mock BERT-NER Redaction.
    In real implementation, this loads a finetuned BERT model.
    """
    logger.info("Running BERT Firewall (Redaction)...")
    
    redactions = []
    sanitized_text = text
    
    # Mock Entities to Redact
    replacements = {
        "Hasitha": ("[Before: Candidate]", "PER"), 
        "John Doe": ("[Candidate]", "PER"),
        "Google": ("[Company]", "ORG"),
        "Sabaragamuwa University": ("[University]", "ORG"),
        "Malabe": ("[Location]", "LOC"),
        "Colombo": ("[Location]", "LOC")
    }
    
    pii_found = False
    
    # Simple replacement logic (simulating NER)
    for key, (replacement, label) in replacements.items():
        if key in sanitized_text:
            sanitized_text = sanitized_text.replace(key, replacement)
            redactions.append(Redaction(entity=key, label=label, score=0.99))
            pii_found = True
            
    return sanitized_text, redactions, pii_found

def check_eligibility(candidate_skills: List[str], required_skills: List[str]) -> dict:
    """
    The Matcher Function.
    Filters candidates based on required skills.
    """
    if not required_skills:
        return {"status": "screening", "reason": "No requirements set"}

    missing_skills = [skill for skill in required_skills if skill not in candidate_skills]
    
    if len(missing_skills) > 0:
        return {"status": "auto-rejected", "reason": f"Missing: {missing_skills}"}
    else:
        return {"status": "screening", "reason": "Skills Match"}

# --- Endpoints ---

@app.get("/")
async def root():
    return {"status": "online", "service": "EquiHire Intelligence Engine", "mode": "Firewall"}

@app.post("/sanitize", response_model=SanitizedResponse)
async def sanitize_text(payload: TextPayload):
    """
    The Bias Firewall Endpoint.
    Receives raw text, runs BERT Redaction, and returns clean text.
    """
    try:
        # 1. Firewall: Redact PII
        sanitized_text, redactions, pii_found = mock_redact_pii(payload.text)
        
        # 2. Analysis (Async/Background)
        # In a real app, we would kick off a background task here to compute scores
        # without blocking the return of the sanitized text.
        
        logger.info(f"Sanitized: '{payload.text}' -> '{sanitized_text}'")
        
        return SanitizedResponse(
            original_text_length=len(payload.text),
            sanitized_text=sanitized_text,
            pii_detected=pii_found,
            redactions=redactions
        )

    except Exception as e:
        logger.error(f"Error processing text: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse/cv")
async def parse_cv(payload: CVParseRequest):
    """
    Simulates CV Parsing (The 'Robot').
    Reads from R2 (mock), extracts skills, and would save to DB.
    """
    logger.info(f"Parsing CV for {payload.candidate_id} from {payload.r2_object_key}")
    
    # In real implementation:
    # 1. Download PDF from R2
    # 2. Extract Text
    # 3. Use LLM to extract skills
    # 4. Save to anonymous_profiles in Postgres
    


    logger.info(f"Parsing CV for {payload.candidate_id}")
    
    # 1. Mock Extraction (Simulating LLM)
    # In reality, this would extract text from PDF and use LLM
    # We'll assign some random skills for demo purposes, or default to passing simple checks
    # Let's assume the candidate HAS the required skills for the demo unless specified
    candidate_skills = ["Python", "Communication", "Teamwork", "SQL"]
    # Add one from required to ensure match for demo if needed, or keeping it "fair"
    if payload.required_skills:
        # For demo: If "Java" is required and not in our list, they fail.
        pass

    # 2. Run The Matcher
    status = "applied"
    reason = "Pending"
    
    if payload.required_skills:
        result = check_eligibility(candidate_skills, payload.required_skills)
        status = result["status"]
        reason = result["reason"]
        
    logger.info(f"Matcher Result: {status} ({reason})")

    # 3. Update Database (Supabase)
    if supabase_client:
        try:
            data = {
                "skills": candidate_skills,
                "status": status
            }
            supabase_client.table("anonymous_profiles").update(data).eq("candidate_id", payload.candidate_id).execute()
            logger.info("Database updated")
        except Exception as e:
            logger.error(f"Failed to update DB: {e}")

    return {"status": status, "message": reason}

@app.get("/reveal/{candidate_id}", response_model=RevealResponse)
async def reveal_candidate(candidate_id: str):
    """
    The 'Reveal' Endpoint.
    Generates a secure Presigned URL for the recruiter to view the original PDF.
    Valid for 5 minutes.
    """
    if not r2_client:
        raise HTTPException(status_code=503, detail="Secure Setup Not Configured")
    
    # TODO: Check DB valid permission (has recruiter clicked 'Unlock'?)
    
    # Construct Object Key (Assuming standard pattern)
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
