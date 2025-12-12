"use client"

import { ProtectedRoute } from "@/components/protectedRoute"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { BookingDetail } from "@/components/bookings/booking-detail"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useEffect, useState } from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const { data: booking, error, mutate } = useSWR(user ? `/api/bookings/${params.id}` : null, fetcher)

  const handleAccept = async (id: number) => {
    try {
      await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })
      mutate()
      alert("Solicitud aceptada exitosamente!")
    } catch (error) {
      console.error("[v0] Error aceptando booking:", error)
      alert("Error al aceptar la solicitud")
    }
  }

  const handleReject = async (id: number) => {
    try {
      await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })
      mutate()
      alert("Solicitud rechazada")
    } catch (error) {
      console.error("[v0] Error rechazando booking:", error)
      alert("Error al rechazar la solicitud")
    }
  }

  const handleCancel = async (id: number) => {
    try {
      await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })
      router.push("/bookings")
    } catch (error) {
      console.error("[v0] Error cancelando booking:", error)
      alert("Error al cancelar la solicitud")
    }
  }

  if (!user) return null

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppNavbar />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {error && (
              <Card className="p-8 text-center">
                <p className="text-destructive">Error cargando la solicitud</p>
              </Card>
            )}

            {!booking && !error && (
              <Card className="p-8 flex items-center justify-center">
                <Spinner className="h-8 w-8" />
              </Card>
            )}

            {booking && (
              <BookingDetail
                booking={booking}
                userRole={user.user.role}
                onAccept={handleAccept}
                onReject={handleReject}
                onCancel={handleCancel}
              />
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
