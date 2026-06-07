import { ImageResponse } from "next/og";

export const alt = "Odoggle — 1v1 Dog Battle Game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1208 50%, #0a0a0a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: "#f59e0b",
            letterSpacing: "-2px",
          }}
        >
          Odoggle
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#a1a1aa",
            marginTop: 16,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          1v1 dog face battles · On-device PDL · Live audience votes
        </div>
      </div>
    ),
    { ...size }
  );
}
