# EquiHire-Core API Reference

**Base URL (local development):** `http://localhost:9092/api`

All endpoints accept and return `application/json` unless otherwise noted. CORS is open (`*`) for all origins.

---

## 1. Organizations

### POST /organizations
Register a new organization and create its first recruiter record.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Display name of the organization |
| `industry` | string | Yes | Industry category |
| `size` | string | Yes | Company size band (e.g., `1-10`, `11-50`, `50+`) |
| `userId` | string | Yes | Asgardeo user ID of the account owner |
| `userEmail` | string | Yes | Email address of the account owner |

**Response `200`**

```json
{ "id": "<org-uuid>", "name": "Acme Corp" }
```

---

### GET /me/organization
Retrieve the organization linked to a given user.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | string | Yes | Asgardeo user ID |

**Response `200`** — Returns an `OrganizationResponse` object.

**Response `500`** — User has no linked organization.

---

### PUT /organization
Update organization industry and size.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `organizationId` | string | Yes | UUID of the organization to update |
| `industry` | string | Yes | New industry value |
| `size` | string | Yes | New size band |

**Response `200`**

```json
{ "status": "updated" }
```

---

## 2. Jobs

### POST /jobs
Create a new job posting.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | Job title |
| `description` | string | Yes | Full job description |
| `requiredSkills` | string[] | Yes | List of required skills |
| `organizationId` | string | Yes | UUID of the owning organization |
| `recruiterId` | string | Yes | Asgardeo user ID of the recruiter (resolved to internal UUID internally) |
| `evaluationTemplateId` | string | No | UUID of the evaluation template to attach |

**Response `200`**

```json
{ "id": "<job-uuid>" }
```

---

### GET /jobs
List all jobs belonging to a recruiter.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | string | Yes | Asgardeo user ID of the recruiter |

**Response `200`** — JSON array of job objects.

---

### PUT /jobs/{jobId}
Update a job posting.

**Path Parameters:** `jobId` — UUID of the job.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | Updated title |
| `description` | string | Yes | Updated description |
| `requiredSkills` | string[] | Yes | Updated skills list |
| `evaluationTemplateId` | string | No | Updated template reference |
| `organizationId` | string | No | Org UUID — required for audit log |
| `recruiterId` | string | No | Recruiter user ID — required for audit log |

**Response `200`**

```json
{ "status": "updated" }
```

---

### DELETE /jobs/{jobId}
Delete a job posting.

**Path Parameters:** `jobId` — UUID of the job.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `organizationId` | string | Yes | Org UUID for audit log |
| `recruiterId` | string | No | Recruiter user ID for audit log |

**Response `200`**

```json
{ "status": "deleted" }
```

---

## 3. Job Questions

### POST /jobs/questions
Create one or more interview questions for a job (bulk).

**Request Body**

```json
{
  "questions": [
    {
      "jobId": "<job-uuid>",
      "questionText": "Explain the CAP theorem.",
      "sampleAnswer": "Consistency, Availability, Partition tolerance...",
      "keywords": ["consistency", "availability", "partition"],
      "type": "paragraph"
    }
  ]
}
```

**Response `200`**

```json
{ "status": "created", "count": 1 }
```

---

### GET /jobs/{jobId}/questions
Retrieve all questions for a job.

**Path Parameters:** `jobId` — UUID of the job.

**Response `200`** — JSON array of `QuestionItem` objects.

---

### PUT /questions/{questionId}
Update a single question.

**Path Parameters:** `questionId` — UUID of the question.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `questionText` | string | Yes | Updated question text |
| `sampleAnswer` | string | Yes | Updated model answer |
| `keywords` | string[] | Yes | Updated keyword hints |
| `type` | string | Yes | Question type (`paragraph`, `mcq`, etc.) |

**Response `200`**

```json
{ "status": "updated" }
```

---

### DELETE /questions/{questionId}
Delete a question.

**Path Parameters:** `questionId` — UUID of the question.

**Response `200`**

```json
{ "status": "deleted" }
```

---

## 4. Invitations

### POST /invitations
Create a magic-link invitation and dispatch the invitation email.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `recruiterId` | string | Yes | Asgardeo user ID of the recruiter |
| `organizationId` | string | Yes | UUID of the organization |
| `jobId` | string | Yes | UUID of the target job |
| `candidateEmail` | string | Yes | Candidate email address |
| `candidateName` | string | Yes | Candidate display name |
| `jobTitle` | string | Yes | Job title shown in the email |
| `interviewDate` | string | No | ISO 8601 interview date hint |

**Response `200`**

