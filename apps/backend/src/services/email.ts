import { Resend } from "resend";
import { APP_NAME } from "@sentio/shared";

// If API key is not provided, we can log the email in dev mode, or Resend might fail.
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");
const defaultFrom = process.env.EMAIL_FROM || "Sentio <onboarding@resend.dev>";
const isDev = process.env.NODE_ENV !== "production";

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  if (isDev && !process.env.RESEND_API_KEY) {
    console.log(`[DEV EMAIL] Password reset for ${email}: ${resetUrl}`);
    return;
  }

  try {
    await resend.emails.send({
      from: defaultFrom,
      to: email,
      subject: `[${APP_NAME}] Reset your password`,
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>If you did not request this, please ignore this email.</p>
        <p>This link expires in 1 hour.</p>
      `,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("Failed to send email");
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email?token=${token}`;

  if (isDev && !process.env.RESEND_API_KEY) {
    console.log(`[DEV EMAIL] Email verification for ${email}: ${verifyUrl}`);
    return;
  }

  try {
    await resend.emails.send({
      from: defaultFrom,
      to: email,
      subject: `[${APP_NAME}] Verify your email address`,
      html: `
        <h1>Email Verification</h1>
        <p>Welcome to ${APP_NAME}! Please verify your email by clicking the link below:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>This link expires in 24 hours.</p>
      `,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Failed to send email");
  }
}
