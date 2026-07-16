import { Router } from "express";
import { body } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import multer from "multer";
import { uploadAvatarToAzure } from "../services/azure";
import {
  authRateLimiter,
  passwordResetRateLimiter,
} from "../middleware/rateLimiter";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../services/email";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "sentio-dev-secret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "sentio-dev-refresh-secret";

// ── Helper: generate token pair ──
function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ sub: userId, role }, JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
}

// ── Helper: set refresh cookie ──
function setRefreshCookie(res: any, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ── Helper: generate crypto token ──
function generateCryptoToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ── POST /api/auth/register ──
router.post(
  "/register",
  authRateLimiter,
  [
    body("name").trim().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain an uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain a number"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  validate,
  async (req: any, res: any) => {
    try {
      const { name, email, password } = req.body;

      // Duplicate email check
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({
          message: "Validation failed",
          errors: [{ field: "email", message: "Email already registered" }],
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const avatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${email.toLowerCase()}`;

      const emailVerificationToken = generateCryptoToken();
      const emailVerificationHash = await bcrypt.hash(
        emailVerificationToken,
        12,
      );

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        avatar: avatarUrl,
        isEmailVerified: false,
        emailVerificationToken: emailVerificationHash,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      // Attempt to send verification email (do not await so it doesn't block response, or await and ignore fail)
      sendVerificationEmail(user.email, emailVerificationToken).catch((err) => {
        console.error(
          "Failed to send verification email during registration",
          err,
        );
      });

      const tokens = generateTokens(user.id, user.role);
      setRefreshCookie(res, tokens.refreshToken);

      return res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
        accessToken: tokens.accessToken,
      });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ── POST /api/auth/login ──
router.post(
  "/login",
  authRateLimiter,
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  async (req: any, res: any) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const tokens = generateTokens(user.id, user.role);
      setRefreshCookie(res, tokens.refreshToken);

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
        accessToken: tokens.accessToken,
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ── GET /api/auth/me ──
router.get("/me", requireAuth, async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user.sub).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── PATCH /api/auth/profile ──
router.patch(
  "/profile",
  requireAuth,
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
    body("avatar")
      .optional()
      .trim()
      .isURL()
      .withMessage("Avatar must be a valid URL"),
    body("currentPassword")
      .optional()
      .notEmpty()
      .withMessage("Current password is required if setting a new password"),
    body("newPassword")
      .optional()
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("New password must contain an uppercase letter")
      .matches(/[0-9]/)
      .withMessage("New password must contain a number"),
  ],
  validate,
  async (req: any, res: any) => {
    try {
      const { name, avatar, currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.sub);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Handle password update
      if (newPassword) {
        if (!currentPassword) {
          return res
            .status(400)
            .json({ message: "Current password is required" });
        }

        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) {
          return res
            .status(400)
            .json({ message: "Incorrect current password" });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 12);
      }

      if (name) user.name = name;
      if (avatar) user.avatar = avatar;

      await user.save();

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
      });
    } catch (err) {
      console.error("Profile update error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ── POST /api/auth/profile/avatar ──
router.post(
  "/profile/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const user = await User.findById(req.user.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Upload to Azure Blob Storage
      const avatarUrl = await uploadAvatarToAzure(
        user.id,
        req.file.buffer,
        req.file.mimetype,
      );

      // Save to database
      user.avatar = avatarUrl;
      await user.save();

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
      });
    } catch (err) {
      console.error("Avatar upload error:", err);
      return res
        .status(500)
        .json({ message: "Internal server error during upload" });
    }
  },
);

// ── POST /api/auth/refresh ──
router.post("/refresh", async (req: any, res: any) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const tokens = generateTokens(user.id, user.role);
    setRefreshCookie(res, tokens.refreshToken);

    return res.status(200).json({ accessToken: tokens.accessToken });
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
});

// ── POST /api/auth/logout ──
router.post("/logout", (req: any, res: any) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.status(200).json({ message: "Logged out successfully" });
});

// ── POST /api/auth/forgot-password ──
router.post(
  "/forgot-password",
  passwordResetRateLimiter,
  [body("email").isEmail().withMessage("Valid email is required")],
  validate,
  async (req: any, res: any) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });

      // Always return success to prevent email enumeration
      if (!user) {
        return res
          .status(200)
          .json({
            message:
              "If that email is in our database, we will send a password reset link to it.",
          });
      }

      const resetToken = generateCryptoToken();
      const resetTokenHash = await bcrypt.hash(resetToken, 12);

      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      await sendPasswordResetEmail(user.email, resetToken);

      return res
        .status(200)
        .json({
          message:
            "If that email is in our database, we will send a password reset link to it.",
        });
    } catch (err) {
      console.error("Forgot password error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ── POST /api/auth/reset-password ──
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain an uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain a number"),
  ],
  validate,
  async (req: any, res: any) => {
    try {
      const { token, email, password } = req.body;

      const user = await User.findOne({
        email: email.toLowerCase(),
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user || !user.resetPasswordToken) {
        return res
          .status(400)
          .json({ message: "Password reset token is invalid or has expired." });
      }

      const validToken = await bcrypt.compare(token, user.resetPasswordToken);
      if (!validToken) {
        return res
          .status(400)
          .json({ message: "Password reset token is invalid or has expired." });
      }

      user.passwordHash = await bcrypt.hash(password, 12);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res
        .status(200)
        .json({ message: "Password has been successfully reset." });
    } catch (err) {
      console.error("Reset password error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ── POST /api/auth/verify-email ──
router.post(
  "/verify-email",
  [
    body("token").notEmpty().withMessage("Token is required"),
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  validate,
  async (req: any, res: any) => {
    try {
      const { token, email } = req.body;

      const user = await User.findOne({
        email: email.toLowerCase(),
        emailVerificationExpires: { $gt: new Date() },
      });

      if (!user || !user.emailVerificationToken) {
        return res
          .status(400)
          .json({ message: "Verification token is invalid or has expired." });
      }

      const validToken = await bcrypt.compare(
        token,
        user.emailVerificationToken,
      );
      if (!validToken) {
        return res
          .status(400)
          .json({ message: "Verification token is invalid or has expired." });
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      return res.status(200).json({ message: "Email verified successfully." });
    } catch (err) {
      console.error("Verify email error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default router;
