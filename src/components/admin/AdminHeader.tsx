"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, LogOut } from "lucide-react"

interface AdminHeaderProps {
  title: string
  adminEmail?: string
  showBack?: boolean
  onLogout?: () => void
}

export function AdminHeader({ title, adminEmail, showBack = false, onLogout }: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
    onLogout?.()
    router.push("/")
  }

  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-4">
        {showBack && (
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {adminEmail && (
          <span className="text-sm text-muted-foreground">{adminEmail}</span>
        )}
        <Button variant="outline" size="sm" onClick={() => router.push("/")}>
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}
