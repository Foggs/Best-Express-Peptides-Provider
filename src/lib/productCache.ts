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
  images: string
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
  images: string[]
  featured: boolean
  active: boolean
  category: {
    name: string
    slug: string
  }
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
  images: string[]
  featured: boolean
  active: boolean
  categoryId: string
  category: {
    id: string
    name: string
    slug: string
    description: string | null
  }
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
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
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

function parseImages(value: string): string[] {
  if (!value || !value.trim()) return ['/images/peptide-vial.png']
  return value.split(',').map(img => img.trim()).filter(Boolean)
}

function parsePriceToCents(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const dollars = parseFloat(cleaned)
  if (isNaN(dollars)) return 0
  return Math.round(dollars * 100)
}

async function fetchFromSheet(): Promise<CachedProductFull[]> {
  const sheets = await getUncachableGoogleSheetClient()

  const [productsResponse, variantsResponse] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Products!A:K',
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
    'images': 'images',
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
      const categoryName = p.category?.trim() || 'Uncategorized'
      const categorySlug = slugify(categoryName)
      const categoryId = generateId('cat', categorySlug)

      if (!categoryMap.has(categorySlug)) {
        categoryMap.set(categorySlug, {
          id: categoryId,
          name: categoryName,
          slug: categorySlug,
        })
      }

      const productId = generateId('prod', p.slug)
      const productVariants = normalizedVariants
        .filter((v: SheetVariant) => v.productSlug?.trim() === p.slug?.trim())
        .map((v: SheetVariant) => ({
          id: generateId('var', v.sku || `${p.slug}-${v.variantName}`),
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
        slug: p.slug,
        description: p.description || '',
        shortDescription: p.shortDescription || null,
        research: p.research || null,
        coa: null,
        shippingInfo: p.shippingInfo || null,
        faq: p.faq || null,
        images: parseImages(p.images),
        featured: parseBoolean(p.featured),
        active: p.active === '' ? true : parseBoolean(p.active),
        categoryId,
        category: categoryMap.get(categorySlug)!,
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
    filtered = filtered.filter(p => p.category.slug === options.category)
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
    images: p.images,
    featured: p.featured,
    active: p.active,
    category: {
      name: p.category.name,
      slug: p.category.slug,
    },
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
      images: p.images,
      featured: p.featured,
      active: p.active,
      category: {
        name: p.category.name,
        slug: p.category.slug,
      },
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
  categorySlug: string,
  excludeSlug: string
): Promise<CachedProductListItem[]> {
  const allProducts = await getCache()

  return allProducts
    .filter(p => p.category.slug === categorySlug && p.slug !== excludeSlug && p.active)
    .slice(0, 4)
    .map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      images: p.images,
      featured: p.featured,
      active: p.active,
      category: {
        name: p.category.name,
        slug: p.category.slug,
      },
      variants: p.variants.map(v => ({
        id: v.id,
        name: v.name,
        price: v.price,
      })),
    }))
}

export async function getCachedCategories(): Promise<CachedCategory[]> {
  const allProducts = await getCache()
  const activeProducts = allProducts.filter(p => p.active)

  const categoryMap = new Map<string, CachedCategory>()

  for (const product of activeProducts) {
    const existing = categoryMap.get(product.category.slug)
    if (existing) {
      existing._count.products++
    } else {
      categoryMap.set(product.category.slug, {
        id: product.categoryId,
        name: product.category.name,
        slug: product.category.slug,
        description: null,
        _count: { products: 1 },
      })
    }
  }

  return Array.from(categoryMap.values())
}
