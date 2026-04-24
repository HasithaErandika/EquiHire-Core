/**
 * @fileoverview Backend API client for EquiHire.
 * All server calls go through this module. Types are centralized in @/types.
 */

import type {
  Job,
  Question,
  Invitation,
  EvaluationTemplate,
  Candidate,
  Organization,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
  CreateJobPayload,
  UpdateJobPayload,
  QuestionPayload,
  CreateInvitationPayload,
  CreateEvaluationTemplatePayload,
  UploadCvResponse,
  StartSessionResponse,
  SubmitAssessmentPayload,
} from '@/types';

export type {
  Job,
  Question,
  Invitation,
  EvaluationTemplate,
  Candidate,
} from '@/types';

const API_BASE_URL = ((window.configs?.VITE_API_URL || import.meta.env.VITE_API_URL) || 'http://localhost:9092') + '/api';

/**
 * Fetches the organization for the given user id. Returns null if not found (404).
 */
export async function getOrganization(userId: string): Promise<Organization | null> {
  const response = await fetch(`${API_BASE_URL}/me/organization?userId=${userId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch organization');
  }
  return response.json();
}

/**
 * Creates a new organization and returns the response (check response.ok for success).
 */
export async function createOrganization(data: CreateOrganizationPayload): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}/organizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create organization');
  return response;
}

/**
 * Updates organization industry and size.
 */
export async function updateOrganization(
  orgId: string,
  data: UpdateOrganizationPayload
): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}/organization`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, organizationId: orgId }),
  });
  if (!response.ok) throw new Error('Failed to update organization');
  return response;
}

/**
 * Creates an invitation and returns the created record (e.g. with magicLink).
 * Backend may accept extra fields (jobTitle, interviewDate, recruiterId).
 */
export async function createInvitation(
  data: CreateInvitationPayload & Record<string, unknown>
): Promise<Invitation & { magicLink?: string }> {
  const response = await fetch(`${API_BASE_URL}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to send invitation');
  return response.json();
}

/**
 * Creates a new job role and returns the created job.
 */
export async function createJob(data: CreateJobPayload & Record<string, unknown>): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create job');
  return response.json();
}

/**
 * Creates or updates job questions in bulk.
 */
export async function createJobQuestions(questions: QuestionPayload[]): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/jobs/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error((errorData as { error?: string }).error || 'Failed to save questions');
  }
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

/**
 * Fetches all questions for a job.
 */
export async function getJobQuestions(jobId: string): Promise<Question[]> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/questions`);
  if (!response.ok) throw new Error('Failed to fetch questions');
  return response.json();
}

/**
 * Deletes a question by id.
 */
export async function deleteQuestion(questionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete question');
}

/**
 * Fetches all jobs for the given user.
 */
export async function getJobs(userId: string): Promise<Job[]> {
  const response = await fetch(`${API_BASE_URL}/jobs?userId=${userId}`);
  if (!response.ok) throw new Error('Failed to fetch jobs');
  return response.json();
}

/**
 * Fetches evaluation templates for an organization.
 */
export async function getEvaluationTemplates(orgId: string): Promise<EvaluationTemplate[]> {
  const response = await fetch(`${API_BASE_URL}/organizations/${orgId}/evaluation-templates`);
  if (!response.ok) throw new Error('Failed to fetch evaluation templates');
  return response.json();
}

/**
 * Creates a new evaluation template.
 */
