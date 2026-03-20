"use client"

import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/utils"
import { User, Package, LogOut, Loader2 } from "lucide-react"

interface Order {
  id: string
  orderNumber: string | null
  status: string
  total: number
  createdAt: string
  items: {
    id: string
    quantity: number
    price: number
    product: { name: string }
    variant: { name: string }
  }[]
}

export default function AccountPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin")
    }
  }, [status])

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch("/api/orders")
        if (response.ok) {
          const data = await response.json()
          setOrders(data)
        }
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchOrders()
    }
  }, [session])

  if (status === "loading") {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  }

  return (
    <div className="py-8">
      <div className="container-custom max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>

        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{session.user?.name || "User"}</p>
                <p className="text-sm text-muted-foreground">{session.user?.email}</p>
              </div>
              <Separator className="my-4" />
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    You haven&apos;t placed any orders yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            {order.orderNumber && (
                              <span className="text-sm font-medium mr-2">{order.orderNumber}</span>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <Badge className={statusColors[order.status] || ""}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between">
                              <span>
                                {item.product.name} ({item.variant.name}) x {item.quantity}
                              </span>
                              <span>{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
