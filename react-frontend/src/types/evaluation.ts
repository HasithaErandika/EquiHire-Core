/**
 * @fileoverview Evaluation template types for marking criteria and job creation.
 */

/**
 * Base evaluation template from API.
 */
export interface EvaluationTemplate {
  id?: string;
  name: string;
  criteria: string[];
  organization_id: string;
}

/**
 * Extended template with UI/backend-only fields (description, prompt, system flag).
 */
export interface ExtendedEvaluationTemplate extends EvaluationTemplate {
  description?: string;
  type?: string;
  prompt_template?: string;
  is_system_template?: boolean;
}

/** Payload for creating a template (no id, organization_id set by client). */
export type CreateEvaluationTemplatePayload = Omit<EvaluationTemplate, 'id' | 'organization_id'>;
