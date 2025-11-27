import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Gezi Başvuru Sistemi",
  description: "Okul gezileri için başvuru ve yönetim servisi",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}

