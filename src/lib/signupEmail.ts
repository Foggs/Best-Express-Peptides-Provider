import { resend } from './resend'

const FROM_ADDRESS = 'BestExpressPeptides <noreply@support.bestexpresspeptides.com>'

export interface ProviderSignupEmailData {
  firstName: string
  lastName: string
  suffix?: string | null
  email: string
  phone: string
  companyName: string
  website: string
  taxId: string
  npiNumber: string
  npiOwnerMatch: boolean
  hasResellerLicense: 'YES' | 'NO' | 'NOT_SURE'
  resellerPermitNumber?: string | null
  addressLine1: string
  city: string
  state: string
  zipCode: string
  referredBy: string
  comments?: string | null
  resellerCertificateUploaded: boolean
  businessLicenseUploaded: boolean
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function row(label: string, value: string | null | undefined): string {
  const display = value && value.trim() ? escapeHtml(value) : '<span style="color:#9ca3af;">—</span>'
  return `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%; vertical-align: top;">${label}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827; vertical-align: top;">${display}</td>
    </tr>
  `
}

function section(title: string, rows: string): string {
  return `
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 13px; color: #6b7280; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">${title}</h3>
      <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 6px; overflow: hidden;">
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

function buildSignupEmailHtml(data: ProviderSignupEmailData): string {
  const fullName = [data.firstName, data.lastName, data.suffix].filter(Boolean).join(' ')
  const resellerLabel =
    data.hasResellerLicense === 'YES'
      ? 'Yes'
      : data.hasResellerLicense === 'NO'
        ? 'No'
        : 'Not sure'

  const contactRows =
    row('Name', fullName) +
    row('Email', data.email) +
    row('Phone', data.phone)

  const businessRows =
    row('Company Name', data.companyName) +
    row('Website', data.website) +
    row('Tax ID / EIN', data.taxId) +
    row('NPI Number', data.npiNumber) +
    row('NPI owner matches contact', data.npiOwnerMatch ? 'Yes' : 'No') +
    row("Reseller's License", resellerLabel) +
    (data.hasResellerLicense === 'YES'
      ? row("Reseller's Permit Number", data.resellerPermitNumber ?? '')
      : '')

  const addressRows =
    row('Address Line 1', data.addressLine1) +
    row('City', data.city) +
    row('State', data.state) +
    row('Zip Code', data.zipCode)

  const verificationRows =
    row(
      "Reseller's Certificate uploaded",
      data.resellerCertificateUploaded ? 'Yes' : 'No',
    ) +
    row(
      'Business / Professional License uploaded',
      data.businessLicenseUploaded ? 'Yes' : 'No',
    ) +
    row('Referred by', data.referredBy)

  const notesRows = row('Comments', data.comments ?? '')

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
      <h1 style="color: #ffffff; margin: 0; font-size: 22px;">New Provider Signup</h1>
      <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">BestExpressPeptides</p>
    </div>
    <div style="background-color: #ffffff; padding: 24px; border-radius: 0 0 8px 8px;">
      <p style="margin: 0 0 16px; font-size: 14px; color: #374151;">
        A new provider application was submitted on
        ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' })}.
      </p>
      ${section('Contact Information', contactRows)}
      ${section('Business Profile', businessRows)}
      ${section('Business Address', addressRows)}
      ${section('Verification & Referral', verificationRows)}
      ${section('Additional Notes', notesRows)}
    </div>
    <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
      <p>This is an automated provider signup notification from BestExpressPeptides.</p>
    </div>
  </div>
</body>
</html>
  `
}

export async function sendProviderSignupEmail(
  data: ProviderSignupEmailData,
): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.error('ADMIN_EMAIL environment variable is not set')
    return { success: false, error: 'Admin email not configured' }
  }

  try {
    const html = buildSignupEmailHtml(data)
    const fullName = `${data.firstName} ${data.lastName}`.trim()

    const { data: result, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [adminEmail],
      subject: `New Provider Signup from ${fullName}`,
      html,
      replyTo: data.email,
    })

    if (error) {
      console.error('Resend provider signup email error:', error)
      return { success: false, error: error.message }
    }

    console.log('Provider signup email sent successfully, id:', result?.id)
    return { success: true }
  } catch (error) {
    console.error('Error sending provider signup email:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
