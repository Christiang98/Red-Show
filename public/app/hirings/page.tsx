"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Esta página redirige a /bookings donde está el flujo completo
export default function HiringsPage() {
  const router = useRouter()
  useEffect(() => { router.replace("/bookings") }, [router])
  return null
}
