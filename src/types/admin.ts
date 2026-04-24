export interface AdminUser {
  id: string
  email: string
  name: string
}

export interface SkippedVariant {
  productSlug: string
  variantName: string
  sku: string
  rawPrice: string
  reason: string
}

export interface DuplicateSlugRow {
  rawSlug: string
  name: string
  rowNumber: number
}

export interface DuplicateSlug {
  normalizedSlug: string
  keptRow: DuplicateSlugRow
  droppedRows: DuplicateSlugRow[]
}

export interface CacheStatus {
  cached: boolean
  lastFetched: number | null
  productCount: number
  skippedVariants: SkippedVariant[]
  duplicateSlugs: DuplicateSlug[]
}

export interface RefreshResult {
  success: boolean
  message?: string
  productCount?: number
  skippedVariants?: SkippedVariant[]
  duplicateSlugs?: DuplicateSlug[]
  error?: string
  details?: string
}

export interface FormErrors {
  productName?: string
  variants?: string
}

export interface VariantFormErrors {
  selectedProduct?: string
  variants?: string
}

export interface ProductOption {
  slug: string
  name: string
}

export interface VariantItem {
  id: number
  variantName: string
  price: string
  stock: string
}

export interface GeneratedContent {
  shortDescription: string
  description: string
  research: string
  categories: string
}

export interface SaveResult {
  success: boolean
  message: string
  slug?: string
}
