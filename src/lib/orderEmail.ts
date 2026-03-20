import { resend } from './resend'

const FROM_ADDRESS = 'BestExpressPeptides <noreply@support.bestexpresspeptides.com>'

interface OrderItem {
  name: string
  variantName: string
  price: number
  quantity: number
}

interface ShippingAddress {
  firstName: string
  lastName: string
  address: string
  apartment?: string
  city: string
  state: string
  zipCode: string
  phone?: string
}

interface OrderEmailData {
  email: string
  items: OrderItem[]
  shippingAddress: ShippingAddress
  subtotal: number
  shipping: number
  discount: number
  total: number
  couponCode?: string
  orderNumber?: string
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function buildOrderEmailHtml(data: OrderEmailData): string {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">
        ${item.name} - ${item.variantName}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; text-align: right;">
        ${formatPrice(item.price)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; text-align: right;">
        ${formatPrice(item.price * item.quantity)}
      </td>
    </tr>
  `).join('')

  const addr = data.shippingAddress
  const addressLines = [
    `${addr.firstName} ${addr.lastName}`,
    addr.address,
    addr.apartment ? addr.apartment : '',
    `${addr.city}, ${addr.state} ${addr.zipCode}`,
    addr.phone ? `Phone: ${addr.phone}` : '',
  ].filter(Boolean).join('<br/>')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #1e40af; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Order Received</h1>
      <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">BestExpressPeptides</p>
    </div>

    <div style="background-color: #ffffff; padding: 24px; border-radius: 0 0 8px 8px;">
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; color: #374151; margin: 0 0 8px;">Order placed: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' })}</h2>
        ${data.orderNumber ? `<div style="display: inline-block; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px 16px; margin-top: 8px;"><span style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.05em;">Order Number</span><span style="font-size: 20px; font-weight: 700; color: #1e40af; font-family: monospace; letter-spacing: 0.1em;">${data.orderNumber}</span></div>` : ''}
      </div>

      <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 6px;">
        <h3 style="font-size: 14px; color: #6b7280; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Customer Information</h3>
        <p style="margin: 0; font-size: 14px; color: #111827;">
          <strong>Email:</strong> ${data.email}<br/>
        </p>
      </div>

      <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 6px;">
        <h3 style="font-size: 14px; color: #6b7280; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Shipping Address</h3>
        <p style="margin: 0; font-size: 14px; color: #111827; line-height: 1.6;">
          ${addressLines}
        </p>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; color: #6b7280; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Product</th>
              <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #6b7280; text-transform: uppercase;">Qty</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #6b7280; text-transform: uppercase;">Price</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #6b7280; text-transform: uppercase;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>

      <div style="border-top: 2px solid #e5e7eb; padding-top: 16px;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 4px 0; font-size: 14px; color: #6b7280;">Subtotal</td>
            <td style="padding: 4px 0; font-size: 14px; color: #111827; text-align: right;">${formatPrice(data.subtotal)}</td>
          </tr>
          ${data.discount > 0 ? `
          <tr>
            <td style="padding: 4px 0; font-size: 14px; color: #16a34a;">Discount${data.couponCode ? ` (${data.couponCode})` : ''}</td>
            <td style="padding: 4px 0; font-size: 14px; color: #16a34a; text-align: right;">-${formatPrice(data.discount)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 12px 0 4px; font-size: 18px; font-weight: bold; color: #111827; border-top: 1px solid #e5e7eb;">Total</td>
            <td style="padding: 12px 0 4px; font-size: 18px; font-weight: bold; color: #1e40af; text-align: right; border-top: 1px solid #e5e7eb;">${formatPrice(data.total)}</td>
          </tr>
        </table>
      </div>
    </div>

    <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
      <p>This is an automated order notification from BestExpressPeptides.</p>
    </div>
  </div>
</body>
</html>
  `
}

export async function sendLowStockAlert(
  warnings: { productSlug: string; variantName: string; remainingStock: number }[]
): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    return { success: false, error: 'Admin email not configured' }
  }

  const warningRows = warnings.map(w => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${w.productSlug}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${w.variantName}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; text-align: center; font-weight: bold; color: ${w.remainingStock === 0 ? '#dc2626' : '#d97706'};">${w.remainingStock === 0 ? 'OUT OF STOCK' : w.remainingStock}</td>
    </tr>
  `).join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #d97706; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Low Stock Alert</h1>
      <p style="color: #fef3c7; margin: 8px 0 0; font-size: 14px;">BestExpressPeptides Inventory</p>
    </div>
    <div style="background-color: #ffffff; padding: 24px; border-radius: 0 0 8px 8px;">
      <p style="font-size: 14px; color: #374151; margin: 0 0 16px;">The following items have dropped below the low stock threshold (5 units) after a recent order:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Product</th>
            <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Variant</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #6b7280; text-transform: uppercase;">Remaining</th>
          </tr>
        </thead>
        <tbody>${warningRows}</tbody>
      </table>
    </div>
    <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
      <p>This is an automated inventory alert from BestExpressPeptides.</p>
    </div>
  </div>
</body>
</html>`

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [adminEmail],
      subject: `Low Stock Alert - ${warnings.length} item${warnings.length === 1 ? '' : 's'} need attention`,
      html,
    })

    if (error) {
      console.error('Resend low stock alert error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending low stock alert:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendOrderEmail(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.error('ADMIN_EMAIL environment variable is not set')
    return { success: false, error: 'Admin email not configured' }
  }

  try {
    const html = buildOrderEmailHtml(data)
    const itemCount = data.items.reduce((sum, item) => sum + item.quantity, 0)

    const { data: result, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [adminEmail],
      subject: `New Order - ${formatPrice(data.total)} (${itemCount} item${itemCount === 1 ? '' : 's'}) from ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}`,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log('Order email sent successfully, id:', result?.id)
    return { success: true }
  } catch (error) {
    console.error('Error sending order email:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
