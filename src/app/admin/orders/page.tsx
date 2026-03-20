"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { formatPrice } from "@/lib/utils"

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
  }
  variant: {
    id: string
    name: string
  }
}

interface Order {
  id: string
  email: string
  user?: {
    email: string
    name: string | null
  }
  status: string
  total: number
  subtotal: number
  tax: number
  shipping: number
  discount: number
  couponCode: string | null
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

interface AdminUser {
  id: string
  email: string
  name: string
}

export default function OrdersPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    const savedToken = localStorage.getItem("adminToken")
    const savedUser = localStorage.getItem("adminUser")
    if (savedToken && savedUser) {
      setAdminToken(savedToken)
      setAdminUser(JSON.parse(savedUser))
      fetchOrders(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchOrders = async (token: string) => {
    try {
      const response = await fetch("/api/admin/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch orders")
      }

      const data = await response.json()
      setOrders(data)
    } catch (err) {
      console.error("Error loading orders:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setAdminToken(null)
    setAdminUser(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "PROCESSING":
        return "bg-blue-100 text-blue-800"
      case "SHIPPED":
        return "bg-purple-100 text-purple-800"
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      case "REFUNDED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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

  return (
    <div className="py-8">
      <div className="container-custom">
        <AdminHeader
          title="Orders"
          adminEmail={adminUser?.email}
          showBack
          onLogout={handleLogout}
        />

        {loading ? (
          <p className="text-muted-foreground">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold">Order {order.id.substring(0, 8).toUpperCase()}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Email: {order.user?.email || order.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Date: {new Date(order.createdAt).toLocaleDateString()} at{" "}
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${formatPrice(order.total)}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded p-3 space-y-2">
                      <h4 className="font-semibold text-sm">Items</h4>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>
                            {item.product.name} - {item.variant.name} x{item.quantity}
                          </span>
                          <span>${formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Subtotal</span>
                        <p className="font-semibold">${formatPrice(order.subtotal)}</p>
                      </div>
                      {order.tax > 0 && (
                        <div>
                          <span className="text-muted-foreground">Tax</span>
                          <p className="font-semibold">${formatPrice(order.tax)}</p>
                        </div>
                      )}
                      {order.shipping > 0 && (
                        <div>
                          <span className="text-muted-foreground">Shipping</span>
                          <p className="font-semibold">${formatPrice(order.shipping)}</p>
                        </div>
                      )}
                      {order.discount > 0 && (
                        <div>
                          <span className="text-muted-foreground">Discount</span>
                          <p className="font-semibold text-green-600">-${formatPrice(order.discount)}</p>
                        </div>
                      )}
                      {order.couponCode && (
                        <div>
                          <span className="text-muted-foreground">Coupon</span>
                          <p className="font-semibold text-xs">{order.couponCode}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
