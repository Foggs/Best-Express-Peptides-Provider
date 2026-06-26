import { NextRequest } from "next/server"
import { POST } from "../src/app/api/admin/login/route"
import { prisma } from "../src/lib/prisma"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++ }
  else { console.error(`  ✗ FAIL: ${msg}`); failed++ }
}

function makeReq(body: Record<string, unknown>, ip?: string): NextRequest {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (ip) headers["x-forwarded-for"] = ip
  return new NextRequest("http://localhost/api/admin/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  })
}

async function run() {
  console.log("\nTest suite: POST /api/admin/login — correct credentials, rejection cases\n")

  // Set JWT_SECRET so getJwtSecret() doesn't throw
  process.env.JWT_SECRET = "test-admin-login-secret-32-chars!!"

  // Pre-hash the test password at cost-factor 1 (bcryptjs minimum ≥ 4 rounds — still fast)
  const PLAIN = "TestPass1!"
  const HASH = await bcrypt.hash(PLAIN, 1)

  const baseAdmin = {
    id: "admin-01",
    email: "admin@example.com",
    name: "Admin",
    password: HASH,
    isAdmin: true,
  }

  // ── 1. Valid admin credentials → 200 + valid JWT ──────────────────────
  console.log("1. Valid admin credentials return 200 with a signed JWT")
  ;(prisma.user as any).findUnique = async () => baseAdmin

  const r1 = await POST(makeReq({ email: baseAdmin.email, password: PLAIN }))
  const j1 = await r1.json()

  assert(r1.status === 200, `valid creds: status 200 (got ${r1.status})`)
  assert(j1.success === true, `valid creds: success = true`)
  assert(typeof j1.token === "string" && j1.token.length > 0, `valid creds: token is non-empty string`)

  const decoded = jwt.verify(j1.token, process.env.JWT_SECRET) as Record<string, unknown>
  assert(decoded.email === baseAdmin.email, `JWT email = "${decoded.email}"`)
  assert(decoded.isAdmin === true, `JWT isAdmin = ${decoded.isAdmin}`)
  assert(j1.user.id === baseAdmin.id, `response user.id matches`)

  // ── 2. Wrong password → 401 ───────────────────────────────────────────
  console.log("\n2. Wrong password returns 401")
  ;(prisma.user as any).findUnique = async () => baseAdmin

  const r2 = await POST(makeReq({ email: baseAdmin.email, password: "WrongPass!" }))
  const j2 = await r2.json()

  assert(r2.status === 401, `wrong password: status 401 (got ${r2.status})`)
  assert(typeof j2.error === "string", `wrong password: error field present: "${j2.error}"`)
  assert(!("token" in j2), `wrong password: no token in response`)

  // ── 3. Non-admin user → 403 ───────────────────────────────────────────
  console.log("\n3. Non-admin user returns 403")
  ;(prisma.user as any).findUnique = async () => ({ ...baseAdmin, isAdmin: false })

  const r3 = await POST(makeReq({ email: baseAdmin.email, password: PLAIN }))
  const j3 = await r3.json()

  assert(r3.status === 403, `non-admin: status 403 (got ${r3.status})`)
  assert(!("token" in j3), `non-admin: no token in response`)

  // ── 4. Unknown email → 401 ────────────────────────────────────────────
  console.log("\n4. Unknown email returns 401")
  ;(prisma.user as any).findUnique = async () => null

  const r4 = await POST(makeReq({ email: "nobody@example.com", password: PLAIN }))
  const j4 = await r4.json()

  assert(r4.status === 401, `unknown email: status 401 (got ${r4.status})`)
  assert(!("token" in j4), `unknown email: no token`)

  // ── 5. Missing credentials → 400 ─────────────────────────────────────
  console.log("\n5. Missing credentials return 400")

  const r5 = await POST(makeReq({ email: "admin@example.com" }))
  const j5 = await r5.json()

  assert(r5.status === 400, `missing password: status 400 (got ${r5.status})`)
  assert(typeof j5.error === "string", `missing password: error field present`)

  // ── 6. OAuth-only account → 401 ───────────────────────────────────────
  console.log("\n6. OAuth-only account (no password hash) returns 401")
  ;(prisma.user as any).findUnique = async () => ({ ...baseAdmin, password: null })

  const r6 = await POST(makeReq({ email: baseAdmin.email, password: PLAIN }))
  const j6 = await r6.json()

  assert(r6.status === 401, `OAuth-only: status 401 (got ${r6.status})`)
  assert(!("token" in j6), `OAuth-only: no token in response`)

  // ── 7. Brute-force is throttled: repeated failures from one IP → 429 ───
  // Uses an isolated client IP so it does not consume the shared "unknown"
  // bucket used by the rejection cases above. The limiter defaults to 10
  // failure points per IP, so the 11th attempt must be blocked.
  console.log("\n7. Repeated failed admin logins from one IP eventually return 429")
  ;(prisma.user as any).findUnique = async () => baseAdmin
  const ATTACKER_IP = "203.0.113.50"
  let sawBlock = false
  let blockedResponse: Response | null = null
  for (let i = 0; i < 15; i++) {
    const r = await POST(makeReq({ email: baseAdmin.email, password: "WrongPass!" }, ATTACKER_IP))
    if (r.status === 429) {
      sawBlock = true
      blockedResponse = r
      break
    }
  }
  assert(sawBlock, `brute-force eventually returns 429 within the failure budget`)
  if (blockedResponse) {
    const jb = await blockedResponse.json()
    assert(typeof jb.error === "string", `429 response carries an error message`)
    assert(
      blockedResponse.headers.has("Retry-After"),
      `429 response includes a Retry-After header`,
    )
  }

  // ── 8. Limiter is per-IP: a fresh IP with valid creds still succeeds ───
  console.log("\n8. A different IP with valid credentials is unaffected by another IP's lockout")
  ;(prisma.user as any).findUnique = async () => baseAdmin
  const r8 = await POST(makeReq({ email: baseAdmin.email, password: PLAIN }, "203.0.113.99"))
  assert(r8.status === 200, `fresh IP valid login: status 200 (got ${r8.status})`)
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
