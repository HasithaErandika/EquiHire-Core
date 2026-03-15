/**
 * @fileoverview Hook for fetching invitation history for the scheduler view.
 */

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/lib/api';
import type { Invitation } from '@/types';

export interface InvitationHistoryItem {
  id: string;
  email: string;
  role: string;
  time: string;
  status: string;
}

export interface UseInvitationsOptions {
  userId: string | undefined;
}

export interface UseInvitationsResult {
  /** Mapped list for UI (email, role, time, status). */
  history: InvitationHistoryItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Fetches invitations for the user and maps them to a simple history shape for the scheduler sidebar.
 */
export function useInvitations({ userId }: UseInvitationsOptions): UseInvitationsResult {
  const [history, setHistory] = useState<InvitationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await API.getInvitations(userId);
      const formatted: InvitationHistoryItem[] = (data ?? []).map((record: Invitation) => ({
        id: record.id ?? '',
        email: record.candidate_email ?? record.candidateEmail ?? (record as any).email ?? '',
        role: record.job_title ?? record.jobTitle ?? record.jobId ?? 'Unknown Role',
        time: record.created_at ? new Date(record.created_at).toLocaleDateString() : 'Just now',
        status: record.status ?? 'pending',
      }));
      setHistory(formatted);
    } catch (err) {
      console.error('Failed to load invitation history', err);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      refresh();
    } else {
      setHistory([]);
      setIsLoading(false);
    }
  }, [userId, refresh]);

  return { history, isLoading, refresh };
}
