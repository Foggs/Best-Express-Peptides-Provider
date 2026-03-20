"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, Tag, Package } from "lucide-react"
import { AdminHeader } from "@/components/admin/AdminHeader"

interface AdminUser {
  id: string
  email: string
  name: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)

  useEffect(() => {
    setMounted(true)
    const savedToken = localStorage.getItem("adminToken")
    const savedUser = localStorage.getItem("adminUser")
    if (savedToken && savedUser) {
      setAdminToken(savedToken)
      setAdminUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogout = () => {
    setAdminToken(null)
    setAdminUser(null)
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
          title="Admin Dashboard"
          adminEmail={adminUser?.email}
          onLogout={handleLogout}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={() => router.push("/admin/products")}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-purple-600" />
                <CardTitle>Products</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Create, edit, and manage research peptide products.</p>
              <Button className="w-full">Manage Products</Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={() => router.push("/admin/orders")}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-green-600" />
                <CardTitle>Orders</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">View and manage all customer orders.</p>
              <Button className="w-full">View Orders</Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={() => router.push("/admin/coupons")}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <Tag className="h-6 w-6 text-blue-600" />
                <CardTitle>Manage Coupons</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Create, edit, and manage discount coupons for your store.</p>
              <Button className="w-full">Open Coupons</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
