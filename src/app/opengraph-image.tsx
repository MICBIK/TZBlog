import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
} as const;

export const contentType = "image/png";

export default function Image(): Response {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 220, fontWeight: 700, letterSpacing: -8 }}>
          TZBlog
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#888",
            marginTop: 24,
            fontFamily: "monospace",
            letterSpacing: 2,
          }}
        >
          ha1den · NOTES FROM THE FIELD
        </div>
      </div>
    ),
    size,
  );
}
