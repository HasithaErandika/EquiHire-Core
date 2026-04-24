/**
 * @fileoverview Interview question types for job questionnaires.
 */

/** Question type: paragraph (text response) or code (coding challenge). */
export type QuestionType = 'paragraph' | 'code';

/**
 * Interview question attached to a job.
 */
export interface Question {
  id: string;
  questionText: string;
  sampleAnswer: string;
  keywords: string[];
  type: QuestionType;
  jobId?: string;
}

/** Payload for creating/updating a question (partial). */
export type QuestionPayload = Partial<Question>;
