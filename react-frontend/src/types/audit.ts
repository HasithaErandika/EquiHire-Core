/**
 * @fileoverview Audit log types for the audit & statistics view.
 */

/**
 * Category of the audit log event.
 * Used for rich tabbed audit view and notification filtering.
 */
export type AuditLogCategory =
  | 'AI_GEMINI'
  | 'AI_HUGGINGFACE'
  | 'EMAIL'
  | 'HIRING'
  | 'SECURITY'
  | 'SYSTEM'
  | 'CANDIDATE'
  | 'VIOLATION';

/**
 * Severity level for the audit event.
 */
export type AuditLogSeverity = 'INFO' | 'WARN' | 'CRITICAL';

/**
 * Single audit log entry (action performed in the system).
 */
export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  created_at: string;
  /** Optional category for rich audit filtering */
  action_category?: AuditLogCategory;
  /** Optional severity for notification prioritisation */
  severity?: AuditLogSeverity;
  /** Optional metadata blob (JSON string or object) for AI events, email events, etc. */
  metadata?: string | Record<string, unknown>;
}

/**
 * Derive the display category of a log entry from its action string.
 * Used client-side when the backend does not populate action_category.
 */
export function deriveCategory(action: string): AuditLogCategory {
  const a = action.toLowerCase();
  if (a.includes('gemini') || a.includes('cv_parse') || a.includes('score') || a.includes('grading') || a.includes('ai_call')) return 'AI_GEMINI';
  if (a.includes('huggingface') || a.includes('hf_') || a.includes('relevance')) return 'AI_HUGGINGFACE';
  if (a.includes('email') || a.includes('send') || a.includes('notify') || a.includes('invite')) return 'EMAIL';
  if (a.includes('accept') || a.includes('reject') || a.includes('decision') || a.includes('hiring')) return 'HIRING';
  if (a.includes('flag') || a.includes('cheat') || a.includes('violation') || a.includes('lockdown')) return 'VIOLATION';
  if (a.includes('login') || a.includes('auth') || a.includes('token') || a.includes('jwt')) return 'SECURITY';
  if (a.includes('candidate') || a.includes('session') || a.includes('submit') || a.includes('upload')) return 'CANDIDATE';
  return 'SYSTEM';
}

/**
 * Determine whether a log is a "special" notification-worthy event.
 */
export function isNotificationWorthy(log: AuditLog): boolean {
  const category = log.action_category ?? deriveCategory(log.action);
  return (
    category === 'HIRING' ||
    category === 'VIOLATION' ||
    (category === 'CANDIDATE' && (log.action.toLowerCase().includes('submit') || log.action.toLowerCase().includes('session_started'))) ||
    log.severity === 'WARN' ||
    log.severity === 'CRITICAL'
  );
}
