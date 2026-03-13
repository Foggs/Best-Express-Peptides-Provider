"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2, Save } from "lucide-react"
import ReactMarkdown from "react-markdown"
import type { GeneratedContent, SaveResult, VariantItem } from "@/types/admin"

interface SubmittedProduct {
  name: string
  variants: Array<Omit<VariantItem, "id">>
}

interface ProductContentPreviewProps {
  submittedProduct: SubmittedProduct
  generatedContent: GeneratedContent | null
  generatingContent: boolean
  contentError: string | null
  savingProduct: boolean
  saveResult: SaveResult | null
  onSave: () => void
}

export function ProductContentPreview({
  submittedProduct,
  generatedContent,
  generatingContent,
  contentError,
  savingProduct,
  saveResult,
  onSave,
}: ProductContentPreviewProps) {
  return (
    <>
      {saveResult && (
        <div className={`mb-6 flex items-start gap-2 text-sm rounded-lg px-4 py-3 border ${
          saveResult.success
            ? "bg-green-50 text-green-800 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {saveResult.success ? (
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium">{saveResult.message}</p>
            {saveResult.success && saveResult.slug && (
              <a
                href={`/peptides/${saveResult.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-green-700 underline hover:text-green-900"
              >
                View product page
              </a>
            )}
          </div>
        </div>
      )}

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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {generatedContent.categories.split(",").map((cat, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                      {cat.trim()}
                    </span>
                  ))}
                </div>
              </div>
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

              <div className="pt-4 border-t border-green-200">
                <Button
                  onClick={onSave}
                  disabled={savingProduct}
                  className="w-full bg-green-700 hover:bg-green-800 text-white"
                  size="lg"
                >
                  {savingProduct ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Saving to Google Sheet...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save to Google Sheet
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}
