/**
 * @fileoverview Audit log types for the audit & statistics view.
 */

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
}
