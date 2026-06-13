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
          background: "linear-gradient(135deg, #070712 0%, #1a1035 40%, #2a1508 70%, #070712 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: "#fbbf24",
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
          1v1 face-offs · On-device PDL · Climb the ELO ladder
        </div>
      </div>
    ),
    { ...size }
  );
}
