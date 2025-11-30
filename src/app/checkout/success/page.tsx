"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCartStore } from "@/store/cart"
import { CheckCircle, Package, Mail, ArrowRight } from "lucide-react"

export default function CheckoutSuccessPage() {
  const { clearCart } = useCartStore()

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="py-16">
      <div className="container-custom max-w-2xl">
        <Card>
          <CardContent className="pt-12 pb-8 text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Thank You for Your Order!</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Your order has been successfully placed. You will receive a confirmation email shortly with your order details and tracking information.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Confirmation Email</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Check your inbox for order details and receipt.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Shipping</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your order will ship within 1-2 business days.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-800">
                <strong>Research Use Only:</strong> Please remember that all products are intended 
                for laboratory research purposes only. Store peptides properly upon receipt.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/peptides">
                  Continue Shopping
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/account">
                  View Order History
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
