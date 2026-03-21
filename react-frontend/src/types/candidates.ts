/**
 * @fileoverview Candidate-related types for the hiring pipeline.
 * Used by dashboard candidate list, detail panel, and decision flows.
 */

/** Pipeline status for a candidate in the hiring process */
export type CandidateStatus = 'pending' | 'accepted' | 'rejected' | 'scheduled' | 'screening' | 'shortlisted' | 'applied';

/**
 * Extended candidate shape returned by the dashboard candidates API.
 * Includes scores, anonymization state, and optional AI/context fields.
 */
export interface ExtendedCandidate {
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  score: number;
  status: CandidateStatus;
  /** Whether the recruiter has viewed this candidate (affects "unseen" filter) */
  seen: boolean;
  appliedDate: string;
  /** Number of answers flagged as irrelevant/gibberish (HF relevance check) */
  hfRelevanceSkipped: number;
  experienceLevel?: string;
  detectedStack?: string[];
  cvScore?: number;
  skillsScore?: number;
  interviewScore?: number;
  cvText?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  education?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workExperience?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projects?: any;
  summaryFeedback?: string;
  cheatEventCount?: number;
  cheatEventTypes?: string[];
}

/** Filter for activity: all, only seen, or only unseen */
export type ActivityFilter = 'all' | 'seen' | 'unseen';

/** Filter for pipeline status; "all" means no status filter */
export type StatusFilter = 'all' | CandidateStatus;
