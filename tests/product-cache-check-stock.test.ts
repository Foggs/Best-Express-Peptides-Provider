import { createRequire } from "module"

const _require = createRequire(import.meta.url)
const nodeModule = _require("module") as { _load: Function }

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++ }
  else { console.error(`  ✗ FAIL: ${msg}`); failed++ }
}

function makeVariantSheetMock(variantRows: string[][]) {
  return {
    spreadsheets: {
      values: {
        get: async () => ({ data: { values: variantRows } }),
      },
    },
  }
}

async function run() {
  console.log("\nTest suite: checkStock — shared VARIANT_HEADER_MAP aliases\n")

  const origLoad = nodeModule._load
  let sheetsMock: ReturnType<typeof makeVariantSheetMock>

  nodeModule._load = function (id: string, ...rest: unknown[]) {
    if (id.includes("googleSheets")) {
      return { getUncachableGoogleSheetClient: async () => sheetsMock }
    }
    if (id.includes("next/cache")) {
      return { revalidatePath: () => undefined }
    }
    return origLoad.call(this, id, ...rest)
  }

  try {
    const { checkStock } = _require("../src/lib/productCache")

    // ── Test 1: canonical headers — sufficient stock ─────────────────────
    console.log("1. Canonical headers with sufficient stock → success")

    sheetsMock = makeVariantSheetMock([
      ["productSlug", "variantName", "price", "sku", "stock"],
      ["bpc-157", "5mg", "$50.00", "BPC-5", "20"],
    ])

    const r1 = await checkStock([{ slug: "bpc-157", variantName: "5mg", quantity: 5 }])
    assert(r1.success === true, `success = true`)
    assert(r1.insufficientItems.length === 0, `no insufficient items`)

    // ── Test 2: "product slug" alias is resolved ─────────────────────────
    console.log("\n2. 'product slug' (spaced) header alias resolves correctly")

    sheetsMock = makeVariantSheetMock([
      ["product slug", "variant name", "price", "sku", "stock"],
      ["tb-500", "10mg", "$75.00", "TB-10", "15"],
    ])

    const r2 = await checkStock([{ slug: "tb-500", variantName: "10mg", quantity: 3 }])
    assert(r2.success === true, `'product slug' alias: success = true`)
    assert(r2.insufficientItems.length === 0, `'variant name' alias: no insufficient items`)

    // ── Test 3: "variant" alias (no "name") is resolved ──────────────────
    console.log("\n3. 'variant' header alias resolves to variantName")

    sheetsMock = makeVariantSheetMock([
      ["productslug", "variant", "price", "sku", "stock"],
      ["ghrp-6", "2mg", "$30.00", "GH-2", "8"],
    ])

    const r3 = await checkStock([{ slug: "ghrp-6", variantName: "2mg", quantity: 2 }])
    assert(r3.success === true, `'variant' alias: success = true`)

    // ── Test 4: insufficient stock is reported ───────────────────────────
    console.log("\n4. Insufficient stock returns failure with correct item detail")

    sheetsMock = makeVariantSheetMock([
      ["productSlug", "variantName", "price", "sku", "stock"],
      ["glp-3r", "20mg", "$150.00", "GLP-20", "2"],
    ])

    const r4 = await checkStock([{ slug: "glp-3r", variantName: "20mg", quantity: 10 }])
    assert(r4.success === false, `insufficient: success = false`)
    assert(r4.insufficientItems.length === 1, `1 insufficient item`)
    assert(r4.insufficientItems[0].slug === "glp-3r", `slug = "glp-3r"`)
    assert(r4.insufficientItems[0].requested === 10, `requested = 10`)
    assert(r4.insufficientItems[0].available === 2, `available = 2`)

    // ── Test 5: unknown variant → available = 0, always insufficient ─────
    console.log("\n5. Missing variant treated as 0 stock")

    sheetsMock = makeVariantSheetMock([
      ["productSlug", "variantName", "price", "sku", "stock"],
      ["known-prod", "5mg", "$40.00", "KP-5", "10"],
    ])

    const r5 = await checkStock([{ slug: "unknown-prod", variantName: "5mg", quantity: 1 }])
    assert(r5.success === false, `unknown variant: success = false`)
    assert(r5.insufficientItems[0].available === 0, `available = 0`)

    // ── Test 6: empty sheet → all items insufficient ──────────────────────
    console.log("\n6. Empty sheet returns failure for every requested item")

    sheetsMock = makeVariantSheetMock([["productSlug", "variantName", "price", "sku", "stock"]])
    const r6 = await checkStock([{ slug: "any", variantName: "5mg", quantity: 1 }])
    assert(r6.success === false, `empty variants: success = false`)
    assert(r6.insufficientItems.length === 1, `1 item reported insufficient`)

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
