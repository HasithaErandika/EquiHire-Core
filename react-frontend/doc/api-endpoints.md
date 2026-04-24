# EquiHire-Core API Reference & Postman Guide

This document describes all REST API endpoints exposed by the **EquiHire-Core** system (Ballerina Gateway + Python AI Engine) and includes instructions for testing them in Postman.

## Base URL
**Gateway API (Public & Admin endpoints)**  
`http://localhost:9092/api`

---

## API Endpoints – Ballerina Gateway (Port 9092)

### 1. Organizations

| Action                  | Method | Endpoint                                          | Description                              | Query / Path Params       | Request Body Example (main fields)                     |
|-------------------------|--------|---------------------------------------------------|------------------------------------------|----------------------------|--------------------------------------------------------|
| Create organization     | POST   | `/organizations`                                  | Register new organization                | —                          | `name`, `industry`, `size`, `userId`, `userEmail`      |
| Get my organization     | GET    | `/me/organization`                                | Retrieve org linked to current user      | `userId`                   | —                                                      |
| Update organization     | PUT    | `/organization`                                   | Modify organization details              | `userId`                   | `id`, `name`, `industry`, `size`                       |

### 2. Jobs

| Action                  | Method | Endpoint                                          | Description                              | Path / Query Params       | Request Body Example (main fields)                     |
|-------------------------|--------|---------------------------------------------------|------------------------------------------|----------------------------|--------------------------------------------------------|
| Create job              | POST   | `/jobs`                                           | Post a new job opening                   | —                          | `title`, `description`, `requiredSkills`, `organizationId`, `recruiterId` |
| List recruiter's jobs   | GET    | `/jobs`                                           | Get all jobs created by recruiter        | `userId`                   | —                                                      |
| Update job              | PUT    | `/jobs/{jobId}`                                   | Modify job details                       | `jobId`                    | `title`, `description`, `requiredSkills`, …            |
| Delete job              | DELETE | `/jobs/{jobId}`                                   | Remove job posting                       | `jobId`                    | —                                                      |

### 3. Job Questions

| Action                        | Method | Endpoint                               | Description                              | Path / Query Params       | Request Body Example (main fields)                     |
|-------------------------------|--------|----------------------------------------|------------------------------------------|----------------------------|--------------------------------------------------------|
| Create questions (bulk)       | POST   | `/jobs/questions`                      | Add multiple interview questions         | —                          | `questions` array (`jobId`, `questionText`, `sampleAnswer`, `keywords`, `type`) |
| List questions for a job      | GET    | `/jobs/{jobId}/questions`              | Retrieve all questions of a job          | `jobId`                    | —                                                      |
| Update single question        | PUT    | `/questions/{questionId}`              | Modify existing question                 | `questionId`               | `questionText`, `sampleAnswer`, `keywords`, `type`     |
| Delete question               | DELETE | `/questions/{questionId}`              | Remove a question                        | `questionId`               | —                                                      |

### 4. Invitations (Magic Links)

| Action                        | Method | Endpoint                                      | Description                              | Path / Query Params       | Request Body Example (main fields)                     |
|-------------------------------|--------|-----------------------------------------------|------------------------------------------|----------------------------|--------------------------------------------------------|
| Create invitation             | POST   | `/invitations`                                | Send magic-link interview invite         | —                          | `recruiterId`, `organizationId`, `jobId`, `candidateEmail`, `candidateName`, `interviewDate` |
| List recruiter's invitations  | GET    | `/invitations`                                | Get all sent invitations                 | `userId`                   | —                                                      |
| Validate token                | GET    | `/invitations/validate/{token}`               | Check if magic link is valid             | `token`                    | —                                                      |

### 5. Candidates & Assessment Flow

