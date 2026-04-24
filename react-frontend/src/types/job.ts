/**
 * @fileoverview Job/role types for job management and creation flows.
 */

/**
 * Job posting or role definition within an organization.
 */
export interface Job {
  id?: string;
  title: string;
  description: string;
  requiredSkills: string[];
  organizationId: string;
  evaluationTemplateId?: string;
}

/** Payload for creating a new job (no id). */
export type CreateJobPayload = Omit<Job, 'id'>;

/** Payload for updating an existing job (partial). */
export interface UpdateJobPayload {
  title?: string;
  description?: string;
  requiredSkills?: string[];
  evaluationTemplateId?: string;
}
