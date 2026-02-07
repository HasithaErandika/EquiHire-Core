# EquiHire-Core: The Agentic Bias Firewall

**"Evaluating Code, Not Context."**

EquiHire is an AI-Native Blind Assessment Platform designed to act as an objective "Bias Firewall" for technical recruitment. It utilizes a **Agent Cognitive Engine** to sanitize candidate identity and evaluate technical merit through semantic analysis, ensuring hiring decisions are based strictly on logic, not background.

---

## Key Features

*   **Context Extraction:** Analyzes candidate CVs to determine experience level (Junior/Senior) and adjust grading strictness.
*   **Privacy Redaction:** Automatically identifies and redacts PII (Names, Universities) from written answers using **Gemini 1.5 Flash** to ensure bias-free evaluation.
*   **Adaptive Scoring & Feedback:** Evaluates technical accuracy and generates personalized "Growth Reports" explaining knowledge gaps.
*   **Lockdown Assessment:** Secure, anti-cheating exam environment.

**[Read the Full Introduction & Problem Statement](doc/introduction.md)**

---

## Tech Stack

![Ballerina](https://img.shields.io/badge/Ballerina-Swan%20Lake-57d9a3?style=flat-square&logo=ballerina)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?style=flat-square&logo=cloudflare)

*   **Gateway:** Ballerina
*   **AI Engine:** Python (FastAPI, PyTorch)
*   **Frontend:** React + TypeScript
*   **Auth:** WSO2 Asgardeo

---

## Documentation

*   **[Introduction](doc/introduction.md)**: Detailed problem statement, solution architecture, and contributors.
*   **[Getting Started](doc/getting-started.md)**: Installation, configuration, and prerequisites.
*   **[API Reference](doc/api-endpoints.md)**: REST API documentation.
*   **[Identity Lifecycle](doc/identity-lifecycle.md)**: Authentication flows.

---

## Quick Start

```bash
# 1. Clone Repo
git clone https://github.com/YourUsername/EquiHire-Core.git

# 2. Run Gateway
cd ballerina-gateway && bal run

# 3. Run AI Engine
cd python-ai-engine && uvicorn main:app --reload

# 4. Run Frontend
cd react-frontend && npm run dev
```

For detailed setup instructions, see **[Getting Started](doc/getting-started.md)**.

---

## License

This project is licensed under the MIT License.
