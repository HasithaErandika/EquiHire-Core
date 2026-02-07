# Introduction to EquiHire

## The Problem

The technical recruitment landscape in Sri Lanka is currently flawed due to three critical bottlenecks:

1.  **The "Pedigree Effect" (Institutional Bias):** Recruiters subconsciously favor candidates from prestigious universities (e.g., Moratuwa/Colombo) while overlooking high-potential talent from regional universities (e.g., Rajarata/Ruhuna). This "University Bias" often leads to qualified candidates being rejected at the CV screening stage before their technical skills are ever tested.
2.  **Inefficient Manual Screening:** HR managers are overwhelmed by the volume of applications. To cope, they often rely on crude keyword matching (Ctrl+F) or superficial metrics, which fails to capture a candidate’s true problem-solving ability.
3.  **The "Black Box" of Rejection:** Rejected candidates rarely receive constructive feedback. They do not know if they failed because of a lack of technical knowledge or simply because they missed a specific keyword, stalling their professional growth.

## The Solution: Context-Aware Assessment Engine

EquiHire is an AI-Native Blind Assessment Platform designed to act as an objective "Bias Firewall." Instead of a standard interview, candidates complete a secure, lockdown technical assessment. The system acts as an intermediary agent that sanitizes the candidate's written identity and scores their technical answers semantically, ensuring hiring decisions are based strictly on code quality and logic, not background.

### Feature Name: The Context-Aware Assessment Engine (Powered by Gemini)

**Technology:** Google Gemini 1.5 Flash API (LLM Orchestration)

**Function:** The system utilizes a Single-Shot Chain-of-Thought Architecture to perform three cognitive tasks simultaneously within a secure pipeline:

1.  **Context Extraction:** It analyzes the candidate's CV to determine their Experience Level (Junior vs. Senior) and adjust grading strictness dynamically.
2.  **Privacy Redaction:** It identifies and redacts PII (Names, Universities) from written answers to ensure bias-free evaluation.
3.  **Adaptive Scoring & Feedback:** It evaluates the technical accuracy of the answer against a model key and generates a personalized "Growth Report" explaining gaps in knowledge.

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
        gemini[Google Gemini 1.5 Flash API<br/>(Unified AI Engine)]
    end

    %% --- INTERNAL SYSTEM ---
    subgraph EquiHire Cloud Environment [WSO2 Choreo Environment]
        
        %% Frontend Container
        webapp[Frontend SPA<br/>React + Vite + Tailwind]
        
        %% Backend Containers
        subgraph Backend Microservices
            gateway[API Gateway & Orchestrator<br/>Ballerina Swan Lake]
            
            subgraph IntelligenceEngine [Intelligence Engine Microservice - Python FastAPI]
                controller[FastAPI Controller]
                wrapper[Gemini Wrapper Service<br/>Prompt Engineering & Error Handling]
            end
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

    %% 4. Gateway Orchestration
    gateway -- "4. Route Requests / Notifications" --> controller
    gateway -- "Read/Write Job Data" --> db

    %% 5. Secure Storage Flow (The Vault)
    gateway -- "Generate Presigned URL" --> webapp
    webapp -- "5. Direct Secure Upload (CV PDF)" --> storage
    controller -- "Read CV for Parsing" --> storage

    %% 6. AI Processing Flow
    controller -- "6. Orchestrate AI Tasks" --> wrapper
    wrapper -- "7. Single-Shot CoT API Call" --> gemini
    gemini -- "8. Context, Redaction, & Scoring" --> wrapper

    %% 7. Data Persistence Flow
    controller -- "9. Save Redacted Text & Scores" --> db

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

1.  **Hybrid Cloud Approach:** We adopted a Hybrid Cloud architecture deployed on **WSO2 Choreo**, separating core logic from managed SaaS providers to ensure scalability and security.
2.  **Microservices Core:**
    *   **Ballerina Gateway:** Acts as the lightweight orchestrator, handling high-concurrency API traffic, routing, and integrating with Identity Providers (Asgardeo).
    *   **Python Intelligence Engine:** A dedicated service acting as a secure wrapper for the Gemini API. It handles prompt engineering, error handling, and JSON validation.
3.  **Unified AI Layer (Gemini 1.5 Flash):** A single powerful LLM handles all cognitive tasks (Context Extraction, Privacy Redaction, Adaptive Scoring) through a Chain-of-Thought architecture, simplifying the stack and reducing latency.
4.  **Zero-Trust "Vault" Data Flow:** CVs are uploaded directly to **Cloudflare R2** via Presigned URLs. The backend never handles the raw file stream, minimizing the security surface area.

