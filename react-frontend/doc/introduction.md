# Introduction to EquiHire

## The Problem

The technical recruitment landscape in Sri Lanka is currently flawed due to three critical bottlenecks:

1.  **The "Pedigree Effect" (Institutional Bias):** Recruiters subconsciously favor candidates from prestigious universities (e.g., Moratuwa/Colombo) while overlooking high-potential talent from regional universities (e.g., Rajarata/Ruhuna). This "University Bias" often leads to qualified candidates being rejected at the CV screening stage before their technical skills are ever tested.
2.  **Inefficient Manual Screening:** HR managers are overwhelmed by the volume of applications. To cope, they often rely on crude keyword matching (Ctrl+F) or superficial metrics, which fails to capture a candidate’s true problem-solving ability.
3.  **The "Black Box" of Rejection:** Rejected candidates rarely receive constructive feedback. They do not know if they failed because of a lack of technical knowledge or simply because they missed a specific keyword, stalling their professional growth.

## The Solution: Context-Aware Assessment Engine

EquiHire is an AI-Native Blind Assessment Platform designed to act as an objective "Bias Firewall." Instead of a standard interview, candidates complete a secure, lockdown technical assessment. The system acts as an intermediary agent that sanitizes the candidate's written identity and scores their technical answers semantically, ensuring hiring decisions are based strictly on code quality and logic, not background.

### Feature Name: The Context-Aware Assessment Engine (Powered by Ballerina & External AI)

**Technology:** Ballerina Swan Lake, Google Gemini API, HuggingFace API.

**Function:** The system utilizes robust integration orchestration to handle parsing and cognitive tasks natively using bounded records and retries:

1.  **CV Parsing & Context Extraction:** Apache PDFBox extracts raw text which is sent to Google Gemini Flash. Gemini structuralizes the sections, maps PII, and determines candidate Experience Level and Tech Stack in a single JSON blob.
2.  **Zero-Shot Relevance Gate:** During the exam, candidate answers are safely vaulted, pre-redacted using the PII map, and passed to a HuggingFace `bart-large-mnli` gate. Low relevance answers (< 0.45 confidence) are auto-scored zero to bypass expensive computation.
3.  **Adaptive Scoring & Feedback:** Relevant answers are sent to Google Gemini along with the candidate's experience level against a model key to generate a final redacted answer, score, and a "Growth Report".

## System Architecture

The following **High-Level Container Diagram** (based on the C4 Model) illustrates the EquiHire system architecture, highlighting the specific roles of the Microservices, SaaS components, and the unified AI Engine.

```mermaid
graph TB
    %% --- USERS ---
    subgraph Users
        candidate[Candidate]
        recruiter[Recruiter]
        admin[IT Admin]
    end

    %% --- EXTERNAL SAAS ---
    subgraph External Managed Services
        auth[WSO2 Asgardeo<br/>(Identity & Access Mgmt)]
        storage[(Cloudflare R2<br/>Secure Object Storage)]
        db[(PostgreSQL<br/>Supabase Managed DB)]
        gemini[Google Gemini API<br/>(CV Parse, Scoring & Feedback)]
        huggingface[HuggingFace API<br/>(bart-large-mnli Relevance Gate)]
    end

    %% --- INTERNAL SYSTEM ---
    subgraph EquiHire Cloud Environment [WSO2 Choreo Environment]
        
        %% Frontend Container
        webapp[Frontend SPA<br/>React + Vite + Tailwind]
        
        %% Backend Containers
        subgraph Backend Microservice
            gateway[Unified API & AI Integrator<br/>Ballerina Swan Lake]
        end
    end

    %% --- CONNECTIONS ---

    %% 1. Authentication Flow
    candidate -- "1. Auth / Magic Link" --> auth
    recruiter -- "Auth (OIDC)" --> auth
    auth -- "JWT Token" --> webapp

    %% 2. User Interactions
    candidate -- "2. Takes Lockdown Exam<br/>(HTTPS/WSS)" --> webapp
    recruiter -- "Views Dashboard / Grades<br/>(HTTPS)" --> webapp
    admin -- "Configures Bias Blocklist<br/>(HTTPS)" --> webapp

    %% 3. Frontend to Gateway
    webapp -- "3. API Calls (REST/JSON)<br/>with Bearer Token" --> gateway

    %% 4. Backend Processing
    gateway -- "Read/Write Job/Exam Data" --> db

    %% 5. Secure Storage & Extraction
    gateway -- "Generate Presigned URL" --> webapp
    webapp -- "5a. Direct Secure Upload (CV PDF)" --> storage
    gateway -- "5b. Read CV & PDFBox Text Extraction" --> storage
    gateway -- "5c. Core CV Parse & PII Map" --> gemini
    gemini -- "5d. Parsed Sections & Context JSON" --> gateway

    %% 6. Grading AI Processing Flow
    gateway -- "6a. Pre-redact & Relevance Gate" --> huggingface
    huggingface -- "6b. Relevance Confidence Score" --> gateway
    gateway -- "7a. Single-Shot Grading Call (If relevant)" --> gemini
    gemini -- "7b. Scoring & Feedback JSON" --> gateway

    %% 7. Data Persistence Flow
    gateway -- "8. Validate JSON & Save Redacted Text, Limits, Cheats & Scores" --> db

    %% Styling
    classDef user fill:#f9f,stroke:#333,stroke-width:2px,color:black;
    classDef saas fill:#d4edda,stroke:#28a745,stroke-width:2px,color:black;
    classDef container fill:#cce5ff,stroke:#007bff,stroke-width:2px,color:black;
    classDef component fill:#e2e3e5,stroke:#6c757d,stroke-width:1px,color:black;

    class candidate,recruiter,admin user;
    class auth,storage,db,gemini saas;
    class webapp,gateway,IntelligenceEngine container;
    class controller,wrapper component;
```

### Architectural Highlights

1.  **Hybrid Cloud Approach:** We adopted a Hybrid Cloud architecture deployed on **WSO2 Choreo**, separating core logic from managed SaaS providers (Supabase, external AI APIs) to ensure scalability and security.
2.  **Unified Microservice Core:**
    *   **Ballerina Backend:** Acts as a powerful integration hub, handling high-concurrency API traffic, Java interoperability (Apache PDFBox for PDF reading), routing, and identity management with WSO2 Asgardeo. It heavily utilizes Ballerina's native JSON data-binding for strict schema enforcement and retry logic across LLM boundaries.
3.  **Composite AI Layer:** An integration of varied models including **HuggingFace** connector models (`bart-large-mnli`) for fast zero-shot candidate answer screening alongside **Google Gemini Flash** for deep structural extraction (CV parsing) and final adaptive scoring feedback.
4.  **Zero-Trust "Vault" Data Flow:** CVs are uploaded directly to **Cloudflare R2** via Presigned URLs. Raw answers are saved in an isolated answer vault *before* any AI processing begins, guaranteeing no candidate data is lost to downstream generation failures.

