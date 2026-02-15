import type React from "react"
import { Poppins } from "next/font/google"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Red Show - Gestor de Eventos",
  description: "Plataforma para conectar espacios, artistas y organizadores de eventos",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={poppins.variable}>
      <body className="font-sans antialiased" style={{ background: "linear-gradient(160deg, #080b14 0%, #0d0817 50%, #080b14 100%)", minHeight: "100vh", color: "#FFFCF2" }}>
        <main className="min-h-screen">{children}</main>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
