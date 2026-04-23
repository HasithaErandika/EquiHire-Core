# EquiHire Backend Gateway

## Overview

The EquiHire Backend Gateway is a high-performance integration and orchestration service built with Ballerina Swan Lake. It serves as the central hub of the EquiHire ecosystem, managing the complex interactions between the React frontend, external AI models (Google Gemini and HuggingFace), data persistence (Supabase), and identity management (WSO2 Asgardeo).

The gateway is engineered for strict schema enforcement, multi-tenant isolation, and reliable AI service orchestration.

---

## Core Responsibilities

- **AI Orchestration:** Managing data flow between multiple LLMs for CV parsing, response relevance gating, and semantic grading.
- **Candidate Anonymization:** Redacting PII from candidate data before AI processing and maintaining an isolated identity mapping.
- **Document Processing:** High-fidelity text extraction from PDF resumes using Java interop with Apache PDFBox.
- **Secure Communication:** Orchestrating magic-link invitations and secure session management for technical assessments.
- **Audit Logging:** Maintaining a comprehensive audit trail of recruitment actions (e.g., CV access, status updates, transcript generation).

---

## Technical Architecture

### Key Service Modules
- **API Resources (`api.bal`):** RESTful endpoints for candidate management, job configuration, and assessment execution.
- **Services Module:** Core business logic for AI pipelines and complex workflows.
- **Repositories Module:** Data persistence layer utilizing PostgreSQL via Supabase.
- **Utils Module:** Shared helper functions and security validation logic.

### AI Integration Pipelines
1. **Structural CV Parsing:** PDF extraction followed by structured section mapping using Google Gemini Flash.
2. **Zero-Shot Relevance Gating:** High-speed response validation using HuggingFace `bart-large-mnli` to optimize cost and latency.
3. **Adaptive Semantic Scoring:** Context-aware grading of technical responses based on candidate experience levels and job-specific rubrics.

---

## Getting Started

### Prerequisites
- [Ballerina Swan Lake](https://ballerina.io/downloads/) (Update 8 or higher)
- Java Development Kit (Required for PDFBox interop)

### Configuration
The service requires a `Config.toml` file in the root of the `ballerina-gateway` directory. Use `Config.toml.example` as a template.

```toml
[equihire.gateway.db]
url = "YOUR_SUPABASE_DB_URL"
key = "YOUR_SUPABASE_ANON_KEY"

[equihire.gateway.ai]
geminiKey = "YOUR_GOOGLE_GEMINI_API_KEY"
huggingfaceToken = "YOUR_HUGGINGFACE_API_TOKEN"

[equihire.gateway.storage]
r2Url = "YOUR_CLOUDFLARE_R2_URL"
accessKey = "YOUR_R2_ACCESS_KEY"
secretKey = "YOUR_R2_SECRET_KEY"
```

### Execution
To start the gateway service:
```bash
bal run
```

---

## Documentation and References

- [Full API Specification](../doc/api-endpoints.md)
- [System Architecture Overview](../doc/introduction.md)
- [Deployment Guide](../doc/getting-started.md)
