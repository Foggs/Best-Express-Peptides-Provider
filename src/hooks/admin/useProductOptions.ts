"use client"

import { useState } from "react"
import type { ProductOption } from "@/types/admin"

export function useProductOptions(adminToken: string | null) {
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const fetchProductOptions = async () => {
    if (!adminToken) return
    setLoadingProducts(true)
    try {
      const response = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        const options: ProductOption[] = (data.products || [])
          .map((p: { slug: string; name: string }) => ({ slug: p.slug, name: p.name }))
          .sort((a: ProductOption, b: ProductOption) => a.name.localeCompare(b.name))
        setProductOptions(options)
      }
    } catch (error) {
      console.error("Error fetching product options:", error)
    } finally {
      setLoadingProducts(false)
    }
  }

  return { productOptions, loadingProducts, fetchProductOptions }
}
