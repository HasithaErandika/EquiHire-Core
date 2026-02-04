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
    -   **Action**: Once logged in, the Admin creates their organization profile.
    -   **Asgardeo's Role**: EquiHire assigns this user the "Organization Admin" role in Asgardeo.

## Phase 2: The Recruiter's Journey (Creating the Interview)

1.  **Login**:
    -   **Action**: The Recruiter logs in using their company email.
    -   **Asgardeo**: Authenticates them and returns a JWT (JSON Web Token) with restricted roles.
    -   **EquiHire Backend**: Validates the JWT and loads the organization dashboard.

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

2.  **The "Waiting Room" (Lobby)**:
    -   **Action**: If valid, the Candidate enters the lobby.
    -   **Security**: The frontend holds a temporary "Candidate Session" (in memory).
    -   The Candidate cannot see the Recruiter's dashboard or other candidates.

## Phase 5: The Interview (The Connection)

1.  **Connecting to the Room**:
    -   **Action**: Candidate clicks "Join Interview."
    -   **Ballerina Gateway**:
        -   It validates the Candidate Session.
        -   **Verification Success**: It opens the WebSocket Audio Stream.
        -   The **Bias Firewall** begins processing audio immediately.

2.  **The End of the Session**:
    -   **Action**: The interview finishes.
    -   **Expiration**: The Invitation Token is marked as `used`. Re-clicking the link will show "Link Expired."
