# EquiHire-Core: AI-Native Blind Assessment Platform

**"Evaluating Code, Not Context."**

EquiHire is a structured technical assessment platform built around a principle of objective evaluation. It acts as a bias firewall by anonymising candidate identity during assessment and scoring responses purely on technical merit through a multi-stage AI pipeline.

---

## Architecture Overview

| Layer | Technology | Role |
|---|---|---|
| Backend Gateway | Ballerina (Swan Lake) | HTTP API, AI orchestration, audit logging |
| AI: CV Parsing | Google Gemini Flash | Structured CV extraction, PII mapping |
| AI: Relevance Gate | HuggingFace (BART-large-MNLI) | Zero-shot answer relevance classification |
| AI: Grading | Google Gemini Flash | Adaptive scoring and growth feedback |
| Database | Supabase (PostgreSQL) | Persistent state, evaluation results, audit trail |
| File Storage | Cloudflare R2 | Encrypted CV document storage |
| Frontend | React + TypeScript (Vite) | Recruiter dashboard |
| Authentication | WSO2 Asgardeo | OIDC identity management |

---

## Key Capabilities

- **Blind Assessment Pipeline** — Candidate PII is extracted and stored separately from technical content. Evaluators see only anonymised answers and AI-generated scores until they explicitly trigger an identity reveal.
- **Zero-Shot Relevance Gate** — Before any costly LLM grading call, answers are pre-screened by a HuggingFace zero-shot classifier. Irrelevant answers are auto-zeroed without consuming Gemini quota.
- **Adaptive Scoring** — The Gemini grading prompt accounts for declared experience level, so Junior and Senior candidates are assessed against appropriate expectations.
- **Integrity Monitoring** — Tab-switch events, focus-loss events, clipboard intercepts, and DevTools detection are recorded in real time and factored into the grading prompt.
- **Weighted Evaluation Templates** — Recruiters define per-job evaluation templates with configurable CV, Skills, and Interview score weights.
- **Full Audit Trail** — Every action (invitation sent, CV uploaded, identity revealed, decision recorded) is appended to an immutable audit log per organisation.

---

## Prerequisites

| Requirement | Minimum Version |
|---|---|
| Ballerina | Swan Lake Update 13 (2201.13.x) |
| Node.js | 18.x or later |
| Java (for Docker build) | 21 (Eclipse Temurin recommended) |
| Docker + Docker Compose | 24.x or later |
| Supabase account | — |
| Google Gemini API key | — |
| HuggingFace API token | — |
| Cloudflare R2 account | — |
| WSO2 Asgardeo tenant | — |

---

## Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/YourUsername/EquiHire-Core.git
cd EquiHire-Core

# 2. Configure and start the backend
cd ballerina-gateway
cp Config.toml.example Config.toml
# Edit Config.toml and add your credentials (see doc/getting-started.md)
bal run

# 3. Start the frontend (separate terminal)
cd ../react-frontend
npm install
npm run dev
# Application available at http://localhost:5173
```

For Docker-based deployment see `ballerina-gateway/docker-compose.yml`.

---

## Documentation

| Document | Description |
|---|---|
| [Getting Started](doc/getting-started.md) | Full setup guide: prerequisites, configuration, database initialisation, running tests |
| [API Reference](doc/api-endpoints.md) | All REST endpoints with request/response schemas |
| [Introduction](doc/introduction.md) | Problem statement, design philosophy, and system architecture |
| [Identity Lifecycle](doc/identity-lifecycle.md) | Authentication flows and PII reveal mechanics |

---

## Running Tests

```bash
cd ballerina-gateway
bal test
```

The test suite is split into groups:

| Group | Description | Requires live credentials |
|---|---|---|
| `unit` | Pure offline logic tests (AI grading, HF gate, utils) | No |
| `connection` | Live connectivity checks (Gemini, HF, Supabase, SMTP, R2) | Yes |
| `integration` | End-to-end API tests (requires running server) | Yes |

---

## License

This project is licensed under the MIT License.
