import { revalidatePath } from 'next/cache'
import { getUncachableGoogleSheetClient } from './googleSheets'

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!
const CACHE_TTL_MS = 5 * 60 * 1000

interface SheetProduct {
  slug: string
  name: string
  category: string
  shortDescription: string
  description: string
  research: string
  shippingInfo: string
  faq: string
  featured: string
  active: string
}

interface SheetVariant {
  productSlug: string
  variantName: string
  price: string
  sku: string
  stock: string
}

interface CachedProductListItem {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  featured: boolean
  active: boolean
  category: {
    name: string
    slug: string
  }
  categories: {
    name: string
    slug: string
  }[]
  variants: {
    id: string
    name: string
    price: number
  }[]
}

interface CachedProductFull {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string | null
  research: string | null
  coa: string | null
  shippingInfo: string | null
  faq: string | null
  featured: boolean
  active: boolean
  categoryId: string
  category: {
    id: string
    name: string
    slug: string
    description: string | null
  }
  categories: {
    id: string
    name: string
    slug: string
  }[]
  variants: {
    id: string
    name: string
    price: number
    sku: string
    stock: number
    productId: string
  }[]
  createdAt: Date
  updatedAt: Date
}

interface CachedCategory {
  id: string
  name: string
  slug: string
  description: string | null
  _count: {
    products: number
  }
}

interface ProductCache {
  products: CachedProductFull[]
  lastFetched: number
}

let cache: ProductCache | null = null

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function generateId(prefix: string, key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return `${prefix}_${Math.abs(hash).toString(36)}`
}

function parseBoolean(value: string): boolean {
  return value?.toLowerCase().trim() === 'true' || value?.toLowerCase().trim() === 'yes' || value?.trim() === '1'
}

function parsePriceToCents(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const dollars = parseFloat(cleaned)
  if (isNaN(dollars)) return 0
  return Math.round(dollars * 100)
}

function parseCategories(value: string): string[] {
  if (!value || !value.trim()) return ['Uncategorized']
  return value.split(',').map(c => c.trim()).filter(Boolean)
}

