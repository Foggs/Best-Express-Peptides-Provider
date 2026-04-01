"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { useAdminAuth } from "@/hooks/admin/useAdminAuth"
import { AddNewProductForm } from "@/components/admin/products/AddNewProductForm"
import { AddVariantForm } from "@/components/admin/products/AddVariantForm"
import { ProductCacheSync } from "@/components/admin/products/ProductCacheSync"

interface ProductsClientProps {
  sheetUrl: string
}

export function ProductsClient({ sheetUrl }: ProductsClientProps) {
  const router = useRouter()
  const { mounted, adminToken, adminUser, loading } = useAdminAuth()

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
        <AdminHeader
          title="Manage Products"
          adminEmail={adminUser?.email}
          showBack
        />

        <AddNewProductForm adminToken={adminToken} />
        <AddVariantForm adminToken={adminToken} />
        <ProductCacheSync adminToken={adminToken} sheetUrl={sheetUrl} />
      </div>
    </div>
  )
}
