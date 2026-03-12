import { NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"
import { getUncachableGoogleSheetClient } from "@/lib/googleSheets"
import OpenAI from "openai"

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
})

function buildPrompt(productName: string, category: string): string {
  return `You are a scientific content writer for a research peptide supplier. Generate product content for the following peptide:

Product Name: ${productName}
Category: ${category}

STRICT COMPLIANCE RULES — YOU MUST FOLLOW ALL OF THESE:
- NEVER claim FDA approval for any peptide
- NEVER provide medical advice or treatment recommendations
- NEVER imply the product is for human consumption
- NEVER provide dosage instructions or administration guidance
- NEVER make unsupported therapeutic claims
- ALWAYS use neutral, research-focused scientific language
- ALWAYS include "For research use only. Not for human consumption." in the description
- Reference published research studies where applicable
- Use phrases like "studies suggest", "research indicates", "has been investigated for"

Generate a JSON object with exactly three fields:
1. shortDescription: A concise 1-2 sentence summary suitable for product cards
2. description: A detailed product description with markdown formatting
3. research: A comprehensive research summary with markdown section headers

All content must be factual, citation-aware, and written for a research audience.

Respond with ONLY valid JSON, no other text.`
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
    const { slug, productName, category } = body

    if (!slug && !productName) {
      return NextResponse.json(
        { success: false, error: "Either slug or productName is required" },
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
      category: "category",
      shortdescription: "shortDescription",
      "short description": "shortDescription",
      description: "description",
      research: "research",
    }

    const colIndex: Record<string, number> = {}
    headers.forEach((h: string, i: number) => {
      const mapped = headerMap[h]
      if (mapped) colIndex[mapped] = i
    })

    let targetRowIndex = -1
    let resolvedName = productName || ""
    let resolvedCategory = category || ""

    if (slug) {
      const slugCol = colIndex["slug"]
      if (slugCol === undefined) {
        return NextResponse.json(
          { success: false, error: "Slug column not found in sheet" },
          { status: 500 }
        )
      }
      for (let i = 1; i < rows.length; i++) {
        if ((rows[i][slugCol] || "").trim() === slug.trim()) {
          targetRowIndex = i
          resolvedName = rows[i][colIndex["name"]] || productName || slug
          resolvedCategory = rows[i][colIndex["category"]] || category || "Research Peptide"
          break
        }
      }
      if (targetRowIndex === -1) {
        return NextResponse.json(
          { success: false, error: `Product with slug "${slug}" not found` },
          { status: 404 }
        )
      }
    }

    const prompt = buildPrompt(resolvedName, resolvedCategory)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    })

    const responseText = completion.choices[0]?.message?.content || ""

    let generated: {
      shortDescription: string
      description: string
      research: string
    }

    try {
      generated = JSON.parse(responseText)
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response", raw: responseText },
        { status: 500 }
      )
    }

    if (!generated.shortDescription || !generated.description || !generated.research) {
      return NextResponse.json(
        { success: false, error: "AI response missing required fields", raw: generated },
        { status: 500 }
      )
    }

    let writtenToSheet = false

    if (targetRowIndex >= 0) {
      const sheetRowNumber = targetRowIndex + 1

      const updates: { range: string; values: string[][] }[] = []

      if (colIndex["shortDescription"] !== undefined) {
        const col = String.fromCharCode(65 + colIndex["shortDescription"])
        updates.push({
          range: `Products!${col}${sheetRowNumber}`,
          values: [[generated.shortDescription]],
        })
      }

      if (colIndex["description"] !== undefined) {
        const col = String.fromCharCode(65 + colIndex["description"])
        updates.push({
          range: `Products!${col}${sheetRowNumber}`,
          values: [[generated.description]],
        })
      }

      if (colIndex["research"] !== undefined) {
        const col = String.fromCharCode(65 + colIndex["research"])
        updates.push({
          range: `Products!${col}${sheetRowNumber}`,
          values: [[generated.research]],
        })
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { success: false, error: "No writable columns found in sheet (shortDescription, description, research)" },
          { status: 500 }
        )
      }

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: "RAW",
          data: updates,
        },
      })
      writtenToSheet = true
    }

    return NextResponse.json({
      success: true,
      slug: slug || null,
      productName: resolvedName,
      generated,
      writtenToSheet,
      ...((!slug && !writtenToSheet) ? { note: "No slug provided — content generated but not written to sheet. Pass a slug to write back." } : {}),
    })
  } catch (error) {
    console.error("Error generating product content:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: "Failed to generate product content", details: message },
      { status: 500 }
    )
  }
}