async function fetchFromSheet(): Promise<CachedProductFull[]> {
  const sheets = await getUncachableGoogleSheetClient()

  const [productsResponse, variantsResponse] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Products!A:J',
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Variants!A:E',
    }),
  ])

  const productRows = productsResponse.data.values || []
  const variantRows = variantsResponse.data.values || []

  if (productRows.length < 2) return []

  const productHeaders = productRows[0].map((h: string) => h.trim().toLowerCase())
  const productData: SheetProduct[] = productRows.slice(1).map((row: string[]) => {
    const obj: any = {}
    productHeaders.forEach((header: string, index: number) => {
      obj[header] = row[index] || ''
    })
    return obj as SheetProduct
  })

  let variantData: SheetVariant[] = []
  if (variantRows.length >= 2) {
    const variantHeaders = variantRows[0].map((h: string) => h.trim().toLowerCase())
    variantData = variantRows.slice(1).map((row: string[]) => {
      const obj: any = {}
      variantHeaders.forEach((header: string, index: number) => {
        obj[header] = row[index] || ''
      })
      return obj as SheetVariant
    })
  }

  const headerMap: Record<string, string> = {
    'slug': 'slug',
    'name': 'name',
    'category': 'category',
    'shortdescription': 'shortDescription',
    'short description': 'shortDescription',
    'description': 'description',
    'research': 'research',
    'shippinginfo': 'shippingInfo',
    'shipping info': 'shippingInfo',
    'faq': 'faq',
    'featured': 'featured',
    'active': 'active',
  }

  const variantHeaderMap: Record<string, string> = {
    'productslug': 'productSlug',
    'product slug': 'productSlug',
    'variantname': 'variantName',
    'variant name': 'variantName',
    'variant': 'variantName',
    'price': 'price',
    'sku': 'sku',
    'stock': 'stock',
  }

  const normalizedProducts = productRows.slice(1).map((row: string[]) => {
    const obj: any = {}
    productRows[0].forEach((header: string, index: number) => {
      const normalizedKey = header.trim().toLowerCase()
      const mappedKey = headerMap[normalizedKey] || normalizedKey
      obj[mappedKey] = row[index] || ''
    })
    return obj as SheetProduct
  })

  const normalizedVariants = variantRows.length >= 2
    ? variantRows.slice(1).map((row: string[]) => {
        const obj: any = {}
        variantRows[0].forEach((header: string, index: number) => {
          const normalizedKey = header.trim().toLowerCase()
          const mappedKey = variantHeaderMap[normalizedKey] || normalizedKey
          obj[mappedKey] = row[index] || ''
        })
        return obj as SheetVariant
      })
    : []

  const categoryMap = new Map<string, { id: string; name: string; slug: string }>()

  const products: CachedProductFull[] = normalizedProducts
    .filter((p: SheetProduct) => p.slug && p.name)
    .map((p: SheetProduct) => {
      const categoryNames = parseCategories(p.category)
      const primaryCategoryName = categoryNames[0]
      const primaryCategorySlug = slugify(primaryCategoryName)
      const primaryCategoryId = generateId('cat', primaryCategorySlug)

      const productCategories = categoryNames.map(name => {
        const slug = slugify(name)
        const id = generateId('cat', slug)
        if (!categoryMap.has(slug)) {
          categoryMap.set(slug, { id, name, slug })
        }
        return { id, name, slug }
      })

      const normalizedSlug = slugify(p.slug)
      const productId = generateId('prod', normalizedSlug)
      const productVariants = normalizedVariants
        .filter((v: SheetVariant) => slugify(v.productSlug || '') === normalizedSlug)
        .map((v: SheetVariant) => ({
          id: generateId('var', v.sku || `${normalizedSlug}-${v.variantName}`),
          name: v.variantName || '',
          price: parsePriceToCents(v.price),
          sku: v.sku || '',
          stock: parseInt(v.stock) || 0,
          productId,
        }))
        .sort((a, b) => a.price - b.price)

      return {
        id: productId,
        name: p.name,
        slug: normalizedSlug,
        description: p.description || '',
        shortDescription: p.shortDescription || null,
        research: p.research || null,
        coa: null,
        shippingInfo: p.shippingInfo || null,
        faq: p.faq || null,
        featured: parseBoolean(p.featured),
        active: p.active === '' ? true : parseBoolean(p.active),
        categoryId: primaryCategoryId,
        category: categoryMap.get(primaryCategorySlug)! as CachedProductFull['category'],
        categories: productCategories,
        variants: productVariants,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

  return products
}

async function getCache(): Promise<CachedProductFull[]> {
  const now = Date.now()
  if (cache && (now - cache.lastFetched) < CACHE_TTL_MS) {
    return cache.products
  }

  try {
    const products = await fetchFromSheet()
    cache = { products, lastFetched: now }
    return products
  } catch (error) {
    console.error('Error fetching products from Google Sheets:', error)
    if (cache) {
      console.warn('Returning stale cache due to fetch error')
      return cache.products
    }
    return []
  }
}

export function clearCache(): { cleared: boolean; previousLastFetched: number | null } {
  const previousLastFetched = cache?.lastFetched || null
  cache = null
  return { cleared: true, previousLastFetched }
}

export function getCacheStatus(): { cached: boolean; lastFetched: number | null; productCount: number } {
  return {
    cached: cache !== null,
    lastFetched: cache?.lastFetched || null,
    productCount: cache?.products.length || 0,
  }
}

export async function getCachedProducts(options?: {
  category?: string
  search?: string
  sort?: string
}): Promise<CachedProductListItem[]> {
  const allProducts = await getCache()

  let filtered = allProducts.filter(p => p.active)

  if (options?.category) {
    filtered = filtered.filter(p =>
      p.categories.some(c => c.slug === options.category)
    )
  }

  if (options?.search) {
    const searchLower = options.search.toLowerCase()
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(searchLower))
    )
  }

  if (options?.sort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name))
  } else if (options?.sort === 'price-asc') {
    filtered.sort((a, b) => {
      const aMin = Math.min(...a.variants.map(v => v.price))
      const bMin = Math.min(...b.variants.map(v => v.price))
      return aMin - bMin
    })
  } else if (options?.sort === 'price-desc') {
    filtered.sort((a, b) => {
      const aMax = Math.max(...a.variants.map(v => v.price))
      const bMax = Math.max(...b.variants.map(v => v.price))
      return bMax - aMax
    })
  }

  return filtered.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    featured: p.featured,
    active: p.active,
    category: {
      name: p.category.name,
      slug: p.category.slug,
    },
    categories: p.categories.map(c => ({ name: c.name, slug: c.slug })),
    variants: p.variants.map(v => ({
      id: v.id,
      name: v.name,
      price: v.price,
    })),
  }))
}

export async function getCachedFeaturedProducts(): Promise<CachedProductListItem[]> {
  const allProducts = await getCache()

  return allProducts
    .filter(p => p.featured && p.active)
    .slice(0, 6)
    .map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      featured: p.featured,
      active: p.active,
      category: {
        name: p.category.name,
        slug: p.category.slug,
      },
      categories: p.categories.map(c => ({ name: c.name, slug: c.slug })),
      variants: p.variants.map(v => ({
        id: v.id,
        name: v.name,
        price: v.price,
      })),
    }))
}

export async function getCachedProductBySlug(slug: string): Promise<CachedProductFull | null> {
  const allProducts = await getCache()
  return allProducts.find(p => p.slug === slug) || null
}

export async function getCachedRelatedProducts(
  categorySlugs: string[],
  excludeSlug: string
): Promise<CachedProductListItem[]> {
  const allProducts = await getCache()

  return allProducts
    .filter(p =>
      p.slug !== excludeSlug &&
      p.active &&
      p.categories.some(c => categorySlugs.includes(c.slug))
    )
    .slice(0, 4)
    .map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      featured: p.featured,
      active: p.active,
      category: {
        name: p.category.name,
        slug: p.category.slug,
      },
      categories: p.categories.map(c => ({ name: c.name, slug: c.slug })),
      variants: p.variants.map(v => ({
        id: v.id,
        name: v.name,
        price: v.price,
      })),
    }))
}

