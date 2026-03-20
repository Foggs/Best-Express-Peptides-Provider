"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { formatPrice } from "@/lib/utils"
import { ArrowUpDown, ChevronDown, ChevronUp, Loader2 } from "lucide-react"

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
  orderNumber: string | null
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

type SortField = "date" | "total" | "status" | "orderNumber"
type SortDirection = "asc" | "desc"

const ORDER_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
]

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
  SHIPPED: "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  REFUNDED: "bg-gray-100 text-gray-800 border-gray-200",
}

export default function OrdersPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!adminToken) return
    setUpdatingOrderId(orderId)
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update order status")
      }

      const updatedOrder = await response.json()
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o))
      )
    } catch (err) {
      console.error("Error updating order status:", err)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection(field === "date" ? "desc" : "asc")
    }
  }

  const sortedOrders = useMemo(() => {
    const sorted = [...orders]
    sorted.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "total":
          comparison = a.total - b.total
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
        case "orderNumber":
          comparison = (a.orderNumber || "").localeCompare(b.orderNumber || "")
          break
      }
      return sortDirection === "asc" ? comparison : -comparison
    })
    return sorted
  }, [orders, sortField, sortDirection])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5 ml-1" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 ml-1" />
    )
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No orders yet.</p>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
            </div>

            <div className="rounded-lg border bg-white overflow-hidden">
              <div className="hidden md:grid md:grid-cols-[1fr_1.5fr_1fr_140px_100px] gap-4 px-4 py-3 bg-gray-50 border-b text-sm font-medium text-muted-foreground">
                <button
                  className="flex items-center hover:text-foreground transition-colors text-left"
                  onClick={() => handleSort("orderNumber")}
                >
                  Order <SortIcon field="orderNumber" />
                </button>
                <span>Customer</span>
                <button
                  className="flex items-center hover:text-foreground transition-colors text-left"
                  onClick={() => handleSort("date")}
                >
                  Date <SortIcon field="date" />
                </button>
                <button
                  className="flex items-center hover:text-foreground transition-colors text-left"
                  onClick={() => handleSort("status")}
                >
                  Status <SortIcon field="status" />
                </button>
                <button
                  className="flex items-center justify-end hover:text-foreground transition-colors"
                  onClick={() => handleSort("total")}
                >
                  Total <SortIcon field="total" />
                </button>
              </div>

              <div className="divide-y">
                {sortedOrders.map((order) => (
                  <div key={order.id}>
                    <div
                      className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_140px_100px] gap-2 md:gap-4 px-4 py-3 hover:bg-gray-50/50 cursor-pointer transition-colors items-center"
                      onClick={() =>
                        setExpandedOrderId(
                          expandedOrderId === order.id ? null : order.id
                        )
                      }
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform md:hidden ${
                            expandedOrderId === order.id ? "rotate-180" : ""
                          }`}
                        />
                        <span className="font-medium text-sm">
                          {order.orderNumber || order.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>

                      <div className="text-sm">
                        <p className="truncate">{order.user?.email || order.email}</p>
                        {order.user?.name && (
                          <p className="text-xs text-muted-foreground truncate">{order.user.name}</p>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}{" "}
                        <span className="hidden lg:inline">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                          disabled={updatingOrderId === order.id}
                        >
                          <SelectTrigger
                            className={`h-8 text-xs font-medium border ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800 border-gray-200"} w-[130px]`}
                          >
                            {updatingOrderId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${STATUS_COLORS[s.value]?.split(" ")[0] || "bg-gray-300"}`} />
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="text-sm font-semibold text-right">
                        ${formatPrice(order.total)}
                      </div>
                    </div>

                    {expandedOrderId === order.id && (
                      <div className="px-4 pb-4 bg-gray-50/50 border-t border-dashed">
                        <div className="grid md:grid-cols-2 gap-4 pt-3">
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Items</h4>
                            <div className="space-y-1">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>
                                    {item.product.name} - {item.variant.name} x{item.quantity}
                                  </span>
                                  <span className="text-muted-foreground">${formatPrice(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-sm mb-2">Summary</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>${formatPrice(order.subtotal)}</span>
                              </div>
                              {order.shipping > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Shipping</span>
                                  <span>${formatPrice(order.shipping)}</span>
                                </div>
                              )}
                              {order.tax > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Tax</span>
                                  <span>${formatPrice(order.tax)}</span>
                                </div>
                              )}
                              {order.discount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                                  </span>
                                  <span className="text-green-600">-${formatPrice(order.discount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                                <span>Total</span>
                                <span>${formatPrice(order.total)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
