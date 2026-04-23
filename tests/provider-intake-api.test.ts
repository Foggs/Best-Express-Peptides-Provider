import { NextRequest } from "next/server"
import { POST } from "../src/app/api/provider-intake/route"
import { providerIntakeDeps } from "../src/app/api/provider-intake/deps"

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++ }
  else { console.error(`  ✗ FAIL: ${msg}`); failed++ }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeFormData(overrides: Record<string, string | null> = {}): FormData {
  const defaults: Record<string, string> = {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@clinic.com",
    phone: "5550001111",
    companyName: "Wellness Clinic LLC",
    website: "https://wellnessclinic.com",
    taxId: "12-3456789",
    npiNumber: "1234567890",
    npiOwnerMatch: "true",
    hasResellerLicense: "NO",
    addressLine1: "100 Health Blvd",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    referredBy: "Dr. Adams",
  }
  const fd = new FormData()
  const merged = { ...defaults, ...overrides }
  for (const [k, v] of Object.entries(merged)) {
    if (v !== null) fd.append(k, v)
  }
  return fd
}

function makeReq(fd: FormData): NextRequest {
  return new NextRequest("http://localhost/api/provider-intake", {
    method: "POST",
    body: fd,
  })
}

// ── Stub setup ───────────────────────────────────────────────────────────────

function setupStubs({
  rateLimitPass = true,
  createResult = { id: "app-01" },
  createThrows = false,
  saveFileResult = "saved-file.pdf",
  saveFileThrows = false,
}: {
  rateLimitPass?: boolean
  createResult?: object
  createThrows?: boolean
  saveFileResult?: string
  saveFileThrows?: boolean
} = {}) {
  providerIntakeDeps.rateLimit = async () =>
    rateLimitPass ? { success: true, remaining: 9 } : { success: false, remaining: 0 }

  providerIntakeDeps.saveFile = async (_file: File) => {
    if (saveFileThrows) throw new Error("WRITE_ERROR")
    return saveFileResult
  }

  providerIntakeDeps.createApplication = async (_data) => {
    if (createThrows) throw new Error("DB_ERROR")
    return createResult as any
  }
}

// ── Test suite ───────────────────────────────────────────────────────────────

