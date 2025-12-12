"use client"

import { ProtectedRoute } from "@/components/protectedRoute"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MessageSquare, Check, X } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function HiringsPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const { data: bookings, mutate } = useSWR(user ? `/api/bookings?userId=${user.id}` : null, fetcher, {
    refreshInterval: 10000,
  })

  const sentRequests =
    bookings?.filter((b: any) => {
      if (user?.role === "artist") return b.artist_id === user.id
      if (user?.role === "owner") return b.owner_id === user.id
      return false
    }) || []

  const receivedRequests =
    bookings?.filter((b: any) => {
      if (user?.role === "artist") return b.owner_id === user.id && b.artist_id !== user.id
      if (user?.role === "owner") return b.artist_id === user.id && b.owner_id !== user.id
      return false
    }) || []

  const handleAccept = async (bookingId: string) => {
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })
      mutate()
      alert("Contratación aceptada. Ahora puedes enviar mensajes desde la sección de Mensajes.")
    } catch (error) {
      console.error("[v0] Error aceptando contratación:", error)
      alert("Error al aceptar la contratación")
    }
  }

  const handleReject = async (bookingId: string) => {
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })
      mutate()
      alert("Contratación rechazada")
    } catch (error) {
      console.error("[v0] Error rechazando contratación:", error)
      alert("Error al rechazar la contratación")
    }
  }

  const handleSendMessage = (userId: string) => {
    router.push(`/messaging?userId=${userId}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-success text-success-foreground">Aceptada</Badge>
      case "rejected":
        return <Badge className="bg-destructive text-destructive-foreground">Rechazada</Badge>
      case "completed":
        return <Badge className="bg-blue-500 text-white">Completada</Badge>
      default:
        return <Badge className="bg-yellow-500 text-white">Pendiente</Badge>
    }
  }

  const HiringCard = ({ booking, isReceived }: { booking: any; isReceived: boolean }) => (
    <Card className="p-4 hover:shadow-md transition">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-foreground">{booking.title || "Solicitud de contratación"}</h4>
              {getStatusBadge(booking.status)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span>
                {booking.booking_date
                  ? new Date(booking.booking_date).toLocaleDateString("es-AR")
                  : "Fecha por confirmar"}
              </span>
            </div>
            {booking.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{booking.description}</p>
            )}
          </div>
        </div>

        {isReceived && booking.status === "pending" && (
          <div className="flex gap-2 pt-3 border-t border-border">
            <Button
              onClick={() => handleAccept(booking.id.toString())}
              className="flex-1 bg-success hover:bg-success/90"
            >
              <Check className="h-4 w-4 mr-2" />
              Aceptar Contratación
            </Button>
            <Button
              onClick={() => handleReject(booking.id.toString())}
              variant="outline"
              className="flex-1 border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
            >
              <X className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
          </div>
        )}

        {booking.status === "accepted" && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-2 text-sm text-success">
              <Check className="h-4 w-4" />
              <span>Contratación confirmada - Mensajería habilitada</span>
            </div>
            <Button
              onClick={() => handleSendMessage(isReceived ? booking.artist_id : booking.owner_id)}
              variant="outline"
              className="w-full"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Enviar Mensaje
            </Button>
          </div>
        )}
      </div>
    </Card>
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppNavbar />

        <div className="max-w-4xl mx-auto p-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Gestión de Contrataciones</h1>
            <p className="text-muted-foreground">Administra las solicitudes de contratación enviadas y recibidas</p>
          </div>

          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="received">Notificaciones Recibidas</TabsTrigger>
              <TabsTrigger value="sent">Notificaciones Enviadas</TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-6">
              <Card className="p-6 bg-secondary/5 border-secondary/30">
                <h3 className="font-semibold text-foreground mb-2">Solicitudes Recibidas</h3>
                <p className="text-sm text-muted-foreground">
                  Aquí verás todas las solicitudes de contratación que has recibido. Al aceptar una solicitud, se
                  habilitará automáticamente la mensajería con la otra parte para coordinar detalles.
                </p>
              </Card>

              {receivedRequests.length > 0 ? (
                <div className="space-y-4">
                  {receivedRequests.map((booking: any) => (
                    <HiringCard key={booking.id} booking={booking} isReceived={true} />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground text-lg">No has recibido solicitudes de contratación aún</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Las solicitudes aparecerán aquí cuando otros usuarios te contacten
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-6">
              <Card className="p-6 bg-secondary/5 border-secondary/30">
                <h3 className="font-semibold text-foreground mb-2">Solicitudes Enviadas</h3>
                <p className="text-sm text-muted-foreground">
                  Aquí verás todas las solicitudes de contratación que has enviado y su estado actual. Una vez que sean
                  aceptadas, podrás comunicarte directamente con el proveedor.
                </p>
              </Card>

              {sentRequests.length > 0 ? (
                <div className="space-y-4">
                  {sentRequests.map((booking: any) => (
                    <HiringCard key={booking.id} booking={booking} isReceived={false} />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground text-lg">No has enviado solicitudes de contratación aún</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Explora perfiles y envía solicitudes desde la sección de Búsqueda
                  </p>
                  <Button onClick={() => router.push("/search")} className="mt-4 bg-primary hover:bg-primary/90">
                    Ir a Búsqueda
                  </Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
