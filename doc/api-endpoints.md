# API Reference

## Base URL
-   **Gateway API**: `http://localhost:9092`
-   **Gateway WebSockets**: `ws://localhost:9090` (Public), `ws://localhost:9091` (Dashboard)
-   **Python AI Engine**: `http://localhost:8000` (Internal)

## Ballerina Gateway Endpoints

### HTTP REST API (`/api`)

#### 1. Create Organization
-   **POST** `/api/organizations`
-   **Body**:
    ```json
    {
      "name": "Tech Corp",
      "industry": "Software",
      "size": "Start-up",
      "userId": "user_123",
      "userEmail": "admin@techcorp.com"
    }
    ```
-   **Response**: `201 Created`

#### 2. Get Organization
-   **GET** `/api/me/organization?userId=user_123`
-   **Response**: `200 OK`

#### 3. Create Invitation
-   **POST** `/api/invitations`
-   **Body**:
    ```json
    {
      "recruiterId": "recruiter_123",
      "organizationId": "org_555",
      "candidateEmail": "candidate@example.com",
      "candidateName": "John Doe",
      "jobTitle": "Senior Engineer",
      "interviewDate": "2024-03-01T10:00:00Z"
    }
    ```
-   **Response**: Returns magic link URL and token.

#### 4. Validate Invitation Token
-   **GET** `/api/invitations/validate/[token]`
-   **Response**: `200 OK` (if valid and not expired)

### WebSocket Services

#### 1. Twilio Media Stream
-   **URL**: `ws://localhost:9090/streams`
-   **Protocol**: Twilio Media Stream (WebSocket)
-   **Input**: Audio chunks (mulaw 8k).
-   **Function**: Ingests audio for the Bias Firewall.

#### 2. Recruiter Dashboard
-   **URL**: `ws://localhost:9091/dashboard?token=[JWT]`
-   **Auth**: Asgardeo JWT required.
-   **Output**: Server-sent events:
    ```json
    {
      "type": "transcription",
      "text": "Hello, I am [Candidate].",
      "pii_detected": true
    }
    ```

## Python AI Engine Endpoints

### 1. Sanitize Text (Firewall)
-   **POST** `/sanitize`
-   **Body**:
    ```json
    {
      "text": "I worked at Google in New York.",
      "context": "voice_interview"
    }
    ```
-   **Response**:
    ```json
    {
      "original_text_length": 31,
      "sanitized_text": "I worked at [Company] in [Location].",
      "pii_detected": true,
      "redactions": [...]
    }
    ```
