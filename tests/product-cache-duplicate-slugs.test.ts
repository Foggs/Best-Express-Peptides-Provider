import { createRequire } from "module"

const _require = createRequire(import.meta.url)
const nodeModule = _require("module") as { _load: Function }

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++ }
  else { console.error(`  ✗ FAIL: ${msg}`); failed++ }
}

function makeSheetsMock(productRows: string[][], variantRows: string[][]) {
  return {
    spreadsheets: {
      values: {
        get: async ({ range }: { range: string }) => ({
          data: {
            values: range.startsWith("Products") ? productRows : variantRows,
          },
        }),
      },
    },
  }
}

async function run() {
  console.log("\nTest suite: fetchFromSheet — duplicate slug detection\n")

  const origLoad = nodeModule._load
  let sheetsMock: ReturnType<typeof makeSheetsMock>

  nodeModule._load = function (id: string, ...rest: unknown[]) {
    if (id.includes("googleSheets")) {
      return { getUncachableGoogleSheetClient: async () => sheetsMock }
    }
    if (id.includes("next/cache")) {
      return { revalidatePath: () => undefined }
    }
    return origLoad.call(this, id, ...rest)
  }

  const origSheetId = process.env.GOOGLE_SHEET_ID
  process.env.GOOGLE_SHEET_ID = "test-sheet-id"

  try {
    const { getCachedProducts, getCacheStatus, clearCache } = _require(
      "../src/lib/productCache",
    )

    // ── Test 1: identical raw slugs → first kept, second dropped ─────────
    console.log("1. Identical raw slugs → first kept, duplicate dropped + warned")

    sheetsMock = makeSheetsMock(
      [
        ["slug", "name", "category", "shortDescription", "description", "research", "shippingInfo", "faq", "featured", "active"],
        ["bpc-157", "BPC-157 Original", "Peptides", "first", "desc 1", "", "", "", "false", "true"],
        ["bpc-157", "BPC-157 Duplicate", "Peptides", "second", "desc 2", "", "", "", "false", "true"],
        ["tb-500", "TB-500", "Peptides", "", "", "", "", "", "false", "true"],
      ],
      [
        ["productSlug", "variantName", "price", "sku", "stock"],
        ["bpc-157", "5mg", "$50.00", "BPC-5", "10"],
        ["tb-500", "5mg", "$60.00", "TB-5", "10"],
      ],
    )

    const warnings: string[] = []
    const origWarn = console.warn
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map(String).join(" "))
    }

    clearCache()
    let products: Array<{ slug: string; name: string }>
    let status: { duplicateSlugs: Array<{ normalizedSlug: string; keptRow: { rowNumber: number; name: string }; droppedRows: Array<{ rowNumber: number; name: string }> }> }
    try {
      products = await getCachedProducts()
      status = getCacheStatus()
    } finally {
      console.warn = origWarn
    }

    const dupBpc = products.filter((p) => p.slug === "bpc-157")
    assert(dupBpc.length === 1, `only 1 product with slug "bpc-157" survives (got ${dupBpc.length})`)
    assert(dupBpc[0]?.name === "BPC-157 Original", `kept product is the FIRST occurrence: "${dupBpc[0]?.name}"`)
    assert(products.some((p) => p.slug === "tb-500"), `unrelated product "tb-500" still present`)

    assert(status.duplicateSlugs.length === 1, `getCacheStatus reports 1 duplicate slug entry (got ${status.duplicateSlugs.length})`)
    const entry = status.duplicateSlugs[0]
    assert(entry.normalizedSlug === "bpc-157", `entry.normalizedSlug = "${entry.normalizedSlug}"`)
    assert(entry.keptRow.rowNumber === 2 && entry.keptRow.name === "BPC-157 Original", `keptRow points at row 2 — "${entry.keptRow.name}"`)
    assert(entry.droppedRows.length === 1, `1 dropped row recorded (got ${entry.droppedRows.length})`)
    assert(entry.droppedRows[0].rowNumber === 3 && entry.droppedRows[0].name === "BPC-157 Duplicate", `dropped row is row 3 — "${entry.droppedRows[0].name}"`)

    const dupWarn = warnings.find((w) => w.includes("Duplicate slug") && w.includes("bpc-157"))
    assert(!!dupWarn, `console.warn fired with a "Duplicate slug" message`)
    assert(!!dupWarn && dupWarn.includes("[productCache]"), `warning is tagged "[productCache]"`)
    assert(!!dupWarn && dupWarn.includes("row 2") && dupWarn.includes("row 3"), `warning identifies both row numbers`)

    // ── Test 2: case + punctuation differences normalize to same slug ────
    console.log("\n2. Case + punctuation variants normalize to the same slug → also caught")

    sheetsMock = makeSheetsMock(
      [
        ["slug", "name", "category", "shortDescription", "description", "research", "shippingInfo", "faq", "featured", "active"],
        ["BPC-157", "Upper case slug", "Peptides", "", "", "", "", "", "false", "true"],
        ["bpc 157", "Spaced slug", "Peptides", "", "", "", "", "", "false", "true"],
        ["bpc--157", "Double-dash slug", "Peptides", "", "", "", "", "", "false", "true"],
      ],
      [
        ["productSlug", "variantName", "price", "sku", "stock"],
        ["bpc-157", "5mg", "$50.00", "BPC-5", "10"],
      ],
    )

    const warnings2: string[] = []
    console.warn = (...args: unknown[]) => {
      warnings2.push(args.map(String).join(" "))
    }

    clearCache()
    try {
      products = await getCachedProducts()
      status = getCacheStatus()
    } finally {
      console.warn = origWarn
    }

    assert(products.length === 1, `only 1 product survives all 3 normalization variants (got ${products.length})`)
    assert(products[0]?.slug === "bpc-157", `surviving slug = "${products[0]?.slug}"`)
    assert(products[0]?.name === "Upper case slug", `surviving product is the FIRST row: "${products[0]?.name}"`)

    assert(status.duplicateSlugs.length === 1, `still grouped into 1 duplicate-slug entry (got ${status.duplicateSlugs.length})`)
    assert(status.duplicateSlugs[0].droppedRows.length === 2, `2 dropped rows recorded (got ${status.duplicateSlugs[0].droppedRows.length})`)
    assert(
      warnings2.filter((w) => w.includes("Duplicate slug")).length === 2,
      `one warning per dropped row (got ${warnings2.filter((w) => w.includes("Duplicate slug")).length})`,
    )

    // ── Test 3: distinct slugs → no duplicates flagged ───────────────────
    console.log("\n3. All distinct slugs → no duplicates flagged")

    sheetsMock = makeSheetsMock(
      [
        ["slug", "name", "category", "shortDescription", "description", "research", "shippingInfo", "faq", "featured", "active"],
        ["bpc-157", "BPC-157", "Peptides", "", "", "", "", "", "false", "true"],
        ["tb-500", "TB-500", "Peptides", "", "", "", "", "", "false", "true"],
        ["ipamorelin", "Ipamorelin", "Peptides", "", "", "", "", "", "false", "true"],
      ],
      [
        ["productSlug", "variantName", "price", "sku", "stock"],
        ["bpc-157", "5mg", "$50.00", "BPC-5", "10"],
        ["tb-500", "5mg", "$60.00", "TB-5", "10"],
        ["ipamorelin", "5mg", "$70.00", "IPA-5", "10"],
      ],
    )

    clearCache()
    products = await getCachedProducts()
    status = getCacheStatus()

    assert(products.length === 3, `all 3 distinct products survive (got ${products.length})`)
    assert(status.duplicateSlugs.length === 0, `no duplicate-slug entries (got ${status.duplicateSlugs.length})`)
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
