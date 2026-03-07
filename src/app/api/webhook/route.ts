import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Webhook endpoint is currently disabled" },
    { status: 503 }
  )
}
