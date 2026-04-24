/**
 * @fileoverview Organization/workspace types used by dashboard and onboarding.
 */

/**
 * Organization (tenant) associated with the authenticated user.
 */
export interface Organization {
  id: string;
  name: string;
  industry?: string;
  size?: string;
}

/** Payload for creating a new organization. */
export interface CreateOrganizationPayload {
  name: string;
  industry: string;
  size: string;
  userEmail: string;
  userId: string;
}

/** Payload for updating organization (industry, size). */
export interface UpdateOrganizationPayload {
  industry: string;
  size: string;
}
