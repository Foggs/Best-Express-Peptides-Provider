import { NextRequest } from "next/server"
import { rateLimit, getRateLimitHeaders } from "../src/lib/rate-limit"

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++ }
  else { console.error(`  ✗ FAIL: ${msg}`); failed++ }
}

function makeRequest(ip: string): NextRequest {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  })
}

async function run() {
  console.log("\nTest suite: rateLimit() — RateLimiterMemory replaces hand-rolled store\n")

  // Use limit=3 throughout.  Each sub-test uses a fresh IP so the shared
  // RateLimiterMemory instance tracks each IP independently.
  const LIMIT = 3
  const WINDOW_MS = 60_000

  // ── 1. Requests within limit succeed, remaining decrements ────────────
  console.log("1. Requests within limit succeed and remaining counts down")
  {
    const ip = "rl-ip-within"
    const r1 = await rateLimit(makeRequest(ip), LIMIT, WINDOW_MS)
    assert(r1.success === true, `call 1/${LIMIT}: success = true`)
    assert(r1.remaining === LIMIT - 1, `call 1/${LIMIT}: remaining = ${r1.remaining} (expected ${LIMIT - 1})`)

    const r2 = await rateLimit(makeRequest(ip), LIMIT, WINDOW_MS)
    assert(r2.success === true, `call 2/${LIMIT}: success = true`)
    assert(r2.remaining === LIMIT - 2, `call 2/${LIMIT}: remaining = ${r2.remaining} (expected ${LIMIT - 2})`)

    const r3 = await rateLimit(makeRequest(ip), LIMIT, WINDOW_MS)
    assert(r3.success === true, `call 3/${LIMIT} (last allowed): success = true`)
    assert(r3.remaining === 0, `call 3/${LIMIT}: remaining = ${r3.remaining} (expected 0)`)
  }

  // ── 2. Call over limit returns { success: false, remaining: 0 } ───────
  console.log("\n2. Call over limit returns success=false")
  {
    const ip = "rl-ip-overlimit"
    for (let i = 0; i < LIMIT; i++) {
      await rateLimit(makeRequest(ip), LIMIT, WINDOW_MS)
    }
    const over = await rateLimit(makeRequest(ip), LIMIT, WINDOW_MS)
    assert(over.success === false, `call ${LIMIT + 1}: success = false (rate limited)`)
    assert(over.remaining === 0, `call ${LIMIT + 1}: remaining = 0 (got ${over.remaining})`)

    // Subsequent calls also return false — not unbounded
    const over2 = await rateLimit(makeRequest(ip), LIMIT, WINDOW_MS)
    assert(over2.success === false, `call ${LIMIT + 2}: still rate limited (success = false)`)
  }

  // ── 3. Different IPs have independent quotas ──────────────────────────
  console.log("\n3. Different IPs are tracked independently")
  {
    const ipA = "rl-ip-independent-a"
    const ipB = "rl-ip-independent-b"

    // Exhaust ipA
    for (let i = 0; i < LIMIT; i++) {
      await rateLimit(makeRequest(ipA), LIMIT, WINDOW_MS)
    }
    const aOver = await rateLimit(makeRequest(ipA), LIMIT, WINDOW_MS)
    assert(aOver.success === false, "IP-A is rate limited after exhausting quota")

    // ipB should still have its full quota
    const bFirst = await rateLimit(makeRequest(ipB), LIMIT, WINDOW_MS)
    assert(bFirst.success === true, "IP-B is not affected by IP-A's limit — success = true")
    assert(bFirst.remaining === LIMIT - 1, `IP-B remaining = ${bFirst.remaining} (expected ${LIMIT - 1})`)
  }

  // ── 4. Fallback IP ('unknown') works when no header is present ────────
  console.log("\n4. Missing IP header falls back to 'unknown' without throwing")
  {
    const req = new NextRequest("http://localhost/api/checkout", { method: "POST" })
    const r = await rateLimit(req, 100, 60_000)
    assert(typeof r.success === "boolean", `fallback IP: result has boolean success field (${r.success})`)
    assert(typeof r.remaining === "number", `fallback IP: result has numeric remaining field (${r.remaining})`)
  }

  // ── 5. getRateLimitHeaders returns correctly shaped headers ───────────
  console.log("\n5. getRateLimitHeaders returns correct header values")
  {
    const headers = getRateLimitHeaders(42, 100)
    assert(headers["RateLimit-Limit"] === "100", `RateLimit-Limit = "${headers["RateLimit-Limit"]}" (expected "100")`)
    assert(headers["RateLimit-Remaining"] === "42", `RateLimit-Remaining = "${headers["RateLimit-Remaining"]}" (expected "42")`)
    assert(typeof headers["RateLimit-Reset"] === "string", `RateLimit-Reset is a string: "${headers["RateLimit-Reset"]}"`)
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