async function run() {
  console.log("\nTest suite: POST /api/provider-intake\n")

  // ── 1. Valid submission with no reseller licence → 201 ──────────────────
  console.log("1. Valid submission (no reseller licence) → 201")
  setupStubs()

  const r1 = await POST(makeReq(makeFormData()))
  const j1 = await r1.json()

  assert(r1.status === 201, `status 201 (got ${r1.status})`)
  assert(j1.success === true, `body.success = true`)

  // ── 2. Missing required field → 400 with descriptive message ───────────
  console.log("\n2. Missing required field (firstName) → 400 with descriptive message")
  setupStubs()

  const r2 = await POST(makeReq(makeFormData({ firstName: null })))
  const j2 = await r2.json()

  assert(r2.status === 400, `status 400 (got ${r2.status})`)
  assert(j2.error === "First name is required", `error = "First name is required" (got "${j2.error}")`)
  assert(j2.field === "firstName", `field = "firstName" (got "${j2.field}")`)

  // ── 3. Invalid email → 400 ──────────────────────────────────────────────
  console.log("\n3. Invalid email → 400")
  setupStubs()

  const r3 = await POST(makeReq(makeFormData({ email: "not-an-email" })))
  const j3 = await r3.json()

  assert(r3.status === 400, `status 400 (got ${r3.status})`)
  assert(j3.field === "email", `field = "email" (got "${j3.field}")`)

  // ── 4. Reseller YES without permit number → 400 ─────────────────────────
  console.log("\n4. hasResellerLicense=YES without permit number → 400")
  setupStubs()

  const r4 = await POST(makeReq(makeFormData({ hasResellerLicense: "YES" })))
  const j4 = await r4.json()

  assert(r4.status === 400, `status 400 (got ${r4.status})`)
  assert(j4.field === "resellerPermitNumber", `field = "resellerPermitNumber" (got "${j4.field}")`)

  // ── 5. Reseller YES with permit number but no certificate → 400 ─────────
  console.log("\n5. hasResellerLicense=YES with permit but no certificate file → 400")
  setupStubs()

  const fd5 = makeFormData({ hasResellerLicense: "YES", resellerPermitNumber: "PERMIT-123" })
  const r5 = await POST(makeReq(fd5))
  const j5 = await r5.json()

  assert(r5.status === 400, `status 400 (got ${r5.status})`)
  assert(j5.field === "resellerCertificate", `field = "resellerCertificate" (got "${j5.field}")`)

  // ── 6. Reseller NOT_SURE → 201 (no cert required) ───────────────────────
  console.log("\n6. hasResellerLicense=NOT_SURE → 201 without certificate")
  setupStubs()

  const r6 = await POST(makeReq(makeFormData({ hasResellerLicense: "NOT_SURE" })))
  const j6 = await r6.json()

  assert(r6.status === 201, `status 201 (got ${r6.status})`)
  assert(j6.success === true, `body.success = true`)

  // ── 7. Rate limit exceeded → 429 ────────────────────────────────────────
  console.log("\n7. Rate limit exceeded → 429")
  setupStubs({ rateLimitPass: false })

  const r7 = await POST(makeReq(makeFormData()))
  const j7 = await r7.json()

  assert(r7.status === 429, `status 429 (got ${r7.status})`)
  assert(typeof j7.error === "string", `error message present: "${j7.error}"`)

  // ── 8. DB error → 500 ───────────────────────────────────────────────────
  console.log("\n8. DB create error → 500")
  setupStubs({ createThrows: true })

  const r8 = await POST(makeReq(makeFormData()))
  const j8 = await r8.json()

  assert(r8.status === 500, `status 500 (got ${r8.status})`)
  assert(typeof j8.error === "string", `error message present: "${j8.error}"`)

  // ── 9. Invalid hasResellerLicense value → 400 ───────────────────────────
  console.log("\n9. Invalid hasResellerLicense value → 400")
  setupStubs()

  const r9 = await POST(makeReq(makeFormData({ hasResellerLicense: "MAYBE" })))
  const j9 = await r9.json()

  assert(r9.status === 400, `status 400 (got ${r9.status})`)
  assert(j9.field === "hasResellerLicense", `field = "hasResellerLicense" (got "${j9.field}")`)

  // ── 10. Suffix is optional — omitting it succeeds ───────────────────────
  console.log("\n10. Suffix is optional — omitting succeeds → 201")
  setupStubs()

  const r10 = await POST(makeReq(makeFormData()))
  const j10 = await r10.json()

  assert(r10.status === 201, `status 201 (got ${r10.status})`)
  assert(j10.success === true, `body.success = true`)

  // ── 11. Missing state → 400 ─────────────────────────────────────────────
  console.log("\n11. Missing state → 400")
  setupStubs()

  const r11 = await POST(makeReq(makeFormData({ state: null })))
  const j11 = await r11.json()

  assert(r11.status === 400, `status 400 (got ${r11.status})`)
  assert(j11.field === "state", `field = "state" (got "${j11.field}")`)

  // ── 12. Missing referredBy → 400 ────────────────────────────────────────
  console.log("\n12. Missing referredBy → 400")
  setupStubs()

  const r12 = await POST(makeReq(makeFormData({ referredBy: null })))
  const j12 = await r12.json()

  assert(r12.status === 400, `status 400 (got ${r12.status})`)
  assert(j12.field === "referredBy", `field = "referredBy" (got "${j12.field}")`)

  // ── 13. Invalid file extension in certificate → 400 ─────────────────────
  console.log("\n13. Invalid file extension in certificate (saveFile throws) → 400")
  setupStubs({
    saveFileThrows: true,
    saveFileResult: "saved.pdf",
  })
  // Override saveFile to throw an extension-specific error
  providerIntakeDeps.saveFile = async (_file: File) => {
    throw new Error('File type ".exe" is not allowed. Accepted: pdf, jpg, jpeg, png.')
  }

  // Need a cert file present so the route attempts saveFile
  const fd13 = makeFormData({ hasResellerLicense: "YES", resellerPermitNumber: "PERMIT-99" })
  fd13.append("resellerCertificate", new File(["data"], "malware.exe", { type: "application/octet-stream" }))

  const r13 = await POST(makeReq(fd13))
  const j13 = await r13.json()

  assert(r13.status === 400, `status 400 (got ${r13.status})`)
  assert(j13.field === "resellerCertificate", `field = "resellerCertificate" (got "${j13.field}")`)
  assert(typeof j13.error === "string" && j13.error.includes("not allowed"), `error mentions "not allowed": "${j13.error}"`)

  // ── 14. File too large → 400 ─────────────────────────────────────────────
  console.log("\n14. File exceeding size limit (saveFile throws) → 400")
  providerIntakeDeps.saveFile = async (_file: File) => {
    throw new Error("File exceeds the 10 MB limit.")
  }

  const fd14 = makeFormData({ hasResellerLicense: "YES", resellerPermitNumber: "PERMIT-99" })
  fd14.append("resellerCertificate", new File(["data"], "toobig.pdf", { type: "application/pdf" }))

  const r14 = await POST(makeReq(fd14))
  const j14 = await r14.json()

  assert(r14.status === 400, `status 400 (got ${r14.status})`)
  assert(j14.field === "resellerCertificate", `field = "resellerCertificate" (got "${j14.field}")`)
  assert(typeof j14.error === "string" && j14.error.includes("10 MB"), `error mentions "10 MB": "${j14.error}"`)

  // ── 15. Missing state → descriptive message ──────────────────────────────
  console.log("\n15. Missing state → descriptive error message")
  setupStubs()

  const r15 = await POST(makeReq(makeFormData({ state: null })))
  const j15 = await r15.json()

  assert(r15.status === 400, `status 400 (got ${r15.status})`)
  assert(j15.error === "State is required", `error = "State is required" (got "${j15.error}")`)
}

run()
  .then(() => {
    console.log(`\n──────────────────────────────────`)
    console.log(`Results: ${passed} passed, ${failed} failed`)
    console.log(`──────────────────────────────────\n`)
    if (failed > 0) process.exit(1)
  })
  .catch((err) => {
    console.error("Test error:", err)
    process.exit(1)
  })
