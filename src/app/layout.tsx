import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MedAgent AI — Bệnh viện Đa khoa Quốc tế",
  description:
    "Trợ lý AI đặt lịch khám và tư vấn chuyên khoa cho bệnh nhân, bác sĩ và lễ tân điều phối.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
