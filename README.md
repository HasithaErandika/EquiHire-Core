# EquiHire-Core: The 3-Stage Cognitive Bias Firewall

**"Evaluating Code, Not Context."**

EquiHire is an AI-driven intermediary layer for technical recruitment. It transforms the traditional "Resume Black Hole" into a transparent, bias-free **3-Stage Hiring Funnel**. It intercepts live audio from candidates, sanitizes their identity in real-time, and presents recruiters with a purely semantic text stream.

---

## Table of Contents
- [The Problem](#the-problem)
- [The Solution: 3-Stage Funnel](#the-solution-3-stage-funnel)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Project Structure](#project-structure)

---

## The Problem
Technical recruitment is broken:
1.  **Volume vs. Quality:** Recruiters are overwhelmed by hundreds of CVs, often "auto-rejecting" good candidates based on keywords.
2.  **The Accent Penalty:** Candidates with non-native accents are subconsciously rated lower on technical competence.
3.  **Contextual Bias:** Hiring managers favor candidates from specific universities or demographics.

## The Solution: 3-Stage Funnel

EquiHire implements a **3-Stage Hiring Funnel** to filter noise and bias efficiently.

### Stage 1: The Automated Gatekeeper (Filter)
*   **Goal:** Instant reject of unqualified candidates.
*   **Action:** Candidates upload their CV to a specific Job ID.
*   **Agent:** The system automatically parses the PDF (securely in Cloudflare R2) and checks against "Must-Have Skills" (e.g., "Django", "Python").
*   **Result:** Only candidates meeting the hard requirements move to Stage 2.

### Stage 2: The Asynchronous AI Screener (Score)
*   **Goal:** Test technical knowledge without using human time.
*   **Action:** Passing candidates receive a "Start Screening" link (Voice/Text).
*   **Agent:** An AI agent asks 3 technical screening questions defined by the recruiter.
*   **Result:** Top-scoring candidates are Shortlisted for the Live Interview.

### Stage 3: The Live Blind Interview (The Bias Firewall)
*   **Goal:** Deep technical culture check (Bias-Free).
*   **Action:** Use **EquiHire Live** for the interview.
*   **The Firewall:**
    *   **Audio Interception:** We capture the candidate's voice.
    *   **AI Sanitization:** Real-time transcription + BERT-NER redaction remove names, locations, and schools.
    *   **Recruiter View:** Sees only technical merit in a text stream.

---

## System Architecture

EquiHire utilizes a cloud-native hybrid microservices pattern.

### 1. The Gateway (Ballerina)
-   **Orchestrator:** Manages the entire funnel (Jobs, Candidates, status updates).
-   **Secure Uploads:** Generates presigned URLs for direct Cloudflare R2 uploads.
-   **Enforcer:** Routes audio to OpenAI and text to the Python Firewall.
-   **Endpoints:** `POST /jobs`, `POST /candidates/complete-upload`.

### 2. The Intelligence Engine (Python/FastAPI)
-   **The Matcher:** Executes the Stage 1 filtering logic (Skills matching).
-   **The Firewall:** Hosts the BERT-NER model for real-time redaction.
-   **The Vault Keymaster:** Manages Cloudflare R2 credentials and secure reveals.
-   **Integration:** Updates results directly to **Supabase**.

### 3. The Dashboard (React + Vite)
-   Real-time "Blind" Dashboard for recruiters receiving only sanitized text.
-   Candidate portal for microphone access and interview joining.

For a detailed deep-dive into the live voice architecture, see [Voice Architecture](doc/voice-architecture.md).

---

## Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend** | React (Vite), TypeScript, Tailwind CSS |
| **Gateway Service** | **Ballerina** (Swan Lake) |
| **AI Service** | Python 3.10, FastAPI, PyTorch (BERT), Supabase-py |
| **Realtime AI** | OpenAI Realtime API (WebSocket) |
| **Identity** | **WSO2 Asgardeo** (OIDC/OAuth2) |
| **Communication** | Twilio Programmable Voice |
| **Database** | PostgreSQL (Supabase) |
| **Storage** | **Cloudflare R2** (S3 Compatible) |

---

## Getting Started

### Prerequisites
*   Ballerina (Swan Lake Update 8+)
*   Python 3.10+
*   Node.js 18+
*   Supabase Account (Database)
*   OpenAI API Key (Transcription)
*   Cloudflare R2 Account (Secure Storage)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/YourUsername/EquiHire-Core.git
    cd EquiHire-Core
    ```

2.  **Database Setup (Supabase)**
    Run the SQL scripts in `supabase_schema.sql` via your Supabase SQL Editor.

3.  **Backend Gateway (Ballerina)**
    ```bash
    cd ballerina-gateway
    cp Config.toml.example Config.toml
    # IMPORTANT: Update Config.toml with your keys.
    # Note: R2 'accessKeyId' is a string ID, not a URL.
    bal run
    ```

4.  **AI Intelligence Engine (Python)**
    ```bash
    cd python-ai-engine
    pip install -r requirements.txt
    
    # Create .env file
    cp .env.example .env
    
    # Update .env with:
    # - OPENAI_API_KEY
    # - R2 Credentials
    # - SUPABASE_URL & SUPABASE_KEY
    
    uvicorn main:app --port 8000 --reload
    ```

5.  **Frontend (React)**
    ```bash
    cd react-frontend
    npm install
    npm run dev
    ```

---

## Documentation

We have detailed documentation available in the `doc/` folder:

-   **[System Overview](doc/README.md)**: General guide.
-   **[Voice Architecture](doc/voice-architecture.md)**: Explains the "Bias Firewall" and PII redaction flow.
-   **[API Reference](doc/api-endpoints.md)**: List of HTTP and WebSocket endpoints.

---

## Project Structure

```
EquiHire-Core/
├── ballerina-gateway/       # [BACKEND] API Gateway & Orchestrator
│   ├── modules/
│   │   ├── database/        # Supabase Repository
│   │   ├── types/           # Data Models (Jobs, Candidates)
│   │   └── ...
│   ├── api.bal              # REST API (Jobs, Candidates, R2)
│   └── service.bal          # WebSocket Services (The Relay)
│
├── python-ai-engine/        # [AI ENGINE] PII Redaction & Matcher
│   ├── main.py              # Firewall & Eligibility Logic
│   └── requirements.txt
│
├── react-frontend/          # [FRONTEND] Recruiter Dashboard
│
├── doc/                     # Documentation
├── supabase_schema.sql      # Database Schema
└── README.md
```

---

## License

This project is licensed under the MIT License.


EquiHire is an AI-driven intermediary layer for technical recruitment. It intercepts live audio from candidates during technical interviews, sanitizes their identity (voice, accent, and PII) in real-time using a hybrid microservices architecture, and presents recruiters with a purely semantic text stream. This ensures hiring decisions are based solely on technical merit, effectively acting as a firewall against unconscious bias.

---

## Table of Contents
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Project Structure](#project-structure)

---

## The Problem
Technical recruitment is plagued by unconscious biases that "Blind Hiring" tools fail to solve:
1.  **The Accent Penalty:** Candidates with non-native accents are subconsciously rated lower on technical competence.
2.  **Contextual Bias:** Hiring managers favor candidates from specific universities or demographics based on visual/auditory cues.
3.  **The "Black Box" Rejection:** Rejected candidates rarely receive explainable feedback on why they failed.

## The Solution
EquiHire replaces the video call with a **Sanitized Real-Time Data Stream**.
1.  **Audio Interception:** We capture the candidate's voice via Twilio Media Streams (or Browser WebSocket).
2.  **AI Sanitization (The Firewall):**
    -   **OpenAI Realtime API** handles low-latency transcription.
    -   **Fine-Tuned BERT** performs Named Entity Recognition (NER) to redact PII (Names, Schools, Locations) *before* the recruiter sees the text.
3.  **Secure CV Vault:**
    -   **Cloudflare R2** acts as a private vault for original resumes.
    -   **Blind Parsing**: AI extracts skills without exposing the file.
    -   **On-Demand Reveal**: Recruiters can only unlock the original PDF via a temporary (5-minute) signed link.
4.  **Explainable Feedback (XAI):** Our engine analyzes the gap between the candidate's answers and the job description to generate a "Growth Report" post-interview.

---

## System Architecture

EquiHire utilizes a cloud-native hybrid microservices pattern.

### 1. The Gateway (Ballerina)
-   Handles high-concurrency WebSockets from Twilio and Frontend.
-   Manages Identity (Asgardeo) and Authentication.
-   **Orchestrator**: Routes audio to OpenAI, text to the Python Firewall, and manages secure R2 uploads.
-   **Enforcer**: Ensures no unredacted text ever reaches the Recruiter UI.

### 2. The Firewall (Python/FastAPI)
-   Hosts the BERT-NER model.
-   **The Vault Keymaster**: Manages Cloudflare R2 credentials.
-   **Secure Reveal**: Generates time-limited Presigned URLs for file access.
-   asynchronously computes technical competency scores.

### 3. The Dashboard (React + Vite)
-   Real-time "Blind" Dashboard for recruiters receiving only sanitized text.
-   Candidate portal for microphone access and interview joining.

For a detailed deep-dive into the live voice architecture, see [Voice Architecture](doc/voice-architecture.md).

---

## Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend** | React (Vite), TypeScript, Tailwind CSS |
| **Gateway Service** | **Ballerina** (Swan Lake) |
| **AI Service** | Python 3.10, FastAPI, PyTorch (BERT) |
| **Realtime AI** | OpenAI Realtime API (WebSocket) |
| **Identity** | **WSO2 Asgardeo** (OIDC/OAuth2) |
| **Communication** | Twilio Programmable Voice |
| **Database** | PostgreSQL (Supabase) |
| **Storage** | **Cloudflare R2** (S3 Compatible) |

---

## Getting Started

### Prerequisites
*   Ballerina (Swan Lake Update 8+)
*   Python 3.10+
*   Node.js 18+
*   Supabase Account (for Database)
*   OpenAI API Key (for Transcription)
*   Cloudflare R2 Account (for Secure Storage)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/YourUsername/EquiHire-Core.git
    cd EquiHire-Core
    ```

2.  **Database Setup (Supabase)**
    Run the SQL scripts in `supabase_schema.sql` via your Supabase SQL Editor.

3.  **Backend Gateway (Ballerina)**
    ```bash
    cd ballerina-gateway
    cp Config.toml.example Config.toml
    # Update Config.toml with your keys (Supabase, OpenAI, R2)
    bal run
    ```

4.  **AI Firewall (Python)**
    ```bash
    cd python-ai-engine
    pip install -r requirements.txt
    
    # Export R2 Credentials
    export R2_ACCOUNT_ID="<your_account_id>"
    export R2_ACCESS_KEY_ID="<your_access_key>"
    export R2_SECRET_ACCESS_KEY="<your_secret_key>"
    
    uvicorn main:app --port 8000 --reload
    ```

5.  **Frontend (React)**
    ```bash
    cd react-frontend
    npm install
    npm run dev
    ```

---

## Documentation

We have detailed documentation available in the `doc/` folder:

-   **[System Overview](doc/README.md)**: General guide.
-   **[Voice Architecture](doc/voice-architecture.md)**: Explains the "Bias Firewall" and PII redaction flow.
-   **[API Reference](doc/api-endpoints.md)**: List of HTTP and WebSocket endpoints.

---

## Project Structure

```
EquiHire-Core/
├── ballerina-gateway/       # [BACKEND] API Gateway & Orchestrator
│   ├── modules/
│   │   ├── openai/          # OpenAI Realtime Client
│   │   └── ...
│   ├── api.bal              # REST API Service (Includes R2 Logic)
│   └── service.bal          # WebSocket Services (The Relay)
│
├── python-ai-engine/        # [AI ENGINE] PII Redaction Service
│   └── main.py              # Firewall Endpoint (/sanitize) & Secure Reveal
│
├── react-frontend/          # [FRONTEND] Recruiter Dashboard
│
├── doc/                     # Documentation
└── README.md
```

---

## License

This project is licensed under the MIT License.
