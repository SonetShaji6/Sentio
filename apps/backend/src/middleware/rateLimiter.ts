import rateLimit from "express-rate-limit";

// Limit login/register attempts to prevent brute force attacks
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many authentication requests from this IP, please try again after 15 minutes",
  },
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many password reset requests from this IP, please try again after an hour",
  },
});

export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 AI generations per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "AI generation request limit reached. Please wait a few minutes before requesting more AI content.",
  },
});

export const fileUploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25, // 25 file uploads per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "File upload rate limit reached. Please wait before uploading more files.",
  },
});

export const sessionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 session operations per 15 min
  standardHeaders: true,
  legacyHeaders: false,
});
