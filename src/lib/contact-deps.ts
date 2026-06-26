import type { sendContactFormEmail } from "@/lib/contactEmail"

type ContactEmailFn = typeof sendContactFormEmail

async function _sendContactFormEmail(
  ...args: Parameters<ContactEmailFn>
): ReturnType<ContactEmailFn> {
  const { sendContactFormEmail: fn } = await import("@/lib/contactEmail")
  return fn(...args)
}

/**
 * Indirection layer that lets tests replace the contact email send without
 * touching sealed ESM namespace bindings.  Object property mutation works in
 * ESM; named-export reassignment does not.
 */
export const contactDeps = {
  sendContactFormEmail: _sendContactFormEmail as ContactEmailFn,
}
