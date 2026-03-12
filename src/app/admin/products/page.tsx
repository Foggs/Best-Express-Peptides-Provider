"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, LogOut, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Clock, PlusCircle, Trash2, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface AdminUser {
  id: string
  email: string
  name: string
}

interface CacheStatus {
  cached: boolean
  lastFetched: number | null
  productCount: number
}

interface RefreshResult {
  success: boolean
  message?: string
  productCount?: number
  error?: string
  details?: string
}

interface FormErrors {
  productName?: string
  variants?: string
}

interface VariantFormErrors {
  selectedProduct?: string
  variants?: string
}

interface ProductOption {
  slug: string
  name: string
}

export default function ProductsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshResult, setRefreshResult] = useState<RefreshResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [newProductName, setNewProductName] = useState("")
  const [addingProduct, setAddingProduct] = useState(false)
  const [variants, setVariants] = useState<Array<{ id: number; variantName: string; price: string; stock: string }>>([
    { id: 1, variantName: "", price: "", stock: "" },
  ])
  const [submittedProduct, setSubmittedProduct] = useState<{ name: string; variants: Array<{ variantName: string; price: string; stock: string }> } | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [generatingContent, setGeneratingContent] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<{ shortDescription: string; description: string; research: string } | null>(null)
  const [contentError, setContentError] = useState<string | null>(null)

  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedProductSlug, setSelectedProductSlug] = useState("")
  const [existingVariants, setExistingVariants] = useState<Array<{ id: number; variantName: string; price: string; stock: string }>>([
    { id: 1, variantName: "", price: "", stock: "" },
  ])
  const [variantFormErrors, setVariantFormErrors] = useState<VariantFormErrors>({})
  const [submittingVariants, setSubmittingVariants] = useState(false)
  const [submittedVariants, setSubmittedVariants] = useState<{ productName: string; productSlug: string; variants: Array<{ variantName: string; price: string; stock: string }> } | null>(null)
  const [variantSubmitResult, setVariantSubmitResult] = useState<{ success: boolean; message: string } | null>(null)

  const addVariant = () => {
    setVariants((prev) => [...prev, { id: Date.now(), variantName: "", price: "", stock: "" }])
  }

  const removeVariant = (id: number) => {
    setVariants((prev) => prev.filter((v) => v.id !== id))
    setFormErrors((prev) => ({ ...prev, variants: undefined }))
  }

  const updateVariant = (id: number, field: string, value: string) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)))
    setFormErrors((prev) => ({ ...prev, variants: undefined }))
  }

  const addExistingVariant = () => {
    setExistingVariants((prev) => [...prev, { id: Date.now(), variantName: "", price: "", stock: "" }])
  }

  const removeExistingVariant = (id: number) => {
    setExistingVariants((prev) => prev.filter((v) => v.id !== id))
    setVariantFormErrors((prev) => ({ ...prev, variants: undefined }))
  }

  const updateExistingVariant = (id: number, field: string, value: string) => {
    setExistingVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)))
    setVariantFormErrors((prev) => ({ ...prev, variants: undefined }))
  }

  const handleProductNameChange = (value: string) => {
    setNewProductName(value)
    setFormErrors((prev) => ({ ...prev, productName: undefined }))
    setSubmittedProduct(null)
    setGeneratedContent(null)
    setContentError(null)
  }

  useEffect(() => {
    setMounted(true)
    const savedToken = localStorage.getItem("adminToken")
    const savedUser = localStorage.getItem("adminUser")
    if (savedToken && savedUser) {
      setAdminToken(savedToken)
      setAdminUser(JSON.parse(savedUser))
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (adminToken) {
      fetchCacheStatus()
      fetchProductOptions()
    }
  }, [adminToken])

  const fetchProductOptions = async () => {
    setLoadingProducts(true)
    try {
      const response = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        const options: ProductOption[] = (data.products || [])
          .map((p: any) => ({ slug: p.slug, name: p.name }))
          .sort((a: ProductOption, b: ProductOption) => a.name.localeCompare(b.name))
        setProductOptions(options)
      }
    } catch (error) {
      console.error("Error fetching product options:", error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchCacheStatus = async () => {
    try {
      const response = await fetch("/api/admin/refresh-products", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setCacheStatus(data)
      }
    } catch (error) {
      console.error("Error fetching cache status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setRefreshResult(null)

    try {
      const response = await fetch("/api/admin/refresh-products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      const data = await response.json()
      setRefreshResult(data)

      if (data.success) {
        await fetchCacheStatus()
      }
    } catch (error) {
      setRefreshResult({
        success: false,
        error: "Network error. Please try again.",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
    setAdminToken(null)
    setAdminUser(null)
  }

  const formatLastFetched = (timestamp: number | null) => {
    if (!timestamp) return "Never"
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingVariants(true)
    setSubmittedVariants(null)
    setVariantFormErrors({})
    setVariantSubmitResult(null)

    const errors: VariantFormErrors = {}

    if (!selectedProductSlug) {
      errors.selectedProduct = "Please select a product."
    }

    const filledVars = existingVariants.filter(
      (v) => v.variantName.trim() !== "" && v.price.trim() !== "" && v.stock.trim() !== ""
    )
    const partialVars = existingVariants.filter((v) => {
      const filled = [v.variantName.trim() !== "", v.price.trim() !== "", v.stock.trim() !== ""]
      const filledCount = filled.filter(Boolean).length
      return filledCount > 0 && filledCount < 3
    })

    if (filledVars.length === 0) {
      errors.variants = "At least one variant must have all fields filled out (Variant Name, Price, and Stock)."
    } else if (partialVars.length > 0) {
      errors.variants = "One or more variant rows are partially filled. Complete or remove them before submitting."
    }

    if (!errors.variants) {
      const nonEmptyNames = existingVariants
        .filter((v) => v.variantName.trim() !== "")
        .map((v) => v.variantName.trim().toLowerCase())
      const seen = new Set<string>()
      for (const name of nonEmptyNames) {
        if (seen.has(name)) {
          errors.variants = "Variant names must be unique."
          break
        }
        seen.add(name)
      }
    }

    if (!errors.variants) {
      for (const v of filledVars) {
        const price = parseFloat(v.price)
        const stock = parseInt(v.stock, 10)
        if (isNaN(price) || price <= 0) {
          errors.variants = "Variant price must be greater than $0."
          break
        }
        if (isNaN(stock) || stock < 0) {
          errors.variants = "Variant stock cannot be negative."
          break
        }
      }
    }

    setVariantFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      const selectedProduct = productOptions.find((p) => p.slug === selectedProductSlug)
      const variantData = filledVars.map(({ variantName, price, stock }) => ({ variantName, price, stock }))

      try {
        const res = await fetch("/api/admin/add-variants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            productSlug: selectedProductSlug,
            variants: variantData,
          }),
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setSubmittedVariants({
            productName: selectedProduct?.name || selectedProductSlug,
            productSlug: selectedProductSlug,
            variants: variantData,
          })
          setVariantSubmitResult({ success: true, message: `${data.addedCount} variant(s) added to Google Sheet.` })
          setExistingVariants([{ id: Date.now(), variantName: "", price: "", stock: "" }])
          setSelectedProductSlug("")
        } else {
          setVariantSubmitResult({ success: false, message: data.error || "Failed to add variants." })
        }
      } catch {
        setVariantSubmitResult({ success: false, message: "Network error. Please try again." })
      }
    }

    setSubmittingVariants(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingProduct(true)
    setSubmittedProduct(null)
    setFormErrors({})

    const errors: FormErrors = {}

    const filledVariants = variants.filter(
      (v) => v.variantName.trim() !== "" && v.price.trim() !== "" && v.stock.trim() !== ""
    )
    const partialVariants = variants.filter((v) => {
      const filled = [v.variantName.trim() !== "", v.price.trim() !== "", v.stock.trim() !== ""]
      const filledCount = filled.filter(Boolean).length
      return filledCount > 0 && filledCount < 3
    })

    if (filledVariants.length === 0) {
      errors.variants = "At least one variant must have all fields filled out (Variant Name, Price, and Stock)."
    } else if (partialVariants.length > 0) {
      errors.variants = "One or more variant rows are partially filled. Complete or remove them before submitting."
    }

    if (!errors.variants) {
      const nonEmptyNames = variants
        .filter((v) => v.variantName.trim() !== "")
        .map((v) => v.variantName.trim().toLowerCase())
      const seen = new Set<string>()
      for (const name of nonEmptyNames) {
        if (seen.has(name)) {
          errors.variants = "Variant names must be unique."
          break
        }
        seen.add(name)
      }
    }

    if (!errors.variants) {
      for (const v of filledVariants) {
        const price = parseFloat(v.price)
        const stock = parseInt(v.stock, 10)
        if (isNaN(price) || price <= 0) {
          errors.variants = "Variant price must be greater than $0."
          break
        }
        if (isNaN(stock) || stock < 0) {
          errors.variants = "Variant stock cannot be negative."
          break
        }
      }
    }

    if (newProductName.trim()) {
      try {
        const res = await fetch(
          `/api/admin/check-product-name?name=${encodeURIComponent(newProductName.trim())}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        )
        if (res.ok) {
          const data = await res.json()
          if (data.exists) {
            errors.productName = `A product named '${newProductName.trim()}' already exists in the Google Sheet.`
          }
        } else {
          errors.productName = "Network failure, try again."
        }
      } catch {
        errors.productName = "Network failure, try again."
      }
    }

    setFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      const productData = {
        name: newProductName.trim(),
        variants: variants.map(({ variantName, price, stock }) => ({ variantName, price, stock })),
      }
      setSubmittedProduct(productData)
      setGeneratedContent(null)
      setContentError(null)
      setGeneratingContent(true)

      fetch("/api/admin/generate-product-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          productName: productData.name,
          category: "Research Peptide",
        }),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            if (data.success && data.generated) {
              setGeneratedContent(data.generated)
            } else {
              setContentError(data.error || "Failed to generate content.")
            }
          } else {
            setContentError("Failed to generate content. Please try again.")
          }
        })
        .catch(() => {
          setContentError("Network error while generating content. Please try again.")
        })
        .finally(() => {
          setGeneratingContent(false)
        })
    }

    setAddingProduct(false)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Please log in to access the admin dashboard.</p>
            <Button onClick={() => router.push("/admin/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || ""}/edit`

  return (
    <div className="py-8">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Manage Products</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {adminUser?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Add New Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input
                    id="product-name"
                    placeholder="Enter product name"
                    value={newProductName}
                    onChange={(e) => handleProductNameChange(e.target.value)}
                    className={formErrors.productName ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {formErrors.productName && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{formErrors.productName}</span>
                    </div>
                  )}
                </div>
                <div className="pt-6">
                  <Button type="submit" disabled={addingProduct || !newProductName.trim()}>
                    {addingProduct ? "Checking..." : "Submit"}
                  </Button>
                </div>
              </div>

              {variants.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 text-xs font-medium text-muted-foreground px-1">
                    <span>Variant Name</span>
                    <span>Price ($)</span>
                    <span>Stock</span>
                    <span />
                  </div>
                  {variants.map((variant) => (
                    <div key={variant.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
                      <Input
                        placeholder="e.g. 5mg"
                        value={variant.variantName}
                        onChange={(e) => updateVariant(variant.id, "variantName", e.target.value)}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={variant.price}
                        onChange={(e) => updateVariant(variant.id, "price", e.target.value)}
                      />
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={variant.stock}
                        onChange={(e) => updateVariant(variant.id, "stock", e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariant(variant.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {formErrors.variants && (
                <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formErrors.variants}</span>
                </div>
              )}

              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <PlusCircle className="h-4 w-4 mr-2" />
                + Add Variant
              </Button>
            </form>
          </CardContent>
        </Card>

        {submittedProduct && (
          <Card className="mb-6 border-green-200 bg-green-50 relative overflow-hidden">
            {generatingContent && (
              <div className="absolute inset-0 bg-green-50/80 z-10 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-green-700" />
                <p className="text-sm font-medium text-green-800">Generating product content...</p>
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Product Submission Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Product Name</p>
                <p className="font-semibold text-green-900">{submittedProduct.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Variants</p>
                <div className="rounded-lg border border-green-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100">
                      <tr>
                        <th className="text-left px-4 py-2 text-green-800 font-medium">Variant Name</th>
                        <th className="text-left px-4 py-2 text-green-800 font-medium">Price</th>
                        <th className="text-left px-4 py-2 text-green-800 font-medium">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submittedProduct.variants.map((v, i) => (
                        <tr key={i} className="border-t border-green-200">
                          <td className="px-4 py-2 text-green-900">{v.variantName || <span className="text-muted-foreground italic">—</span>}</td>
                          <td className="px-4 py-2 text-green-900">{v.price ? `$${v.price}` : <span className="text-muted-foreground italic">—</span>}</td>
                          <td className="px-4 py-2 text-green-900">{v.stock || <span className="text-muted-foreground italic">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {contentError && (
                <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{contentError}</span>
                </div>
              )}

              {generatedContent && (
                <>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Short Description</p>
                    <p className="text-sm text-green-900">{generatedContent.shortDescription}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Description</p>
                    <div className="prose prose-sm prose-green max-w-none text-green-900 bg-white/50 rounded-lg border border-green-200 p-4">
                      <ReactMarkdown>{generatedContent.description}</ReactMarkdown>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Research</p>
                    <div className="prose prose-sm prose-green max-w-none text-green-900 bg-white/50 rounded-lg border border-green-200 p-4">
                      <ReactMarkdown>{generatedContent.research}</ReactMarkdown>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Add Variant to Existing Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVariantSubmit} className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="variant-product-select">Select Product</Label>
                  <select
                    id="variant-product-select"
                    value={selectedProductSlug}
                    onChange={(e) => {
                      setSelectedProductSlug(e.target.value)
                      setVariantFormErrors((prev) => ({ ...prev, selectedProduct: undefined }))
                      setSubmittedVariants(null)
                      setVariantSubmitResult(null)
                    }}
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      variantFormErrors.selectedProduct ? "border-red-500 focus-visible:ring-red-500" : "border-input"
                    }`}
                    disabled={loadingProducts}
                  >
                    <option value="">{loadingProducts ? "Loading products..." : "-- Select a product --"}</option>
                    {productOptions.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {variantFormErrors.selectedProduct && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{variantFormErrors.selectedProduct}</span>
                    </div>
                  )}
                </div>
                <div className="pt-6">
                  <Button type="submit" disabled={submittingVariants}>
                    {submittingVariants ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>

              {existingVariants.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 text-xs font-medium text-muted-foreground px-1">
                    <span>Variant Name</span>
                    <span>Price ($)</span>
                    <span>Stock</span>
                    <span />
                  </div>
                  {existingVariants.map((variant) => (
                    <div key={variant.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
                      <Input
                        placeholder="e.g. 10mg"
                        value={variant.variantName}
                        onChange={(e) => updateExistingVariant(variant.id, "variantName", e.target.value)}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={variant.price}
                        onChange={(e) => updateExistingVariant(variant.id, "price", e.target.value)}
                      />
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={variant.stock}
                        onChange={(e) => updateExistingVariant(variant.id, "stock", e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExistingVariant(variant.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {variantFormErrors.variants && (
                <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{variantFormErrors.variants}</span>
                </div>
              )}

              <Button type="button" variant="outline" size="sm" onClick={addExistingVariant}>
                <PlusCircle className="h-4 w-4 mr-2" />
                + Add Variant
              </Button>
            </form>
          </CardContent>
        </Card>

        {variantSubmitResult && (
          <div
            className={`mb-6 rounded-lg p-3 flex items-start gap-2 ${
              variantSubmitResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {variantSubmitResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            )}
            <p className={`text-sm ${variantSubmitResult.success ? "text-green-800" : "text-red-800"}`}>
              {variantSubmitResult.message}
            </p>
          </div>
        )}

        {submittedVariants && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Variant Submission Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Product</p>
                <p className="font-semibold text-green-900">{submittedVariants.productName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Added Variants</p>
                <div className="rounded-lg border border-green-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100">
                      <tr>
                        <th className="text-left px-4 py-2 text-green-800 font-medium">Variant Name</th>
                        <th className="text-left px-4 py-2 text-green-800 font-medium">Price</th>
                        <th className="text-left px-4 py-2 text-green-800 font-medium">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submittedVariants.variants.map((v, i) => (
                        <tr key={i} className="border-t border-green-200">
                          <td className="px-4 py-2 text-green-900">{v.variantName}</td>
                          <td className="px-4 py-2 text-green-900">${v.price}</td>
                          <td className="px-4 py-2 text-green-900">{v.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Product Data Sync
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Products are managed through Google Sheets. Edit your products in the spreadsheet, then refresh the cache to see changes on the site.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last refreshed:</span>
                  <span className="font-medium">{formatLastFetched(cacheStatus?.lastFetched || null)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground ml-6">Products in cache:</span>
                  <span className="font-medium">{cacheStatus?.productCount ?? "—"}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Refreshing..." : "Refresh Products from Google Sheets"}
                </Button>
              </div>

              {refreshResult && (
                <div
                  className={`rounded-lg p-3 flex items-start gap-2 ${
                    refreshResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {refreshResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  )}
                  <div className="text-sm">
                    {refreshResult.success ? (
                      <p className="text-green-800">
                        {refreshResult.message} ({refreshResult.productCount} products loaded)
                      </p>
                    ) : (
                      <p className="text-red-800">
                        {refreshResult.error}
                        {refreshResult.details && (
                          <span className="block text-xs mt-1 opacity-75">{refreshResult.details}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                The cache automatically refreshes every 5 minutes. Use the button above for immediate updates.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Edit Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Open the Google Sheet to add, edit, or remove products. You can update prices, descriptions, research info, and stock quantities directly in the spreadsheet.
              </p>

              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Sheet Structure:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li><strong>Products tab:</strong> slug, name, category, shortDescription, description, research, shippingInfo, faq, featured, active, images</li>
                    <li><strong>Variants tab:</strong> productSlug, variantName, price (in dollars), sku, stock</li>
                  </ul>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(sheetUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Google Sheet
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                After making changes in the sheet, come back here and click "Refresh Products" to update the site.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
