/**
 * @fileoverview Invitation types for candidate magic-link invites.
 */

/** Invitation delivery status. */
export type InvitationStatus = 'pending' | 'completed' | 'expired';

/**
 * Candidate invitation record (magic link sent for an interview).
 */
export interface Invitation {
  id?: string;
  candidateName?: string;
  candidate_name?: string;
  candidateEmail?: string;
  candidate_email?: string;
  email?: string;
  jobId: string;
  jobTitle?: string;
  job_title?: string;
  organizationId: string;
  status: InvitationStatus;
  createdAt?: string;
  created_at?: string;
}

/** Payload for creating an invitation (no id, status set by backend). */
export type CreateInvitationPayload = Omit<Invitation, 'id' | 'status'>;
