import { NextRequest } from "next/server"
import { POST } from "../src/app/api/contact/route"
import { contactDeps } from "../src/lib/contact-deps"

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++ }
  else { console.error(`  ✗ FAIL: ${msg}`); failed++ }
}

function makeReq(body: Record<string, unknown>, ip: string): NextRequest {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
  })
}

async function run() {
  console.log("\nTest: POST /api/contact — honeypot spam protection\n")

  const validBody = {
    name: "Jane Doe",
    email: "jane@example.com",
    message: "I have a question about your peptides.",
  }

  // ── 1. Filled honeypot → silent success, email NEVER sent ──────────────
  console.log("1. Bot fills the honeypot 'website' field")
  let sendCount = 0
  contactDeps.sendContactFormEmail = async () => {
    sendCount++
    return { success: true }
  }

  const r1 = await POST(makeReq({ ...validBody, website: "http://spam.example" }, "10.0.0.1"))
  const j1 = await r1.json()

  assert(r1.status === 200, `honeypot filled: status 200 (got ${r1.status})`)
  assert(j1.success === true, `honeypot filled: success = true (no signal to bot)`)
  assert(sendCount === 0, `honeypot filled: email was NOT sent (sendCount=${sendCount})`)

  // ── 2. Empty honeypot → legitimate submission, email IS sent ───────────
  console.log("\n2. Real user leaves the honeypot empty")
  sendCount = 0
  let captured: unknown = null
  contactDeps.sendContactFormEmail = async (data) => {
    sendCount++
    captured = data
    return { success: true }
  }

  const r2 = await POST(makeReq({ ...validBody, website: "" }, "10.0.0.2"))
  const j2 = await r2.json()

  assert(r2.status === 200, `empty honeypot: status 200 (got ${r2.status})`)
  assert(j2.success === true, `empty honeypot: success = true`)
  assert(sendCount === 1, `empty honeypot: email WAS sent (sendCount=${sendCount})`)
  assert(
    !!captured && (captured as Record<string, unknown>).name === "Jane Doe",
    `empty honeypot: email received the submitted data`,
  )

  // ── 3. Honeypot field absent → still treated as legitimate ─────────────
  console.log("\n3. Honeypot field omitted entirely")
  sendCount = 0
  contactDeps.sendContactFormEmail = async () => {
    sendCount++
    return { success: true }
  }

  const r3 = await POST(makeReq({ ...validBody }, "10.0.0.3"))
  const j3 = await r3.json()

  assert(r3.status === 200, `no honeypot: status 200 (got ${r3.status})`)
  assert(j3.success === true, `no honeypot: success = true`)
  assert(sendCount === 1, `no honeypot: email WAS sent (sendCount=${sendCount})`)

  // ── 4. Whitespace-only honeypot → still treated as spam ────────────────
  console.log("\n4. Honeypot filled with whitespace only")
  sendCount = 0
  contactDeps.sendContactFormEmail = async () => {
    sendCount++
    return { success: true }
  }

  const r4 = await POST(makeReq({ ...validBody, website: "   " }, "10.0.0.4"))
  const j4 = await r4.json()

  assert(r4.status === 200, `whitespace honeypot: status 200 (got ${r4.status})`)
  assert(j4.success === true, `whitespace honeypot: success = true`)
  assert(sendCount === 0, `whitespace honeypot: email was NOT sent (sendCount=${sendCount})`)

  console.log(`\n${passed} passed, ${failed} failed\n`)
  if (failed > 0) process.exit(1)
}

run()
