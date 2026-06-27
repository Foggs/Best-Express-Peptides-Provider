import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { providerIntakeDeps } from "./deps"

function req(msg: string) {
  return { required_error: msg, invalid_type_error: msg }
}

// Hidden form field that real users never see or fill. Any value here is a
// strong signal the submission came from an automated bot.
export const HONEYPOT_FIELD = "companyUrl"

// Upper bounds on every field so a bot cannot flood the DB / admin inbox with
// megabyte-sized payloads. Generous enough that no legitimate value is rejected.
const MAX = {
  short: 100,
  email: 254,
  phone: 30,
  medium: 200,
  id: 60,
  zip: 12,
  comments: 2000,
}

const schema = z.object({
  firstName:   z.string(req("First name is required")).min(1, "First name is required").max(MAX.short, "First name is too long"),
  lastName:    z.string(req("Last name is required")).min(1, "Last name is required").max(MAX.short, "Last name is too long"),
  suffix:      z.string().max(MAX.short, "Suffix is too long").optional(),
  email:       z.string(req("Email is required")).email("A valid email address is required").max(MAX.email, "Email is too long"),
  phone:       z.string(req("Phone is required")).min(7, "A valid phone number is required").max(MAX.phone, "Phone number is too long"),
  companyName: z.string(req("Company name is required")).min(1, "Company name is required").max(MAX.medium, "Company name is too long"),
  website:     z.string(req("Website is required")).min(1, "Website is required").max(MAX.medium, "Website is too long"),
  taxId:       z.string(req("Tax ID / EIN is required")).min(1, "Tax ID / EIN is required").max(MAX.id, "Tax ID / EIN is too long"),
  npiNumber:   z.string(req("NPI Number is required")).min(1, "NPI Number is required").max(MAX.id, "NPI Number is too long"),
  npiOwnerMatch: z.enum(["true", "false"], {
    required_error: "Please select Yes or No for NPI owner",
    message: "Please select Yes or No for NPI owner",
  }),
  hasResellerLicense: z.enum(["YES", "NO", "NOT_SURE"], {
    required_error: "Please select your reseller license status",
    message: "Please select your reseller license status",
  }),
  resellerPermitNumber: z.string().max(MAX.id, "Permit number is too long").optional(),
  addressLine1: z.string(req("Address is required")).min(1, "Address is required").max(MAX.medium, "Address is too long"),
  city:         z.string(req("City is required")).min(1, "City is required").max(MAX.short, "City is too long"),
  state:        z.string(req("State is required")).min(1, "State is required").max(MAX.short, "State is too long"),
  zipCode:      z.string(req("A valid zip code is required")).min(5, "A valid zip code is required").max(MAX.zip, "Zip code is too long"),
  referredBy:   z.string(req("Referral information is required")).min(1, "Referral information is required").max(MAX.medium, "Referral information is too long"),
  comments:     z.string().max(MAX.comments, "Comments are too long").optional(),
})

export async function POST(request: NextRequest) {
  // Burst limit (10/min) catches rapid-fire scripts; the sustained limit
  // (15/hour) throttles slow-drip flooding that stays under the per-minute cap.
  const burstLimit = await providerIntakeDeps.rateLimit(request, 10, 60_000)
  const sustainedLimit = await providerIntakeDeps.rateLimit(request, 15, 3_600_000)
  if (!burstLimit.success || !sustainedLimit.success) {
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

  // Honeypot: real users never see or fill this hidden field. If it has any
  // value, treat the request as a bot. Respond with a 201 so the bot believes
  // it succeeded, but skip all persistence, file saves, and the admin email.
  const honeypotValue = formData.get(HONEYPOT_FIELD)
  if (typeof honeypotValue === "string" && honeypotValue.trim() !== "") {
    console.warn("Provider intake honeypot triggered — dropping suspected bot submission")
    return NextResponse.json({ success: true }, { status: 201 })
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
    const existingUser = await providerIntakeDeps.findUserByEmail(data.email)
    const existingUserAtIntake = Boolean(existingUser)

    const applicationData = {
      existingUserAtIntake,
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
    }

    if (existingUser) {
      // No placeholder user needed — application stands alone.
      await providerIntakeDeps.createApplication(applicationData)
    } else {
      // Atomic: either both rows land or neither does.
      await providerIntakeDeps.createApplicationAndPendingUser({
        user: {
          email: data.email,
          name: `${data.firstName} ${data.lastName}`.trim(),
        },
        application: applicationData,
      })
    }

    try {
      const emailResult = await providerIntakeDeps.sendSignupEmail({
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
        addressLine1: data.addressLine1,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        referredBy: data.referredBy,
        comments: data.comments ?? null,
        resellerCertificateUploaded: Boolean(resellerCertificatePath),
        businessLicenseUploaded: Boolean(businessLicensePath),
      })
      if (!emailResult.success) {
        console.error(
          "Provider signup admin email failed:",
          emailResult.error,
        )
      }
    } catch (emailErr) {
      console.error("Unexpected error sending provider signup email:", emailErr)
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error("Provider intake submission error:", err)
    return NextResponse.json(
      { error: "Failed to save your application. Please try again." },
      { status: 500 },
    )
  }
}
