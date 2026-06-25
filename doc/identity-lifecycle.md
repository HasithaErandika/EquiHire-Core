# Identity Lifecycle (Asgardeo Integration)

This document details the workflow of how the Interviewer (Recruiter) and Candidate interact, specifically focusing on how **WSO2 Asgardeo** handles the Identity and Access Management (IAM).

## Phase 1: The Setup (Organization Creation)

Before any interview happens, the company must exist in the system.

1.  **The Sign-Up**:
    -   **Action**: The Lead Recruiter (Admin) visits the web portal and clicks "Sign Up for Enterprise."
    -   **Asgardeo's Role**:
        -   The app redirects to the Asgardeo Login Page.
        -   The Admin can use SSO (Single Sign-On).
        -   **Tech**: Asgardeo verifies the corporate credentials via OIDC (OpenID Connect).

2.  **Organization Provisioning**:
    -   **Action**: Once logged in, the Admin creates their organization profile (`POST /organizations`).
    -   **Asgardeo's Role**: Asgardeo only authenticates the user and supplies their `userId` (the OIDC `sub` claim) — it has no concept of organizations or roles. "Organization Admin" is purely a database fact: the backend inserts a row into the Supabase `recruiters` table with `role = "admin"`, keyed to that Asgardeo `userId`. There is no role/group sync back into Asgardeo.

## Phase 2: The Recruiter's Journey (Creating the Interview)

1.  **Login**:
    -   **Action**: The Recruiter logs in using their company email.
    -   **Asgardeo**: Authenticates them via OIDC and returns standard `openid profile email` claims (no custom roles/scopes are requested) plus the `userId` (`sub`).
    -   **EquiHire Frontend**: Calls `GET /me/organization?userId={userId}` to resolve which organization (and `recruiters` row) this Asgardeo identity maps to, then loads the dashboard.

2.  **Scheduling the Session**:
    -   **Action**: The Recruiter clicks "New Session" on the dashboard.
    -   **Input**: Job Role, Candidate Email, Date/Time.
    -   **The Trigger**: When "Send Invite" is clicked, the Ballerina Gateway initiates the invitation flow.

## Phase 3: The "Magic" Invitation

Candidates should not have to create a complex account with a password.

1.  **Backend Logic (Ballerina)**:
    -   The Ballerina service receives the request: "Invite candidate@gmail.com."
    -   It creates a unique, time-bound "Invitation Token" (stored in Supabase).
    -   This token is separate from Asgardeo initially.

2.  **The "Magic Link" Dispatch**:
    -   **Email**: The system sends an email to the candidate: "You have been invited to a Blind Interview. Click here to join."

## Phase 4: The Candidate's Journey (The Login)

1.  **The Click**:
    -   **Action**: Sarah clicks the link in her email.
    -   **Verification**: The link is an EquiHire Frontend link (e.g., `/invite/{token}`).
    -   **Backend**: The backend validates the token against the database (Check expiration, check used status).

2.  **The Welcome / Consent Screen**:
    -   **Action**: If valid, the candidate is redirected straight to `/candidate/welcome` — there is no separate waiting room or "join session" step gated on recruiter approval.
    -   **Security**: The invitation data (email, name, jobTitle, organizationId, jobId, invitationId) is held in browser `sessionStorage`, not a server-side session.
    -   This screen explains the integrity/lockdown rules and collects the candidate's CV upload before the assessment can start. The candidate cannot see the Recruiter's dashboard or other candidates at any point.

## Phase 5: The Assessment (The Lockdown)

1.  **Starting the Assessment**:
    -   **Action**: Candidate clicks "Start Assessment," which calls `POST /candidates/{candidateId}/start-session`.
    -   **Ballerina Gateway**:
        -   Creates an exam session row (`status: in_progress`) and links the candidate to their invitation for PII mapping.
        -   **Answer Vault, not on-the-fly redaction**: On submission (`POST /candidates/{candidateId}/evaluate`), raw answer text is written to the database **unredacted and unconditionally first** — this is a deliberate "vault" guarantee so no candidate data is lost even if the AI pipeline fails. Redaction happens *after* this write, asynchronously: each answer is string-matched against the PII map captured during CV parsing (Gemini) and self-disclosed names/emails are swapped for placeholder tokens before the redacted text is sent to Gemini for grading. HuggingFace's `bart-large-mnli` model plays no role in redaction — it is only used as the zero-shot relevance gate (see [Introduction](introduction.md)) to auto-zero off-topic answers before they reach Gemini.

2.  **Token Single-Use, Not Session-Use**:
    -   The invitation token is marked `used_at` immediately on its **first successful validation** in Phase 4 (`GET /invitations/validate/{token}`) — not at the end of the assessment. Re-clicking the same magic link after that first click will show "This invitation link has already been used," even if the candidate never finished (or never started) the assessment. The frontend carries the candidate forward via `sessionStorage`, not by re-validating the token on every page.
    -   The interview itself ends when the candidate submits (`POST /candidates/{candidateId}/evaluate`) or the client-side timer/focus-loss limit auto-submits on their behalf.