| Action                              | Method | Endpoint                                           | Description                                      | Path / Query Params          | Request Body Example (main fields)                          |
|-------------------------------------|--------|----------------------------------------------------|--------------------------------------------------|------------------------------|-------------------------------------------------------------|
| Complete resume upload & trigger AI | POST   | `/candidates/upload-cv`                            | Uploads multipart CV file and starts parsing     | —                            | `file` and `jobId` multipart elements                       |
| Start Candidate Session             | POST   | `/candidates/{candidateId}/start-session`          | Starts tracking a new exam session               | `candidateId`                | `jobId`, `invitationId` (optional)                          |
| Evaluate candidate answer           | POST   | `/candidates/{candidateId}/evaluate`               | Score answer relevance & quality                 | `candidateId`                | `candidateAnswer`, `question`, `modelAnswer`                |
| Reveal candidate identity           | GET    | `/candidates/{candidateId}/reveal`                 | Unmask anonymized candidate (admin/recruiter)    | `candidateId`                | —                                                           |
| Re-Evaluate candidate CV            | POST   | `/candidates/{candidateId}/evaluate-cv`            | Explicitly trigger AI CV parsing on existing CV  | `candidateId`                | —                                                           |
| Flag Cheating                       | POST   | `/candidates/{candidateId}/flag-cheating`          | Register a security violation/cheating flag      | `candidateId`                | `violation_details`, `severity`                             |
| List candidates for organization    | GET    | `/organizations/{organizationId}/candidates`       | View all candidates in org                       | `organizationId`             | —                                                           |
| Submit final decision               | POST   | `/candidates/{candidateId}/decide`                 | Record hire/reject decision & trigger email      | `candidateId`                | `threshold`, `notes` (optional)                             |

### 6. Evaluation Templates & Audit Logs

| Action                        | Method | Endpoint                                                  | Description                                      | Path / Query Params              | Request Body Example (main fields)                          |
|-------------------------------|--------|-----------------------------------------------------------|--------------------------------------------------|----------------------------------|-------------------------------------------------------------|
| List evaluation templates     | GET    | `/organizations/{organizationId}/evaluation-templates`    | Get all templates of an organization             | `organizationId`                 | —                                                           |
| Create template               | POST   | `/evaluation-templates`                                   | Define new scoring / prompting template          | —                                | `organizationId`, `name`, `description`, `type`, `prompt_template` |
| Update template               | PUT    | `/evaluation-templates/{id}`                              | Modify existing template                         | `id`                             | `name`, `description`, `prompt_template`, …                 |
| Delete template               | DELETE | `/evaluation-templates/{id}`                              | Remove template                                  | `id` + query `organizationId`    | —                                                           |
| Get audit logs                | GET    | `/organizations/{organizationId}/audit-logs`              | Retrieve action history                          | `organizationId`                 | —                                                           |

---

## Postman Collection – Professional Setup

For consistent and efficient testing across your team, import the ready-to-use **Postman Collection** below.

### Import Instructions
1. Copy the entire JSON block
2. In Postman: **File → Import → Raw text** → paste → **Import**
3. (Recommended) Create a Postman **Environment** for variables like `baseUrl`, `userId`, `organizationId`, etc.

> **Security Note**  
> This collection uses `localhost` and placeholder values only. It contains **no secrets**.  
> For real environments, use Postman Environments / Variables to store tokens, IDs, and base URLs.

<details>
<summary>EquiHire Postman Collection (JSON)</summary>

