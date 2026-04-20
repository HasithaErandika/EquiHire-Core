# Getting Started with EquiHire

This guide provides the necessary steps to configure and execute the EquiHire platform locally.

---

## Prerequisites

Before beginning the installation, ensure you have the following tools and accounts configured:

*   **Runtime Environments:**
    *   Ballerina Swan Lake (Update 8 or higher)
    *   Node.js (LTS version)
*   **External Managed Services:**
    *   Supabase Account (For PostgreSQL persistence)
    *   Google Gemini API Key (For CV parsing and semantic evaluation)
    *   HuggingFace API Token (For response relevance gating)
    *   Cloudflare R2 Account (For secure object storage)
    *   WSO2 Asgardeo Account (For identity and access management)

---

## Installation and Configuration

### 1. Repository Setup
Clone the repository to your local environment:
```bash
git clone https://github.com/YourUsername/EquiHire-Core.git
cd EquiHire-Core
```

### 2. Database Initialization
EquiHire uses Supabase for data persistence. To initialize the database:
1.  Access your Supabase SQL Editor.
2.  Execute the scripts provided in `supabase_schema.sql` to create the required tables and relational constraints.

### 3. Backend Implementation (Ballerina)
1.  Navigate to the gateway directory:
    ```bash
    cd ballerina-gateway
    ```
2.  Initialize the configuration:
    ```bash
    cp Config.toml.example Config.toml
    ```
3.  **Important:** Update `Config.toml` with your specific API credentials and database connection details. Note that the R2 `accessKeyId` is a unique identifier, not a URL.
4.  Execute the service:
    ```bash
    bal run
    ```

### 4. Frontend Implementation (React)
1.  Navigate to the frontend directory:
    ```bash
    cd react-frontend
    ```
2.  Initialize environment variables:
    ```bash
    cp .env.example .env
    ```
3.  Install dependencies and start the development server:
    ```bash
    npm install
    npm run dev
    ```

---

## Support and Documentation
For detailed architecture diagrams and API specifications, refer to the [Introduction](./introduction.md) and [API Reference](./api-endpoints.md) documents.

