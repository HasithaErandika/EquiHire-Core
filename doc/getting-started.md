# Getting Started with EquiHire-Core

This guide walks you through setting up the EquiHire-Core platform for local development from scratch.

---

Welcome to the EquiHire setup guide. Follow these instructions to configure and execute the EquiHire platform in your local development environment.

---

## Prerequisites

Ensure your system meets the following requirements before proceeding with the installation.

### Runtime Environments
| Tool | Version | Purpose |
| :--- | :--- | :--- |
| **Ballerina** | Swan Lake (Update 8 or higher) | Backend microservices & gateway |
| **Node.js** | 18.x or higher (LTS recommended) | Frontend development & tooling |
| **npm** | 9.x or higher | Dependency management |

### Managed Services
EquiHire integrates several cloud services. You will need active accounts for the following:
*   **Supabase:** PostgreSQL database and authentication.
*   **Google Gemini:** AI-driven CV parsing and evaluations.
*   **HuggingFace:** Inference APIs for response gating.
*   **Cloudflare R2:** Secure S3-compatible object storage for resumes.
*   **WSO2 Asgardeo:** Identity and Access Management (OIDC).
*   **Brevo:** SMTP service for automated email notifications.

---

## Installation & Configuration

### 1. Repository Setup
Clone the EquiHire repository to your local machine:
```bash
git clone https://github.com/DilnakaAbhishek/EquiHire-Core.git
cd EquiHire-Core
```

### 2. Database Initialization
EquiHire utilizes Supabase for structured data persistence.
1.  Navigate to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Create a new project.
3.  Open the **SQL Editor** in Supabase.
4.  Copy the contents of `supabase_schema.sql` (found in the root directory) and execute it to initialize the database schema.

### 3. Backend Gateway Configuration (Ballerina)
The backend gateway handles API routing and core logic.
1.  Navigate to the gateway directory:
    ```bash
    cd ballerina-gateway
    ```
2.  Initialize the configuration file:
    ```bash
    cp Config.toml.example Config.toml
    ```
3.  Open `Config.toml` and populate it with your service credentials.

**IMPORTANT:** The Cloudflare R2 `accessKeyId` is a literal string identifier, not a URL. Ensure all AI API keys are correctly scoped.

4.  Start the Ballerina service:
    ```bash
    bal run
    ```

### 4. Frontend Application Setup (React)
The frontend is built with React and Vite.
1.  Navigate to the frontend directory:
    ```bash
    cd ../react-frontend
    ```
2.  Initialize the environment configuration:
    ```bash
    cp .env.example .env
    ```
3.  Update `.env` with your Asgardeo and API URL configuration.
4.  Install dependencies and launch the development server:
    ```bash
    npm install
    npm run dev
    ```

---

## Verification
Once both the backend and frontend are running:
*   Frontend: [http://localhost:5173](http://localhost:5173)
*   Backend Gateway: [http://localhost:9092](http://localhost:9092)

Attempt a test login using an Asgardeo-registered account to verify the full authentication flow.

---

## Related Documentation
*   [Introduction](./introduction.md) - Project overview and core concepts.
*   [API Reference](./api-endpoints.md) - Detailed endpoint documentation.
*   [Frontend Design](./frontend-design.md) - UI/UX standards and architecture.


