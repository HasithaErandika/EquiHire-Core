

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

    validateInvitation: async (token: string) => {
        const response = await fetch(`${API_BASE_url}/invitations/validate/${token}`);
        if (!response.ok) throw new Error("Invalid or expired token");
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
        if (!response.ok) throw new Error("Failed to save questions");
        return response.json();
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
    }
};
