import crypto from "crypto";
import { Resend } from "resend";
import { getFrontendBaseUrl } from "../utils/security";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const emailFrom =
  process.env.EMAIL_FROM || "QuantNest <onboarding@quantnesttrading.com>";

export function createEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function sendAgentDownEmail(input: {
  email: string;
  username: string;
  agentId: string;
  reason: "agent_disconnected" | "openclaw_down";
}): Promise<void> {
  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      console.error("Resend not configured — cannot send agent-down alert");
    }
    return;
  }

  const reasonText =
    input.reason === "agent_disconnected"
      ? "Your QuantNest Agent has disconnected from the cloud."
      : "Your local OpenClaw gateway stopped responding.";

  await resend.emails.send({
    from: emailFrom,
    to: input.email,
    subject: "⚠️ QuantNest Agent Offline — Workflows Paused",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #f17463;">Agent Offline</h2>
        <p>Hello ${input.username},</p>
        <p>${reasonText}</p>
        <p>Agent ID: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px;">${input.agentId.slice(0, 12)}...</code></p>
        <p><strong>All OpenClaw-powered workflows have been automatically paused.</strong></p>
        <p>To resume trading:</p>
        <ol>
          <li>Restart the agent: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">quantnest start</code></li>
          <li>Resume each workflow from the QuantNest dashboard</li>
        </ol>
        <p style="margin-top: 24px; padding: 16px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444; font-size: 14px;">
          No executions were lost. Workflows will resume from their next trigger after you manually restart them.
        </p>
        <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">
          QuantNest Trading &bull; <a href="${getFrontendBaseUrl()}" style="color: #f17463;">Dashboard</a>
        </p>
      </div>
    `,
  });
}

export async function sendRiskAlertEmail(input: {
  email: string;
  username: string;
  workflowName: string;
  reason: "blocked" | "approval";
  message: string;
}): Promise<void> {
  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      console.error("Resend not configured — cannot send risk alert");
    }
    return;
  }

  const isBlocked = input.reason === "blocked";
  const subject = isBlocked
    ? `QuantNest Order Blocked by Risk Policy`
    : `QuantNest Order Requires Your Approval`;

  await resend.emails.send({
    from: emailFrom,
    to: input.email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 560px; margin: 0 auto;">
        <h2 style="color: ${isBlocked ? "#ef4444" : "#f17463"};">${isBlocked ? "Order Blocked" : "Approval Required"}</h2>
        <p>Hello ${input.username},</p>
        <p>Workflow <strong>${input.workflowName}</strong> was stopped by your risk guardrails.</p>
        <p style="margin-top: 16px; padding: 16px; background: ${isBlocked ? "#fef2f2" : "#fff7ed"}; border-radius: 8px; border-left: 4px solid ${isBlocked ? "#ef4444" : "#f17463"}; font-size: 14px;">
          ${input.message}
        </p>
        ${
          !isBlocked
            ? `<p>The order was <strong>not placed</strong>. Approve or reject it from the Approvals page before the workflow can resume.</p>`
            : `<p>No order was placed. Review the workflow's risk limits to allow this trade.</p>`
        }
        <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">
          QuantNest Trading &bull; <a href="${getFrontendBaseUrl()}" style="color: #f17463;">Dashboard</a>
        </p>
      </div>
    `,
  });
}

export function getEmailVerificationExpiry(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

export async function sendEmailVerificationEmail(input: {
  email: string;
  username: string;
  token: string;
}): Promise<void> {
  const verificationLink = `${getFrontendBaseUrl()}/verify-email?token=${input.token}`;

  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Email verification is not configured. Set RESEND_API_KEY.",
      );
    }
    return;
  }

  await resend.emails.send({
    from: emailFrom,
    to: input.email,
    subject: "Verify your QuantNest email",
    html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <h2>Verify your email</h2>
            <p>Hello ${input.username},</p>
            <p>Complete your QuantNest signup by verifying your email address.</p>
            <p>
              <a href="${verificationLink}" style="display:inline-block;padding:10px 16px;background:#f17463;color:#ffffff;text-decoration:none;border-radius:8px;">
                Verify email
              </a>
            </p>
            <p>If the button does not work, open this link:</p>
            <p>${verificationLink}</p>
            <p>This link expires in 24 hours.</p>
          </div>
        `,
  });
}
