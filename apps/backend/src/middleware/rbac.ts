import { Request, Response, NextFunction } from "express";
import { UserRole } from "@sentio/shared";

/**
 * Middleware to check if the authenticated user has one of the required roles.
 * Note: This should be used AFTER requireAuth middleware.
 */
export function requireRole(roles: UserRole[]) {
  return (req: any, res: any, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Missing user role context" });
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
}

export const requireAdmin = requireRole(["admin"]);
export const requirePresenter = requireRole(["admin", "presenter"]);
export const requireParticipant = requireRole([
  "admin",
  "presenter",
  "participant",
]);
