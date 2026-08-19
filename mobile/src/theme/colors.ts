// Trích từ Figma `c2sN13nHkKK8O1YdW5xvhk` — page "Bản mobile" (node 46:3, 46:65).
// primary700 khớp chính xác --color-primary-700 trong frontend/src/app/globals.css;
// các token còn lại là palette riêng của bản mobile trong Figma (không hoàn toàn
// trùng token web), giữ nguyên hex gốc để đúng thiết kế.
export const colors = {
  primary700: "#27657B",
  primaryTint: "#83BDD5",
  photoBg: "#EDEEF0",

  textBody: "#40484C",
  textMuted: "#70787C",
  textLabel: "#191C1E",
  placeholder: "#C0C8CC",

  border: "#C0C8CC",
  borderSoft: "#E1E2E4",

  calloutBg: "rgba(205,227,238,0.3)",
  calloutBorder: "#CDE3EE",
  calloutHeading: "#004D61",

  danger: "#BA1A1A",
  dangerSoft: "#FFDAD6",

  white: "#FFFFFF",
  pageBg: "#F9F9FB",

  // Trích từ Figma node 46:945 (Trang chủ)
  chipBg: "#F3F3F6",
  navActiveText: "#51666F",
} as const;
