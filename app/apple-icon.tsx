import { ImageResponse } from "next/og";

// The same picture as app/icon.svg (Mars and a blue Earth), drawn as a PNG because phones do not take SVG home-screen icons.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const dot = (left: number, top: number, d: number, background: string) => (
  <div style={{ position: "absolute", left, top, width: d, height: d, borderRadius: d / 2, background }} />
);

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#1c0f0b" }}>
      {dot(33, 50, 101, "#b5613a")}
      {dot(121, 28, 28, "#8ec5f0")}
    </div>,
    size,
  );
}
