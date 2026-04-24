/**
 * @fileoverview Hook for job list, create, update, delete, and evaluation templates.
 * Used by the Jobs dashboard view.
 */

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/lib/api';
import type { Job, ExtendedEvaluationTemplate } from '@/types';

export interface UseJobsOptions {
  userId: string | undefined;
}

export interface UseJobsResult {
  jobs: Job[];
  organization: { id: string; name: string } | null;
  evaluationTemplates: ExtendedEvaluationTemplate[];
  isLoading: boolean;
  isLoadingTemplates: boolean;
  refreshJobs: () => Promise<void>;
  createJob: (payload: {
    title: string;
    description: string;
    requiredSkills: string[];
    organizationId: string;
    recruiterId: string;
    evaluationTemplateId: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateJob: (jobId: string, payload: { title: string; description: string; requiredSkills: string[]; evaluationTemplateId?: string }) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
}

/**
 * Loads organization, jobs, and evaluation templates; exposes CRUD for jobs.
 */
export function useJobs({ userId }: UseJobsOptions): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [organization, setOrganization] = useState<{ id: string; name: string } | null>(null);
  const [evaluationTemplates, setEvaluationTemplates] = useState<ExtendedEvaluationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  const refreshJobs = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await API.getJobs(userId);
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs', err);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchTemplates = useCallback(async (orgId: string) => {
    setIsLoadingTemplates(true);
    try {
      const data = await API.getEvaluationTemplates(orgId);
      setEvaluationTemplates(data as ExtendedEvaluationTemplate[]);
    } catch (err) {
      console.error('Failed to fetch evaluation templates', err);
      setEvaluationTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const org = await API.getOrganization(userId);
        if (cancelled) return;
        if (org?.id) {
          setOrganization({ id: org.id, name: org.name });
          await Promise.all([fetchTemplates(org.id), refreshJobs()]);
        } else {
          await refreshJobs();
        }
      } catch (error) {
        if (!cancelled) console.error('Failed to fetch organization', error);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, fetchTemplates, refreshJobs]);

  const createJob = useCallback(
    async (payload: {
      title: string;
      description: string;
      requiredSkills: string[];
      organizationId: string;
      recruiterId: string;
      evaluationTemplateId: string;
    }) => {
      try {
        await API.createJob(payload);
        await refreshJobs();
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create job.';
        return { success: false, error: message };
      }
    },
    [refreshJobs]
  );

  const updateJob = useCallback(
    async (jobId: string, payload: { title: string; description: string; requiredSkills: string[]; evaluationTemplateId?: string }) => {
      try {
        await API.updateJob(jobId, payload);
        await refreshJobs();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update job.';
        console.error('updateJob failed:', message);
        throw err;
      }
    },
    [refreshJobs]
  );

  const deleteJob = useCallback(
    async (jobId: string) => {
      try {
        await API.deleteJob(jobId);
        await refreshJobs();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to delete job.';
        console.error('deleteJob failed:', message);
        throw err;
      }
    },
    [refreshJobs]
  );

  return {
    jobs,
    organization,
    evaluationTemplates,
    isLoading,
    isLoadingTemplates,
    refreshJobs,
    createJob,
    updateJob,
    deleteJob,
  };
}
