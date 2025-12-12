"use client"

import { ProtectedRoute } from "@/components/protectedRoute"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingList } from "@/components/bookings/booking-list"
import { Card } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { useEffect, useState } from "react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function BookingsPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const { data: bookings, mutate } = useSWR(user ? `/api/bookings?userId=${user.id}` : null, fetcher)

  const sentBookings =
    bookings?.filter((b: any) => (user?.role === "artist" ? b.artist_id === user.id : b.owner_id === user.id)) || []

  const receivedBookings =
    bookings?.filter((b: any) => (user?.role === "artist" ? b.owner_id === user.id : b.artist_id === user.id)) || []

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      mutate()
    } catch (error) {
      console.error("[v0] Error actualizando booking:", error)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppNavbar />

        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-4xl font-bold text-primary mb-2">Mis Contrataciones</h1>
          <p className="text-muted-foreground mb-8">Gestiona tus solicitudes y confirma eventos</p>

          <Tabs defaultValue="sent" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="sent">Solicitudes Enviadas</TabsTrigger>
              <TabsTrigger value="received">Solicitudes Recibidas</TabsTrigger>
            </TabsList>

            <TabsContent value="sent" className="space-y-6">
              <Card className="p-6 bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-900">
                  Aquí verás todas las solicitudes de contratación que has enviado y sus estados.
                </p>
              </Card>
              {sentBookings.length > 0 ? (
                <BookingList bookings={sentBookings} isReceived={false} onUpdateStatus={handleUpdateStatus} />
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No has enviado solicitudes aún</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="received" className="space-y-6">
              <Card className="p-6 bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-900">
                  Aquí verás todas las solicitudes de contratación que has recibido. Puedes aceptarlas o rechazarlas.
                </p>
              </Card>
              {receivedBookings.length > 0 ? (
                <BookingList bookings={receivedBookings} isReceived={true} onUpdateStatus={handleUpdateStatus} />
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No has recibido solicitudes aún</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
