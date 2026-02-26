const API_BASE_url = "http://localhost:9092/api";

export const API = {
    getOrganization: async (userId: string) => {
        const response = await fetch(`${API_BASE_url}/me/organization?userId=${userId}`);
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error("Failed to fetch organization");
        }
        return response.json();
    },

    createOrganization: async (data: { name: string; industry: string; size: string; userEmail: string; userId: string }) => {
        const response = await fetch(`${API_BASE_url}/organizations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error("Failed to create organization");
        }
        return response;
    },

    updateOrganization: async (orgId: string, data: { industry: string; size: string; }, userId: string) => {
        const response = await fetch(`${API_BASE_url}/organization?userId=${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, id: orgId }),
        });
        if (!response.ok) throw new Error("Failed to update organization");
        return response;
    },

    createInvitation: async (data: any) => {
        const response = await fetch(`${API_BASE_url}/invitations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to send invitation");
        return response.json();
    },

    // Job Management
    createJob: async (data: any) => {
        const response = await fetch(`${API_BASE_url}/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to create job");
        return response.json();
    },


    createJobQuestions: async (questions: any[]) => {

        const response = await fetch(`${API_BASE_url}/jobs/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to save questions");
        }

        const text = await response.text();
        return text ? JSON.parse(text) : {};
    },

    getJobQuestions: async (jobId: string) => {
        const response = await fetch(`${API_BASE_url}/jobs/${jobId}/questions`);
        if (!response.ok) throw new Error("Failed to fetch questions");
        return response.json();
    },

    deleteQuestion: async (questionId: string) => {
        const response = await fetch(`${API_BASE_url}/questions/${questionId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error("Failed to delete question");
        return response;
    },

    getJobs: async (userId: string) => {
        const response = await fetch(`${API_BASE_url}/jobs?userId=${userId}`);
        if (!response.ok) throw new Error("Failed to fetch jobs");
        return response.json();
    },

    getEvaluationTemplates: async (orgId: string) => {
        const response = await fetch(`${API_BASE_url}/organizations/${orgId}/evaluation-templates`);
        if (!response.ok) throw new Error("Failed to fetch evaluation templates");
        return response.json();
    },

    createEvaluationTemplate: async (orgId: string, data: any) => {
        const response = await fetch(`${API_BASE_url}/evaluation-templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, organization_id: orgId }),
        });
        if (!response.ok) throw new Error("Failed to create evaluation template");
        return response.json();
    },

    updateEvaluationTemplate: async (orgId: string, templateId: string, data: any) => {
        const response = await fetch(`${API_BASE_url}/evaluation-templates/${templateId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, organization_id: orgId }),
        });
        if (!response.ok) throw new Error("Failed to update evaluation template");
        return response;
    },

    deleteEvaluationTemplate: async (orgId: string, templateId: string) => {
        const response = await fetch(`${API_BASE_url}/evaluation-templates/${templateId}?organizationId=${orgId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error("Failed to delete evaluation template");
        return response;
    },

    getInvitations: async (userId: string) => {
        const response = await fetch(`${API_BASE_url}/invitations?userId=${userId}`);
        if (!response.ok) throw new Error("Failed to fetch invitations");
        return response.json();
    },

    // Candidate Upload
    getUploadUrl: async () => {
        const response = await fetch(`${API_BASE_url}/candidates/upload-url`);
        if (!response.ok) throw new Error("Failed to get upload URL");
        return response.json();
    },

    completeUpload: async (data: { candidateId: string; objectKey: string; jobId: string }) => {
        const response = await fetch(`${API_BASE_url}/candidates/complete-upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to complete upload");
        return response;
    },

    // Interview Invitation & Questions flow
    validateInvitation: async (token: string) => {
        const response = await fetch(`${API_BASE_url}/invitations/validate/${token}`);
        if (!response.ok) {
            if (response.status === 404) {
                return { valid: false, message: "Invitation not found" };
            }
            throw new Error("Failed to validate invitation");
        }
        return response.json();
    },

    submitCandidateAnswers: async (candidateId: string, jobId: string, answers: any[]) => {
        // POST /api/candidates/${candidateId}/evaluate (or something similar)
        const response = await fetch(`${API_BASE_url}/candidates/${candidateId}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId, answers }),
        });
        if (!response.ok) throw new Error("Failed to submit answers");
        return response.json();
    },

    // Candidates
    getCandidates: async (orgId: string) => {
        const response = await fetch(`${API_BASE_url}/organizations/${orgId}/candidates`);
        if (!response.ok) throw new Error("Failed to fetch candidates");
        return response.json();
    },

    decideCandidate: async (candidateId: string, threshold: number) => {
        const response = await fetch(`${API_BASE_url}/candidates/${candidateId}/decide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threshold }),
        });
        if (!response.ok) throw new Error("Decision failed");
        return response.json();
    },

    // Job Management
    updateJob: async (jobId: string, data: { title: string; description: string; requiredSkills: string[] }) => {
        const response = await fetch(`${API_BASE_url}/jobs/${jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update job");
        return response;
    },

    deleteJob: async (jobId: string) => {
        const response = await fetch(`${API_BASE_url}/jobs/${jobId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error("Failed to delete job");
        return response;
    },

    // Question Management
    updateQuestion: async (questionId: string, data: { questionText: string; sampleAnswer: string; keywords: string[]; type: string }) => {
        const response = await fetch(`${API_BASE_url}/questions/${questionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update question");
        return response;
    },

    // Audit
    getAuditLogs: async (orgId: string) => {
        const response = await fetch(`${API_BASE_url}/organizations/${orgId}/audit-logs`);
        if (!response.ok) throw new Error("Failed to fetch audit logs");
        return response.json();
    },

    // Lockdown Cheat Flagging
    flagCheating: async (candidateId: string, organizationId: string, violations: Record<string, any>) => {
        const response = await fetch(`${API_BASE_url}/candidates/${candidateId}/flag-cheating`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ organizationId, violations }),
        });
        if (!response.ok) throw new Error("Failed to flag cheating");
        return response.json();
    },
};
