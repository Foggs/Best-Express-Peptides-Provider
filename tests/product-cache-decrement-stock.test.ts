import { createRequire } from "module"

const _require = createRequire(import.meta.url)
const nodeModule = _require("module") as { _load: Function }

process.env.GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || "TEST_SHEET_ID"

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
