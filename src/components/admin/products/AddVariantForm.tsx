"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle, PlusCircle, MinusCircle, Trash2, Loader2 } from "lucide-react"
import { useProductOptions } from "@/hooks/admin/useProductOptions"
import type { VariantFormErrors, VariantItem } from "@/types/admin"

interface AddVariantFormProps {
  adminToken: string
}

export function AddVariantForm({ adminToken }: AddVariantFormProps) {
  const [open, setOpen] = useState(false)
  const [selectedProductSlug, setSelectedProductSlug] = useState("")
  const [existingVariants, setExistingVariants] = useState<VariantItem[]>([
    { id: 1, variantName: "", price: "", stock: "" },
  ])
  const [variantFormErrors, setVariantFormErrors] = useState<VariantFormErrors>({})
  const [submittingVariants, setSubmittingVariants] = useState(false)
  const [submittedVariants, setSubmittedVariants] = useState<{
    productName: string
    productSlug: string
    variants: Array<Omit<VariantItem, "id">>
  } | null>(null)
  const [variantSubmitResult, setVariantSubmitResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const { productOptions, loadingProducts, fetchProductOptions } = useProductOptions(adminToken)

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      fetchProductOptions()
    } else {
      setSelectedProductSlug("")
      setExistingVariants([{ id: Date.now(), variantName: "", price: "", stock: "" }])
      setVariantFormErrors({})
      setSubmittedVariants(null)
      setVariantSubmitResult(null)
    }
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
          body: JSON.stringify({ productSlug: selectedProductSlug, variants: variantData }),
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
          setOpen(false)
        } else {
          setVariantSubmitResult({ success: false, message: data.error || "Failed to add variants." })
        }
      } catch {
        setVariantSubmitResult({ success: false, message: "Network error. Please try again." })
      }
    }

    setSubmittingVariants(false)
  }

  return (
    <>
      {variantSubmitResult && (
        <div className={`mb-6 flex items-start gap-2 text-sm rounded-lg px-4 py-3 border ${
          variantSubmitResult.success
            ? "bg-green-50 text-green-800 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {variantSubmitResult.success ? (
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <p className="font-medium">{variantSubmitResult.message}</p>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader className="cursor-pointer select-none" onClick={toggle}>
          <CardTitle className="flex items-center gap-2">
            Add Variant to Existing Product
            <span className="ml-auto">
              {open ? <MinusCircle className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
            </span>
          </CardTitle>
        </CardHeader>
        {open && (
          <CardContent>
            <form onSubmit={handleVariantSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="variant-product-select">
                  Select Product
                </label>
                {loadingProducts ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading products...
                  </div>
                ) : (
                  <select
                    id="variant-product-select"
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={selectedProductSlug}
                    onChange={(e) => {
                      setSelectedProductSlug(e.target.value)
                      setVariantFormErrors((prev) => ({ ...prev, selectedProduct: undefined }))
                    }}
                  >
                    <option value="">— Select a product —</option>
                    {productOptions.map((p) => (
                      <option key={p.slug} value={p.slug}>{p.name}</option>
                    ))}
                  </select>
                )}
                {variantFormErrors.selectedProduct && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{variantFormErrors.selectedProduct}</span>
                  </div>
                )}
              </div>

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

              {variantFormErrors.variants && (
                <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{variantFormErrors.variants}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" size="sm" onClick={addExistingVariant}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  + Add Row
                </Button>
                <Button type="submit" disabled={submittingVariants}>
                  {submittingVariants ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {submittedVariants && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Variants Added
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
    </>
  )
}
