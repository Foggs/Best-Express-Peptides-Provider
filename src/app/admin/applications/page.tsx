"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"

interface Application {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
  npiNumber: string
  state: string
  hasResellerLicense: string
  referredBy: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  existingUserAtIntake: boolean
  createdAt: string
}

interface AdminUser {
  id: string
  email: string
  name: string
}

type SortField = "name" | "company" | "date" | "status"
type SortDir = "asc" | "desc"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
}

export default function AdminApplicationsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [approveError, setApproveError] = useState("")
  const [approveNotice, setApproveNotice] = useState("")

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("adminToken")
    const user = localStorage.getItem("adminUser")
    if (token && user) {
      setAdminToken(token)
      setAdminUser(JSON.parse(user))
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (!adminToken) { setLoading(false); return }
    fetch("/api/admin/applications", {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setApplications(data.applications ?? [])
      })
      .catch(() => setError("Failed to load applications"))
      .finally(() => setLoading(false))
  }, [mounted, adminToken])

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortField(field); setSortDir("asc") }
  }

  async function approveApplication(app: Application, isReissue: boolean) {
    if (!adminToken) return
    const verb = isReissue ? "Reissue setup link for" : "Approve"
    if (!confirm(`${verb} ${app.firstName} ${app.lastName} (${app.email})? A fresh password setup email will be sent and any previous setup link will be invalidated.`)) {
      return
    }
    setApprovingId(app.id)
    setApproveError("")
    setApproveNotice("")
    try {
      const res = await fetch(`/api/admin/applications/${app.id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setApproveError(data.error || "Failed to approve application")
      } else {
        setApplications((prev) =>
          prev.map((a) => (a.id === app.id ? { ...a, status: "APPROVED" } : a)),
        )
        setApproveNotice(
          data.warning ??
            (isReissue
              ? `Fresh setup link sent to ${app.email}.`
              : `Approved ${app.email}. Welcome email sent.`),
        )
      }
    } catch {
      setApproveError("Network error while approving application")
    } finally {
      setApprovingId(null)
    }
  }

  async function rejectApplication(app: Application) {
    if (!adminToken) return
    if (!confirm(`Reject ${app.firstName} ${app.lastName} (${app.email})? They will be notified by email and the application will be marked REJECTED.`)) {
      return
    }
    setRejectingId(app.id)
    setApproveError("")
    setApproveNotice("")
    try {
      const res = await fetch(`/api/admin/applications/${app.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setApproveError(data.error || "Failed to reject application")
      } else {
        setApplications((prev) =>
          prev.map((a) => (a.id === app.id ? { ...a, status: "REJECTED" } : a)),
        )
        setApproveNotice(
          data.warning ?? `Rejected ${app.email}. Notification email sent.`,
        )
      }
    } catch {
      setApproveError("Network error while rejecting application")
    } finally {
      setRejectingId(null)
    }
  }

  const sorted = [...applications].sort((a, b) => {
    let cmp = 0
    if (sortField === "name") cmp = `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)
    else if (sortField === "company") cmp = a.companyName.localeCompare(b.companyName)
    else if (sortField === "date") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    else if (sortField === "status") cmp = a.status.localeCompare(b.status)
    return sortDir === "asc" ? cmp : -cmp
  })

  if (!mounted) return null

  if (!adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Please log in to access the admin dashboard.</p>
            <Button onClick={() => router.push("/admin/login")} className="w-full">Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  function SortButton({ field, label }: { field: SortField; label: string }) {
    return (
      <button
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
      >
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      </button>
    )
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <AdminHeader title="Provider Applications" adminEmail={adminUser?.email} showBack />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md mb-6">
            {error}
          </div>
        )}
        {approveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md mb-6">
            {approveError}
          </div>
        )}
        {approveNotice && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-md mb-6">
            {approveNotice}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Submitted Applications</span>
              <span className="text-sm font-normal text-muted-foreground">
                {applications.length} total
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading applications…</div>
            ) : sorted.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No applications submitted yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left"><SortButton field="name" label="Applicant" /></th>
                      <th className="px-4 py-3 text-left"><SortButton field="company" label="Company" /></th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">NPI</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">State</th>
                      <th className="px-4 py-3 text-left"><SortButton field="date" label="Submitted" /></th>
                      <th className="px-4 py-3 text-left"><SortButton field="status" label="Status" /></th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sorted.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          {app.firstName} {app.lastName}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{app.companyName}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {app.email}
                          {app.existingUserAtIntake && (
                            <span
                              className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-amber-50 text-amber-800 border-amber-200"
                              title="An account with this email already existed when this application was submitted. Verify the applicant's identity before approving."
                            >
                              account exists
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{app.npiNumber}</td>
                        <td className="px-4 py-3 text-gray-600">{app.state}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[app.status] ?? ""}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {app.status === "PENDING" ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => approveApplication(app, false)}
                                disabled={approvingId === app.id || rejectingId === app.id}
                              >
                                {approvingId === app.id ? "Approving…" : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                onClick={() => rejectApplication(app)}
                                disabled={approvingId === app.id || rejectingId === app.id}
                              >
                                {rejectingId === app.id ? "Rejecting…" : "Reject"}
                              </Button>
                            </div>
                          ) : app.status === "APPROVED" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveApplication(app, true)}
                              disabled={approvingId === app.id}
                              title="Generate a fresh setup link and resend the welcome email"
                            >
                              {approvingId === app.id ? "Sending…" : "Reissue link"}
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
