export interface CartItem {
  id: string
  productId: string
  variantId: string
  name: string
  variantName: string
  price: number
  quantity: number
  image: string
  slug: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string | null
  research?: string | null
  coa?: string | null
  shippingInfo?: string | null
  faq?: string | null
  images: string[]
  featured: boolean
  active: boolean
  categoryId: string
  category: Category
  variants: ProductVariant[]
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariant {
  id: string
  name: string
  price: number
  sku: string
  stock: number
  productId: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
}

export interface Order {
  id: string
  email: string
  status: string
  total: number
  subtotal: number
  tax: number
  shipping: number
  items: OrderItem[]
  createdAt: Date
}

export interface OrderItem {
  id: string
  productId: string
  variantId: string
  quantity: number
  price: number
  product: {
    name: string
    slug: string
    images: string[]
  }
  variant: {
    name: string
  }
}
