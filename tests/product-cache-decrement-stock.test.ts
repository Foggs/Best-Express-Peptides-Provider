import { createRequire } from "module"

const _require = createRequire(import.meta.url)
const nodeModule = _require("module") as { _load: Function }

process.env.GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || "TEST_SHEET_ID"
// Keep retry backoff fast so the test suite stays under a second.
process.env.STOCK_WRITE_MIN_TIMEOUT_MS = "1"
process.env.STOCK_WRITE_MAX_TIMEOUT_MS = "5"

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++ }
  else { console.error(`  ✗ FAIL: ${msg}`); failed++ }
}

interface BatchUpdateCall {
  spreadsheetId: string
  requestBody: {
    valueInputOption: string
    data: { range: string; values: string[][] }[]
  }
}

function makeSheetMock(rows: string[][]) {
  const batchUpdates: BatchUpdateCall[] = []
  let getCount = 0
  return {
    batchUpdates,
    getCallCount: () => getCount,
    client: {
      spreadsheets: {
        values: {
          get: async () => {
            getCount++
            return { data: { values: rows } }
          },
          batchUpdate: async (call: BatchUpdateCall) => {
            batchUpdates.push(call)
            return { data: {} }
          },
        },
      },
    },
  }
}

/**
 * Build a mock whose `batchUpdate` calls a user-supplied handler so tests can
 * inject transient or permanent failures.  The handler receives the 1-indexed
 * call number and may return a value (success) or throw an error.
 */
function makeFlakyBatchUpdateMock(
  rows: string[][],
  batchUpdateHandler: (callIndex: number, call: BatchUpdateCall) => unknown | Promise<unknown>,
) {
  const batchUpdates: BatchUpdateCall[] = []
  return {
    batchUpdates,
    client: {
      spreadsheets: {
        values: {
          get: async () => ({ data: { values: rows } }),
          batchUpdate: async (call: BatchUpdateCall) => {
            batchUpdates.push(call)
            return batchUpdateHandler(batchUpdates.length, call)
          },
        },
      },
    },
  }
}

class FakeSheetsHttpError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.name = "FakeSheetsHttpError"
  }
}

