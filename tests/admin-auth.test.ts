import { createRequire } from "module"

const _require = createRequire(import.meta.url)
const nodeModule = _require("module") as { _load: Function }

process.env.JWT_SECRET = "test-secret-admin-auth-33"

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++ }
  else { console.error(`  ✗ FAIL: ${msg}`); failed++ }
}

function makeRequest(authHeader?: string) {
  return {
    headers: {
      get: (name: string) => name === "authorization" ? (authHeader ?? null) : null,
    },
  }
}

async function run() {
  console.log("\nTest suite: verifyAdminAuth — synchronous after async removal\n")

  const origLoad = nodeModule._load
  nodeModule._load = function (id: string, ...rest: unknown[]) {
    if (id.includes("next/server")) {
      return { NextRequest: class {}, NextResponse: { json: () => ({}) } }
    }
    return origLoad.call(this, id, ...rest)
  }

  try {
    const { verifyAdminAuth } = _require("../src/lib/admin-auth")
    const jwt = _require("jsonwebtoken")
    const secret = process.env.JWT_SECRET!

    console.log("1. Missing authorization header → { valid: false, user: null }")
    const r1 = verifyAdminAuth(makeRequest())
    assert(!(r1 instanceof Promise), "result is NOT a Promise (synchronous)")
    assert(r1.valid === false, "no header: valid = false")
    assert(r1.user === null, "no header: user = null")

    console.log("\n2. Non-Bearer header → { valid: false }")
    const r2 = verifyAdminAuth(makeRequest("Basic dXNlcjpwYXNz"))
    assert(!(r2 instanceof Promise), "non-Bearer: NOT a Promise")
    assert(r2.valid === false, "non-Bearer: valid = false")

    console.log("\n3. Malformed Bearer token → { valid: false }")
    const r3 = verifyAdminAuth(makeRequest("Bearer not-a-real-jwt"))
    assert(r3.valid === false, "bad token: valid = false")
    assert(r3.user === null, "bad token: user = null")

    console.log("\n4. Valid JWT with isAdmin=false → { valid: false }")
    const nonAdminToken = jwt.sign({ id: "u1", email: "user@test.com", isAdmin: false }, secret)
    const r4 = verifyAdminAuth(makeRequest(`Bearer ${nonAdminToken}`))
    assert(r4.valid === false, "non-admin token: valid = false")
    assert(r4.user === null, "non-admin token: user = null")

    console.log("\n5. Valid admin JWT → { valid: true, user: { isAdmin: true } }")
    const adminToken = jwt.sign({ id: "a1", email: "admin@test.com", isAdmin: true }, secret)
    const r5 = verifyAdminAuth(makeRequest(`Bearer ${adminToken}`))
    assert(!(r5 instanceof Promise), "admin token: NOT a Promise (synchronous)")
    assert(r5.valid === true, "admin token: valid = true")
    assert(r5.user !== null, "admin token: user is not null")
    assert(r5.user?.isAdmin === true, "admin token: user.isAdmin = true")
    assert(r5.user?.email === "admin@test.com", `admin token: user.email = "${r5.user?.email}"`)

    console.log("\n6. Token signed with wrong secret → { valid: false }")
    const wrongToken = jwt.sign({ id: "a2", email: "hacker@test.com", isAdmin: true }, "wrong-secret")
    const r6 = verifyAdminAuth(makeRequest(`Bearer ${wrongToken}`))
    assert(r6.valid === false, "wrong secret: valid = false")
    assert(r6.user === null, "wrong secret: user = null")

  } finally {
    nodeModule._load = origLoad
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
