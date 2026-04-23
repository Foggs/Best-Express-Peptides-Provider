import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkAuthRateLimit } from '@/lib/rate-limit'
import { sendContactFormEmail } from '@/lib/contactEmail'

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(254, 'Email is too long')
    .email('Please enter a valid email address'),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(5000, 'Message is too long'),
})

function stripControlChars(value: string): string {
  // Remove ASCII control chars except newline (\n) and tab (\t)
  return value.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '')
}

export async function POST(request: NextRequest) {
  const rateLimit = await checkAuthRateLimit(request)
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      {
        status: 429,
        headers: rateLimit.retryAfter
          ? { 'Retry-After': String(rateLimit.retryAfter) }
          : undefined,
      },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  const sanitized = {
    name: stripControlChars(parsed.data.name),
    email: stripControlChars(parsed.data.email),
    message: stripControlChars(parsed.data.message),
  }

  const result = await sendContactFormEmail(sanitized)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Unable to send your message right now. Please try again later.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
