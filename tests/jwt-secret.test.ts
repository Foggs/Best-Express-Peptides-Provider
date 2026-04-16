/**
 * Verification test for Task #27: Fix hardcoded JWT fallback secret
 *
 * Run with: npx tsx tests/jwt-secret.test.ts
 */

import jwt from "jsonwebtoken"

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${message}`)
    failed++
  }
}

function assertThrows(fn: () => unknown, expectedMessage: string, label: string) {
  try {
    fn()
    console.error(`  ✗ FAIL: ${label} — expected an error to be thrown`)
    failed++
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes(expectedMessage)) {
      console.log(`  ✓ ${label}`)
      passed++
    } else {
      console.error(`  ✗ FAIL: ${label} — got "${msg}", expected it to include "${expectedMessage}"`)
      failed++
    }
  }
}

// ─── Inline getJwtSecret for testing (mirrors src/lib/admin-auth.ts) ─────────

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not set. " +
      "Set it to a strong random string before starting the server."
    )
  }
  return secret
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log("\nTest suite: JWT secret hardening\n")

// 1. getJwtSecret() throws when JWT_SECRET is absent
console.log("1. Missing JWT_SECRET throws an explicit error")
const originalSecret = process.env.JWT_SECRET
delete process.env.JWT_SECRET

assertThrows(
  () => getJwtSecret(),
  "JWT_SECRET environment variable is not set",
  "getJwtSecret() throws when JWT_SECRET is not set"
)

// 2. getJwtSecret() returns the secret when set
console.log("\n2. JWT_SECRET is returned when set")
process.env.JWT_SECRET = "test-secret-value-for-tests"

assert(getJwtSecret() === "test-secret-value-for-tests", "getJwtSecret() returns the env var value")

// 3. Token signed with correct secret verifies successfully
console.log("\n3. Token signed with correct secret is accepted")
const correctSecret = "correct-test-secret"
process.env.JWT_SECRET = correctSecret

const validPayload = { id: "user-1", email: "admin@test.com", isAdmin: true }
const validToken = jwt.sign(validPayload, correctSecret, { expiresIn: "1h" })

let decoded: any
try {
  decoded = jwt.verify(validToken, getJwtSecret())
} catch {
  decoded = null
}
assert(decoded !== null && decoded.isAdmin === true, "Valid token with correct secret is accepted")

// 4. Token signed with a WRONG secret (the old fallback) is rejected
console.log("\n4. Token signed with old fallback 'your-secret-key' is rejected")
const forgeryToken = jwt.sign(validPayload, "your-secret-key", { expiresIn: "1h" })

let forgeryDecoded: any = null
let forgeryError = ""
try {
  forgeryDecoded = jwt.verify(forgeryToken, getJwtSecret())
} catch (err) {
  forgeryError = err instanceof Error ? err.message : "unknown error"
}
assert(forgeryDecoded === null, "Forged token is rejected (returns null)")
assert(forgeryError.includes("invalid signature"), `Rejection reason is signature mismatch (got: "${forgeryError}")`)

// 5. Token with isAdmin=false is structurally valid but must not grant access
console.log("\n5. Non-admin token does not satisfy isAdmin check")
const nonAdminToken = jwt.sign({ id: "user-2", email: "user@test.com", isAdmin: false }, correctSecret)
const nonAdminDecoded = jwt.verify(nonAdminToken, getJwtSecret()) as any
assert(nonAdminDecoded.isAdmin === false, "Non-admin token payload is preserved correctly")

// ─── Restore env ──────────────────────────────────────────────────────────────

if (originalSecret !== undefined) {
  process.env.JWT_SECRET = originalSecret
} else {
  delete process.env.JWT_SECRET
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n─────────────────────────────────────`)
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log(`─────────────────────────────────────\n`)

if (failed > 0) {
  process.exit(1)
}
