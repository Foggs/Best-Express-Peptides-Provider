import { NextRequest } from "next/server"
import * as fs from "fs"
import { POST as approvePOST } from "../src/app/api/admin/applications/[id]/approve/route"
import { approveApplicationDeps } from "../src/app/api/admin/applications/[id]/approve/deps"
import { POST as rejectPOST } from "../src/app/api/admin/applications/[id]/reject/route"
import { rejectApplicationDeps } from "../src/app/api/admin/applications/[id]/reject/deps"
import { POST as intakePOST } from "../src/app/api/provider-intake/route"
import { providerIntakeDeps } from "../src/app/api/provider-intake/deps"
import { consumeSetupToken } from "../src/app/auth/set-password/deps"
import { generateSetupToken, hashSetupToken } from "../src/lib/setupTokens"
import jwt from "jsonwebtoken"

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++ }
  else { console.error(`  ✗ FAIL: ${msg}`); failed++ }
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-secret-must-be-32-chars-long-xx"
}

function adminToken(): string {
  return jwt.sign({ isAdmin: true, email: "admin@test" }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  })
}

function makeIntakeForm(overrides: Record<string, string | null> = {}): FormData {
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

function makeApproveReq(id: string, withAuth = true): NextRequest {
  const headers: Record<string, string> = {}
  if (withAuth) headers.authorization = `Bearer ${adminToken()}`
  return new NextRequest(`http://localhost/api/admin/applications/${id}/approve`, {
    method: "POST",
    headers,
  })
}

function makeRejectReq(id: string, withAuth = true): NextRequest {
  const headers: Record<string, string> = {}
  if (withAuth) headers.authorization = `Bearer ${adminToken()}`
  return new NextRequest(`http://localhost/api/admin/applications/${id}/reject`, {
    method: "POST",
    headers,
  })
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

async function run() {
  console.log("\nTest suite: Vetted provider onboarding\n")

  // ──────────────────────────────────────────────────────────────────────────
  // Regression guard: no self-register bypass; OAuth users must be APPROVED
  // ──────────────────────────────────────────────────────────────────────────
  console.log("0. /api/auth/register bypass route is removed (vetted-provider gate enforced)")
  assert(
    !fs.existsSync("src/app/api/auth/register/route.ts"),
    `register route is removed so nobody can self-mint an APPROVED account outside provider vetting`,
  )

  console.log("\n0b. NextAuth events.createUser flips OAuth users to APPROVED")
  const authSrc = fs.readFileSync("src/lib/auth.ts", "utf8")
  assert(
    /events:\s*\{[\s\S]*createUser/.test(authSrc) &&
      /status:\s*["']APPROVED["']/.test(authSrc),
    `auth.ts has events.createUser that marks OAuth users APPROVED`,
  )

  // ──────────────────────────────────────────────────────────────────────────
  // Token helpers
  // ──────────────────────────────────────────────────────────────────────────
  console.log("1. generateSetupToken returns base64url token + matching SHA-256 hash + 24h expiry")
  const before = Date.now()
  const { token: t1, tokenHash: h1, expiresAt: e1 } = generateSetupToken()
  assert(typeof t1 === "string" && t1.length >= 40, `token is a non-trivial string (len=${t1.length})`)
  assert(/^[A-Za-z0-9_-]+$/.test(t1), `token uses base64url charset (no '+', '/', '=')`)
  assert(hashSetupToken(t1) === h1, `hashSetupToken(token) === stored hash`)
  assert(h1.length === 64 && /^[0-9a-f]+$/.test(h1), `hash is 64 hex chars (SHA-256)`)
  const ttl = e1.getTime() - before
  assert(ttl >= 23.9 * 3600 * 1000 && ttl <= 24.1 * 3600 * 1000, `expiresAt ~24h ahead (got ${Math.round(ttl/3600000)}h)`)

  console.log("\n2. Two generated tokens are unique")
  const { token: t2 } = generateSetupToken()
  assert(t1 !== t2, "tokens differ across calls")

  // ──────────────────────────────────────────────────────────────────────────
  // Intake creates PENDING user when email is new
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n3. Intake atomically creates PENDING user + application when email does not yet exist")
  let createdEmail = ""
  let createdName = ""
  let lookupCalls = 0
  let intakeAppData: any = null
  let signupEmailSends = 0
  let standaloneAppCreates = 0
  providerIntakeDeps.rateLimit = async () => ({ success: true, remaining: 9 })
  providerIntakeDeps.saveFile = async () => "f.pdf"
  providerIntakeDeps.createApplication = async (data) => {
    standaloneAppCreates++
    intakeAppData = data
    return { id: "app-new" }
  }
  providerIntakeDeps.createApplicationAndPendingUser = async (params) => {
    intakeAppData = params.application
    createdEmail = params.user.email
    createdName = params.user.name
    return [{ id: "u-new" }, { id: "app-new" }] as any
  }
  providerIntakeDeps.findUserByEmail = async (email: string) => {
    lookupCalls++
    return null
  }
  // Stub outbound email so unit tests are deterministic and CI-safe.
  providerIntakeDeps.sendSignupEmail = async () => {
    signupEmailSends++
    return { success: true } as any
  }
  providerIntakeDeps.createPendingUser = async (data) => {
    createdEmail = data.email
    createdName = data.name
    return { id: "u-new", email: data.email, name: data.name } as any
  }

  const r3 = await intakePOST(
    new NextRequest("http://localhost/api/provider-intake", {
      method: "POST",
      body: makeIntakeForm(),
    }),
  )
  assert(r3.status === 201, `intake returns 201 (got ${r3.status})`)
  assert(lookupCalls === 1, `findUserByEmail called once`)
  assert(
    createdEmail === "jane@clinic.com" && createdName === "Jane Smith",
    `createPendingUser called with normalized email + full name (got "${createdEmail}", "${createdName}")`,
  )
  assert(
    intakeAppData?.existingUserAtIntake === false,
    `application persisted with existingUserAtIntake=false for new email`,
  )
  assert(
    signupEmailSends === 1,
    `outbound signup email is dispatched (via stubbed dep, no network)`,
  )
  assert(
    standaloneAppCreates === 0,
    `new-email branch uses transactional createApplicationAndPendingUser (not standalone createApplication)`,
  )

  console.log("\n4. Intake skips user creation AND flags application when email already exists")
  let createCalls = 0
  let txCalls = 0
  intakeAppData = null
  standaloneAppCreates = 0
  providerIntakeDeps.findUserByEmail = async () =>
    ({ id: "u-existing", email: "jane@clinic.com", status: "APPROVED" }) as any
  providerIntakeDeps.createPendingUser = async () => {
    createCalls++
    return {} as any
  }
  providerIntakeDeps.createApplicationAndPendingUser = async () => {
    txCalls++
    return [] as any
  }
  const r4 = await intakePOST(
    new NextRequest("http://localhost/api/provider-intake", {
      method: "POST",
      body: makeIntakeForm(),
    }),
  )
  assert(r4.status === 201, `intake still returns 201 when user exists (got ${r4.status})`)
  assert(createCalls === 0, `createPendingUser NOT called`)
  assert(
    intakeAppData?.existingUserAtIntake === true,
    `application persisted with existingUserAtIntake=true for existing email (admin signal)`,
  )
  assert(
    txCalls === 0 && standaloneAppCreates === 1,
    `existing-user branch uses standalone createApplication (no transaction needed)`,
  )

  console.log("\n5. Intake fails loudly (500) when the atomic write throws — no orphaned application")
  // New contract: createApplicationAndPendingUser is a transaction. If it
  // fails, neither the User nor the ProviderApplication row exists, and
  // the caller MUST get an error so they know to retry. No silent 201.
  providerIntakeDeps.findUserByEmail = async () => null
  providerIntakeDeps.createApplicationAndPendingUser = async () => {
    throw new Error("DB_ERROR")
  }
  const r5 = await intakePOST(
    new NextRequest("http://localhost/api/provider-intake", {
      method: "POST",
      body: makeIntakeForm(),
    }),
  )
  assert(r5.status === 500, `tx failure → 500 (got ${r5.status})`)

  // ──────────────────────────────────────────────────────────────────────────
  // Approve route
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n6. Approve route rejects unauthenticated requests with 401")
  const r6 = await approvePOST(makeApproveReq("app-1", false), ctx("app-1"))
  assert(r6.status === 401, `unauth returns 401 (got ${r6.status})`)

  console.log("\n7. Approve route returns 404 when application missing")
  approveApplicationDeps.findApplication = async () => null
  const r7 = await approvePOST(makeApproveReq("missing"), ctx("missing"))
  assert(r7.status === 404, `missing app → 404 (got ${r7.status})`)

  console.log("\n8. Approve route ALLOWS reissue for APPROVED app whose user has no password yet")
  let reissueAppMarkApproved = 0
  let reissueUpsertCalls = 0
  let reissueEmailCalls = 0
  approveApplicationDeps.findApplication = async () =>
    ({ id: "a", email: "x@y.com", firstName: "X", lastName: "Y", status: "APPROVED" }) as any
  approveApplicationDeps.findUserByEmail = async () =>
    ({ id: "u", email: "x@y.com", password: null, status: "PENDING" }) as any
  approveApplicationDeps.upsertUserWithSetupToken = async () => {
    reissueUpsertCalls++
    return { id: "u" } as any
  }
  approveApplicationDeps.setApplicationApproved = async () => {
    reissueAppMarkApproved++
    return { id: "a" } as any
  }
  approveApplicationDeps.sendWelcomeEmail = async () => {
    reissueEmailCalls++
    return { success: true }
  }
  const r8 = await approvePOST(makeApproveReq("a"), ctx("a"))
  assert(r8.status === 200, `reissue → 200 (got ${r8.status})`)
  assert(reissueUpsertCalls === 1, `fresh token issued (upsert called once)`)
  assert(reissueEmailCalls === 1, `welcome email re-sent`)
  assert(reissueAppMarkApproved === 0, `application status NOT touched on reissue (already APPROVED)`)

  console.log("\n8b. Approve route ALSO covers OAuth edge: APPROVED user with no password → fresh link issued")
  // OAuth-created user has status=APPROVED, password=null. Admin approves
  // their provider application → we must issue a setup link. The approve
  // route should treat this as a reissue (no application status change),
  // and the upsert MUST also reset status to PENDING so the atomic consume
  // in /auth/set-password (which filters status=PENDING) can succeed.
  let oauthUpserts = 0
  approveApplicationDeps.findApplication = async () =>
    ({ id: "a", email: "x@y.com", firstName: "X", lastName: "Y", status: "APPROVED" }) as any
  approveApplicationDeps.findUserByEmail = async () =>
    ({ id: "u", email: "x@y.com", password: null, status: "APPROVED" }) as any
  approveApplicationDeps.upsertUserWithSetupToken = async () => {
    oauthUpserts++
    return { id: "u" } as any
  }
  const r8b = await approvePOST(makeApproveReq("a"), ctx("a"))
  assert(r8b.status === 200, `OAuth-APPROVED + no-password reissue → 200 (got ${r8b.status})`)
  assert(oauthUpserts === 1, `setup token issued for OAuth user`)

  // Lock in that the production upsert SQL itself includes status:"PENDING"
  // in its update branch (so the consume can actually succeed for this user).
  const approveDepsSrc = fs.readFileSync(
    "src/app/api/admin/applications/[id]/approve/deps.ts",
    "utf8",
  )
  const updateMatch = approveDepsSrc.match(/update:\s*\{[\s\S]*?\},/)
  assert(
    !!updateMatch && /status:\s*["']PENDING["']/.test(updateMatch[0]),
    `upsert update branch resets status to PENDING (lets set-password consume succeed)`,
  )

  console.log("\n9. Approve route returns 409 when user already has a password")
  approveApplicationDeps.findApplication = async () =>
    ({ id: "a", email: "x@y.com", firstName: "X", lastName: "Y", status: "PENDING" }) as any
  approveApplicationDeps.findUserByEmail = async () =>
    ({ id: "u", email: "x@y.com", password: "$2a$12$existing", status: "APPROVED" }) as any
  const r9 = await approvePOST(makeApproveReq("a"), ctx("a"))
  assert(r9.status === 409, `user with password → 409 (got ${r9.status})`)

  console.log("\n10. Approve route happy path: upserts user + token, marks approved, sends email with setup URL")
  let upsertedToken: string | undefined
  let upsertedExpiry: Date | undefined
  let appUpdateId: string | undefined
  let emailedTo: string | undefined
  let emailedSetupUrl: string | undefined
  let generatedToken: string | undefined

  approveApplicationDeps.findApplication = async () =>
    ({ id: "app-ok", email: "new@clinic.com", firstName: "New", lastName: "Provider", status: "PENDING" }) as any
  approveApplicationDeps.findUserByEmail = async () => null
  approveApplicationDeps.generateSetupToken = () => {
    const t = generateSetupToken()
    generatedToken = t.token
    return t
  }
  // Belt-and-suspenders: also stub the legacy non-transactional path so a
  // regression that bypasses the atomic helper would still fail loudly.
  let nonAtomicCalls = 0
  approveApplicationDeps.upsertUserWithSetupToken = async () => {
    nonAtomicCalls++
    return { id: "u-new" } as any
  }
  approveApplicationDeps.setApplicationApproved = async () => {
    nonAtomicCalls++
    return { id: "app-ok" } as any
  }
  approveApplicationDeps.upsertUserAndApproveApplication = async (params) => {
    upsertedToken = params.setupTokenHash
    upsertedExpiry = params.setupTokenExpiresAt
    appUpdateId = params.applicationId
    return [{ id: "u-new" }, { id: params.applicationId }] as any
  }
  approveApplicationDeps.sendWelcomeEmail = async (data) => {
    emailedTo = data.email
    emailedSetupUrl = data.setupUrl
    return { success: true }
  }

  const r10 = await approvePOST(makeApproveReq("app-ok"), ctx("app-ok"))
  const j10 = await r10.json()
  assert(r10.status === 200, `happy path → 200 (got ${r10.status})`)
  assert(j10.success === true, `body.success = true`)
  assert(upsertedToken === hashSetupToken(generatedToken!), `stored hash matches sha256(generated token)`)
  assert(upsertedExpiry instanceof Date && upsertedExpiry.getTime() > Date.now(), `expiry is in the future`)
  assert(appUpdateId === "app-ok", `application marked APPROVED via atomic transaction`)
  assert(nonAtomicCalls === 0, `first-time approval uses the atomic helper, not the legacy split writes`)
  assert(emailedTo === "new@clinic.com", `welcome email sent to applicant address`)
  assert(
    typeof emailedSetupUrl === "string" &&
      emailedSetupUrl.includes("/auth/set-password?token=") &&
      emailedSetupUrl.includes(encodeURIComponent(generatedToken!)),
    `setup URL contains /auth/set-password?token=<encoded raw token>`,
  )
  assert(
    !emailedSetupUrl!.includes(upsertedToken!),
    `setup URL does NOT leak the stored hash`,
  )

  console.log("\n11. Approve route returns 200 with warning when email send fails")
  approveApplicationDeps.findApplication = async () =>
    ({ id: "app-w", email: "warn@clinic.com", firstName: "W", lastName: "Z", status: "PENDING" }) as any
  approveApplicationDeps.findUserByEmail = async () => null
  approveApplicationDeps.upsertUserAndApproveApplication = async () => [] as any
  approveApplicationDeps.sendWelcomeEmail = async () => ({ success: false, error: "boom" })
  const r11 = await approvePOST(makeApproveReq("app-w"), ctx("app-w"))
  const j11 = await r11.json()
  assert(r11.status === 200, `email-fail → still 200 (got ${r11.status})`)
  assert(j11.success === true, `body.success = true`)
  assert(typeof j11.warning === "string" && j11.warning.length > 0, `warning string present`)

  console.log("\n12. Approve route returns 500 when DB throws")
  approveApplicationDeps.findApplication = async () => {
    throw new Error("DB_DOWN")
  }
  const r12 = await approvePOST(makeApproveReq("app-z"), ctx("app-z"))
  assert(r12.status === 500, `DB error → 500 (got ${r12.status})`)

  // ──────────────────────────────────────────────────────────────────────────
  // Reject route
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n12a. Reject route rejects unauthenticated requests with 401")
  const rR1 = await rejectPOST(makeRejectReq("app-1", false), ctx("app-1"))
  assert(rR1.status === 401, `unauth returns 401 (got ${rR1.status})`)

  console.log("\n12b. Reject route returns 404 when application missing")
  rejectApplicationDeps.findApplication = async () => null
  const rR2 = await rejectPOST(makeRejectReq("missing"), ctx("missing"))
  assert(rR2.status === 404, `missing app → 404 (got ${rR2.status})`)

  console.log("\n12c. Reject route refuses to reject an already-APPROVED application (409)")
  let rejectStatusFlips = 0
  let rejectEmailSends = 0
  rejectApplicationDeps.findApplication = async () =>
    ({ id: "a", email: "x@y.com", firstName: "X", lastName: "Y", status: "APPROVED" }) as any
  rejectApplicationDeps.setApplicationRejected = async () => {
    rejectStatusFlips++
    return { id: "a" } as any
  }
  rejectApplicationDeps.sendRejectionEmail = async () => {
    rejectEmailSends++
    return { success: true }
  }
  const rR3 = await rejectPOST(makeRejectReq("a"), ctx("a"))
  assert(rR3.status === 409, `already APPROVED → 409 (got ${rR3.status})`)
  assert(rejectStatusFlips === 0, `status NOT flipped when application is already decided`)
  assert(rejectEmailSends === 0, `no email sent when application is already decided`)

  console.log("\n12d. Reject route is idempotent-safe: already-REJECTED returns 409, no double email")
  rejectStatusFlips = 0
  rejectEmailSends = 0
  rejectApplicationDeps.findApplication = async () =>
    ({ id: "a", email: "x@y.com", firstName: "X", lastName: "Y", status: "REJECTED" }) as any
  const rR4 = await rejectPOST(makeRejectReq("a"), ctx("a"))
  assert(rR4.status === 409, `already REJECTED → 409 (got ${rR4.status})`)
  assert(rejectStatusFlips === 0 && rejectEmailSends === 0, `no DB write or email on second reject`)

  console.log("\n12e. Reject route happy path: flips PENDING → REJECTED and emails the applicant")
  let flippedId: string | undefined
  let emailedRejectTo: string | undefined
  let emailedRejectName: string | undefined
  rejectApplicationDeps.findApplication = async () =>
    ({ id: "app-r", email: "decline@clinic.com", firstName: "De", lastName: "Cline", status: "PENDING" }) as any
  rejectApplicationDeps.setApplicationRejected = async (id) => {
    flippedId = id
    return { id } as any
  }
  rejectApplicationDeps.sendRejectionEmail = async (data) => {
    emailedRejectTo = data.email
    emailedRejectName = data.name
    return { success: true }
  }
  const rR5 = await rejectPOST(makeRejectReq("app-r"), ctx("app-r"))
  const jR5 = await rR5.json()
  assert(rR5.status === 200, `happy path → 200 (got ${rR5.status})`)
  assert(jR5.success === true, `body.success = true`)
  assert(flippedId === "app-r", `application flipped to REJECTED via setApplicationRejected`)
  assert(emailedRejectTo === "decline@clinic.com", `rejection email sent to applicant address`)
  assert(emailedRejectName === "De Cline", `rejection email uses applicant full name`)

  console.log("\n12f. Reject route returns 200 with warning when email send fails")
  rejectApplicationDeps.findApplication = async () =>
    ({ id: "app-rw", email: "warn@clinic.com", firstName: "W", lastName: "Z", status: "PENDING" }) as any
  rejectApplicationDeps.setApplicationRejected = async () => ({ id: "app-rw" }) as any
  rejectApplicationDeps.sendRejectionEmail = async () => ({ success: false, error: "boom" })
  const rR6 = await rejectPOST(makeRejectReq("app-rw"), ctx("app-rw"))
  const jR6 = await rR6.json()
  assert(rR6.status === 200, `email-fail → still 200 (got ${rR6.status})`)
  assert(jR6.success === true, `body.success = true`)
  assert(typeof jR6.warning === "string" && jR6.warning.length > 0, `warning string present`)

  console.log("\n12g. Reject route returns 500 when DB throws")
  rejectApplicationDeps.findApplication = async () => {
    throw new Error("DB_DOWN")
  }
  const rR7 = await rejectPOST(makeRejectReq("app-rz"), ctx("app-rz"))
  assert(rR7.status === 500, `DB error → 500 (got ${rR7.status})`)

  // ──────────────────────────────────────────────────────────────────────────
  // consumeSetupToken (set-password Server Action core)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n13. consumeSetupToken rejects empty token")
  const r13 = await consumeSetupToken({
    token: "",
    password: "longenough123",
    confirmPassword: "longenough123",
    deps: stubDeps(0),
  })
  assert(!r13.ok, "empty token → not ok")

  console.log("\n14. consumeSetupToken rejects short password")
  const r14 = await consumeSetupToken({
    token: "abc",
    password: "short1",
    confirmPassword: "short1",
    deps: stubDeps(1),
  })
  assert(!r14.ok && /8 characters/i.test((r14 as any).error), "short password → 8-char error")

  console.log("\n14b. consumeSetupToken rejects password missing letters (complexity)")
  const r14b = await consumeSetupToken({
    token: "abc",
    password: "12345678",
    confirmPassword: "12345678",
    deps: stubDeps(1),
  })
  assert(!r14b.ok && /letter/i.test((r14b as any).error), "all-digits → letter error")

  console.log("\n14c. consumeSetupToken rejects password missing numbers (complexity)")
  const r14c = await consumeSetupToken({
    token: "abc",
    password: "abcdefgh",
    confirmPassword: "abcdefgh",
    deps: stubDeps(1),
  })
  assert(!r14c.ok && /number/i.test((r14c as any).error), "all-letters → number error")

  console.log("\n15. consumeSetupToken rejects mismatched passwords")
  const r15 = await consumeSetupToken({
    token: "abc",
    password: "longenough123",
    confirmPassword: "different1234",
    deps: stubDeps(1),
  })
  assert(!r15.ok && /do not match/i.test((r15 as any).error), "mismatch → match error")

  console.log("\n16. consumeSetupToken rejects unknown / consumed token (atomic update returns 0)")
  const r16 = await consumeSetupToken({
    token: "unknown",
    password: "longenough123",
    confirmPassword: "longenough123",
    deps: stubDeps(0),
  })
  assert(!r16.ok && /invalid|expired|already been used/i.test((r16 as any).error), "0 rows → invalid/expired")

  console.log("\n17. consumeSetupToken happy path: atomic update succeeds (1 row)")
  let consumeArgs: { tokenHash: string; passwordHash: string; now: Date } | undefined
  const r17 = await consumeSetupToken({
    token: "valid-token",
    password: "supersecret1",
    confirmPassword: "supersecret1",
    deps: {
      hashSetupToken: (s: string) => `H(${s})`,
      findUserByTokenHash: async () => null,
      hashPassword: async (pw: string) => `BCRYPT(${pw})`,
      consumeTokenAtomic: async (args) => {
        consumeArgs = args
        return 1
      },
    },
  })
  assert(r17.ok, "valid → ok")
  assert(consumeArgs?.tokenHash === "H(valid-token)", "consumeTokenAtomic called with hashed token")
  assert(consumeArgs?.passwordHash === "BCRYPT(supersecret1)", "consumeTokenAtomic called with bcrypt password hash")
  assert(consumeArgs?.now instanceof Date, "consumeTokenAtomic called with current time for expiry check")

  console.log("\n18. consumeSetupToken concurrent replay: only first request wins (atomic)")
  // Simulate two parallel requests racing on the same token. The atomic
  // update returns 1 to the winner and 0 to the loser; no double-set possible.
  let calls = 0
  const racingDeps = {
    hashSetupToken: (s: string) => `H(${s})`,
    findUserByTokenHash: async () => null,
    hashPassword: async (pw: string) => `BCRYPT(${pw})`,
    consumeTokenAtomic: async () => {
      calls++
      return calls === 1 ? 1 : 0
    },
  }
  const [a, b] = await Promise.all([
    consumeSetupToken({
      token: "race-token",
      password: "longenough123",
      confirmPassword: "longenough123",
      deps: racingDeps,
    }),
    consumeSetupToken({
      token: "race-token",
      password: "longenough123",
      confirmPassword: "longenough123",
      deps: racingDeps,
    }),
  ])
  assert(a.ok !== b.ok, "exactly one of two concurrent requests succeeds")
}

function stubDeps(updatedRows: number) {
  return {
    hashSetupToken: (s: string) => `H(${s})`,
    findUserByTokenHash: async () => null,
    hashPassword: async (pw: string) => `BCRYPT(${pw})`,
    consumeTokenAtomic: async () => updatedRows,
  }
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
