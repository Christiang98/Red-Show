import type React from "react"
import { Poppins } from "next/font/google"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AppNavbar } from "@/components/navigation/app-navbar"

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
      <body className="font-sans antialiased bg-background">
        <AppNavbar />
        <main className="min-h-screen">{children}</main>
        <Analytics />
      </body>
    </html>
  )
}