```json
{
	"info": {
		"_postman_id": "8b51c312-6150-4fc7-bf84-f3c0512521c7",
		"name": "EquiHire API Collection",
		"description": "Comprehensive API collection for the EquiHire-Core backend, configured from gateway endpoints.",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
	},
	"item": [
		{
			"name": "1. Organizations",
			"item": [
				{
					"name": "Create Organization",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"name\": \"Tech Corp\",\n  \"industry\": \"Software\",\n  \"size\": \"Start-up\",\n  \"userId\": \"user_123\",\n  \"userEmail\": \"admin@techcorp.com\"\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/organizations",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"organizations"
							]
						}
					}
				},
				{
					"name": "Get Organization by User ID",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "http://localhost:9092/api/me/organization?userId=user_123",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"me",
								"organization"
							],
							"query": [
								{
									"key": "userId",
									"value": "user_123"
								}
							]
						}
					}
				},
				{
					"name": "Update Organization",
					"request": {
						"method": "PUT",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"organizationId\": \"org_555\",\n  \"industry\": \"FinTech\",\n  \"size\": \"11-50\"\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/organization",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"organization"
							]
						}
					}
				}
			]
		},
		{
			"name": "2. Jobs",
			"item": [
				{
					"name": "Create Job",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"title\": \"Senior Backend Engineer\",\n  \"description\": \"5+ years experience in Python and Go.\",\n  \"requiredSkills\": [\"Python\", \"Go\", \"AWS\"],\n  \"organizationId\": \"org_555\",\n  \"recruiterId\": \"user_123\"\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/jobs",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"jobs"
							]
						}
					}
				},
				{
					"name": "Get Jobs for Recruiter",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "http://localhost:9092/api/jobs?userId=user_123",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"jobs"
							],
							"query": [
								{
									"key": "userId",
									"value": "user_123"
								}
							]
						}
					}
				},
				{
					"name": "Update Job",
					"request": {
						"method": "PUT",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"title\": \"Lead Backend Engineer\",\n  \"description\": \"Updated Description\",\n  \"requiredSkills\": [\"Python\", \"Go\", \"AWS\", \"Kubernetes\"]\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/jobs/job_111",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"jobs",
								"job_111"
							]
						}
					}
				},
				{
					"name": "Delete Job",
					"request": {
						"method": "DELETE",
						"header": [],
						"url": {
							"raw": "http://localhost:9092/api/jobs/job_111",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"jobs",
								"job_111"
							]
						}
					}
				}
			]
		},
		{
			"name": "3. Questions",
			"item": [
				{
					"name": "Create Job Questions",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"questions\": [\n    {\n      \"jobId\": \"job_111\",\n      \"questionText\": \"Explain REST vs GraphQL.\",\n      \"sampleAnswer\": \"REST is architectural, GraphQL is a query language...\",\n      \"keywords\": [\"endpoints\", \"query\", \"over-fetching\"],\n      \"type\": \"paragraph\"\n    }\n  ]\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/jobs/questions",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"jobs",
								"questions"
							]
						}
					}
				},
				{
					"name": "Get Questions for Job",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "http://localhost:9092/api/jobs/job_111/questions",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"jobs",
								"job_111",
								"questions"
							]
						}
					}
				},
				{
					"name": "Update Question",
					"request": {
						"method": "PUT",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"questionText\": \"Explain REST vs GraphQL in depth.\",\n  \"sampleAnswer\": \"Updated Answer\",\n  \"keywords\": [\"endpoints\", \"query\", \"over-fetching\", \"caching\"],\n  \"type\": \"paragraph\"\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/questions/question_111",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"questions",
								"question_111"
							]
						}
					}
				},
				{
					"name": "Delete Question",
					"request": {
						"method": "DELETE",
						"header": [],
						"url": {
							"raw": "http://localhost:9092/api/questions/question_111",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"questions",
								"question_111"
							]
						}
					}
				}
			]
		},
		{
			"name": "4. Invitations",
			"item": [
				{
					"name": "Create Invitation",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"recruiterId\": \"user_123\",\n  \"organizationId\": \"org_555\",\n  \"jobId\": \"job_111\",\n  \"candidateEmail\": \"candidate@example.com\",\n  \"candidateName\": \"John Doe\",\n  \"interviewDate\": \"2024-03-01T10:00:00Z\"\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/invitations",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"invitations"
							]
						}
					}
				},
				{
					"name": "Get Invitations for Recruiter",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "http://localhost:9092/api/invitations?userId=user_123",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"invitations"
							],
							"query": [
								{
									"key": "userId",
									"value": "user_123"
								}
							]
						}
					}
				},
				{
					"name": "Validate Invitation Token",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "http://localhost:9092/api/invitations/validate/sample-token-123",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"invitations",
								"validate",
								"sample-token-123"
							]
						}
					}
				}
			]
		},
		{
			"name": "5. Candidates",
			"item": [
				{
					"name": "Upload CV",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "multipart/form-data"
							}
						],
						"body": {
							"mode": "formdata",
							"formdata": [
								{ "key": "file", "type": "file" },
								{ "key": "jobId", "value": "job_111", "type": "text" }
							]
						},
						"url": {
							"raw": "http://localhost:9092/api/candidates/upload-cv",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"candidates",
								"upload-cv"
							]
						}
					}
				},
				{
					"name": "Start Session",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"jobId\": \"job_111\",\n    \"invitationId\": \"inv_111\"\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/candidates/cand_999/start-session",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"candidates",
								"cand_999",
								"start-session"
							]
						}
					}
				},
				{
					"name": "Submit Assessment Evaluation",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"answers\": [\n    {\n      \"questionId\": \"q_1\",\n      \"questionText\": \"Explain REST\",\n      \"candidateAnswer\": \"Representational state transfer uses HTTP\",\n      \"score\": 85.0\n    }\n  ],\n  \"overallScore\": 85.0\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/candidates/cand_999/evaluate",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"candidates",
								"cand_999",
								"evaluate"
							]
						}
					}
				},
				{
					"name": "Reveal Candidate Identity",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "http://localhost:9092/api/candidates/cand_999/reveal",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"candidates",
								"cand_999",
								"reveal"
							]
						}
					}
				},
				{
					"name": "Re-Evaluate CV",
					"request": {
						"method": "POST",
						"header": [],
						"url": {
							"raw": "http://localhost:9092/api/candidates/cand_999/evaluate-cv",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"candidates",
								"cand_999",
								"evaluate-cv"
							]
						}
					}
				},
				{
					"name": "Flag Cheating",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"violation_details\": \"Detected unauthorized browser window navigation.\",\n  \"severity\": \"high\"\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/candidates/cand_999/flag-cheating",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"candidates",
								"cand_999",
								"flag-cheating"
							]
						}
					}
				},
				{
					"name": "Submit Decision",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n  \"threshold\": 70.0,\n  \"notes\": \"Strong candidate, good fundamentals\"\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/candidates/cand_999/decide",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"candidates",
								"cand_999",
								"decide"
							]
						}
					}
				}
			]
		},
		{
			"name": "6. Templates & Audits",
			"item": [
				{
					"name": "Get Evaluation Templates",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "http://localhost:9092/api/organizations/org_555/evaluation-templates",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"organizations",
								"org_555",
								"evaluation-templates"
							]
						}
					}
				},
				{
					"name": "Create Evaluation Template",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n        \"organizationId\": \"org_555\",\n        \"name\": \"Frontend Standard\",\n        \"description\": \"Standard template for frontend devs.\",\n        \"type\": \"react\",\n        \"prompt_template\": \"Evaluate React proficiency...\"\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/evaluation-templates",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"evaluation-templates"
							]
						}
					}
				},
				{
					"name": "Update Evaluation Template",
					"request": {
						"method": "PUT",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n        \"name\": \"Frontend Standard V2\",\n        \"description\": \"Updated standard template.\",\n        \"type\": \"react\",\n        \"organizationId\": \"org_555\",\n        \"prompt_template\": \"Evaluate React proficiency with hooks...\"\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/evaluation-templates/tmpl_111",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"evaluation-templates",
								"tmpl_111"
							]
						}
					}
				},
				{
					"name": "Delete Evaluation Template",
					"request": {
						"method": "DELETE",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"organizationId\": \"org_555\"\n}"
						},
						"url": {
							"raw": "http://localhost:9092/api/evaluation-templates/tmpl_111",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"evaluation-templates",
								"tmpl_111"
							]
						}
					}
				},
				{
					"name": "Get Audit Logs",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "http://localhost:9092/api/organizations/org_555/audit-logs",
							"protocol": "http",
							"host": [
								"localhost"
							],
							"port": "9092",
							"path": [
								"api",
								"organizations",
								"org_555",
								"audit-logs"
							]
						}
					}
				}
			]
		}
	]
}
```

</details>




---

