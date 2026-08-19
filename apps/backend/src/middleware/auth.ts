import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sentio-dev-secret";

export interface AuthPayload {
  sub: string;
  role: string;
  id?: string;
}

/**
 * Verifies the Bearer token from the Authorization header.
 * On success, attaches `req.user` with { sub, role, id }.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    payload.id = payload.sub;
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * Requires an authenticated user with role === "admin".
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  requireAuth(req, res, async () => {
    const userRole = (req as any).user?.role;
    if (userRole !== "admin") {
      res
        .status(403)
        .json({ message: "Access denied. Administrator privileges required." });
      return;
    }

    // Check if user is blocked
    try {
      const User = (await import("../models/User")).default;
      const user = await User.findById((req as any).user.id).select(
        "isBlocked",
      );
      if (user?.isBlocked) {
        res
          .status(403)
          .json({ message: "Account is blocked. Contact support." });
        return;
      }
    } catch (e) {
      // Continue if DB check fails
    }

    next();
  });
}

/**
 * Requires an authenticated user with verified email (admins bypass).
 */
export async function requireVerifiedEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  requireAuth(req, res, async () => {
    const userRole = (req as any).user?.role;
    if (userRole === "admin") {
      return next();
    }

    try {
      const User = (await import("../models/User")).default;
      const user = await User.findById((req as any).user.id).select(
        "isEmailVerified",
      );
      if (user && !user.isEmailVerified) {
        res.status(403).json({
          message: "Please verify your email address to access this feature.",
          isEmailVerified: false,
        });
        return;
      }
    } catch {
      // Continue if DB check fails
    }

    next();
  });
}
