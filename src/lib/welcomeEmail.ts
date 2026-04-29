import { resend } from "./resend"

const FROM_ADDRESS = "BestExpressPeptides <noreply@support.bestexpresspeptides.com>"

export interface ProviderWelcomeEmailData {
  email: string
  name: string
  setupUrl: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildWelcomeEmailHtml(data: ProviderWelcomeEmailData): string {
  const safeName = escapeHtml(data.name)
  const safeUrl = escapeHtml(data.setupUrl)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 640px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #1e40af; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Welcome to BestExpressPeptides</h1>
      <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Your provider account has been approved</p>
    </div>
    <div style="background-color: #ffffff; padding: 32px 24px; border-radius: 0 0 8px 8px;">
      <p style="margin: 0 0 16px; font-size: 15px; color: #111827;">Hi ${safeName},</p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #374151; line-height: 1.6;">
        Thank you for applying to become a vetted BestExpressPeptides provider. Your application has been reviewed and approved.
      </p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #374151; line-height: 1.6;">
        To finish setting up your account, please choose a password using the secure link below. This link will expire in 24 hours and can only be used once.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${safeUrl}"
           style="display: inline-block; background-color: #1e40af; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Set Your Password
        </a>
      </div>
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">If the button does not work, copy and paste this link into your browser:</p>
      <p style="margin: 0 0 24px; font-size: 12px; color: #2563eb; word-break: break-all;">${safeUrl}</p>
      <p style="margin: 24px 0 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
        If you did not apply for an account, you can safely ignore this email.
      </p>
    </div>
    <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
      <p>BestExpressPeptides &middot; Provider Portal</p>
    </div>
  </div>
</body>
</html>
  `
}

export async function sendProviderWelcomeEmail(
  data: ProviderWelcomeEmailData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = buildWelcomeEmailHtml(data)
    const { data: result, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [data.email],
      subject: "Your BestExpressPeptides provider account is approved",
      html,
    })

    if (error) {
      console.error("Resend welcome email error:", error)
      return { success: false, error: error.message }
    }

    console.log("Welcome email sent successfully, id:", result?.id)
    return { success: true }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: message }
  }
}
