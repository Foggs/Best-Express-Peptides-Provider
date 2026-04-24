import { createRequire } from "module"

const _require = createRequire(import.meta.url)
const nodeModule = _require("module") as { _load: Function }

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++ }
  else { console.error(`  ✗ FAIL: ${msg}`); failed++ }
}

async function run() {
  console.log("\nTest suite: GOOGLE_SHEET_ID validation + connector errors\n")

  const origLoad = nodeModule._load
  let sheetsClientFactory: () => Promise<unknown>

  nodeModule._load = function (id: string, ...rest: unknown[]) {
    if (id.includes("googleSheets")) {
      return { getUncachableGoogleSheetClient: () => sheetsClientFactory() }
    }
    if (id.includes("next/cache")) {
      return { revalidatePath: () => undefined }
    }
    return origLoad.call(this, id, ...rest)
  }

  const origSheetId = process.env.GOOGLE_SHEET_ID

  try {
    // Mock client should never actually be called when GOOGLE_SHEET_ID is missing,
    // because the validation error fires before the sheet API is hit.
    sheetsClientFactory = async () => {
      throw new Error("sheets client should not have been requested")
    }

    // ── Test 1: missing GOOGLE_SHEET_ID → fetch throws descriptive error,
    //          getCachedProducts() degrades gracefully to [] ───────────────
    console.log("1. Missing GOOGLE_SHEET_ID → clear error logged, [] returned")

    delete process.env.GOOGLE_SHEET_ID

    const errors: string[] = []
    const origError = console.error
    console.error = (...args: unknown[]) => { errors.push(args.map(String).join(" ")) }

    const { getCachedProducts, checkStock, clearCache } = _require("../src/lib/productCache")

    clearCache()
    let result: unknown[]
    try {
      result = await getCachedProducts()
    } finally {
      console.error = origError
    }

    assert(Array.isArray(result) && result.length === 0, `getCachedProducts() returns [] when env var is missing`)
    assert(errors.length >= 1, `at least one error was logged (got ${errors.length})`)
    assert(
      errors.some(e => e.includes("GOOGLE_SHEET_ID env var is not set")),
      `logged error mentions the missing env var`,
    )
    assert(
      errors.some(e => e.includes("Products and Variants tabs")),
      `logged error includes actionable hint about which sheet`,
    )

    // ── Test 2: empty-string GOOGLE_SHEET_ID is treated as missing ───────
    console.log("\n2. Empty/whitespace GOOGLE_SHEET_ID → treated as missing")

    process.env.GOOGLE_SHEET_ID = "   "
    const errors2: string[] = []
    console.error = (...args: unknown[]) => { errors2.push(args.map(String).join(" ")) }

    clearCache()
    let result2: unknown[]
    try {
      result2 = await getCachedProducts()
    } finally {
      console.error = origError
    }

    assert(Array.isArray(result2) && result2.length === 0, `whitespace-only env var → []`)
    assert(
      errors2.some(e => e.includes("GOOGLE_SHEET_ID env var is not set")),
      `whitespace-only env var triggers the same descriptive error`,
    )

    // ── Test 3: missing env var → checkStock throws (loud failure on the
    //          checkout path, not silent) ─────────────────────────────────
    console.log("\n3. Missing GOOGLE_SHEET_ID → checkStock throws descriptive error")

    delete process.env.GOOGLE_SHEET_ID

    let thrown: Error | null = null
    try {
      await checkStock([{ slug: "anything", variantName: "5mg", quantity: 1 }])
    } catch (err) {
      thrown = err as Error
    }

    assert(thrown !== null, `checkStock throws instead of returning silently`)
    assert(
      !!thrown && thrown.message.includes("GOOGLE_SHEET_ID env var is not set"),
      `thrown error message identifies the missing env var: "${thrown?.message}"`,
    )

    // ── Test 4: env var set + happy path still works ─────────────────────
    console.log("\n4. With GOOGLE_SHEET_ID set, happy path still works")

    process.env.GOOGLE_SHEET_ID = "test-sheet-id"
    sheetsClientFactory = async () => ({
      spreadsheets: {
        values: {
          get: async ({ range, spreadsheetId }: { range: string; spreadsheetId: string }) => {
            // Confirm the helper passed the right id through
            assert(spreadsheetId === "test-sheet-id", `spreadsheetId arg = "${spreadsheetId}"`)
            return {
              data: {
                values: range.startsWith("Products")
                  ? [
                      ["slug", "name", "category", "shortDescription", "description", "research", "shippingInfo", "faq", "featured", "active"],
                      ["happy", "Happy Product", "Peptides", "", "desc", "", "", "", "false", "true"],
                    ]
                  : [
                      ["productSlug", "variantName", "price", "sku", "stock"],
                      ["happy", "5mg", "$50.00", "HP-5", "10"],
                    ],
              },
            }
          },
        },
      },
    })

    clearCache()
    const happy = await getCachedProducts()
    assert(happy.length === 1, `happy path returns 1 product (got ${happy.length})`)
    assert(happy[0].slug === "happy", `slug = "${happy[0].slug}"`)

  } finally {
    nodeModule._load = origLoad
    if (origSheetId === undefined) {
      delete process.env.GOOGLE_SHEET_ID
    } else {
      process.env.GOOGLE_SHEET_ID = origSheetId
    }
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
