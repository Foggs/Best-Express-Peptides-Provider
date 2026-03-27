"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import { CheckCircle, Package, Mail, ArrowRight, Printer, FileDown } from "lucide-react"

interface OrderSummary {
  items: {
    id: string
    name: string
    variantName: string
    price: number
    quantity: number
  }[]
  email: string
  shippingAddress: {
    firstName: string
    lastName: string
    address: string
    apartment?: string
    city: string
    state: string
    zipCode: string
    phone?: string
  }
  subtotal: number
  shipping: number
  discount: number
  total: number
  couponCode?: string | null
}

function SuccessContent() {
  const { clearCart } = useCartStore()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order")
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null)

  useEffect(() => {
    clearCart()
    if (orderNumber) {
      const stored = sessionStorage.getItem(`order-${orderNumber}`)
      if (stored) {
        try {
          setOrderSummary(JSON.parse(stored))
        } catch {
          // silently ignore parse errors
        }
      }
    }
  }, [clearCart, orderNumber])

  const addr = orderSummary?.shippingAddress

  return (
    <>
      <style>{`
        @media print {
          header, footer, nav, .print-hidden { display: none !important; }
          body { background: white !important; }
          .print-card { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="py-16">
        <div className="container-custom max-w-2xl">
          <Card className="print-card">
            <CardContent className="pt-12 pb-8">
              <div className="text-center mb-8">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 print-hidden">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>

                <h1 className="text-3xl font-bold mb-4">Thank You for Your Order!</h1>

                {orderNumber && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-8 py-5 mb-6 inline-block">
                    <p className="text-xs text-blue-500 uppercase tracking-widest font-semibold mb-1">Your Order Number</p>
                    <p className="text-3xl font-bold font-mono tracking-widest text-blue-700">{orderNumber}</p>
                    <p className="text-xs text-blue-400 mt-1">Keep this for your records</p>
                  </div>
                )}

                <p className="text-muted-foreground max-w-md mx-auto">
                  Your order has been submitted successfully. Our team will review your order and reach out to you with payment details and next steps.
                </p>
              </div>

              {orderSummary && (
                <>
                  <Separator className="my-6" />

                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">Contact</h2>
                        <p className="text-sm">{orderSummary.email}</p>
                      </div>
                      {addr && (
                        <div>
                          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">Ship To</h2>
                          <p className="text-sm leading-relaxed">
                            {addr.firstName} {addr.lastName}<br />
                            {addr.address}{addr.apartment ? `, ${addr.apartment}` : ""}<br />
                            {addr.city}, {addr.state} {addr.zipCode}
                            {addr.phone && <><br />{addr.phone}</>}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Order Items</h2>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Product</th>
                              <th className="text-center px-4 py-2 font-medium text-muted-foreground">Qty</th>
                              <th className="text-right px-4 py-2 font-medium text-muted-foreground">Price</th>
                              <th className="text-right px-4 py-2 font-medium text-muted-foreground">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderSummary.items.map((item) => (
                              <tr key={item.id} className="border-t">
                                <td className="px-4 py-3">
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">{item.variantName}</p>
                                </td>
                                <td className="px-4 py-3 text-center">{item.quantity}</td>
                                <td className="px-4 py-3 text-right">{formatPrice(item.price)}</td>
                                <td className="px-4 py-3 text-right">{formatPrice(item.price * item.quantity)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(orderSummary.subtotal)}</span>
                      </div>
                      {orderSummary.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount{orderSummary.couponCode ? ` (${orderSummary.couponCode})` : ""}</span>
                          <span>-{formatPrice(orderSummary.discount)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span className="text-blue-700">{formatPrice(orderSummary.total)}</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />
                </>
              )}

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <span className="font-semibold">What Happens Next</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You will be contacted with payment instructions and order confirmation.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Shipping</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your order will ship within 1-2 business days after payment is confirmed.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-blue-800">
                  <strong>Research Use Only:</strong> Please remember that all products are intended
                  for laboratory research purposes only. Store peptides properly upon receipt.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center print-hidden">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print / Save as PDF
                </Button>
                <Button asChild>
                  <Link href="/peptides">
                    Continue Shopping
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="flex justify-center mt-4 print-hidden">
                <a
                  href="/pdfs/Certificates_of_Analysis.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <FileDown className="h-4 w-4" />
                  <span className="font-bold">Download Certificate of Analysis</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-muted-foreground">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
