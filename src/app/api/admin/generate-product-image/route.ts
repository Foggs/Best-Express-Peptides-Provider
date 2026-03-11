import { NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"
import { getUncachableGoogleSheetClient } from "@/lib/googleSheets"
import * as fs from "fs"
import * as path from "path"

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!

async function generatePlaceholderImage(peptideName: string): Promise<Buffer> {
  const sharp = (await import("sharp")).default

  const width = 800
  const height = 800
  const displayName = peptideName.toUpperCase()

  const nameLines: string[] = []
  if (displayName.length > 16) {
    const words = displayName.split(/[\s-]+/)
    let currentLine = ""
    for (const word of words) {
      if (currentLine && (currentLine + " " + word).length > 16) {
        nameLines.push(currentLine)
        currentLine = word
      } else {
        currentLine = currentLine ? currentLine + " " + word : word
      }
    }
    if (currentLine) nameLines.push(currentLine)
  } else {
    nameLines.push(displayName)
  }

  const nameTextElements = nameLines.map((line, i) => {
    const y = 448 + i * 22
    return `<text x="400" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="bold" fill="#1a365d" text-anchor="middle" letter-spacing="1.5">${escapeXml(line)}</text>`
  }).join("\n    ")

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="vial" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#e8eef5;stop-opacity:1" />
      <stop offset="30%" style="stop-color:#f5f8fc;stop-opacity:1" />
      <stop offset="70%" style="stop-color:#f5f8fc;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#dce4ee;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="cap" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#cbd5e1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#94a3b8;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="liquid" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#dbeafe;stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:#93c5fd;stop-opacity:0.4" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-5%" width="120%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#64748b" flood-opacity="0.15"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)" rx="12"/>

  <g filter="url(#shadow)">
    <rect x="340" y="160" width="120" height="120" rx="4" fill="url(#cap)" stroke="#7c8ba0" stroke-width="0.5"/>
    <line x1="355" y1="180" x2="355" y2="270" stroke="#a8b5c4" stroke-width="0.5"/>
    <line x1="370" y1="180" x2="370" y2="270" stroke="#a8b5c4" stroke-width="0.5"/>
    <line x1="385" y1="180" x2="385" y2="270" stroke="#a8b5c4" stroke-width="0.5"/>
    <line x1="415" y1="180" x2="415" y2="270" stroke="#a8b5c4" stroke-width="0.5"/>
    <line x1="430" y1="180" x2="430" y2="270" stroke="#a8b5c4" stroke-width="0.5"/>
    <line x1="445" y1="180" x2="445" y2="270" stroke="#a8b5c4" stroke-width="0.5"/>

    <rect x="335" y="270" width="130" height="370" rx="8" fill="url(#vial)" stroke="#c4cdd8" stroke-width="1"/>
    <rect x="345" y="500" width="110" height="130" rx="4" fill="url(#liquid)"/>

    <rect x="355" y="400" width="90" height="100" rx="3" fill="white" stroke="#e2e8f0" stroke-width="0.5"/>
    ${nameTextElements}

    <text x="400" y="${448 + nameLines.length * 22 + 14}" font-family="Arial, Helvetica, sans-serif" font-size="10" fill="#64748b" text-anchor="middle">RESEARCH USE ONLY</text>
  </g>

  <text x="400" y="720" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle" letter-spacing="3">BEST EXPRESS PEPTIDES</text>
  <line x1="310" y1="734" x2="490" y2="734" stroke="#cbd5e1" stroke-width="0.5"/>
  <text x="400" y="750" font-family="Arial, Helvetica, sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle" letter-spacing="1">RESEARCH GRADE</text>
</svg>`

  return await sharp(Buffer.from(svg)).png().toBuffer()
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.valid) {
    return createUnauthorizedResponse()
  }

  try {
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      )
    }

    const { slug } = body

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "slug is required" },
        { status: 400 }
      )
    }

    const safeSlugRegex = /^[a-z0-9][a-z0-9 /\-]*$/
    if (!safeSlugRegex.test(slug.trim())) {
      return NextResponse.json(
        { success: false, error: "Invalid slug format" },
        { status: 400 }
      )
    }

    if (!SPREADSHEET_ID) {
      return NextResponse.json(
        { success: false, error: "GOOGLE_SHEET_ID is not configured" },
        { status: 500 }
      )
    }

    const sheets = await getUncachableGoogleSheetClient()

    const productsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Products!A:K",
    })

    const rows = productsResponse.data.values || []
    if (rows.length < 2) {
      return NextResponse.json(
        { success: false, error: "No products found in sheet" },
        { status: 404 }
      )
    }

    const headers = rows[0].map((h: string) => h.trim().toLowerCase())

    const headerMap: Record<string, string> = {
      slug: "slug",
      name: "name",
      images: "images",
    }

    const colIndex: Record<string, number> = {}
    headers.forEach((h: string, i: number) => {
      const mapped = headerMap[h]
      if (mapped) colIndex[mapped] = i
    })

    let targetRowIndex = -1
    const resolvedSlug = slug.trim()
    let resolvedName = ""

    const slugCol = colIndex["slug"]
    if (slugCol === undefined) {
      return NextResponse.json(
        { success: false, error: "Slug column not found in sheet" },
        { status: 500 }
      )
    }
    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][slugCol] || "").trim() === resolvedSlug) {
        targetRowIndex = i
        resolvedName = rows[i][colIndex["name"]] || resolvedSlug
        break
      }
    }
    if (targetRowIndex === -1) {
      return NextResponse.json(
        { success: false, error: `Product with slug "${resolvedSlug}" not found` },
        { status: 404 }
      )
    }

    const safeFilename = resolvedSlug.replace(/[/\\]/g, "_")
    const filename = `${safeFilename}.png`
    const imageDir = path.join(process.cwd(), "public", "product-images")

    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true })
    }

    const filePath = path.join(imageDir, filename)
    let generatedWith = "existing"

    if (!fs.existsSync(filePath)) {
      const imageBuffer = await generatePlaceholderImage(resolvedName)
      fs.writeFileSync(filePath, imageBuffer)
      generatedWith = "placeholder"
    }

    const imageUrl = `/product-images/${filename}`

    let writtenToSheet = false

    if (colIndex["images"] !== undefined) {
      const col = String.fromCharCode(65 + colIndex["images"])
      const sheetRowNumber = targetRowIndex + 1

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Products!${col}${sheetRowNumber}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[imageUrl]],
        },
      })
      writtenToSheet = true
    }

    return NextResponse.json({
      success: true,
      slug: resolvedSlug,
      productName: resolvedName,
      imageUrl,
      generatedWith,
      writtenToSheet,
    })
  } catch (error) {
    console.error("Error generating product image:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: "Failed to generate product image", details: message },
      { status: 500 }
    )
  }
}
