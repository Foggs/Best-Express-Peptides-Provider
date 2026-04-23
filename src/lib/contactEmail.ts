import { resend } from './resend'

const FROM_ADDRESS = 'BestExpressPeptides <noreply@support.bestexpresspeptides.com>'

interface ContactFormData {
  name: string
  email: string
  message: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildContactEmailHtml(data: ContactFormData): string {
  const safeName = escapeHtml(data.name)
  const safeEmail = escapeHtml(data.email)
  const safeMessage = escapeHtml(data.message).replace(/\n/g, '<br/>')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f3f4f6;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background-color:#1e40af;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;">New Contact Form Submission</h1>
      <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">BestExpressPeptides</p>
    </div>
    <div style="background-color:#ffffff;padding:24px;border-radius:0 0 8px 8px;">
      <div style="margin-bottom:16px;padding:16px;background-color:#f9fafb;border-radius:6px;">
        <h3 style="font-size:12px;color:#6b7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">From</h3>
        <p style="margin:0;font-size:14px;color:#111827;line-height:1.6;">
          <strong>${safeName}</strong><br/>
          <a href="mailto:${safeEmail}" style="color:#1e40af;">${safeEmail}</a>
        </p>
      </div>
      <div style="padding:16px;background-color:#f9fafb;border-radius:6px;">
        <h3 style="font-size:12px;color:#6b7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Message</h3>
        <p style="margin:0;font-size:14px;color:#111827;line-height:1.6;white-space:pre-wrap;">${safeMessage}</p>
      </div>
    </div>
    <div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px;">
      <p>Submitted via the BestExpressPeptides contact form.</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendContactFormEmail(
  data: ContactFormData,
): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.error('ADMIN_EMAIL environment variable is not set')
    return { success: false, error: 'Admin email not configured' }
  }

  try {
    const html = buildContactEmailHtml(data)

    const { data: result, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [adminEmail],
      replyTo: data.email,
      subject: `New Contact Form Submission from ${data.name}`,
      html,
    })

    if (error) {
      console.error('Resend contact form error:', error)
      return { success: false, error: error.message }
    }

    console.log('Contact form email sent successfully, id:', result?.id)
    return { success: true }
  } catch (error) {
    console.error('Error sending contact form email:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
