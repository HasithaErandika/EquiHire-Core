/**
 * @fileoverview Hook for loading and updating the current user's organization.
 * Used by App (hasOrg check), Dashboard (header + settings), and onboarding.
 */

import { useState, useEffect, useCallback } from 'react';
import * as API from '@/lib/api';
import type { Organization, UpdateOrganizationPayload } from '@/types';

export interface UseOrganizationOptions {
  /** Authenticated user id (e.g. state.sub). When undefined, no fetch runs. */
  userId: string | undefined;
}

export interface UseOrganizationResult {
  /** Current organization or null if not loaded / user has none. */
  organization: Organization | null;
  /** True while the initial organization check is in progress. */
  isLoading: boolean;
  /** Refetch organization (e.g. after update). */
  refresh: () => Promise<void>;
  /** Update organization (industry, size). Calls API then refreshes. */
  updateOrganization: (payload: UpdateOrganizationPayload) => Promise<boolean>;
}

/**
 * Loads the organization for the given user and exposes refresh and update helpers.
 */
export function useOrganization({ userId }: UseOrganizationOptions): UseOrganizationResult {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await API.getOrganization(userId);
      setOrganization(data ?? null);
    } catch (error) {
      console.error('Failed to fetch organization', error);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setOrganization(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const data = await API.getOrganization(userId);
        if (cancelled) return;
        setOrganization(data ?? null);
      } catch (error) {
        if (!cancelled) console.error('Failed to fetch organization', error);
        setOrganization(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const updateOrganization = useCallback(
    async (payload: UpdateOrganizationPayload): Promise<boolean> => {
      if (!organization?.id || !userId) return false;
      try {
        const response = await API.updateOrganization(organization.id, payload);
        if (response.ok) {
          setOrganization((prev) => (prev ? { ...prev, ...payload } : null));
          return true;
        }
      } catch (e) {
        console.error('Error updating organization', e);
      }
      return false;
    },
    [organization?.id, userId]
  );

  return { organization, isLoading, refresh, updateOrganization };
}
