"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Plus, Trash2, Edit2, LogOut } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface Coupon {
  id: string
  code: string
  discountType: string
  discountValue: number
  isActive: boolean
  expiresAt: string | null
  maxUses: number | null
  timesUsed: number
  minOrderAmount: number
  createdAt: string
}

interface AdminUser {
  id: string
  email: string
  name: string
}

export default function AdminDashboard() {
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: 10,
    isActive: true,
    expiresAt: "",
    maxUses: "",
    minOrderAmount: 0,
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken")
    const savedUser = localStorage.getItem("adminUser")
    if (savedToken && savedUser) {
      setAdminToken(savedToken)
      setAdminUser(JSON.parse(savedUser))
      fetchCoupons(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      localStorage.setItem("adminToken", data.token)
      localStorage.setItem("adminUser", JSON.stringify(data.user))

      setAdminToken(data.token)
      setAdminUser(data.user)
      setLoginEmail("")
      setLoginPassword("")
      fetchCoupons(data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
    setAdminToken(null)
    setAdminUser(null)
    setCoupons([])
  }

  const fetchCoupons = async (token: string) => {
    try {
      const response = await fetch("/api/admin/coupons", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch coupons")
      }

      const data = await response.json()
      setCoupons(data)
    } catch (err) {
      setError("Failed to load coupons")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminToken) return

    setError("")
    setSuccess("")

    try {
      const url = editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons"
      const method = editingId ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          ...formData,
          discountValue: Number(formData.discountValue),
          minOrderAmount: Number(formData.minOrderAmount),
          maxUses: formData.maxUses ? Number(formData.maxUses) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      setSuccess(editingId ? "Coupon updated!" : "Coupon created!")
      resetForm()
      fetchCoupons(adminToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  const handleDelete = async (id: string) => {
    if (!adminToken || !confirm("Are you sure you want to delete this coupon?")) return

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete coupon")
      }

      setSuccess("Coupon deleted!")
      fetchCoupons(adminToken)
    } catch (err) {
      setError("Failed to delete coupon")
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "",
      maxUses: coupon.maxUses?.toString() || "",
      minOrderAmount: coupon.minOrderAmount,
    })
    setEditingId(coupon.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: 10,
      isActive: true,
      expiresAt: "",
      maxUses: "",
      minOrderAmount: 0,
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (!adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 flex items-center gap-2 text-red-800 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@test.com"
                  required
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
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

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Manage Coupons</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded p-4 mb-6 flex items-center gap-2 text-green-800">
              ✓ {success}
            </div>
          )}

          <Button onClick={() => setShowForm(!showForm)} className="mb-6">
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Cancel" : "New Coupon"}
          </Button>

          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingId ? "Edit Coupon" : "Create New Coupon"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Code</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., SUMMER25"
                      disabled={!!editingId}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Discount Type</Label>
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>

                    <div>
                      <Label>Discount Value</Label>
                      <Input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                        placeholder="10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Minimum Order Amount ($)</Label>
                      <Input
                        type="number"
                        value={formData.minOrderAmount}
                        onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label>Max Uses (leave empty for unlimited)</Label>
                      <Input
                        type="number"
                        value={formData.maxUses}
                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Expiration Date (optional)</Label>
                      <Input
                        type="date"
                        value={formData.expiresAt}
                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Active</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">{formData.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    {editingId ? "Update Coupon" : "Create Coupon"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <p>Loading coupons...</p>
          ) : coupons.length === 0 ? (
            <p className="text-muted-foreground">No coupons yet. Create one to get started.</p>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <Card key={coupon.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">{coupon.code}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              coupon.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {coupon.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}% off`
                            : `$${formatPrice(coupon.discountValue * 100)} off`}
                          {coupon.minOrderAmount > 0 &&
                            ` • Min: $${formatPrice(coupon.minOrderAmount * 100)}`}
                          {coupon.maxUses && ` • Uses: ${coupon.timesUsed}/${coupon.maxUses}`}
                          {coupon.expiresAt &&
                            ` • Expires: ${new Date(coupon.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
