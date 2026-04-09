/**
 * @fileoverview Hook for candidate list data, filters, and actions.
 * Loads organization and candidates for the authenticated user and exposes
 * filtering, selection, and decision (accept/reject) logic.
 */

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/lib/api';
import type { ExtendedCandidate, ActivityFilter, StatusFilter } from '@/types';

export interface UseCandidatesOptions {
  /** Authenticated user id (e.g. from auth context state.sub) */
  userId: string | undefined;
}

export interface UseCandidatesResult {
  /** All candidates for the org (before filters) */
  candidates: ExtendedCandidate[];
  /** Candidates filtered by status and activity (seen/unseen) */
  filteredCandidates: ExtendedCandidate[];
  /** Currently selected candidate for the detail panel */
  selectedCandidate: ExtendedCandidate | null;
  /** Current org id after load */
  orgId: string;
  /** Whether initial load or refresh is in progress */
  isLoading: boolean;
  /** Whether a decision (accept/reject) request is in progress */
  isProcessing: boolean;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  activityFilter: ActivityFilter;
  setActivityFilter: (v: ActivityFilter) => void;
  setSelectedCandidate: (c: ExtendedCandidate | null) => void;
  /** Mark a candidate as seen and optionally open detail panel */
  handleViewDetails: (candidate: ExtendedCandidate) => void;
  /** Accept candidate and send acceptance email */
  handleAcceptCandidate: (candidateId: string) => Promise<void>;
  /** Reject candidate and send rejection email with scores */
  handleRejectCandidate: (candidateId: string) => Promise<void>;
  /** Apply accept/reject decision and refresh list */
  handleApplyDecision: (candidateId: string) => Promise<void>;
  /** Refetch candidates (e.g. after decision) */
  refreshCandidates: () => Promise<void>;
}

/**
 * Fetches and filters candidates for the current organization, and provides
 * handlers for viewing details and applying accept/reject decisions.
 */
export function useCandidates({ userId }: UseCandidatesOptions): UseCandidatesResult {
  const [candidates, setCandidates] = useState<ExtendedCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<ExtendedCandidate | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [orgId, setOrgId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCandidates = useCallback(async (organizationId: string) => {
    setIsLoading(true);
    try {
      const data = (await API.getCandidates(organizationId)) as unknown as ExtendedCandidate[];
      setCandidates(data);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCandidates = useCallback(async () => {
    if (orgId) await fetchCandidates(orgId);
  }, [orgId, fetchCandidates]);

  const loadData = useCallback(
    async (uid: string) => {
      try {
        const org = await API.getOrganization(uid);
        if (org?.id) {
          setOrgId(org.id);
          await fetchCandidates(org.id);
        }
      } catch (error) {
        console.error('Failed to load organization:', error);
        setIsLoading(false);
      }
    },
    [fetchCandidates]
  );

  useEffect(() => {
    if (userId) loadData(userId);
  }, [userId, loadData]);

  const mappedCandidates = candidates;

  // Sort: newest application first. Use createdAt or appliedDate as tie-breaker.
  const sortedCandidates = [...mappedCandidates].sort((a, b) => {
    const dateA = new Date(a.createdAt ?? a.appliedDate ?? 0).getTime();
    const dateB = new Date(b.createdAt ?? b.appliedDate ?? 0).getTime();
    return dateB - dateA;
  });

  const filteredCandidates = sortedCandidates.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    // 'new' activity = applied status, not yet opened in this session
    const matchesActivity =
      activityFilter === 'all' || (activityFilter === 'seen' ? c.seen : !c.seen);
    return matchesStatus && matchesActivity;
  });


  const activeSelectedCandidate = selectedCandidate
    ? filteredCandidates.find(c => c.candidateId === selectedCandidate.candidateId) || selectedCandidate
    : null;

  const markAsSeen = useCallback((candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.candidateId === candidateId ? { ...c, seen: true } : c))
    );
  }, []);

  const handleViewDetails = useCallback(
    (candidate: ExtendedCandidate) => {
      markAsSeen(candidate.candidateId);
      setSelectedCandidate(candidate);
    },
    [markAsSeen]
  );

  const handleApplyDecision = useCallback(
    async (candidateId: string) => {
      setIsProcessing(true);
      try {
        await API.decideCandidate(candidateId, 'accepted'); // Default to accepted if called directly from generic handler
        await fetchCandidates(orgId);

        // Refresh the selected candidate to show revealed PII
        const updatedCandidates = await API.getCandidates(orgId) as unknown as ExtendedCandidate[];
        const updated = updatedCandidates.find(c => c.candidateId === candidateId);
        if (updated) setSelectedCandidate(updated);
      } catch (error) {
        console.error('Decision failed:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [orgId, fetchCandidates]
  );

  const handleAcceptCandidate = useCallback(
    async (candidateId: string) => {
      setIsProcessing(true);
      try {
        // Backend handles acceptance email in the decide endpoint
        const res = await API.decideCandidate(candidateId, 'accepted');

        // Refresh candidates list and selected candidate details
        await fetchCandidates(orgId);
        const updatedCandidates = await API.getCandidates(orgId) as unknown as ExtendedCandidate[];
        const updated = updatedCandidates.find(c => c.candidateId === candidateId);
        if (updated) setSelectedCandidate(updated);

        return res as any;
      } catch (error) {
        console.error('Accept failed:', error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [orgId, fetchCandidates]
  );

  const handleRejectCandidate = useCallback(
    async (candidateId: string) => {
      setIsProcessing(true);
      try {
        // Backend handles rejection email with scores in the decide endpoint
        const res = await API.decideCandidate(candidateId, 'rejected');

        // Refresh candidates list and selected candidate details
        await fetchCandidates(orgId);
        const updatedCandidates = await API.getCandidates(orgId) as unknown as ExtendedCandidate[];
        const updated = updatedCandidates.find(c => c.candidateId === candidateId);
        if (updated) setSelectedCandidate(updated);

        return res as any;
      } catch (error) {
        console.error('Reject failed:', error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [orgId, fetchCandidates]
  );


  return {
    candidates,
    filteredCandidates,
    selectedCandidate: activeSelectedCandidate,
    orgId,
    isLoading,
    isProcessing,
    statusFilter,
    setStatusFilter,
    activityFilter,
    setActivityFilter,
    setSelectedCandidate,
    handleViewDetails,
    handleAcceptCandidate,
    handleRejectCandidate,
    handleApplyDecision,
    refreshCandidates,
  };
}
