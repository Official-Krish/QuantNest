import crypto from "crypto";
import { Resend } from "resend";
import { getFrontendBaseUrl } from "../utils/security";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const emailFrom = process.env.EMAIL_FROM || "QuantNest <onboarding@quantnesttrading.com>";

export function createEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex");
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
            throw new Error("Email verification is not configured. Set RESEND_API_KEY.");
        }
        console.log(`Email verification link for ${input.email}: ${verificationLink}`);
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
