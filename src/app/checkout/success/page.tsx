"use client"

import { useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCartStore } from "@/store/cart"
import { CheckCircle, Package, Mail, ArrowRight, Printer } from "lucide-react"

function SuccessContent() {
  const { clearCart } = useCartStore()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order")

  useEffect(() => {
    clearCart()
  }, [clearCart])

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
            <CardContent className="pt-12 pb-8 text-center">
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

              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Your order has been submitted successfully. Our team will review your order and reach out to you with payment details and next steps.
              </p>

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
