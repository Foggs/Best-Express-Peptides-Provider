import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { rateLimit as _rateLimit } from "@/lib/rate-limit"

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"])
const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

async function _saveFile(file: File): Promise<string> {
  // Derive and sanitise extension — never trust file.name for path construction
  const rawExt = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")
  if (!ALLOWED_EXTENSIONS.has(rawExt)) {
    throw new Error(`File type ".${rawExt}" is not allowed. Accepted: pdf, jpg, jpeg, png.`)
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File exceeds the 10 MB limit.")
  }
  const uploadDir = join(process.cwd(), "private-uploads", "provider-intake")
  await mkdir(uploadDir, { recursive: true })
  // Filename is UUID-only so no user input reaches the filesystem path
  const filename = `${randomUUID()}.${rawExt}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(join(uploadDir, filename), buffer)
  return filename
}

/**
 * Mutable deps object — lets tests replace individual operations without
 * touching sealed ESM namespace bindings. Same pattern as checkoutDeps.
 */
type ApplicationData = Parameters<typeof prisma.providerApplication.create>[0]["data"]

export const providerIntakeDeps = {
  rateLimit: _rateLimit as typeof _rateLimit,
  saveFile: _saveFile as (file: File) => Promise<string>,
  createApplication: (data: ApplicationData): Promise<unknown> =>
    prisma.providerApplication.create({ data }),
}

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string().optional(),
  email: z.string().email("A valid email address is required"),
  phone: z.string().min(7, "A valid phone number is required"),
  companyName: z.string().min(1, "Company name is required"),
  website: z.string().min(1, "Website is required"),
  taxId: z.string().min(1, "Tax ID / EIN is required"),
  npiNumber: z.string().min(1, "NPI Number is required"),
  npiOwnerMatch: z.enum(["true", "false"], { message: "Please select Yes or No for NPI owner" }),
  hasResellerLicense: z.enum(["YES", "NO", "NOT_SURE"], {
    message: "Please select your reseller license status",
  }),
  resellerPermitNumber: z.string().optional(),
  addressLine1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "A valid zip code is required"),
  referredBy: z.string().min(1, "Referral information is required"),
  comments: z.string().optional(),
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
    if (typeof value === "string") fields[key] = value
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
    resellerCertificatePath = await providerIntakeDeps.saveFile(certFile)
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
    businessLicensePath = await providerIntakeDeps.saveFile(licenseFile)
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
