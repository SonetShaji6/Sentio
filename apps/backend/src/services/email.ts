import { Resend } from "resend";
import { APP_NAME } from "@sentio/shared";

const defaultFrom =
  process.env.EMAIL_FROM || "Sentio <noreply@project-sentio.in>";
const isDev = process.env.NODE_ENV !== "production";

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY || "re_dummy_key");
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  if (isDev && !process.env.RESEND_API_KEY) {
    console.log(`[DEV EMAIL] Password reset for ${email}: ${resetUrl}`);
    return;
  }

  const resend = getResendClient();

  try {
    const response = await resend.emails.send({
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

    console.log("Resend API response:", response);

    if (response.error) {
      console.error("Resend returned an error:", response.error);
      throw new Error(`Resend error: ${response.error.message}`);
    }
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

  const resend = getResendClient();

  try {
    const response = await resend.emails.send({
      from: defaultFrom,
      to: email,
      subject: `[${APP_NAME}] Verify your email`,
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>If you did not create an account, please ignore this email.</p>
        <p>This link expires in 24 hours.</p>
      `,
    });

    console.log("Resend API response:", response);

    if (response.error) {
      console.error("Resend returned an error:", response.error);
      throw new Error(`Resend error: ${response.error.message}`);
    }
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Failed to send email");
  }
}
