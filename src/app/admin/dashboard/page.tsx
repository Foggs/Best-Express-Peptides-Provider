"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Tag } from "lucide-react"

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
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
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
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {adminUser?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
