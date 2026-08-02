import { Resend } from "resend";
import { UserModel } from "@quantnest-trading/db/client";
import { WorkflowModel } from "@quantnest-trading/db/client";
import { env } from "../config/env";

const resend = env.NOTIFICATIONS.RESEND_API_KEY
  ? new Resend(env.NOTIFICATIONS.RESEND_API_KEY)
  : null;

const emailFrom =
  process.env.EMAIL_FROM || "QuantNest <support@quantnesttrading.com>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Best-effort email alert when a risk gate blocks or holds an order. Never
 * throws — risk enforcement must not fail because email delivery failed.
 */
export async function sendRiskAlertEmail(input: {
  userId?: string;
  workflowId?: string;
  reason: "blocked" | "approval";
  message: string;
}): Promise<void> {
  if (!resend) return;

  try {
    const [user, workflow] = await Promise.all([
      input.userId
        ? UserModel.findById(input.userId)
            .select({ email: 1, username: 1, displayName: 1, _id: 0 })
            .lean()
        : null,
      input.workflowId
        ? WorkflowModel.findById(input.workflowId)
            .select({ workflowName: 1, _id: 0 })
            .lean()
        : null,
    ]);

    if (!user?.email) return;

    const workflowName = workflow?.workflowName || "your workflow";
    const username = user.displayName || user.username || "there";
    const isBlocked = input.reason === "blocked";
    const subject = isBlocked
      ? "⛔ QuantNest Order Blocked by Risk Policy"
      : "⚠️ QuantNest Order Requires Your Approval";

    await resend.emails.send({
      from: emailFrom,
      to: user.email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 560px; margin: 0 auto;">
          <h2 style="color: ${isBlocked ? "#ef4444" : "#f17463"};">${isBlocked ? "Order Blocked" : "Approval Required"}</h2>
          <p>Hello ${escapeHtml(username)},</p>
          <p>Workflow <strong>${escapeHtml(workflowName)}</strong> was stopped by your risk guardrails.</p>
          <p style="margin-top: 16px; padding: 16px; background: ${isBlocked ? "#fef2f2" : "#fff7ed"}; border-radius: 8px; border-left: 4px solid ${isBlocked ? "#ef4444" : "#f17463"}; font-size: 14px;">
            ${escapeHtml(input.message)}
          </p>
          ${
            !isBlocked
              ? `<p>The order was <strong>not placed</strong>. Approve or reject it from the Approvals page before the workflow can resume.</p>`
              : `<p>No order was placed. Review the workflow's risk limits to allow this trade.</p>`
          }
          <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">QuantNest Trading</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send risk alert email:", error);
  }
}
