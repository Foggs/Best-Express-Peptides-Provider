import { ImageResponse } from "next/og"

export const runtime = "edge"
export const contentType = "image/png"
export const size = { width: 32, height: 32 }

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#1e3a8a",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          fontWeight: 800,
          fontSize: 18,
          color: "#f97316",
          letterSpacing: "-0.5px",
        }}
      >
        B
      </div>
    ),
    { width: 32, height: 32 }
  )
}