async function run() {
  console.log("\nTest suite: decrementStock — Google Sheets write-back & cache invalidation\n")

  const origLoad = nodeModule._load
  let mock: ReturnType<typeof makeSheetMock>
  const revalidateCalls: string[] = []

  nodeModule._load = function (id: string, ...rest: unknown[]) {
    if (id.includes("googleSheets")) {
      return { getUncachableGoogleSheetClient: async () => mock.client }
    }
    if (id.includes("next/cache")) {
      return { revalidatePath: (p: string) => { revalidateCalls.push(p) } }
    }
    return origLoad.call(this, id, ...rest)
  }

  try {
    const { decrementStock } = _require("../src/lib/productCache")

    // ── Test 1: correct row/column targeting + batchUpdate call shape ──────
    console.log("1. Correct row/column targeting + batchUpdate request shape")
    mock = makeSheetMock([
      ["productSlug", "variantName", "price", "sku", "stock"],
      ["bpc-157", "5mg", "$50.00", "BPC-5", "20"],
      ["bpc-157", "10mg", "$80.00", "BPC-10", "15"],
      ["tb-500", "5mg", "$60.00", "TB-5", "30"],
    ])
    const r1 = await decrementStock([{ slug: "bpc-157", variantName: "10mg", quantity: 3 }])
    assert(r1.success === true, "success = true")
    assert(mock.batchUpdates.length === 1, "exactly 1 batchUpdate call")
    assert(mock.batchUpdates[0].requestBody.valueInputOption === "RAW", "valueInputOption = 'RAW'")
    assert(mock.batchUpdates[0].requestBody.data.length === 1, "data array has 1 entry")
    assert(mock.batchUpdates[0].requestBody.data[0].range === "Variants!E3", "targets row 3, column E (stock col, 10mg row)")
    assert(mock.batchUpdates[0].requestBody.data[0].values[0][0] === "12", "writes new stock '12' (15 - 3)")

    // ── Test 2: low-stock warnings emitted at threshold ────────────────────
    console.log("\n2. Low-stock warnings emitted when remaining ≤ 5")
    mock = makeSheetMock([
      ["productSlug", "variantName", "price", "sku", "stock"],
      ["ghrp-6", "5mg", "$30.00", "GH-5", "8"],
      ["ghrp-6", "10mg", "$50.00", "GH-10", "20"],
    ])
    const r2 = await decrementStock([
      { slug: "ghrp-6", variantName: "5mg", quantity: 5 },   // 8 - 5 = 3 → warning
      { slug: "ghrp-6", variantName: "10mg", quantity: 2 },  // 20 - 2 = 18 → no warning
    ])
    assert(r2.success === true, "success = true")
    assert(r2.lowStockWarnings.length === 1, "exactly 1 low-stock warning")
    assert(r2.lowStockWarnings[0].productSlug === "ghrp-6", "warning slug = 'ghrp-6'")
    assert(r2.lowStockWarnings[0].variantName === "5mg", "warning variantName = '5mg'")
    assert(r2.lowStockWarnings[0].remainingStock === 3, "warning remainingStock = 3")
    assert(mock.batchUpdates[0].requestBody.data.length === 2, "both items batched into one batchUpdate")

    // ── Test 3: no-match no-op ─────────────────────────────────────────────
    console.log("\n3. No matching variant → no batchUpdate call, success = true")
    mock = makeSheetMock([
      ["productSlug", "variantName", "price", "sku", "stock"],
      ["known-prod", "5mg", "$40.00", "KP-5", "10"],
    ])
    revalidateCalls.length = 0
    const r3 = await decrementStock([{ slug: "unknown-prod", variantName: "5mg", quantity: 1 }])
    assert(r3.success === true, "no-match: success = true")
    assert(r3.lowStockWarnings.length === 0, "no warnings")
    assert(mock.batchUpdates.length === 0, "no batchUpdate call when nothing to update")
    assert(revalidateCalls.length === 0, "no cache revalidation when nothing to update")

    // ── Test 4: cache cleared + paths revalidated after successful write ──
    console.log("\n4. Successful decrement clears cache + revalidates paths")
    mock = makeSheetMock([
      ["productSlug", "variantName", "price", "sku", "stock"],
      ["prod-x", "5mg", "$40.00", "X-5", "20"],
    ])
    revalidateCalls.length = 0
    const r4 = await decrementStock([{ slug: "prod-x", variantName: "5mg", quantity: 1 }])
    assert(r4.success === true, "decrement success")
    assert(revalidateCalls.includes("/peptides"), "revalidatePath called with '/peptides'")
    assert(revalidateCalls.includes("/"), "revalidatePath called with '/'")

    // ── Test 5: empty sheet returns explicit error ─────────────────────────
    console.log("\n5. Empty Variants sheet returns error, no batchUpdate")
    mock = makeSheetMock([["productSlug", "variantName", "price", "sku", "stock"]])
    const r5 = await decrementStock([{ slug: "any", variantName: "5mg", quantity: 1 }])
    assert(r5.success === false, "empty sheet: success = false")
    assert(r5.error === "No variant data found", `error = "No variant data found"`)
    assert(mock.batchUpdates.length === 0, "no batchUpdate call for empty sheet")

    // ── Test 6: missing required columns returns explicit error ───────────
    console.log("\n6. Missing 'stock' column returns error, no batchUpdate")
    mock = makeSheetMock([
      ["productSlug", "variantName", "price", "sku"],
      ["bpc-157", "5mg", "$50.00", "BPC-5"],
    ])
    const r6 = await decrementStock([{ slug: "bpc-157", variantName: "5mg", quantity: 1 }])
    assert(r6.success === false, "missing column: success = false")
    assert(r6.error === "Could not find required columns in Variants sheet", "explicit error message")
    assert(mock.batchUpdates.length === 0, "no batchUpdate call when columns missing")

    // ── Test 7: stock floor at 0 (Math.max guard) ─────────────────────────
    console.log("\n7. Stock cannot go below 0 (Math.max floor)")
    mock = makeSheetMock([
      ["productSlug", "variantName", "price", "sku", "stock"],
      ["low-prod", "5mg", "$40.00", "L-5", "3"],
    ])
    const r7 = await decrementStock([{ slug: "low-prod", variantName: "5mg", quantity: 10 }])
    assert(r7.success === true, "floor: success = true")
    assert(mock.batchUpdates[0].requestBody.data[0].values[0][0] === "0", "writes '0' instead of negative")
    assert(r7.lowStockWarnings[0].remainingStock === 0, "warning remainingStock = 0 (still flagged)")

    // ── Test 8: aliased headers ('product slug' + 'variant') resolved ─────
    console.log("\n8. Aliased headers ('product slug' + 'variant') resolved correctly")
    mock = makeSheetMock([
      ["product slug", "variant", "price", "sku", "stock"],
      ["alias-prod", "5mg", "$40.00", "A-5", "20"],
    ])
    const r8 = await decrementStock([{ slug: "alias-prod", variantName: "5mg", quantity: 4 }])
    assert(r8.success === true, "alias: success = true")
    assert(mock.batchUpdates[0].requestBody.data[0].range === "Variants!E2", "row 2, col E")
    assert(mock.batchUpdates[0].requestBody.data[0].values[0][0] === "16", "writes '16' (20 - 4)")

    // ── Test 9: spreadsheetId propagated to batchUpdate ───────────────────
    console.log("\n9. spreadsheetId is passed through to batchUpdate")
    mock = makeSheetMock([
      ["productSlug", "variantName", "price", "sku", "stock"],
      ["x", "5mg", "$10", "X", "10"],
    ])
    const r9 = await decrementStock([{ slug: "x", variantName: "5mg", quantity: 1 }])
    assert(r9.success === true, "ok")
    assert(
      typeof mock.batchUpdates[0].spreadsheetId === "string" && mock.batchUpdates[0].spreadsheetId.length > 0,
      "batchUpdate.spreadsheetId is a non-empty string",
    )
    assert(mock.batchUpdates[0].spreadsheetId === process.env.GOOGLE_SHEET_ID, "spreadsheetId matches GOOGLE_SHEET_ID env var")

    // ── Test 10: only matching items written; unmatched silently skipped ──
    console.log("\n10. Mixed match/no-match: only matched items written")
    mock = makeSheetMock([
      ["productSlug", "variantName", "price", "sku", "stock"],
      ["real-prod", "5mg", "$40.00", "R-5", "20"],
    ])
    const r10 = await decrementStock([
      { slug: "real-prod", variantName: "5mg", quantity: 2 },
      { slug: "ghost-prod", variantName: "5mg", quantity: 99 },
    ])
    assert(r10.success === true, "success = true")
    assert(mock.batchUpdates.length === 1, "1 batchUpdate call")
    assert(mock.batchUpdates[0].requestBody.data.length === 1, "only 1 update entry (ghost skipped)")
    assert(mock.batchUpdates[0].requestBody.data[0].range === "Variants!E2", "matched row only")

    // ── Test 11: transient failure (5xx) → retries → eventually succeeds ──
    console.log("\n11. Transient 503 on first 2 batchUpdate calls → retries → succeeds on 3rd")
    const flakyMock = makeFlakyBatchUpdateMock(
      [
        ["productSlug", "variantName", "price", "sku", "stock"],
        ["retry-prod", "5mg", "$40.00", "RT-5", "20"],
      ],
      (callIndex) => {
        if (callIndex < 3) {
          throw new FakeSheetsHttpError(503, "Service Unavailable")
        }
        return { data: {} }
      },
    )
    mock = flakyMock as unknown as ReturnType<typeof makeSheetMock>
    revalidateCalls.length = 0
    const r11 = await decrementStock([{ slug: "retry-prod", variantName: "5mg", quantity: 1 }])
    assert(r11.success === true, "success = true after retry")
    assert(flakyMock.batchUpdates.length === 3, `batchUpdate retried until success (called ${flakyMock.batchUpdates.length}× — expected 3)`)
    assert(r11.attempts === 3, `attempts counter reflects retries (got ${r11.attempts})`)
    assert(r11.error === undefined, "no error on eventual success")
    assert(revalidateCalls.includes("/peptides"), "cache revalidated on eventual success")

    // ── Test 12: transient failure that exhausts all retries ──────────────
    console.log("\n12. Persistent 503 exhausts retries → returns { success: false, error }")
    const exhaustMock = makeFlakyBatchUpdateMock(
      [
        ["productSlug", "variantName", "price", "sku", "stock"],
        ["exhaust-prod", "5mg", "$40.00", "EX-5", "20"],
      ],
      () => {
        throw new FakeSheetsHttpError(503, "Service Unavailable")
      },
    )
    mock = exhaustMock as unknown as ReturnType<typeof makeSheetMock>
    revalidateCalls.length = 0
    let r12: any
    let r12Threw = false
    try {
      r12 = await decrementStock([{ slug: "exhaust-prod", variantName: "5mg", quantity: 1 }])
    } catch (e) {
      r12Threw = true
    }
    assert(r12Threw === false, "decrementStock does NOT throw when retries are exhausted")
    assert(r12.success === false, "success = false on exhaustion")
    assert(typeof r12.error === "string" && r12.error.length > 0, `error string returned ("${r12.error}")`)
    assert(r12.error.includes("503") || r12.error.includes("Service Unavailable"), "error message preserves underlying cause")
    assert(exhaustMock.batchUpdates.length > 1, `multiple retries attempted (got ${exhaustMock.batchUpdates.length})`)
    assert(exhaustMock.batchUpdates.length === 5, `retried up to retries+1 = 5 attempts (got ${exhaustMock.batchUpdates.length})`)
    assert(r12.attempts === 5, `attempts counter = 5 (got ${r12.attempts})`)
    assert(revalidateCalls.length === 0, "cache NOT revalidated on failure")

    // ── Test 13: permanent (4xx) failure fails fast — no retries ──────────
    console.log("\n13. Permanent 400 (bad request) fails fast — no retry")
    const permMock = makeFlakyBatchUpdateMock(
      [
        ["productSlug", "variantName", "price", "sku", "stock"],
        ["perm-prod", "5mg", "$40.00", "PM-5", "20"],
      ],
      () => {
        throw new FakeSheetsHttpError(400, "Bad Request: malformed range")
      },
    )
    mock = permMock as unknown as ReturnType<typeof makeSheetMock>
    revalidateCalls.length = 0
    let r13: any
    let r13Threw = false
    try {
      r13 = await decrementStock([{ slug: "perm-prod", variantName: "5mg", quantity: 1 }])
    } catch (e) {
      r13Threw = true
    }
    assert(r13Threw === false, "decrementStock does NOT throw on permanent failure")
    assert(r13.success === false, "success = false on permanent failure")
    assert(typeof r13.error === "string" && r13.error.length > 0, `error string returned ("${r13.error}")`)
    assert(r13.error.includes("Bad Request") || r13.error.includes("400"), "error message preserves underlying cause")
    assert(permMock.batchUpdates.length === 1, `permanent error fails fast — exactly 1 batchUpdate call (got ${permMock.batchUpdates.length})`)
    assert(r13.attempts === 1, `attempts counter = 1 — no retry on 4xx (got ${r13.attempts})`)
    assert(revalidateCalls.length === 0, "cache NOT revalidated on failure")

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
