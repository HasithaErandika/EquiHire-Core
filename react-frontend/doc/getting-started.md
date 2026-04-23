# Getting Started with EquiHire (Frontend)

This guide focuses on setting up the EquiHire frontend application. For a comprehensive overview of the entire system, please refer to the [Root Documentation](../../doc/getting-started.md).

---

## Prerequisites

Ensure your environment is configured with the following:

| Requirement | Purpose |
| :--- | :--- |
| **Node.js 18+** | Frontend runtime (Vite/React) |
| **Ballerina (Update 8+)** | Required to run the backend gateway locally |
| **Supabase** | Backend database access |
| **Cloud Services** | Google Gemini (AI), Cloudflare R2 (Storage), HuggingFace |

---

## Setup Instructions

### 1. Repository Access
If you haven't already, clone the repository:
```bash
git clone https://github.com/DilnakaAbhishek/EquiHire-Core.git
cd EquiHire-Core
```

### 2. Backend Gateway (Required)
The frontend requires the Ballerina gateway to be active for API communication.
```bash
cd ballerina-gateway
cp Config.toml.example Config.toml
# Update Config.toml with your keys (Gemini, R2, Supabase)
bal run
```

### 3. Frontend Initialization
In a new terminal, navigate to the frontend directory:
```bash
cd react-frontend
npm install
```

### 4. Environment Configuration
Create a `.env` file based on the provided template:
```bash
cp .env.example .env
```
**TIP:** Ensure `VITE_API_URL` points to your local Ballerina gateway (default: `http://localhost:9092`).

### 5. Launch Development Server
```bash
npm run dev
```

---

## Access
Once running, the application is accessible at:
**[http://localhost:5173](http://localhost:5173)**

---

## Resources
*   [Frontend Design Guidelines](./frontend-design.md)
*   [API Endpoints Reference](./api-endpoints.md)
*   [Identity Lifecycle (Asgardeo)](./identity-lifecycle.md)
