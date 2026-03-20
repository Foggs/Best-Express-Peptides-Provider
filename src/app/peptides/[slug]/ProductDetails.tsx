"use client"

import { useState } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ProductCard } from "@/components/products/ProductCard"
import { PeptideHero } from "@/components/products/PeptideHero"
import { useCartStore } from "@/store/cart"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Shield, 
  Truck, 
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from "lucide-react"
import type { Product, ProductListItem } from "@/types"

interface ProductDetailsProps {
  product: Product
  relatedProducts: ProductListItem[]
}

export function ProductDetails({ product, relatedProducts }: ProductDetailsProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0])
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCartStore()
  const { toast } = useToast()

  const handleAddToCart = () => {
    addItem({
      id: `${product.id}-${selectedVariant.id}`,
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      variantName: selectedVariant.name,
      price: selectedVariant.price,
      quantity,
      image: product.images[0] || '',
      slug: product.slug,
      stock: selectedVariant.stock,
    })

    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} (${selectedVariant.name}) has been added to your cart.`,
    })
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <Link href="/peptides" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Peptides
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <PeptideHero name={product.name} />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {product.categories?.map((cat: { name: string; slug: string }) => (
                  <Badge key={cat.slug} variant="secondary">{cat.name}</Badge>
                )) || <Badge variant="secondary">{product.category.name}</Badge>}
              </div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-muted-foreground">{product.shortDescription}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                <p className="text-sm text-yellow-800">
                  <strong>For Research Use Only.</strong> This product is not intended for human consumption. 
                  By purchasing, you confirm this product will be used for research purposes only.
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Size</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                      selectedVariant.id === variant.id
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200 hover:border-primary'
                    }`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(selectedVariant.price)}
              </span>
              {selectedVariant.stock > 0 ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" /> {selectedVariant.stock} in stock
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center border rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 min-w-[50px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity >= selectedVariant.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full"
              onClick={handleAddToCart}
              disabled={selectedVariant.stock === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart - {formatPrice(selectedVariant.price * quantity)}
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">99%+ Purity</p>
                  <p className="text-xs text-muted-foreground">HPLC Verified</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Fast Shipping</p>
                  <p className="text-xs text-muted-foreground">2-3 Day Delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Description
              </TabsTrigger>
              <TabsTrigger value="research" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Research
              </TabsTrigger>
              <TabsTrigger value="coa" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                COA
              </TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Shipping
              </TabsTrigger>
              <TabsTrigger value="faq" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                FAQ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="pt-6">
              <Card>
                <CardContent className="pt-6 prose max-w-none">
                  <ReactMarkdown>{product.description}</ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="research" className="pt-6">
              <Card>
                <CardContent className="pt-6 prose max-w-none">
                  {product.research ? (
                    <ReactMarkdown>{product.research}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground">Research information coming soon.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coa" className="pt-6">
              <Card>
                <CardContent className="pt-6">
                  {product.coa ? (
                    <div className="space-y-4">
                      <p>Certificate of Analysis is available for this product.</p>
                      <Button variant="outline">Download COA (PDF)</Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">COA will be included with your order.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shipping" className="pt-6">
              <Card>
                <CardContent className="pt-6 prose max-w-none">
                  {product.shippingInfo ? (
                    <ReactMarkdown>{product.shippingInfo}</ReactMarkdown>
                  ) : (
                    <div>
                      <h3>Shipping Information</h3>
                      <ul>
                        <li>Orders ship within 1-2 business days</li>
                        <li>Free shipping on orders over $200</li>
                        <li>Temperature-controlled packaging</li>
                        <li>Discreet, unmarked packaging</li>
                        <li>Tracking number provided via email</li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faq" className="pt-6">
              <Card>
                <CardContent className="pt-6 prose max-w-none">
                  {product.faq ? (
                    <ReactMarkdown>{product.faq}</ReactMarkdown>
                  ) : (
                    <div>
                      <h3>Frequently Asked Questions</h3>
                      <p><strong>What purity level are your peptides?</strong></p>
                      <p>All our peptides are verified at 99%+ purity via HPLC analysis.</p>
                      <p><strong>How should I store this peptide?</strong></p>
                      <p>Store in a cool, dry place. For long-term storage, refrigerate at 2-8°C.</p>
                      <p><strong>Do you provide a Certificate of Analysis?</strong></p>
                      <p>Yes, a COA is included with every order.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <Separator className="mb-8" />
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
