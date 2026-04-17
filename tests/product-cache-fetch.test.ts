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
  console.log("\nTest suite: fetchFromSheet — single parse pass after dead-code removal\n")

  // Intercept googleSheets module BEFORE productCache is loaded.
  // tsx compiles ESM → CJS under the hood, so Module._load catches it.
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

  try {
    // Use createRequire so productCache loads via CJS Module._load,
    // inheriting the googleSheets + next/cache intercepts above.
    const { getCachedProducts, clearCache } = _require("../src/lib/productCache")

    // ── Test 1: basic product + variant shape ────────────────────────────
    console.log("1. Basic product with one variant is shaped correctly")

    sheetsMock = makeSheetsMock(
      [
        ["slug", "name", "category", "shortDescription", "description", "research", "shippingInfo", "faq", "featured", "active"],
        ["bpc-157", "BPC-157", "Research Peptides", "Gut & tendon peptide", "Full description", "", "", "", "true", "true"],
      ],
      [
        ["productSlug", "variantName", "price", "sku", "stock"],
        ["bpc-157", "5mg", "$50.00", "BPC-5", "20"],
      ],
    )

    clearCache()
    const products = await getCachedProducts()

    assert(products.length === 1, `returns 1 product (got ${products.length})`)
    const p = products[0]
    assert(p.slug === "bpc-157", `slug = "${p.slug}"`)
    assert(p.name === "BPC-157", `name = "${p.name}"`)
    assert(p.variants.length === 1, `product has 1 variant`)
    assert(p.variants[0].name === "5mg", `variant name = "${p.variants[0].name}"`)
    assert(p.variants[0].price === 5000, `variant price = ${p.variants[0].price}¢ ($50.00)`)
    assert(p.featured === true, `featured = true`)
    assert(p.active === true, `active = true`)

    // ── Test 2: header aliases (space-separated keys) work ───────────────
    console.log("\n2. Header aliases (space-separated) are normalised")

    sheetsMock = makeSheetsMock(
      [
        ["Slug", "Name", "Category", "Short Description", "Description", "Research", "Shipping Info", "FAQ", "Featured", "Active"],
        ["tb-500", "TB-500", "Research Peptides", "Recovery peptide", "Full desc", "", "", "", "false", "true"],
      ],
      [
        ["product slug", "variant name", "price", "sku", "stock"],
        ["tb-500", "10mg", "$75.00", "TB-10", "5"],
      ],
    )

    clearCache()
    const products2 = await getCachedProducts()

    assert(products2.length === 1, `returns 1 product from aliased headers`)
    const p2 = products2[0]
    assert(p2.slug === "tb-500", `slug = "${p2.slug}"`)
    assert(p2.shortDescription === "Recovery peptide", `shortDescription is mapped from "Short Description" header`)
    assert(p2.variants[0].price === 7500, `variant price = 7500¢ from "variant name" alias`)

    // ── Test 3: inactive products are filtered out ───────────────────────
    console.log("\n3. Inactive products are excluded from getCachedProducts()")

    sheetsMock = makeSheetsMock(
      [
        ["slug", "name", "category", "shortDescription", "description", "research", "shippingInfo", "faq", "featured", "active"],
        ["active-prod", "Active Product", "Peptides", "", "desc", "", "", "", "false", "true"],
        ["inactive-prod", "Inactive Product", "Peptides", "", "desc", "", "", "", "false", "false"],
      ],
      [
        ["productSlug", "variantName", "price", "sku", "stock"],
        ["active-prod", "5mg", "$30.00", "AP-5", "10"],
        ["inactive-prod", "5mg", "$30.00", "IP-5", "10"],
      ],
    )

    clearCache()
    const products3 = await getCachedProducts()

    assert(products3.length === 1, `only active product returned (got ${products3.length})`)
    assert(products3[0].slug === "active-prod", `active-prod is the one returned`)

    // ── Test 4: empty sheet returns empty array ───────────────────────────
    console.log("\n4. Sheet with no data rows returns []")

    sheetsMock = makeSheetsMock([["slug", "name"]], [])
    clearCache()
    const products4 = await getCachedProducts()
    assert(products4.length === 0, `empty sheet → []`)

    // ── Test 5: variants sorted by price ascending ─────────────────────
    console.log("\n5. Variants are sorted by price ascending")

    sheetsMock = makeSheetsMock(
      [
        ["slug", "name", "category", "shortDescription", "description", "research", "shippingInfo", "faq", "featured", "active"],
        ["multi", "Multi Variant", "Peptides", "", "desc", "", "", "", "false", "true"],
      ],
      [
        ["productSlug", "variantName", "price", "sku", "stock"],
        ["multi", "10mg", "$100.00", "M-10", "5"],
        ["multi", "2mg", "$25.00", "M-2", "10"],
        ["multi", "5mg", "$50.00", "M-5", "8"],
      ],
    )

    clearCache()
    const products5 = await getCachedProducts()
    const prices = products5[0].variants.map(v => v.price)
    assert(
      JSON.stringify(prices) === JSON.stringify([2500, 5000, 10000]),
      `variants sorted asc: [${prices}]`,
    )

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
