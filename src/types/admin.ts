export interface AdminUser {
  id: string
  email: string
  name: string
}

export interface CacheStatus {
  cached: boolean
  lastFetched: number | null
  productCount: number
}

export interface RefreshResult {
  success: boolean
  message?: string
  productCount?: number
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
