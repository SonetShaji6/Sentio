import AuditLog from "../models/AuditLog";

export const AUDIT_ACTIONS = {
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_REGISTER: "USER_REGISTER",
  PASSWORD_RESET: "PASSWORD_RESET",
  PRESENTATION_CREATE: "PRESENTATION_CREATE",
  PRESENTATION_DELETE: "PRESENTATION_DELETE",
  SESSION_START: "SESSION_START",
  SESSION_END: "SESSION_END",
  REPORT_GENERATE: "REPORT_GENERATE",
  ADMIN_ACTION: "ADMIN_ACTION",
} as const;

export type AuditActionType =
  (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | string;

export interface AuditLogOptions {
  user: string;
  action: AuditActionType;
  target?: string;
  details?: any;
  ip?: string;
}

/**
 * Asynchronously records an audit event without blocking execution.
 */
export function logAuditEvent(options: AuditLogOptions): void {
  // Sanitize details to avoid logging passwords/tokens
  const safeDetails = options.details
    ? JSON.parse(JSON.stringify(options.details))
    : undefined;
  if (safeDetails) {
    delete safeDetails.password;
    delete safeDetails.token;
    delete safeDetails.refreshToken;
    delete safeDetails.apiKey;
  }

  AuditLog.create({
    user: options.user,
    action: options.action,
    target: options.target,
    details: safeDetails,
    ip: options.ip,
  }).catch((err) => {
    console.warn("[AuditLogger] Failed to write audit log:", err);
  });
}
