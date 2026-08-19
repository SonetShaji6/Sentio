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
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="https://www.project-sentio.in/logo.jpg" alt="Sentio" width="80" style="display: block; margin-bottom: 24px; border-radius: 50%;" />
          <h1 style="color: #111827; font-size: 24px;">Password Reset Request</h1>
          <p style="color: #4B5563; font-size: 16px;">You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
          <p style="color: #4B5563; font-size: 14px; margin-top: 24px;">If you did not request this, please ignore this email.</p>
          <p style="color: #6B7280; font-size: 12px;">This link expires in 1 hour.</p>
        </div>
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
  const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

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
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="https://www.project-sentio.in/logo.jpg" alt="Sentio" width="80" style="display: block; margin-bottom: 24px; border-radius: 50%;" />
          <h1 style="color: #111827; font-size: 24px;">Email Verification</h1>
          <p style="color: #4B5563; font-size: 16px;">Please click the link below to verify your email address:</p>
          <a href="${verifyUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
          <p style="color: #4B5563; font-size: 14px; margin-top: 24px;">If you did not create an account, please ignore this email.</p>
          <p style="color: #6B7280; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
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

export async function sendReportEmail(
  email: string,
  reportTitle: string,
  reportUrl: string,
) {
  if (isDev && !process.env.RESEND_API_KEY) {
    console.log(
      `[DEV EMAIL] Report ready for ${email}: ${reportTitle} -> ${reportUrl}`,
    );
    return;
  }

  const resend = getResendClient();

  try {
    const response = await resend.emails.send({
      from: defaultFrom,
      to: email,
      subject: `[${APP_NAME}] Your Session Report: ${reportTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
          <img src="https://www.project-sentio.in/logo.jpg" alt="Sentio" width="80" style="display: block; margin-bottom: 24px; border-radius: 50%;" />
          <h1 style="font-size: 24px; color: #4F46E5;">Your Session Report is Ready</h1>
          <p style="font-size: 16px; color: #4B5563;">The report for <strong>${reportTitle}</strong> has been generated and is ready for download.</p>
          <a href="${reportUrl}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: bold;">Download Report</a>
          <p style="font-size: 14px; color: #6B7280; margin-top: 24px;">Thank you for presenting with Sentio!</p>
        </div>
      `,
    });

    if (response.error) {
      console.error("Resend returned an error:", response.error);
    }
  } catch (error) {
    console.error("Failed to send report email:", error);
  }
}

export async function sendOrgInvitationEmail(
  email: string,
  orgName: string,
  inviteUrl: string,
) {
  if (isDev && !process.env.RESEND_API_KEY) {
    console.log(
      `[DEV EMAIL] Org invite for ${email} to join ${orgName}: ${inviteUrl}`,
    );
    return;
  }

  const resend = getResendClient();

  try {
    const response = await resend.emails.send({
      from: defaultFrom,
      to: email,
      subject: `[${APP_NAME}] You are invited to join ${orgName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
          <img src="https://www.project-sentio.in/logo.jpg" alt="Sentio" width="80" style="display: block; margin-bottom: 24px; border-radius: 50%;" />
          <h1 style="font-size: 24px; color: #4F46E5;">Join ${orgName} on Sentio</h1>
          <p style="font-size: 16px; color: #4B5563;">You have been invited to join the <strong>${orgName}</strong> team workspace on Sentio.</p>
          <a href="${inviteUrl}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: bold;">Accept Invitation</a>
          <p style="font-size: 14px; color: #6B7280; margin-top: 24px;">This link will expire in 7 days.</p>
        </div>
      `,
    });

    if (response.error) console.error("Resend error:", response.error);
  } catch (error) {
    console.error("Failed to send org invitation email:", error);
  }
}

export async function sendNotificationEmail(
  email: string,
  title: string,
  message: string,
) {
  if (isDev && !process.env.RESEND_API_KEY) {
    console.log(`[DEV EMAIL] Notification to ${email}: ${title} - ${message}`);
    return;
  }

  const resend = getResendClient();

  try {
    await resend.emails.send({
      from: defaultFrom,
      to: email,
      subject: `[${APP_NAME}] ${title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
          <h2 style="color: #4F46E5;">${title}</h2>
          <p style="font-size: 15px; color: #4B5563;">${message}</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send notification email:", error);
  }
}
