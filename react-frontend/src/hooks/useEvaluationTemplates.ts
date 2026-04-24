/**
 * @fileoverview Hook for evaluation templates (marking criteria): list, create, update, delete.
 */

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/lib/api';
import type { ExtendedEvaluationTemplate } from '@/types';

export interface UseEvaluationTemplatesOptions {
  userId: string | undefined;
}

export interface UseEvaluationTemplatesResult {
  templates: ExtendedEvaluationTemplate[];
  orgId: string;
  isLoading: boolean;
  refresh: () => Promise<void>;
  createTemplate: (payload: {
    name: string;
    description?: string;
    type?: string;
    prompt_template?: string;
    criteria?: string[];
  }) => Promise<void>;
  updateTemplate: (
    templateId: string,
    payload: Partial<ExtendedEvaluationTemplate> & { criteria?: string[] }
  ) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
}

/**
 * Loads organization and evaluation templates; exposes CRUD for templates.
 */
export function useEvaluationTemplates({
  userId,
}: UseEvaluationTemplatesOptions): UseEvaluationTemplatesResult {
  const [templates, setTemplates] = useState<ExtendedEvaluationTemplate[]>([]);
  const [orgId, setOrgId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = useCallback(async (organizationId: string) => {
    try {
      const data = (await API.getEvaluationTemplates(organizationId)) as ExtendedEvaluationTemplate[];
      
      // Backend already returns data sorted by created_at.desc
      // We pin system templates to the top while preserving the latest-to-oldest order for both system and user templates.
      const systemTemplates = data.filter((t) => t.is_system_template);
      const userTemplates = data.filter((t) => !t.is_system_template);
      
      setTemplates([...systemTemplates, ...userTemplates]);
    } catch (err) {
      console.error('Error fetching templates', err);
      setTemplates([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    await fetchTemplates(orgId);
  }, [orgId, fetchTemplates]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const org = await API.getOrganization(userId);
        if (cancelled) return;
        if (org?.id) {
          setOrgId(org.id);
          await fetchTemplates(org.id);
        }
      } catch (err) {
        if (!cancelled) console.error('Error loading organization', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, fetchTemplates]);

  const createTemplate = useCallback(
    async (payload: {
      name: string;
      description?: string;
      type?: string;
      prompt_template?: string;
      criteria?: string[];
    }) => {
      if (!orgId) return;
      await API.createEvaluationTemplate(orgId, {
        name: payload.name,
        description: payload.description,
        type: payload.type ?? 'QUESTIONNAIRE',
        prompt_template: payload.prompt_template ?? '',
        criteria: payload.criteria ?? [],
      } as import('@/types').CreateEvaluationTemplatePayload & Record<string, unknown>);
      await fetchTemplates(orgId);
    },
    [orgId, fetchTemplates]
  );

  const updateTemplate = useCallback(
    async (templateId: string, payload: Partial<ExtendedEvaluationTemplate>) => {
      if (!orgId) return;
      await API.updateEvaluationTemplate(orgId, templateId, payload as Record<string, unknown>);
      await fetchTemplates(orgId);
    },
    [orgId, fetchTemplates]
  );

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      if (!orgId) return;
      await API.deleteEvaluationTemplate(orgId, templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    },
    [orgId]
  );

  return {
    templates,
    orgId,
    isLoading,
    refresh,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
