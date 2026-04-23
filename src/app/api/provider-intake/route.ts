import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { providerIntakeDeps } from "./deps"

function req(msg: string) {
  return { required_error: msg, invalid_type_error: msg }
}

const schema = z.object({
  firstName:   z.string(req("First name is required")).min(1, "First name is required"),
  lastName:    z.string(req("Last name is required")).min(1, "Last name is required"),
  suffix:      z.string().optional(),
  email:       z.string(req("Email is required")).email("A valid email address is required"),
  phone:       z.string(req("Phone is required")).min(7, "A valid phone number is required"),
  companyName: z.string(req("Company name is required")).min(1, "Company name is required"),
  website:     z.string(req("Website is required")).min(1, "Website is required"),
  taxId:       z.string(req("Tax ID / EIN is required")).min(1, "Tax ID / EIN is required"),
  npiNumber:   z.string(req("NPI Number is required")).min(1, "NPI Number is required"),
  npiOwnerMatch: z.enum(["true", "false"], {
    required_error: "Please select Yes or No for NPI owner",
    message: "Please select Yes or No for NPI owner",
  }),
  hasResellerLicense: z.enum(["YES", "NO", "NOT_SURE"], {
    required_error: "Please select your reseller license status",
    message: "Please select your reseller license status",
  }),
  resellerPermitNumber: z.string().optional(),
  addressLine1: z.string(req("Address is required")).min(1, "Address is required"),
  city:         z.string(req("City is required")).min(1, "City is required"),
  state:        z.string(req("State is required")).min(1, "State is required"),
  zipCode:      z.string(req("A valid zip code is required")).min(5, "A valid zip code is required"),
  referredBy:   z.string(req("Referral information is required")).min(1, "Referral information is required"),
  comments:     z.string().optional(),
})

export async function POST(request: NextRequest) {
  const rateLimitResult = await providerIntakeDeps.rateLimit(request, 10, 60_000)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const fields: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") fields[key] = value.trim()
  }

  const parsed = schema.safeParse(fields)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return NextResponse.json(
      { error: first.message, field: first.path[0] },
      { status: 400 },
    )
  }

  const data = parsed.data

  if (data.hasResellerLicense === "YES" && !data.resellerPermitNumber?.trim()) {
    return NextResponse.json(
      {
        error: "Reseller's Permit Number is required when you have a reseller license",
        field: "resellerPermitNumber",
      },
      { status: 400 },
    )
  }

  let resellerCertificatePath: string | undefined
  let businessLicensePath: string | undefined

  const certFile = formData.get("resellerCertificate") as File | null
  if (certFile && certFile.size > 0) {
    try {
      resellerCertificatePath = await providerIntakeDeps.saveFile(certFile)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid certificate file"
      return NextResponse.json({ error: msg, field: "resellerCertificate" }, { status: 400 })
    }
  } else if (data.hasResellerLicense === "YES") {
    return NextResponse.json(
      {
        error: "Reseller's Certificate is required when you have a reseller license",
        field: "resellerCertificate",
      },
      { status: 400 },
    )
  }

  const licenseFile = formData.get("businessLicense") as File | null
  if (licenseFile && licenseFile.size > 0) {
    try {
      businessLicensePath = await providerIntakeDeps.saveFile(licenseFile)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid license file"
      return NextResponse.json({ error: msg, field: "businessLicense" }, { status: 400 })
    }
  }

  try {
    await providerIntakeDeps.createApplication({
      firstName: data.firstName,
      lastName: data.lastName,
      suffix: data.suffix ?? null,
      email: data.email,
      phone: data.phone,
      companyName: data.companyName,
      website: data.website,
      taxId: data.taxId,
      npiNumber: data.npiNumber,
      npiOwnerMatch: data.npiOwnerMatch === "true",
      hasResellerLicense: data.hasResellerLicense,
      resellerPermitNumber: data.resellerPermitNumber ?? null,
      resellerCertificatePath: resellerCertificatePath ?? null,
      addressLine1: data.addressLine1,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      businessLicensePath: businessLicensePath ?? null,
      referredBy: data.referredBy,
      comments: data.comments ?? null,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error("Provider intake submission error:", err)
    return NextResponse.json(
      { error: "Failed to save your application. Please try again." },
      { status: 500 },
    )
  }
}
