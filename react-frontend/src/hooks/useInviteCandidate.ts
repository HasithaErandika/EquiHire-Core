/**
 * @fileoverview Hook for the invite-candidate form: jobs list, send invitation, magic link result.
 */

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/lib/api';
import type { Job } from '@/types';

export interface UseInviteCandidateOptions {
  userId: string | undefined;
  organizationId: string | undefined;
}

/** Extended payload sent to backend (includes jobTitle, interviewDate, recruiterId). */
export interface SendInvitationParams {
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  interviewDate?: string;
}

export interface UseInviteCandidateResult {
  jobs: Job[];
  isSending: boolean;
  error: string;
  magicLink: string;
  sendInvitation: (params: SendInvitationParams) => Promise<boolean>;
  clearMagicLink: () => void;
  clearError: () => void;
}

/**
 * Provides jobs list and send-invitation action for the invite candidate form.
 */
export function useInviteCandidate({
  userId,
  organizationId,
}: UseInviteCandidateOptions): UseInviteCandidateResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [magicLink, setMagicLink] = useState('');

  useEffect(() => {
    if (!userId) return;
    API.getJobs(userId)
      .then(setJobs)
      .catch((err) => {
        console.error('Failed to load jobs', err);
        setJobs([]);
      });
  }, [userId]);

  const sendInvitation = useCallback(
    async (params: SendInvitationParams): Promise<boolean> => {
      setError('');
      setMagicLink('');
      if (!organizationId || !userId) {
        setError('Organization or recruiter information missing');
        return false;
      }
      setIsSending(true);
      try {
        const payload = {
          candidateEmail: params.candidateEmail,
          candidateName: params.candidateName,
          jobId: params.jobId,
          organizationId,
          jobTitle: params.jobTitle,
          interviewDate: params.interviewDate || null,
          recruiterId: userId,
        };
        const data = (await API.createInvitation(payload)) as { magicLink?: string };
        if (data.magicLink) setMagicLink(data.magicLink);
        return true;
      } catch (err) {
        console.error('Error sending invitation', err);
        setError('Failed to send invitation. Please try again.');
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [organizationId, userId]
  );

  const clearMagicLink = useCallback(() => setMagicLink(''), []);
  const clearError = useCallback(() => setError(''), []);

  return {
    jobs,
    isSending,
    error,
    magicLink,
    sendInvitation,
    clearMagicLink,
    clearError,
  };
}
