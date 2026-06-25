# EquiHire-Core Documentation

This directory contains the technical documentation for the EquiHire-Core platform.

---

## Table of Contents

| File | Title | Description |
|---|---|---|
| [getting-started.md](getting-started.md) | Getting Started | Step-by-step setup guide covering prerequisites, configuration keys, database initialisation, running the backend and frontend, Docker deployment, and test execution |
| [api-endpoints.md](api-endpoints.md) | API Reference | Complete REST API documentation: all endpoints, request/response schemas, field types, validation rules, and a Postman collection |
| [introduction.md](introduction.md) | Introduction | Problem statement, design philosophy, bias-firewall concept, and high-level system architecture |
| [identity-lifecycle.md](identity-lifecycle.md) | Identity Lifecycle | Authentication flows, PII anonymisation pipeline, and recruiter identity-reveal mechanics |
| [frontend-design.md](frontend-design.md) | Frontend Design | Component structure and design decisions for the React dashboard |

---

## Conventions

- All configuration values are documented in `ballerina-gateway/Config.toml.example`.
- The database schema is in `supabase_schema.sql` at the project root.
- Docker deployment files are in `ballerina-gateway/`.