```json
{
  "id": "<invitation-uuid>",
  "token": "<uuid-token>",
  "magicLink": "https://app.example.com/invite/<uuid-token>",
  "candidateEmail": "candidate@example.com",
  "expiresAt": "2026-04-29T15:00:00Z"
}
```

> Invitations expire after **7 days**. Each token is single-use — it is marked `used_at` on the first valid validation.

---

### GET /invitations
List all invitations sent by a recruiter.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | string | Yes | Asgardeo user ID of the recruiter |

**Response `200`** — JSON array of invitation objects.

---

### GET /invitations/validate/{token}
Validate a magic-link token. This endpoint is called by the candidate portal on page load.

**Path Parameters:** `token` — The UUID token from the magic link URL.

**Response `200` — Valid token**

```json
{
  "valid": true,
  "candidateEmail": "candidate@example.com",
  "candidateName": "Jane Smith",
  "jobTitle": "Senior Backend Engineer",
  "organizationId": "<org-uuid>",
  "jobId": "<job-uuid>",
  "invitationId": "<invitation-uuid>"
}
```

**Response `200` — Invalid token** (expired or already used)

```json
{ "valid": false, "message": "This invitation link has expired" }
```

---

## 5. Candidates and Assessment

### POST /candidates/upload-cv
Upload a candidate CV. Triggers the full AI pipeline: PDF extraction, Gemini structured parsing, PII mapping, R2 storage, and asynchronous CV evaluation.

**Request:** `multipart/form-data`

| Part | Type | Required | Description |
|---|---|---|---|
| `file` | binary (PDF) | Yes | The CV file |
| `jobId` | text | Yes | UUID of the target job |

**Response `200`**

```json
{
  "status": "success",
  "candidateId": "<candidate-uuid>",
  "r2Key": "cvs/<candidate-uuid>.pdf",
  "parsed": {
    "experienceLevel": "Senior",
    "detectedStack": ["Python", "Kubernetes", "PostgreSQL"],
    "sections": { "education": [...], "work_experience": [...] }
  }
}
```

> The candidate identity (`candidateId`) must be passed to all subsequent endpoints. CV evaluation runs asynchronously — scores appear in the candidate record after a short delay.

---

### POST /candidates/{candidateId}/start-session
Begin a tracked exam session for a candidate.

**Path Parameters:** `candidateId` — UUID returned by `upload-cv`.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `jobId` | string | Yes | UUID of the job |
| `invitationId` | string | No | UUID of the invitation (for audit) |

**Response `200`**

```json
{ "sessionId": "<session-uuid>", "candidateId": "<candidate-uuid>" }
```

---

### POST /candidates/{candidateId}/evaluate
Submit a completed assessment. Writes raw answers immediately, then runs the full grading pipeline asynchronously (HF gate + Gemini scoring).

**Path Parameters:** `candidateId` — UUID of the candidate.

**Request Body**

```json
{
  "sessionId": "<session-uuid>",
  "jobId": "<job-uuid>",
  "submissionType": "manual",
  "answers": [
    {
      "questionId": "<question-uuid>",
      "answerText": "REST is a stateless architectural style using HTTP verbs.",
      "timeSpentSeconds": 120
    }
  ],
  "cheatEvents": [
    {
      "eventType": "tab_switch",
      "occurredAt": "2026-04-22T10:05:30Z",
      "details": "switched to Chrome DevTools"
    }
  ]
}
```

**Response `200`**

```json
{ "status": "submitted", "candidateId": "<uuid>", "answersReceived": 5 }
```

> Grading is asynchronous. Poll the candidate list or transcript endpoint to see when scores are populated.

---

### GET /candidates/{candidateId}/reveal
Unmask a candidate's identity (PII reveal). Restricted to authorised recruiters. Creates an audit log entry on every call.

**Path Parameters:** `candidateId` — UUID of the candidate.

**Response `200`**

```json
{
  "candidateId": "<uuid>",
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1-555-0100"
}
```

---

