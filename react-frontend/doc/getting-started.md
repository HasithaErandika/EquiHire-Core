# Getting Started with EquiHire

## Prerequisites
*   Ballerina (Swan Lake Update 8+)
*   Node.js 18+
*   Supabase Account (Database)
*   Google Gemini API Key (Feedback)
*   Cloudflare R2 Account (Secure Storage)

## Installation

### 1. Fork and Clone the Repository
```bash
git clone https://github.com/YourUsername/EquiHire-Core.git
cd EquiHire-Core
```

### 2. Database Setup (Supabase)
Run the SQL scripts in `supabase_schema.sql` via your Supabase SQL Editor.

### 3. Backend Gateway (Ballerina)
```bash
cd ballerina-gateway
cp Config.toml.example Config.toml
# IMPORTANT: Update Config.toml with your keys. follow the Config.toml.example file.
# Note: R2 'accessKeyId' is a string ID, not a URL.
# Add your Google Gemini API Key and HuggingFace tokens here as well.
bal run
```

### 4. Frontend (React)
```bash
cd react-frontend
npm install
npm run dev
```
