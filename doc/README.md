# EquiHire Documentation

Welcome to the EquiHire Core documentation. This folder contains detailed information about the system architecture, API reference, and specific workflows.

## Table of Contents

1.  **[System Overview](../README.md)**: The root README serves as the general system overview.
2.  **[Voice Architecture](./voice-architecture.md)**: Deep dive into the "Bias Firewall" (Twilio -> OpenAI -> Python -> Recruiter).
3.  **[Identity Lifecycle](./identity-lifecycle.md)**: Detailed flow of Authentication, Sign-up, and Magic Link Invitations using Asgardeo.
4.  **[API Reference](./api-endpoints.md)**: List of available HTTP and WebSocket endpoints.

## Project Structure

-   `ballerina-gateway`: The core orchestrator handling API requests, Database interactions, and Voice Streams.
-   `python-ai-engine`: The intelligence layer responsible for PII Redaction (BERT) and Analytics.
-   `react-frontend`: The dashboard for Recruiters.
