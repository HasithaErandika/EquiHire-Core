/**
 * @fileoverview Hook for job list, question list by job, add/delete questions.
 * Used by the Questions dashboard view.
 */

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/lib/api';
import type { Job, Question } from '@/types';

/** Job with optional organizationId for question creation. */
export type JobWithOrg = Job & { organizationId?: string };

export interface UseQuestionsOptions {
  userId: string | undefined;
}

export interface UseQuestionsResult {
  jobs: JobWithOrg[];
  selectedJobId: string;
  setSelectedJobId: (id: string) => void;
  questions: Question[];
  questionCounts: Record<string, number>;
  isLoading: boolean;
  addQuestion: (params: {
    jobId: string;
    organizationId: string | undefined;
    questionText: string;
    sampleAnswer: string;
    keywords: string[];
    questionType: string;
    sortOrder: number;
  }) => Promise<{ success: boolean; error?: string }>;
  updateQuestion: (questionId: string, params: {
    questionText: string;
    sampleAnswer: string;
    keywords: string[];
    questionType: string;
  }) => Promise<{ success: boolean; error?: string }>;
  deleteQuestion: (questionId: string) => Promise<void>;
  refreshQuestions: (jobId: string) => Promise<void>;
}

/**
 * Loads jobs and questions for the selected job; exposes add/delete and question counts.
 */
export function useQuestions({ userId }: UseQuestionsOptions): UseQuestionsResult {
  const [jobs, setJobs] = useState<JobWithOrg[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuestions = useCallback(async (jobId: string) => {
    setIsLoading(true);
    try {
      const data = await API.getJobQuestions(jobId);
      setQuestions(data);
      setQuestionCounts((prev) => ({ ...prev, [jobId]: data.length }));
    } catch (err) {
      console.error('Failed to load questions', err);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    API.getJobs(userId)
      .then(async (data) => {
        setJobs(data as JobWithOrg[]);
        // Fetch all question counts in parallel instead of sequentially
        const jobsWithId = data.filter((job: Job) => job.id);
        const counts = await Promise.all(
          jobsWithId.map((job: Job) =>
            API.getJobQuestions(job.id as string)
              .then((qs: Question[]) => ({ id: job.id as string, count: qs.length }))
              .catch(() => ({ id: job.id as string, count: 0 }))
          )
        );
        setQuestionCounts(
          counts.reduce<Record<string, number>>((acc, { id, count }) => {
            acc[id] = count;
            return acc;
          }, {})
        );
      })
      .catch((err) => {
        console.error('Failed to load jobs', err);
        setJobs([]);
      });
  }, [userId]);

  useEffect(() => {
    if (selectedJobId) fetchQuestions(selectedJobId);
    else setQuestions([]);
  }, [selectedJobId, fetchQuestions]);

  const addQuestion = useCallback(
    async (params: {
      jobId: string;
      organizationId: string | undefined;
      questionText: string;
      sampleAnswer: string;
      keywords: string[];
      questionType: string;
      sortOrder: number;
    }) => {
      try {
        await API.createJobQuestions([
          {
            jobId: params.jobId,
            questionText: params.questionText,
            sampleAnswer: params.sampleAnswer,
            keywords: params.keywords,
            type: params.questionType as import('@/types').QuestionType,
          },
        ] as unknown as import('@/types').QuestionPayload[]);
        await fetchQuestions(params.jobId);
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to add question.';
        return { success: false, error: message };
      }
    },
    [fetchQuestions]
  );

  const updateQuestion = useCallback(
    async (
      questionId: string,
      params: {
        questionText: string;
        sampleAnswer: string;
        keywords: string[];
        questionType: string;
      }
    ) => {
      try {
        await API.updateQuestion(questionId, {
          questionText: params.questionText,
          sampleAnswer: params.sampleAnswer,
          keywords: params.keywords,
          type: params.questionType,
        });
        if (selectedJobId) await fetchQuestions(selectedJobId);
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update question.';
        return { success: false, error: message };
      }
    },
    [fetchQuestions, selectedJobId]
  );

  const deleteQuestion = useCallback(async (questionId: string) => {
    await API.deleteQuestion(questionId);
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    if (selectedJobId) {
      setQuestionCounts((prev) => ({
        ...prev,
        [selectedJobId]: Math.max(0, (prev[selectedJobId] ?? 0) - 1),
      }));
    }
  }, [selectedJobId]);

  const refreshQuestions = useCallback(
    (jobId: string) => fetchQuestions(jobId),
    [fetchQuestions]
  );

  return {
    jobs,
    selectedJobId,
    setSelectedJobId,
    questions,
    questionCounts,
    isLoading,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    refreshQuestions,
  };
}
