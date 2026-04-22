# Getting Started with EquiHire-Core

This guide walks you through setting up the EquiHire-Core platform for local development from scratch.

---

## Prerequisites

Ensure the following tools are installed before proceeding.

| Dependency | Minimum Version | Purpose |
|---|---|---|
| [Ballerina](https://ballerina.io/downloads/) | Swan Lake Update 13 (2201.13.x) | Backend gateway runtime and compiler |
| [Node.js](https://nodejs.org/) | 18.x | Frontend build toolchain |
| [npm](https://npmjs.com/) | 9.x | Frontend dependency management |
| [Docker](https://docs.docker.com/get-docker/) | 24.x | Optional: containerised backend |
| [Docker Compose](https://docs.docker.com/compose/) | 2.x | Optional: container orchestration |

### External Service Accounts Required

| Service | Purpose | Notes |
|---|---|---|
| [Supabase](https://supabase.com/) | PostgreSQL database and REST API | Free tier is sufficient |
| [Google AI Studio](https://aistudio.google.com/) | Gemini Flash API key | Used for CV parsing and answer grading |
| [HuggingFace](https://huggingface.co/settings/tokens) | Inference API token | Used for zero-shot relevance classification |
| [Cloudflare R2](https://dash.cloudflare.com/) | Object storage for CV files | Free tier is sufficient |
| [WSO2 Asgardeo](https://wso2.com/asgardeo/) | OIDC authentication provider | Required for recruiter login |

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/YourUsername/EquiHire-Core.git
cd EquiHire-Core
```

---

## Step 2: Database Setup (Supabase)

1. Create a new Supabase project.
2. Navigate to your project's **SQL Editor**.
3. Open the file `supabase_schema.sql` from the project root.
4. Paste the full SQL content into the editor and click **Run**.
5. Verify the tables were created under the **Table Editor**.

> **Note:** The schema uses Row Level Security policies. Ensure the Supabase service role key is used in `Config.toml` (not the anon key) so the backend can bypass RLS.

---

## Step 3: Backend Configuration

```bash
cd ballerina-gateway
cp Config.toml.example Config.toml
```

Open `Config.toml` and fill in each value. The following table describes every configuration key.

### Supabase

| Key | Description |
|---|---|
| `supabaseUrl` | Your Supabase project URL (e.g., `https://xxxxx.supabase.co`) |
| `supabaseKey` | Your Supabase **service role** API key (not the anon key) |

### Google Gemini

| Key | Description |
|---|---|
| `geminiApiKey` | API key from Google AI Studio |
| `geminiBaseUrl` | Base URL for the Gemini API (default: `https://generativelanguage.googleapis.com/v1beta`) |

### HuggingFace

| Key | Description |
|---|---|
| `hfToken` | Your HuggingFace Inference API token |

### Cloudflare R2

| Key | Description |
|---|---|
| `r2AccountId` | Your Cloudflare account ID |
| `r2BucketName` | Name of your R2 bucket |
| `r2AccessKey` | R2 Access Key ID (string, not a URL) |
| `r2SecretKey` | R2 Secret Access Key |
| `r2Region` | R2 region (typically `auto`) |

### Email (SMTP)

| Key | Description |
|---|---|
| `smtpHost` | SMTP server hostname |
| `smtpPort` | SMTP port (typically `587` for TLS) |
| `smtpUsername` | SMTP account username |
| `smtpPassword` | SMTP account password |
| `senderEmail` | The From address for outbound emails |

### Asgardeo

| Key | Description |
|---|---|
| `asgardeoJwksUrl` | JWKS endpoint URL from your Asgardeo application |

### Application

| Key | Description |
|---|---|
| `frontendUrl` | The base URL of the frontend (e.g., `http://localhost:5173`) |

---

## Step 4: Run the Backend

```bash
cd ballerina-gateway
bal run
```

The gateway starts on port **9092**. Verify it is running:

```bash
curl http://localhost:9092/health
# Expected: {"status":"UP"}
```

---

## Step 5: Frontend Setup

```bash
cd react-frontend
cp .env.example .env
# Edit .env with your Asgardeo client ID, organisation name, and backend URL
npm install
npm run dev
# Application available at http://localhost:5173
```

---

## Docker-Based Deployment

A `Dockerfile` and `docker-compose.yml` are located inside `ballerina-gateway/`.

```bash
cd ballerina-gateway

# Ensure Config.toml is populated (see Step 3)
docker compose up --build
```

The gateway is accessible at `http://localhost:9092`. The health check endpoint is probed automatically by the compose health check.

---

## Running the Test Suite

```bash
cd ballerina-gateway
bal test
```

Tests are grouped for selective execution:

```bash
# Run only offline unit tests (no credentials needed)
bal test --groups unit

# Run connectivity tests (requires a populated Config.toml)
bal test --groups connection

# Run integration tests (requires the gateway to be running on port 9092)
bal test --groups integration
```

### Test Groups

| Group | Description | Requires Running Server | Requires Credentials |
|---|---|---|---|
| `unit` | Pure logic tests for AI grading pipeline and HF gate | No | No |
| `connection` | Smoke tests for Gemini, HuggingFace, Supabase, R2, and SMTP | No | Yes |
| `integration` | End-to-end API tests against live endpoints | Yes | Yes |

---

## Common Issues

| Symptom | Likely Cause | Resolution |
|---|---|---|
| `Address already in use` on port 9092 | Another process is bound to 9092 | Run `lsof -i :9092` to identify and stop it |
| Ballerina compile warnings about `isolated` methods | Non-isolated resource functions | These are hints, not errors; the service functions correctly |
| `Gemini HTTP 400` in logs | Malformed or empty prompt sent to the API | Check that CV text was extracted correctly and is non-empty |
| HuggingFace 503 in logs | HF inference endpoint temporarily unavailable | Expected; the gateway falls back and forwards the answer to Gemini |
| `insertRawAnswer failed` in logs | Supabase connection issue or schema mismatch | Verify `supabaseUrl` and `supabaseKey` in `Config.toml`; ensure schema was applied |
| SMTP `connection refused` | Incorrect SMTP host, port, or credentials | Test credentials separately using a standalone SMTP client |
