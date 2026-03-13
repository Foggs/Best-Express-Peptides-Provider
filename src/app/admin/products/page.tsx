"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, LogOut } from "lucide-react"
import { useAdminAuth } from "@/hooks/admin/useAdminAuth"
import { AddNewProductForm } from "@/components/admin/products/AddNewProductForm"
import { AddVariantForm } from "@/components/admin/products/AddVariantForm"
import { ProductCacheSync } from "@/components/admin/products/ProductCacheSync"

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || ""}/edit`

export default function ProductsPage() {
  const router = useRouter()
  const { mounted, adminToken, adminUser, loading, handleLogout } = useAdminAuth()

  if (!mounted || loading) {
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
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Manage Products</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{adminUser?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <AddNewProductForm adminToken={adminToken} />
        <AddVariantForm adminToken={adminToken} />
        <ProductCacheSync adminToken={adminToken} sheetUrl={SHEET_URL} />
      </div>
    </div>
  )
}
