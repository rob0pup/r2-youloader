import { ImageResponse } from "next/og"

export const alt = "Youloader — download YouTube videos on your PC"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            borderRadius: 28,
            background: "#fafafa",
            color: "#0a0a0a",
            fontSize: 80,
            fontWeight: 800,
            marginBottom: 44,
          }}
        >
          R²
        </div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 800, letterSpacing: -2 }}>
          Youloader
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#a1a1aa", marginTop: 18 }}>
          Download YouTube videos on your PC
        </div>
      </div>
    ),
    { ...size }
  )
}
