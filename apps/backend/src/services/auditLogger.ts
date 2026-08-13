import AuditLog from "../models/AuditLog";

export interface AuditLogOptions {
  user: string;
  action: string;
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