export interface StockCheckItem {
  slug: string
  variantName: string
  quantity: number
}

export interface StockCheckResult {
  success: boolean
  insufficientItems: {
    slug: string
    variantName: string
    requested: number
    available: number
  }[]
}

export async function checkStock(items: StockCheckItem[]): Promise<StockCheckResult> {
  const sheets = await getUncachableGoogleSheetClient()

  const variantsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Variants!A:E',
  })

  const rows = variantsResponse.data.values || []
  if (rows.length < 2) {
    return { success: false, insufficientItems: items.map(i => ({ ...i, requested: i.quantity, available: 0 })) }
  }

  const headers = rows[0].map((h: string) => h.trim().toLowerCase())
  const variantHeaderMapLocal: Record<string, string> = {
    'productslug': 'productSlug',
    'product slug': 'productSlug',
    'variantname': 'variantName',
    'variant name': 'variantName',
    'variant': 'variantName',
    'stock': 'stock',
  }

  const variants = rows.slice(1).map((row: string[]) => {
    const obj: any = {}
    headers.forEach((header: string, index: number) => {
      const mapped = variantHeaderMapLocal[header] || header
      obj[mapped] = row[index] || ''
    })
    return obj
  })

  const insufficientItems: StockCheckResult['insufficientItems'] = []

  for (const item of items) {
    const itemSlug = slugify(item.slug)
    const variant = variants.find((v: any) =>
      slugify(v.productSlug || '') === itemSlug &&
      v.variantName?.trim().toLowerCase() === item.variantName.toLowerCase()
    )

    const available = variant ? parseInt(variant.stock) || 0 : 0

    if (available < item.quantity) {
      insufficientItems.push({
        slug: item.slug,
        variantName: item.variantName,
        requested: item.quantity,
        available,
      })
    }
  }

  return {
    success: insufficientItems.length === 0,
    insufficientItems,
  }
}

export interface DecrementResult {
  success: boolean
  lowStockWarnings: { productSlug: string; variantName: string; remainingStock: number }[]
  error?: string
}

const LOW_STOCK_THRESHOLD = 5

export async function decrementStock(items: StockCheckItem[]): Promise<DecrementResult> {
  const sheets = await getUncachableGoogleSheetClient()

  const variantsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Variants!A:E',
  })

  const rows = variantsResponse.data.values || []
  if (rows.length < 2) {
    return { success: false, lowStockWarnings: [], error: 'No variant data found' }
  }

  const headers = rows[0].map((h: string) => h.trim().toLowerCase())
  const slugCol = headers.indexOf('productslug') !== -1 ? headers.indexOf('productslug') : headers.indexOf('product slug')
  const nameCol = headers.indexOf('variantname') !== -1 ? headers.indexOf('variantname') : (headers.indexOf('variant name') !== -1 ? headers.indexOf('variant name') : headers.indexOf('variant'))
  const stockCol = headers.indexOf('stock')

  if (slugCol === -1 || stockCol === -1) {
    return { success: false, lowStockWarnings: [], error: 'Could not find required columns in Variants sheet' }
  }

  const updates: { range: string; values: string[][] }[] = []
  const lowStockWarnings: DecrementResult['lowStockWarnings'] = []

  for (const item of items) {
    for (let i = 1; i < rows.length; i++) {
      const rowSlug = (rows[i][slugCol] || '').trim().toLowerCase()
      const rowName = nameCol !== -1 ? (rows[i][nameCol] || '').trim().toLowerCase() : ''

      if (slugify(rowSlug) === slugify(item.slug) && rowName === item.variantName.toLowerCase()) {
        const currentStock = parseInt(rows[i][stockCol]) || 0
        const newStock = Math.max(0, currentStock - item.quantity)

        const colLetter = String.fromCharCode(65 + stockCol)
        updates.push({
          range: `Variants!${colLetter}${i + 1}`,
          values: [[String(newStock)]],
        })

        if (newStock <= LOW_STOCK_THRESHOLD) {
          lowStockWarnings.push({
            productSlug: item.slug,
            variantName: item.variantName,
            remainingStock: newStock,
          })
        }
        break
      }
    }
  }

  if (updates.length === 0) {
    return { success: true, lowStockWarnings: [] }
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: updates,
    },
  })

  clearCache()
  revalidatePath('/peptides', 'layout')

  return { success: true, lowStockWarnings }
}

export async function getCachedCategories(): Promise<CachedCategory[]> {
  const allProducts = await getCache()
  const activeProducts = allProducts.filter(p => p.active)

  const categoryMap = new Map<string, CachedCategory>()

  for (const product of activeProducts) {
    for (const cat of product.categories) {
      const existing = categoryMap.get(cat.slug)
      if (existing) {
        existing._count.products++
      } else {
        categoryMap.set(cat.slug, {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: null,
          _count: { products: 1 },
        })
      }
    }
  }

  return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}
