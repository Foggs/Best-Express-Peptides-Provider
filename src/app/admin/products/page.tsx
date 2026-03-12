"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, LogOut, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Clock, PlusCircle, Trash2 } from "lucide-react"

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

  const addVariant = () => {
    setVariants((prev) => [...prev, { id: Date.now(), variantName: "", price: "", stock: "" }])
  }

  const removeVariant = (id: number) => {
    setVariants((prev) => prev.filter((v) => v.id !== id))
  }

  const updateVariant = (id: number, field: string, value: string) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)))
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
    }
  }, [adminToken])

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
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setAddingProduct(true)
                setSubmittedProduct({
                  name: newProductName.trim(),
                  variants: variants.map(({ variantName, price, stock }) => ({ variantName, price, stock })),
                })
                setTimeout(() => setAddingProduct(false), 500)
              }}
              className="space-y-4"
            >
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input
                    id="product-name"
                    placeholder="Enter product name"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={addingProduct || !newProductName.trim() || variants.length === 0}>
                  {addingProduct ? "Submitting..." : "Submit"}
                </Button>
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

              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <PlusCircle className="h-4 w-4 mr-2" />
                + Add Variant
              </Button>
            </form>
          </CardContent>
        </Card>

        {submittedProduct && (
          <Card className="mb-6 border-green-200 bg-green-50">
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
