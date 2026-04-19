"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle, Loader2, Upload } from "lucide-react"

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
]

const SUFFIXES = ["Jr.", "Sr.", "II", "III", "IV", "MD", "DO", "PhD", "NP", "PA"]

interface FieldErrors {
  [key: string]: string
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
      {children}
    </h2>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-red-600 text-xs mt-1">{msg}</p>
}

function FileUploadInput({
  id,
  label,
  required,
  accept,
  fileRef,
  fileName,
  onChange,
  error,
}: {
  id: string
  label: string
  required?: boolean
  accept?: string
  fileRef: React.RefObject<HTMLInputElement>
  fileName: string
  onChange: (name: string) => void
  error?: string
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2 block">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <div
        className={`flex items-center gap-3 border rounded-md px-3 py-2 bg-white ${error ? "border-red-400" : "border-gray-300"}`}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          className="shrink-0"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Upload
        </Button>
        <span className="text-sm text-gray-500">
          {fileName || "or drag files here."}
        </span>
        <input
          ref={fileRef}
          id={id}
          type="file"
          accept={accept ?? ".pdf,.jpg,.jpeg,.png"}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
        />
      </div>
      <FieldError msg={error} />
    </div>
  )
}

export default function ProviderIntakePage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [globalError, setGlobalError] = useState("")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [suffix, setSuffix] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [website, setWebsite] = useState("")
  const [taxId, setTaxId] = useState("")
  const [npiNumber, setNpiNumber] = useState("")
  const [npiOwnerMatch, setNpiOwnerMatch] = useState<"true" | "false" | "">("")
  const [hasResellerLicense, setHasResellerLicense] = useState<"YES" | "NO" | "NOT_SURE" | "">("")
  const [resellerPermitNumber, setResellerPermitNumber] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [referredBy, setReferredBy] = useState("")
  const [comments, setComments] = useState("")

  const [certFileName, setCertFileName] = useState("")
  const [licenseFileName, setLicenseFileName] = useState("")
  const certRef = useRef<HTMLInputElement>(null!)
  const licenseRef = useRef<HTMLInputElement>(null!)

  const showResellerFields = hasResellerLicense === "YES"

  function validate(): boolean {
    const e: FieldErrors = {}
    if (!firstName.trim()) e.firstName = "First name is required"
    if (!lastName.trim()) e.lastName = "Last name is required"
    if (!email.trim()) e.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address"
    if (!phone.trim()) e.phone = "Phone is required"
    if (!companyName.trim()) e.companyName = "Company name is required"
    if (!website.trim()) e.website = "Website is required"
    if (!taxId.trim()) e.taxId = "Tax ID / EIN is required"
    if (!npiNumber.trim()) e.npiNumber = "NPI Number is required"
    if (!npiOwnerMatch) e.npiOwnerMatch = "Please select Yes or No"
    if (!hasResellerLicense) e.hasResellerLicense = "Please select your reseller license status"
    if (hasResellerLicense === "YES") {
      if (!resellerPermitNumber.trim()) e.resellerPermitNumber = "Permit number is required"
      if (!certRef.current?.files?.[0]) e.resellerCertificate = "Certificate upload is required"
    }
    if (!addressLine1.trim()) e.addressLine1 = "Address is required"
    if (!city.trim()) e.city = "City is required"
    if (!state) e.state = "State is required"
    if (!zipCode.trim()) e.zipCode = "Zip code is required"
    if (!referredBy.trim()) e.referredBy = "Referral information is required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGlobalError("")
    if (!validate()) {
      document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setLoading(true)
    const fd = new FormData()
    fd.append("firstName", firstName)
    fd.append("lastName", lastName)
    if (suffix) fd.append("suffix", suffix)
    fd.append("email", email)
    fd.append("phone", phone)
    fd.append("companyName", companyName)
    fd.append("website", website)
    fd.append("taxId", taxId)
    fd.append("npiNumber", npiNumber)
    fd.append("npiOwnerMatch", npiOwnerMatch)
    fd.append("hasResellerLicense", hasResellerLicense)
    if (resellerPermitNumber) fd.append("resellerPermitNumber", resellerPermitNumber)
    fd.append("addressLine1", addressLine1)
    fd.append("city", city)
    fd.append("state", state)
    fd.append("zipCode", zipCode)
    fd.append("referredBy", referredBy)
    if (comments) fd.append("comments", comments)

    const certFile = certRef.current?.files?.[0]
    if (certFile) fd.append("resellerCertificate", certFile)

    const licenseFile = licenseRef.current?.files?.[0]
    if (licenseFile) fd.append("businessLicense", licenseFile)

    try {
      const res = await fetch("/api/provider-intake", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) {
        if (json.field) setErrors({ [json.field]: json.error })
        else setGlobalError(json.error ?? "Submission failed. Please try again.")
        return
      }
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setGlobalError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 max-w-md w-full text-center">
          <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted</h2>
          <p className="text-gray-600 mb-6">
            Thank you for applying! Your Provider Intake form has been received. Our team will
            review your information and reach out via email within 2–3 business days.
          </p>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            Return to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Disclaimer */}
        <div className="bg-white border border-gray-200 rounded-md p-4 mb-6 text-xs text-gray-600 leading-relaxed">
          <span className="font-semibold text-blue-600">Disclaimer:</span>{" "}
          This platform provides access exclusively to verified healthcare providers, research
          institutions, and group purchasing organizations (GPOs) for institutional and laboratory
          use. All product orders must originate from authorized accounts and are supplied strictly
          for in-vitro research and analytical purposes. We do not sell directly to patients or
          individual consumers, and all materials are distributed under research-use-only (RUO)
          classification.
        </div>

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-0">
            <div className="flex items-center gap-0.5">
              <span className="text-blue-600 font-black text-2xl tracking-tight">Alpha</span>
              <div className="flex flex-col leading-none ml-0.5">
                <div className="w-6 h-1.5 bg-blue-600 rounded-sm mb-0.5" />
                <div className="w-6 h-1.5 bg-blue-400 rounded-sm" />
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium -mb-1">BioMed</div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 ml-2">Provider Intake</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* Global error */}
          {globalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md">
              {globalError}
            </div>
          )}

          {/* ── Contact Information ─────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <SectionTitle>Contact Information</SectionTitle>

            {/* Name row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-1">
                <Label htmlFor="firstName">
                  First Name<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="First"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={errors.firstName ? "border-red-400" : ""}
                  data-error={errors.firstName ? true : undefined}
                />
                <FieldError msg={errors.firstName} />
              </div>
              <div className="sm:col-span-1">
                <Label htmlFor="lastName">
                  Last Name<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={errors.lastName ? "border-red-400" : ""}
                />
                <FieldError msg={errors.lastName} />
              </div>
              <div className="sm:col-span-1">
                <Label htmlFor="suffix">Suffix</Label>
                <Select value={suffix} onValueChange={setSuffix}>
                  <SelectTrigger id="suffix">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUFFIXES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Email + Phone row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">
                  Email<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-red-400" : ""}
                />
                <FieldError msg={errors.email} />
              </div>
              <div>
                <Label htmlFor="phone">
                  Phone<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="US-based mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={errors.phone ? "border-red-400" : ""}
                />
                <FieldError msg={errors.phone} />
              </div>
            </div>
          </div>

          {/* ── Business Profile ────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <SectionTitle>Business Profile</SectionTitle>

            {/* Company + Business Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="companyName">
                  Company Name<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={errors.companyName ? "border-red-400" : ""}
                />
                <FieldError msg={errors.companyName} />
              </div>
              <div>
                <Label>Business Type</Label>
                <p className="text-sm text-gray-700 mt-2 font-medium">Provider</p>
              </div>
            </div>

            {/* Website + Tax ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="website">
                  Website<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="website"
                  placeholder="https://"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className={errors.website ? "border-red-400" : ""}
                />
                <FieldError msg={errors.website} />
              </div>
              <div>
                <Label htmlFor="taxId">
                  Tax ID / EIN<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="taxId"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className={errors.taxId ? "border-red-400" : ""}
                />
                <FieldError msg={errors.taxId} />
              </div>
            </div>

            {/* NPI + NPI owner match */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="npiNumber">
                  NPI Number<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="npiNumber"
                  value={npiNumber}
                  onChange={(e) => setNpiNumber(e.target.value)}
                  className={errors.npiNumber ? "border-red-400" : ""}
                />
                <FieldError msg={errors.npiNumber} />
              </div>
              <div>
                <Label className="block mb-2">
                  Does the owner of the NPI number match the contact for this account?
                  <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <div className="flex gap-6">
                  {(["true", "false"] as const).map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="npiOwnerMatch"
                        value={val}
                        checked={npiOwnerMatch === val}
                        onChange={() => setNpiOwnerMatch(val)}
                        className="accent-blue-600"
                      />
                      {val === "true" ? "Yes" : "No"}
                    </label>
                  ))}
                </div>
                <FieldError msg={errors.npiOwnerMatch} />
              </div>
            </div>

            {/* Reseller license + Permit number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-1">
              <div>
                <Label className="block mb-2">
                  Does your business have a reseller&apos;s license?
                  <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <div className="flex gap-4">
                  {(["YES", "NO", "NOT_SURE"] as const).map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="hasResellerLicense"
                        value={val}
                        checked={hasResellerLicense === val}
                        onChange={() => setHasResellerLicense(val)}
                        className="accent-blue-600"
                      />
                      {val === "YES" ? "Yes" : val === "NO" ? "No" : "Not sure"}
                    </label>
                  ))}
                </div>
                <FieldError msg={errors.hasResellerLicense} />
              </div>
              <div>
                <Label htmlFor="resellerPermitNumber">
                  Reseller&apos;s Permit Number
                  {showResellerFields && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
                <Input
                  id="resellerPermitNumber"
                  value={resellerPermitNumber}
                  onChange={(e) => setResellerPermitNumber(e.target.value)}
                  disabled={!showResellerFields}
                  className={errors.resellerPermitNumber ? "border-red-400" : ""}
                />
                <FieldError msg={errors.resellerPermitNumber} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Helps determine your eligibility for sales tax exemption.
            </p>

            {/* Reseller certificate — conditional */}
            {showResellerFields && (
              <FileUploadInput
                id="resellerCertificate"
                label="Upload Reseller's Certificate"
                required
                fileRef={certRef}
                fileName={certFileName}
                onChange={setCertFileName}
                error={errors.resellerCertificate}
              />
            )}
          </div>

          {/* ── Business Address ────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <SectionTitle>Business Address</SectionTitle>
            <p className="text-sm text-gray-500 -mt-2 mb-4">
              If not applicable, use your main operating address
            </p>

            <div className="mb-4">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className={errors.addressLine1 ? "border-red-400" : ""}
              />
              <FieldError msg={errors.addressLine1} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={errors.city ? "border-red-400" : ""}
                />
                <FieldError msg={errors.city} />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger id="state" className={errors.state ? "border-red-400" : ""}>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError msg={errors.state} />
              </div>
              <div>
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  placeholder="Zip Code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  maxLength={10}
                  className={errors.zipCode ? "border-red-400" : ""}
                />
                <FieldError msg={errors.zipCode} />
              </div>
            </div>
            <p className="text-xs text-gray-500">All fields are required</p>
          </div>

          {/* ── Verification & Referral ─────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <SectionTitle>Verification &amp; Referral</SectionTitle>

            <div className="mb-1">
              <FileUploadInput
                id="businessLicense"
                label="Upload Proof of Business or Professional License"
                fileRef={licenseRef}
                fileName={licenseFileName}
                onChange={setLicenseFileName}
              />
            </div>
            <p className="text-xs text-gray-500 mb-5">
              <span className="font-medium">Optional at this stage.</span> Clinics may upload a
              business permit; individual providers may upload a license or valid ID. Required later
              to complete your application.
            </p>

            <div>
              <Label htmlFor="referredBy">
                Referred by someone? Let us know!<span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                id="referredBy"
                placeholder="Name or code of the person who referred you"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                className={errors.referredBy ? "border-red-400" : ""}
              />
              <FieldError msg={errors.referredBy} />
            </div>
          </div>

          {/* ── Additional Notes ────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <SectionTitle>Additional Notes</SectionTitle>
            <div>
              <Label htmlFor="comments">Comments</Label>
              <textarea
                id="comments"
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* ── Consent + Submit ────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              By registering, you consent to receive email and/or SMS notifications, alerts, and
              occasional marketing communication. Message frequency varies. Message &amp; data rates
              may apply. See our{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}
