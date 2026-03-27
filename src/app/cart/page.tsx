"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight,
  AlertTriangle,
  ShoppingBag,
  FileDown
} from "lucide-react"

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="py-16">
        <div className="container-custom">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-muted-foreground">Loading cart...</div>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-16">
        <div className="container-custom">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Looks like you haven&apos;t added any peptides to your cart yet.
            </p>
            <Button asChild>
              <Link href="/peptides">
                Browse Peptides
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const subtotal = getTotal()
  const shipping = subtotal >= 20000 ? 0 : 1500
  const total = subtotal + shipping

  return (
    <div className="py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <Link href="/peptides" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.variantId}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div
                      className="w-24 h-24 rounded-md shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: "url('/images/peptide-bckgrd.png')" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link href={`/peptides/${item.slug}`} className="font-semibold hover:text-primary">
                            {item.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">{item.variantName}</p>
                        </div>
                        <p className="font-semibold shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border rounded-md">
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-2 min-w-[50px] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variantId, Math.min(item.stock || 999, item.quantity + 1))}
                            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={item.stock !== undefined && item.quantity >= item.stock}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {item.stock !== undefined && item.quantity >= item.stock && (
                          <span className="text-xs text-amber-600">Max quantity reached</span>
                        )}
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            </div>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Free shipping on orders over $200
                  </p>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button asChild className="w-full" size="lg">
                  <Link href="/checkout">
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                
                <a
                  href="/pdfs/Certificates_of_Analysis.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors w-full justify-center"
                >
                  <FileDown className="h-4 w-4" />
                  <span className="font-bold">Download Certificate of Analysis</span>
                </a>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 w-full">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      By proceeding, you confirm these products are for research use only.
                    </p>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
