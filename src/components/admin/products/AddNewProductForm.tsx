"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, PlusCircle, MinusCircle, Trash2 } from "lucide-react"
import { ProductContentPreview } from "./ProductContentPreview"
import type { FormErrors, GeneratedContent, SaveResult, VariantItem } from "@/types/admin"

interface AddNewProductFormProps {
  adminToken: string
}

export function AddNewProductForm({ adminToken }: AddNewProductFormProps) {
  const [open, setOpen] = useState(false)
  const [newProductName, setNewProductName] = useState("")
  const [addingProduct, setAddingProduct] = useState(false)
  const [variants, setVariants] = useState<VariantItem[]>([
    { id: 1, variantName: "", price: "", stock: "" },
  ])
  const [submittedProduct, setSubmittedProduct] = useState<{
    name: string
    variants: Array<Omit<VariantItem, "id">>
  } | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [generatingContent, setGeneratingContent] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [contentError, setContentError] = useState<string | null>(null)
  const [savingProduct, setSavingProduct] = useState(false)
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null)

  const resetForm = () => {
    setNewProductName("")
    setVariants([{ id: Date.now(), variantName: "", price: "", stock: "" }])
    setSubmittedProduct(null)
    setGeneratedContent(null)
    setContentError(null)
    setFormErrors({})
    setSaveResult(null)
  }

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (!next) resetForm()
  }

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

  const handleProductNameChange = (value: string) => {
    setNewProductName(value)
    setFormErrors((prev) => ({ ...prev, productName: undefined }))
    setSubmittedProduct(null)
    setGeneratedContent(null)
    setContentError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingProduct(true)
    setSubmittedProduct(null)
    setFormErrors({})
    setSaveResult(null)

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
          { headers: { Authorization: `Bearer ${adminToken}` } }
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
        body: JSON.stringify({ productName: productData.name, category: "Research Peptide" }),
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

  const handleSaveToSheet = async () => {
    if (!submittedProduct || !generatedContent) return
    setSavingProduct(true)
    setSaveResult(null)

    try {
      const res = await fetch("/api/admin/add-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: submittedProduct.name,
          categories: generatedContent.categories,
          shortDescription: generatedContent.shortDescription,
          description: generatedContent.description,
          research: generatedContent.research,
          variants: submittedProduct.variants.filter(
            (v) => v.variantName.trim() && v.price.trim() && v.stock.trim()
          ),
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSaveResult({
          success: true,
          message: `Product "${data.name}" saved with ${data.variantCount} variant(s).`,
          slug: data.slug,
        })
        setNewProductName("")
        setVariants([{ id: Date.now(), variantName: "", price: "", stock: "" }])
        setSubmittedProduct(null)
        setGeneratedContent(null)
        setContentError(null)
        setFormErrors({})
      } else {
        setSaveResult({ success: false, message: data.error || "Failed to save product." })
      }
    } catch {
      setSaveResult({ success: false, message: "Network error while saving. Please try again." })
    } finally {
      setSavingProduct(false)
    }
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="cursor-pointer select-none" onClick={toggle}>
          <CardTitle className="flex items-center gap-2">
            Add New Product
            <span className="ml-auto">
              {open ? <MinusCircle className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
            </span>
          </CardTitle>
        </CardHeader>
        {open && (
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
        )}
      </Card>

      {submittedProduct && (
        <ProductContentPreview
          submittedProduct={submittedProduct}
          generatedContent={generatedContent}
          generatingContent={generatingContent}
          contentError={contentError}
          savingProduct={savingProduct}
          saveResult={saveResult}
          onSave={handleSaveToSheet}
        />
      )}
    </>
  )
}
