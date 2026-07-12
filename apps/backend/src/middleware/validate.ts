import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

/**
 * Runs express-validator checks and returns structured 422 errors.
 */
export function validate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      message: "Validation failed",
      errors: errors.array().map((e) => ({
        field: (e as any).path ?? (e as any).param ?? "unknown",
        message: e.msg,
      })),
    });
    return;
  }
  next();
}
