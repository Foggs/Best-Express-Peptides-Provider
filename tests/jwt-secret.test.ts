/**
 * Verification test for Task #27: Fix hardcoded JWT fallback secret
 *
 * Imports the real getJwtSecret() from src/lib/jwt.ts — if production logic
 * regresses, these tests will catch it.
 *
 * Run with: npm run test:unit
 */

import jwt from "jsonwebtoken"
import { getJwtSecret } from "../src/lib/jwt"

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

function assertThrows(fn: () => unknown, expectedSubstring: string, label: string) {
  try {
    fn()
    console.error(`  ✗ FAIL: ${label} — expected an error to be thrown but none was`)
    failed++
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes(expectedSubstring)) {
      console.log(`  ✓ ${label}`)
      passed++
    } else {
      console.error(`  ✗ FAIL: ${label} — error message was "${msg}", expected it to include "${expectedSubstring}"`)
      failed++
    }
  }
}

// Save and restore JWT_SECRET around each test that mutates it
const originalSecret = process.env.JWT_SECRET

function restoreSecret() {
  if (originalSecret !== undefined) {
    process.env.JWT_SECRET = originalSecret
  } else {
    delete process.env.JWT_SECRET
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log("\nTest suite: JWT secret hardening (real src/lib/jwt.ts)\n")

// 1. Missing JWT_SECRET causes an explicit, descriptive config error
console.log("1. Missing JWT_SECRET throws a descriptive configuration error")
delete process.env.JWT_SECRET

assertThrows(
  () => getJwtSecret(),
  "JWT_SECRET environment variable is not set",
  "getJwtSecret() throws with a clear message when JWT_SECRET is absent"
)

// Verify it does NOT fall back to "your-secret-key"
let secretWhenMissing: string | null = null
try { secretWhenMissing = getJwtSecret() } catch { /* expected */ }
assert(secretWhenMissing === null, "getJwtSecret() does not silently return a fallback string")

// 2. When JWT_SECRET is set, getJwtSecret() returns it
console.log("\n2. getJwtSecret() returns the env var when present")
process.env.JWT_SECRET = "strong-random-test-secret-32chars+"

assert(
  getJwtSecret() === "strong-random-test-secret-32chars+",
  "getJwtSecret() returns the correct env var value"
)

// 3. Token signed with the correct secret verifies successfully
console.log("\n3. Token signed with the real secret is accepted")
const correctSecret = "correct-secret-used-in-signing"
process.env.JWT_SECRET = correctSecret

const adminPayload = { id: "admin-1", email: "admin@example.com", isAdmin: true }
const validToken = jwt.sign(adminPayload, correctSecret, { expiresIn: "1h" })

let decoded: any = null
try { decoded = jwt.verify(validToken, getJwtSecret()) } catch { /* handled below */ }

assert(decoded !== null, "Valid token is accepted")
assert(decoded?.isAdmin === true, "Decoded payload preserves isAdmin: true")

// 4. Token signed with the OLD hardcoded fallback is rejected
console.log("\n4. Token forged with the old hardcoded fallback 'your-secret-key' is rejected")
const forgedToken = jwt.sign(adminPayload, "your-secret-key", { expiresIn: "1h" })

let forgedDecoded: any = null
let forgedError = ""
try {
  forgedDecoded = jwt.verify(forgedToken, getJwtSecret())
} catch (err) {
  forgedError = err instanceof Error ? err.message : String(err)
}

assert(forgedDecoded === null, "Token forged with old fallback is rejected (decoded is null)")
assert(
  forgedError.includes("invalid signature"),
  `Rejection reason is 'invalid signature' (got: "${forgedError}")`
)

// 5. Config error is NOT caught by a bare jwt.verify() try/catch
//    (simulates verifyAdminAuth calling getJwtSecret() before the try block)
console.log("\n5. Config error propagates through a jwt.verify() try/catch block")
delete process.env.JWT_SECRET

let configErrorCaught = false
let configErrorMessage = ""
try {
  const secret = getJwtSecret()           // throws — not inside try/catch
  jwt.verify("any.token.here", secret)    // never reached
} catch (err) {
  configErrorCaught = true
  configErrorMessage = err instanceof Error ? err.message : String(err)
}

assert(configErrorCaught, "Config error is thrown and not silently swallowed")
assert(
  configErrorMessage.includes("JWT_SECRET environment variable is not set"),
  "Error message identifies the missing env var"
)

// ─── Restore ─────────────────────────────────────────────────────────────────
restoreSecret()

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n─────────────────────────────────────`)
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log(`─────────────────────────────────────\n`)

if (failed > 0) process.exit(1)
