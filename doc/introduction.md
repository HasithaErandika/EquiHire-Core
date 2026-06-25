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

The following **High-Level Container Diagram** (based on the C4 Model) illustrates the EquiHire system architecture: one backend service, one frontend SPA, and the external SaaS components each integrates with.

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
    webapp[Frontend SPA<br/>React + Vite + Tailwind<br/><i>Deployed on Vercel</i>]

    subgraph EquiHire Cloud Environment [WSO2 Choreo Environment]
        %% Backend Container — ONE deployable service, not a set of microservices.
        %% Internally layered: api.bal (controller) -> services/ -> repositories/ -> clients/
        subgraph Backend Service [Ballerina Backend — Modular Monolith]
            gateway[Unified API & AI Integrator<br/>Ballerina Swan Lake]
        end
    end

    %% --- CONNECTIONS ---

    %% 1. Authentication Flow
    candidate -- "1. Auth / Magic Link" --> auth
    recruiter -- "Auth (OIDC)" --> auth
    auth -- "JWT Token" --> webapp

    %% 2. User Interactions
    candidate -- "2. Takes Lockdown Exam<br/>(HTTPS)" --> webapp
    recruiter -- "Views Dashboard / Grades<br/>(HTTPS)" --> webapp
    admin -- "Configures Bias Blocklist<br/>(HTTPS)" --> webapp

    %% 3. Frontend to Gateway
    webapp -- "3. API Calls (REST/JSON)<br/>with Bearer Token" --> gateway

    %% 4. Backend Processing
    gateway -- "Read/Write Job/Exam Data" --> db

    %% 5. CV Upload & Extraction (file bytes flow through the gateway, not direct-to-storage)
    webapp -- "5a. Upload CV (multipart/form-data)" --> gateway
    gateway -- "5b. PDFBox Text Extraction (in-memory)" --> gateway
    gateway -- "5c. Store Original PDF" --> storage
    gateway -- "5d. CV Parse & PII Map" --> gemini
    gemini -- "5e. Parsed Sections & Context JSON" --> gateway

    %% 5f. Identity Reveal (this is the one leg that genuinely uses a presigned URL)
    gateway -- "5f. Generate Presigned GET URL (on reveal)" --> storage
    gateway -- "5g. Presigned URL" --> webapp

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
    class auth,storage,db,gemini,huggingface saas;
    class webapp,gateway container;
```

### Architectural Highlights

1.  **Hybrid Cloud Approach:** The Ballerina gateway is deployed on **WSO2 Choreo**, the React SPA is deployed separately on **Vercel**, and both integrate with managed SaaS providers (Supabase, external AI APIs) — separating core orchestration logic from undifferentiated infrastructure to ensure scalability and security.

2.  **What kind of backend architecture is this, actually?** It is **one Ballerina service, deployed as a single unit** — not a microservices architecture. There is one process, one shared Supabase database, and no independently-deployable service boundaries between "jobs," "candidates," "invitations," etc. — those are all resources on the same `service /api` in `api.bal`. Internally it *is* organized as a clean **layered (n-tier) architecture**, split into Ballerina modules by responsibility:

    | Layer | Module | Responsibility |
    |---|---|---|
    | Controller / API | `api.bal`, `health_api.bal` | HTTP routing, request/response shaping |
    | Service | `modules/services/*` | Business logic — CV pipeline, grading pipeline, invitations, reveal |
    | Repository | `modules/repositories/*` | Data access — wraps Supabase PostgREST calls |
    | Client | `modules/clients/*` | Thin HTTP clients for Gemini, HuggingFace, R2, Supabase |
    | Types / Constants / Config / Utils | supporting modules | Shared records, named constants, configurable values, helpers |

    It is **not classic MVC** either — there's no "View" in the backend at all (the view is the separate React SPA, an entirely different deployable); the closest mapping is Controller → Service → Repository. And it is **not Clean Architecture** in the strict (Uncle Bob) sense, because there's no dependency inversion: the service layer imports concrete repository and client modules directly (`import equihire/gateway.repositories;`, `import equihire/gateway.clients;`) rather than depending on abstractions/ports that infrastructure implements. The honest label is: **a modular monolith with a layered internal structure** — which is also exactly the shape Ballerina is designed for (an "integration" service fanning out to several backends from one process), not a deliberate microservices decomposition.

3.  **Composite AI Layer:** An integration of varied models including **HuggingFace** connector models (`bart-large-mnli`) for fast zero-shot candidate answer screening alongside **Google Gemini Flash** for deep structural extraction (CV parsing) and final adaptive scoring feedback.

4.  **Zero-Trust "Vault" Data Flow:** Raw candidate answers are saved to an isolated answer vault *before* any AI processing begins, guaranteeing no candidate data is lost to a downstream Gemini/HuggingFace failure. CVs follow a different path worth being precise about: the original PDF is uploaded from the browser to the Ballerina gateway (`multipart/form-data`), which extracts text in-memory via PDFBox and then stores the original bytes in Cloudflare R2 itself — it is **not** a direct browser-to-R2 presigned upload. Presigned URLs *are* used for the **reveal** flow: when a recruiter unmasks a candidate's CV, the gateway generates a short-lived presigned GET URL so the recruiter's browser fetches the file straight from R2.