### POST /candidates/{candidateId}/evaluate-cv
Re-trigger AI CV evaluation on demand (for example, after a job's evaluation template is updated).

**Path Parameters:** `candidateId` — UUID of the candidate.

**Response `200`**

```json
{ "status": "success" }
```

---

### GET /candidates/{candidateId}/transcript
Retrieve the full assessment transcript including all answers, scores, CV metadata, and evaluation summary.

**Path Parameters:** `candidateId` — UUID of the candidate.

**Response `200`**

```json
{
  "candidateId": "<uuid>",
  "candidateName": "Candidate #A3F2",
  "candidateEmail": "redacted",
  "jobTitle": "Senior Backend Engineer",
  "appliedDate": "2026-04-22",
  "overallScore": 78.5,
  "cvScore": 82.0,
  "skillsScore": 74.0,
  "interviewScore": 77.0,
  "summaryFeedback": "Strong distributed systems knowledge...",
  "transcript": [ { "questionText": "...", "answerText": "...", "score": 8 } ],
  "education": [...],
  "workExperience": [...],
  "technicalSkills": [...],
  "phone": "redacted"
}
```

---

### POST /candidates/{candidateId}/decide
Record a final hiring decision. Updates the candidate status and dispatches an acceptance or rejection email with the evaluation summary.

**Path Parameters:** `candidateId` — UUID of the candidate.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `decision` | string | Yes | Must be `"accepted"` or `"rejected"` |

**Response `200`**

```json
{
  "candidateId": "<uuid>",
  "pass": true,
  "emailSent": true,
  "status": "accepted",
  "overallScore": 78.5,
  "cvScore": 82.0,
  "skillsScore": 74.0,
  "interviewScore": 77.0
}
```

---

### POST /candidates/{candidateId}/flag-cheating
Record a legacy integrity violation flag (for clients that do not submit `cheatEvents` via the `evaluate` endpoint).

**Path Parameters:** `candidateId` — UUID of the candidate.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `organizationId` | string | Yes | UUID of the organization |
| `violations` | object | Yes | Key-value map of violation types to details |

**Response `200`**

```json
{ "status": "flagged", "candidateId": "<uuid>" }
```

---

### GET /organizations/{organizationId}/candidates
List all candidates belonging to an organization.

**Path Parameters:** `organizationId` — UUID of the organization.

**Response `200`** — JSON array of `CandidateResponse` objects.

---

## 6. Evaluation Templates

### GET /organizations/{organizationId}/evaluation-templates
List all evaluation templates for an organization.

**Path Parameters:** `organizationId` — UUID of the organization.

**Response `200`** — JSON array of template objects.

---

### POST /evaluation-templates
Create a new evaluation template.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `organizationId` | string | Yes | UUID of the owning organization |
| `name` | string | Yes | Template display name |
| `description` | string | Yes | Brief description of use case |
| `type` | string | No | Template type (default: `QUESTIONNAIRE`) |
| `prompt_template` | string | Yes | AI prompt instructions for this role type |

**Response `200`** — Created template object.

---

### PUT /evaluation-templates/{id}
Update an existing template.

**Path Parameters:** `id` — UUID of the template.

**Request Body** — Same fields as POST, all required.

**Response `200`**

```json
{ "status": "updated" }
```

---

### DELETE /evaluation-templates/{id}
Delete a template.

**Path Parameters:** `id` — UUID of the template.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `organizationId` | string | Yes | UUID of the organization (ownership check) |

**Response `200`**

```json
{ "status": "deleted" }
```

---

## 7. Audit Logs

### GET /organizations/{organizationId}/audit-logs
Retrieve the full audit trail for an organization.

**Path Parameters:** `organizationId` — UUID of the organization.

**Response `200`** — JSON array of audit log entries ordered by timestamp descending.

```json
[
  {
    "id": "<uuid>",
    "organizationId": "<uuid>",
    "action": "CV Uploaded",
    "entityType": "Candidate",
    "entityId": "<candidate-uuid>",
    "metadata": { "jobId": "<uuid>" },
    "createdAt": "2026-04-22T10:00:00Z"
  }
]
```

**Audit action values**

| Action String | Trigger |
|---|---|
| `CV Uploaded` | `POST /candidates/upload-cv` |
| `Session Started` | `POST /candidates/{id}/start-session` |
| `Submit Assessment` | `POST /candidates/{id}/evaluate` |
| `Candidate Accepted` | `POST /candidates/{id}/decide` with `accepted` |
| `Candidate Rejected` | `POST /candidates/{id}/decide` with `rejected` |
| `CV Accessed` | `GET /candidates/{id}/reveal` |
| `Transcript Viewed` | `GET /candidates/{id}/transcript` |
| `Send Invitation` | `POST /invitations` |
| `Invitation Accepted` | `GET /invitations/validate/{token}` (valid) |
| `Job Updated` | `PUT /jobs/{jobId}` |
| `Job Deleted` | `DELETE /jobs/{jobId}` |
| `Template Updated` | `PUT /evaluation-templates/{id}` |
| `Template Deleted` | `DELETE /evaluation-templates/{id}` |
| `Organization Updated` | `PUT /organization` |

---

## 8. Health

### GET /health
Liveness check endpoint.

**Response `200`**

```json
{ "status": "UP" }
```
