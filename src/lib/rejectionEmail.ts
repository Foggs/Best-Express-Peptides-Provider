import { resend } from "./resend"

const FROM_ADDRESS = "BestExpressPeptides <noreply@support.bestexpresspeptides.com>"

export interface ProviderRejectionEmailData {
  email: string
  name: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildRejectionEmailHtml(data: ProviderRejectionEmailData): string {
  const safeName = escapeHtml(data.name)

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
      <h1 style="color: #ffffff; margin: 0; font-size: 22px;">BestExpressPeptides Provider Application</h1>
      <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Application update</p>
    </div>
    <div style="background-color: #ffffff; padding: 32px 24px; border-radius: 0 0 8px 8px;">
      <p style="margin: 0 0 16px; font-size: 15px; color: #111827;">Hi ${safeName},</p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #374151; line-height: 1.6;">
        Thank you for taking the time to apply for a vetted BestExpressPeptides provider account. After reviewing your submission, we are unable to approve your application at this time.
      </p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #374151; line-height: 1.6;">
        We appreciate your interest in our program and wish you the best with your work.
      </p>
      <p style="margin: 24px 0 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
        If you believe this decision was made in error or you would like to provide additional information, please reply to this email and our team will follow up.
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

export async function sendProviderRejectionEmail(
  data: ProviderRejectionEmailData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = buildRejectionEmailHtml(data)
    const { data: result, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [data.email],
      subject: "Update on your BestExpressPeptides provider application",
      html,
    })

    if (error) {
      console.error("Resend rejection email error:", error)
      return { success: false, error: error.message }
    }

    console.log("Rejection email sent successfully, id:", result?.id)
    return { success: true }
  } catch (error) {
    console.error("Error sending rejection email:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: message }
  }
}