export async function createEvaluationTemplate(
  orgId: string,
  data: CreateEvaluationTemplatePayload & Record<string, unknown>
): Promise<EvaluationTemplate> {
  const response = await fetch(`${API_BASE_URL}/evaluation-templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, organizationId: orgId }),
  });
  if (!response.ok) throw new Error('Failed to create evaluation template');
  return response.json();
}

/**
 * Updates an evaluation template.
 */
export async function updateEvaluationTemplate(
  orgId: string,
  templateId: string,
  data: Partial<EvaluationTemplate> & Record<string, unknown>
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/evaluation-templates/${templateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, organizationId: orgId }),
  });
  if (!response.ok) throw new Error('Failed to update evaluation template');
}

/**
 * Deletes an evaluation template.
 */
export async function deleteEvaluationTemplate(orgId: string, templateId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/evaluation-templates/${templateId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId: orgId }),
  });
  if (!response.ok) throw new Error('Failed to delete evaluation template');
}

/**
 * Fetches all invitations for the given user.
 */
export async function getInvitations(userId: string): Promise<Invitation[]> {
  const response = await fetch(`${API_BASE_URL}/invitations?userId=${userId}`);
  if (!response.ok) throw new Error('Failed to fetch invitations');
  return response.json();
}

/**
 * Uploads a CV file for a candidate (multipart/form-data).
 */
export async function uploadCv(formData: FormData): Promise<UploadCvResponse> {
  const response = await fetch(`${API_BASE_URL}/candidates/upload-cv`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error((errorData as { error?: string }).error || 'Failed to upload CV');
  }
  return response.json();
}

/**
 * Validates an invitation token and returns validation result and candidate context.
 */
export async function validateInvitation(token: string): Promise<import('@/types').ValidateInvitationResponse> {
  const response = await fetch(`${API_BASE_URL}/invitations/validate/${token}`);
  if (!response.ok) {
    if (response.status === 404) return { valid: false, message: 'Invitation not found' };
    throw new Error('Failed to validate invitation');
  }
  return response.json();
}

/**
 * Creates a new exam session when the candidate enters the interview.
 */
export async function startExamSession(
  candidateId: string,
  payload: { jobId: string; invitationId: string }
): Promise<StartSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/start-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to start exam session');
  return response.json();
}

/**
 * Submits candidate answers for evaluation (interview completion) and logs cheat events.
 */
export async function submitCandidateAnswers(
  candidateId: string,
  payload: SubmitAssessmentPayload
): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to submit answers');
  return response.json();
}

/**
 * Fetches candidates for an organization (dashboard list).
 */
export async function getCandidates(orgId: string): Promise<Candidate[]> {
  const response = await fetch(`${API_BASE_URL}/organizations/${orgId}/candidates`);
  if (!response.ok) throw new Error('Failed to fetch candidates');
  return response.json();
}

/**
 * Applies accept/reject decision for a candidate.
 * @param candidateId - The candidate ID
 * @param decision - Explicit decision: 'accepted' or 'rejected'
 */
export async function decideCandidate(
  candidateId: string,
  decision: 'accepted' | 'rejected'
): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/decide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision }),
  });
  if (!response.ok) throw new Error('Decision failed');
  return response.json();
}

/**
 * Updates a job by id. Pass organizationId + userId for audit logging.
 */
export async function updateJob(
  jobId: string,
  data: UpdateJobPayload,
  context?: { organizationId?: string; userId?: string }
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, ...context }),
  });
  if (!response.ok) throw new Error('Failed to update job');
}

/**
 * Deletes a job by id. Pass organizationId + userId for audit logging.
 */
export async function deleteJob(
  jobId: string,
  context?: { organizationId?: string; recruiterId?: string }
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...context }),
  });
  if (!response.ok) throw new Error('Failed to delete job');
}

/**
 * Updates a question by id.
 */
export async function updateQuestion(
  questionId: string,
  data: { questionText: string; sampleAnswer: string; keywords: string[]; type: string }
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update question');
}

/**
 * Fetches audit logs for an organization.
 */
export async function getAuditLogs(orgId: string): Promise<import('@/types').AuditLog[]> {
  const response = await fetch(`${API_BASE_URL}/organizations/${orgId}/audit-logs`);
  if (!response.ok) throw new Error('Failed to fetch audit logs');
  return response.json();
}

/**
 * Fetches the presigned URL to reveal the candidate's original CV (PII data).
 */
export async function revealCandidate(candidateId: string): Promise<{ url: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/reveal`);
  if (!response.ok) throw new Error('Failed to reveal candidate');
  return response.json();
}

/**
 * Fetches the transcript for a candidate.
 */
export async function getTranscript(candidateId: string): Promise<import('@/types').TranscriptResponse> {
  const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/transcript`);
  if (!response.ok) throw new Error('Failed to fetch transcript');
  return response.json();
}

/** Central API object — all functions are also exported individually above. */
export const API = {
  getOrganization,
  createOrganization,
  updateOrganization,
  createInvitation,
  createJob,
  createJobQuestions,
  getJobQuestions,
  deleteQuestion,
  getJobs,
  evaluationTemplates: {
    get: getEvaluationTemplates,
    create: createEvaluationTemplate,
    update: updateEvaluationTemplate,
    delete: deleteEvaluationTemplate,
  },
  getEvaluationTemplates,
  createEvaluationTemplate,
  updateEvaluationTemplate,
  deleteEvaluationTemplate,
  getInvitations,
  uploadCv,
  validateInvitation,
  startExamSession,
  submitCandidateAnswers,
  getCandidates,
  decideCandidate,
  updateJob,
  deleteJob,
  updateQuestion,
  getAuditLogs,
  revealCandidate,
  getTranscript,
};

